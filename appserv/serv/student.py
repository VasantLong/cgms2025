import asyncio  # noqa: F401
from dataclasses import asdict
from fastapi import status, Query, Depends
import datetime as dt
from fastapi import HTTPException, APIRouter
from fastapi.responses import StreamingResponse
import io
from sqlalchemy.orm import Session
from sqlalchemy import text
import xlsxwriter
from reportlab.pdfgen import canvas
from .auth import get_current_active_user, User
from .course_class import validate_jiaomi_role
from urllib.parse import quote_plus

from pydantic import BaseModel, field_validator
from .config import app, dblock
from .error import ConflictError, InvalidError

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

try:
    pdfmetrics.registerFont(TTFont('SimSun', '../fonts/simsun.ttc'))  # 需要字体文件
except:
    pdfmetrics.registerFont(TTFont('SimSun', '../fonts/simsun.ttf'))  # 尝试不同格式

router = APIRouter(tags=["学生管理"])

class Student(BaseModel):
    stu_sn: int | None
    stu_no: str
    stu_name: str
    gender: str | None
    enrollment_date: dt.date | None

    @field_validator('stu_no')
    def validate_stu_no(cls, v):
        if not v.isdigit() or len(v) != 9:
            raise ValueError("学号必须为9位数字")
        return v

    @field_validator('enrollment_date')
    def validate_enrollment_date_date(cls, v):
        if v and v < dt.date(2000, 1, 1):
            raise ValueError("入学日期必须在2000年1月1日之后")
        return v


# 分页到时候再说
 #   page: int = Query(1, ge=1),
  #  page_size: int = Query(20, ge=1, le=100
@router.get("/api/student/list")
async def get_student_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    last_sn: int = Query(None)
) -> list[Student]:
    with dblock() as db:
        query = """
        SELECT sn AS stu_sn, no AS stu_no, name AS stu_name, gender, enrollment_date 
        FROM student
        """
        params = {}

        # 添加游标分页条件
        if last_sn:
            query += " WHERE sn > %(last_sn)s"
            params["last_sn"] = last_sn
        # 没有游标时使用传统分页
        else:
            params["offset"] = (page - 1) * page_size

        query += " ORDER BY sn LIMIT %(limit)s"
        params["limit"] = page_size
        
        db.execute(query, params)
        data = [Student(**asdict(row)) for row in db]

    return data


@router.get("/api/student/{stu_sn}")
async def get_student_profile(stu_sn) -> Student:
    with dblock() as db:
        db.execute(
            """
            SELECT sn AS stu_sn, no AS stu_no, name AS stu_name, gender, enrollment_date 
            FROM student WHERE sn=%(stu_sn)s
            """,
            dict(stu_sn=stu_sn),
        )
        row = db.fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"无此学生(sn={stu_sn})"
        )

    return row


@router.post("/api/student", status_code=status.HTTP_201_CREATED)
async def new_student(student: Student) -> Student:
    stu_no = student.stu_no

    with dblock() as db:
        db.execute(
            """
            SELECT sn AS stu_sn, name AS stu_name FROM student
            WHERE no=%(stu_no)s
            """,
            dict(stu_no=stu_no),
        )
        record = db.fetchone()
        if record:
            raise ConflictError(
                f"学号'{stu_no}'已被{record.stu_name}(#{record.stu_sn}占用"
            )

        # 思考：为什么此处不能另起一个连接或事务（ACID）
        # 必须保持与前面 SELECT 在同一个事务中：
        # 1. 避免竞态条件：如果另起事务，其他连接可能在检查后插入相同学号
        # 2. 保证原子性：整个操作要么全部成功要么全部失败
        # 3. 共享事务隔离级别：确保看到一致的数据视图
        db.execute(
            """
            INSERT INTO student (no, name, gender, enrollment_date)
            VALUES(%(stu_no)s, %(stu_name)s, %(gender)s, %(enrollment_date)s) 
            RETURNING sn""",
            student.model_dump(),
        )
        row = db.fetchone()
        student.stu_sn = row.sn  # type: ignore

    return student




@router.put("/api/student/{stu_sn}")
async def update_student(stu_sn: int, student: Student):
    assert student.stu_sn == stu_sn

    stu_no = student.stu_no

    with dblock() as db:
        db.execute(
            """
            UPDATE student SET
                no=%(stu_no)s, name=%(stu_name)s, 
                gender=%(gender)s, enrollment_date=%(enrollment_date)s
            WHERE sn=%(stu_sn)s;
            """,
            student.model_dump(),
        )


@router.delete("/api/student/{stu_sn}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(stu_sn):
    with dblock() as db:
        db.execute("DELETE FROM student WHERE sn=%(stu_sn)s", {"stu_sn": stu_sn})


@router.get("/api/student/{stu_sn}/report", summary="生成学生报表")
async def generate_student_report(
    stu_sn: int,
    current_user: User = Depends(get_current_active_user)
):
    validate_jiaomi_role(current_user.user_name)
    
    with dblock() as db:
        # 获取学生基本信息（复用已有查询逻辑）
        db.execute("""
            SELECT sn AS stu_sn, no AS stu_no, name AS stu_name 
            FROM student WHERE sn=%(stu_sn)s
            """, {"stu_sn": stu_sn})
        student = db.fetchone()
        if not student:
            raise HTTPException(status_code=404, detail="学生不存在")
        
        # 获取成绩数据（基于已有视图）
        db.execute("""
            SELECT c.name as course_name, 
                   cl.class_no, cl.semester, 
                   g.grade, c.credit
            FROM student_grade_report g
            JOIN class cl ON g.class_sn = cl.sn
            JOIN course c ON cl.cou_sn = c.sn
            WHERE g.stu_sn = %(stu_sn)s
            """,
            {"stu_sn": stu_sn})
        grades = db.fetchall()

        # 计算统计信息
        passed_courses = [g for g in grades if g.grade and g.grade >= 60]
        failed_courses = [g for g in grades if g.grade and g.grade < 60]
        total_credits = sum(g.credit for g in passed_courses)
        
        # 计算加权平均分
        weighted_sum = sum(g.grade * g.credit for g in passed_courses if g.grade)
        gpa = weighted_sum / total_credits if total_credits else 0
        
    return {
        "student": asdict(student),
        "grades": [{
            **asdict(g),
            "passed": "是" if (g.grade or 0) >= 60 else "否"
        } for g in grades],
        "stats": {
            "total_credits": total_credits,
            "gpa": round(gpa, 2),
            "failed_count": len(failed_courses)
        }
    }

@router.get("/api/student/{stu_sn}/report/export", summary="导出学生报表")
async def export_report(
    stu_sn: int,
    format: str = 'xlsx',
    current_user: User = Depends(get_current_active_user)
):
    validate_jiaomi_role(current_user.user_name)
    if format not in ('xlsx', 'pdf'):
        raise HTTPException(status_code=400, detail="不支持的导出格式")

    with dblock() as db:  # 将整个操作放在同一个数据库连接中
        # 获取学生信息和报表数据
        db.execute("""
            SELECT no AS stu_no, name AS stu_name, 
                gender, enrollment_date
            FROM student 
            WHERE sn=%(stu_sn)s
        """, {"stu_sn": stu_sn})
        student = db.fetchone()
        if not student:
            raise HTTPException(status_code=404, detail="学生不存在")

        # 获取成绩数据
        db.execute("""
            SELECT c.name as course_name, 
                   cl.class_no, cl.semester, 
                   g.grade, c.credit
            FROM student_grade_report g
            JOIN class cl ON g.class_sn = cl.sn
            JOIN course c ON cl.cou_sn = c.sn
            WHERE g.stu_sn = %(stu_sn)s
            """, {"stu_sn": stu_sn})
        grades = db.fetchall()

    report_data = await generate_student_report(stu_sn, current_user)
    
    # Excel导出实现
    if format == 'xlsx':
        output = io.BytesIO()
        with xlsxwriter.Workbook(output) as workbook:
            worksheet = workbook.add_worksheet()
            
            # 定义格式样式
            header_format = workbook.add_format({
                'bold': True, 
                'bg_color': '#D3D3D3',
                'border': 1,
                'align': 'center'
            })
            info_format = workbook.add_format({
                'bold': True,
                'bg_color': '#E8F4FF',
                'border': 1,
                'align': 'center'
            })
            stats_format = workbook.add_format({
                'bold': True,
                'bg_color': '#FFF2E0',
                'border': 1,
                'align': 'center'
            })
            
            # 学生基本信息
            worksheet.merge_range(0, 0, 0, 2, '学生基本信息', info_format)
            worksheet.write_row(1, 0, [
                f"学号：{student.stu_no}",
                f"姓名：{student.stu_name}",
                f"性别：{'男' if student.gender == 'M' else '女'}",
            ], info_format)

            # 课程表头
            header_row = 2
            worksheet.write_row(header_row, 0, [
                '课程名称', '班次号', '学期', '成绩', '学分', '是否通过'
            ], header_format)

            # 动态计算列宽
            col_widths = [10]*6  # 初始最小宽度
            max_data_row = header_row
            
            # 写入课程数据
            for row_idx, item in enumerate(report_data['grades'], start=header_row+1):
                # 更新列宽
                col_widths[0] = max(col_widths[0], len(item['course_name'])*2.3) # type: ignore
                col_widths[1] = max(col_widths[1], len(str(item['class_no']))*1.5) # type: ignore
                col_widths[2] = max(col_widths[2], len(item['semester'])*1.5) # type: ignore
                col_widths[3] = max(col_widths[3], len(str(item['grade'] or '未录入')))
                col_widths[4] = max(col_widths[4], len(str(item['credit'])))
                col_widths[5] = max(col_widths[5], len(item['passed']))
                
                # 写入数据
                worksheet.write(row_idx, 0, item['course_name'])
                worksheet.write(row_idx, 1, item['class_no'])
                worksheet.write(row_idx, 2, item['semester'])
                worksheet.write(row_idx, 3, item['grade'] or '未录入')
                worksheet.write(row_idx, 4, item['credit'])
                worksheet.write(row_idx, 5, item['passed'])
                max_data_row = row_idx

            # 设置动态列宽（限制最大40）
            for col, width in enumerate(col_widths):
                worksheet.set_column(col, col, min(width, 40))

            # 统计摘要
            stats_row = max_data_row + 2
            worksheet.merge_range(stats_row, 0, stats_row, 2, "成绩统计", stats_format)
            worksheet.write_row(stats_row+1, 0, [
                f"总学分：{report_data['stats']['total_credits']}",
                f"加权平均分：{report_data['stats']['gpa']}",
                f"不及格门数：{report_data['stats']['failed_count']}",
            ], stats_format)

        filename = f"学生成绩_{student.stu_no}_{dt.date.today().strftime('%Y%m%d')}.xlsx"
        encoded_filename = quote_plus(filename, encoding='utf-8')
        # 调整列宽
        for i in range(6):  # 6列数据
            worksheet.set_column(i, i, 15)  # 宽度设为15个字符
        
        return StreamingResponse(
            io.BytesIO(output.getvalue()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": 
                f"attachment; filename*=UTF-8''{encoded_filename}"
            }
        )
    
    # PDF导出实现
    if format == 'pdf':
        # 确保字体已注册
        if 'SimSun' not in pdfmetrics.getRegisteredFontNames():
            raise HTTPException(status_code=500, detail="请安装SimSun字体")

        output = io.BytesIO()
        c = canvas.Canvas(output, pagesize=A4)
        width, height = A4

        # 报表标题和导出时间
        y_position = height - 40  # 初始Y坐标
        c.setFont('SimSun', 16)
        c.drawCentredString(width/2, y_position, "学生成绩报表")
        c.setFont('SimSun', 10)
        c.drawRightString(width-50, y_position, f"导出时间：{dt.datetime.now().strftime('%Y-%m-%d %H:%M')}")


        # 学生基本信息
        y_position -= 60 
        c.setFont('SimSun', 12)
        c.drawString(50, y_position, f"学号：{student.stu_no}")
        y_position -= 30
        c.drawString(50, y_position, f"姓名：{student.stu_name}")
        y_position -= 30 
        c.drawString(50, y_position, f"性别：{'男' if student.gender == 'M' else '女'}")
        
        
        # 创建成绩表格
        data = [
            ['课程名称', '班次号', '学期', '成绩', '学分', '是否通过']
        ]
        for g in report_data['grades']:
            data.append([
                g['course_name'],
                g['class_no'],
                g['semester'],
                str(g['grade']) if g['grade'] else '未录入',
                str(g['credit']),
                g['passed']
            ])

        # 自动计算列宽
        col_widths = [width*0.3, width*0.15, width*0.15, width*0.1, width*0.1, width*0.1]
        
        # 创建表格并设置样式
        table = Table(data, colWidths=col_widths)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.black),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,-1), 'SimSun'),  # 修改这里，应用全局字体
            ('FONTSIZE', (0,0), (-1,0), 10),         # 表头字号
            ('FONTSIZE', (0,1), (-1,-1), 9),         # 数据行字号
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('BACKGROUND', (0,1), (-1,-1), colors.white),
            ('GRID', (0,0), (-1,-1), 1, colors.black)
        ]))

        # 绘制表格
        y_position -= 40  # 基本信息与表格间距
        table.wrapOn(c, width, height)
        table.drawOn(c, 30, y_position - table._height)  # type: ignore # 自动计算表格高度

        # 统计信息
        stats_text = [
            f"总学分：{report_data['stats']['total_credits']}",
            f"加权平均分：{report_data['stats']['gpa']}",
            f"不及格门数：{report_data['stats']['failed_count']}"
        ]
        y_position -= (table._height + 60) # type: ignore
        c.setFont('SimSun', 14)
        c.drawString(50, y_position, "成绩统计：")
        y_position -= 30
        c.setFont('SimSun', 12)
        for i, text in enumerate(stats_text):
            c.drawString(100, y_position - i*30, text)

        c.save()
        
        filename = f"学生成绩_{student.stu_no}_{dt.date.today().strftime('%Y%m%d')}.pdf"
        encoded_filename = quote_plus(filename, encoding='utf-8')
        
        return StreamingResponse(
            io.BytesIO(output.getvalue()),
            media_type="application/pdf",
            headers={
                "Content-Disposition": 
                f"attachment; filename*=UTF-8''{encoded_filename}"
            }
        )
