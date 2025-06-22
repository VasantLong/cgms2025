import asyncio
from dataclasses import asdict
from datetime import datetime
from fastapi import HTTPException, APIRouter, status, Depends, UploadFile, File, Query
from typing import List
from pydantic import BaseModel, field_validator
from .config import dblock
from .error import ConflictError, InvalidError
from .auth import get_current_active_user, User
from fastapi.responses import StreamingResponse
import pandas as pd
from io import BytesIO
from urllib.parse import quote

router = APIRouter(tags=["成绩管理"])

class Grade(BaseModel):
    stu_sn: int
    course_sn: int# ？？？？？为什么不是 class_sn
    grade: float | None

    @field_validator('grade')
    def validate_grade(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError("成绩必须在0-100之间")
        return v

class GradeItem(BaseModel):
    stu_sn: int
    class_sn: int
    grade: float | None

class BatchGradeUpdate(BaseModel):
    grades: List[GradeItem]


class ImportRecord(BaseModel):
    stu_no: str
    name: str
    grade: float | None
    remark: str | None

class ImportRequest(BaseModel):
    class_sn: int
    records: List[ImportRecord]

class ImportResult(BaseModel):
    success: int
    failed: int
    invalid: int
    logs: List[str]

class GradeQueryParams(BaseModel):
    course_sn: int | None = None
    class_sn: int | None = None
    semester: str | None = None
    page: int = Query(1, ge=1)
    page_size: int = Query(20, ge=1, le=100)
    
@router.get("/api/grade/list", summary="获取成绩列表")
async def get_grade_list(
    params: GradeQueryParams = Depends(),
    current_user: User = Depends(get_current_active_user)
) -> dict:
    try:
        with dblock() as db:
            # 查询总记录数
            db.execute("""
                SELECT COUNT(*) AS total 
                FROM class_grade AS g
                INNER JOIN student AS s ON g.stu_sn = s.sn
                INNER JOIN class AS cl ON g.class_sn = cl.sn
                INNER JOIN course AS c ON cl.cou_sn = c.sn
            """)
            total_row = db.fetchone()
            total = total_row.total if total_row else 0
            # 计算偏移量
            offset = (params.page - 1) * params.page_size


            db.execute("""
                SELECT 
                    g.id AS grade_sn,
                    g.stu_sn AS stu_sn, 
                    cl.cou_sn AS course_sn,
                    s.name AS stu_name, 
                    c.name AS course_name, 
                    g.grade AS grade
                FROM class_grade AS g
                    INNER JOIN student AS s ON g.stu_sn = s.sn
                    INNER JOIN class AS cl ON g.class_sn = cl.sn
                    INNER JOIN course AS c ON cl.cou_sn = c.sn
                ORDER BY g.stu_sn, cl.cou_sn
                LIMIT %(page_size)s OFFSET %(offset)s
                """,
                {"page_size": params.page_size, "offset": offset})
        
            rows = db.fetchall()  # 使用fetchall避免游标问题
            data = [asdict(row) for row in rows]  # 转换为字典列表

        return {
            "data": data,
            "total": total
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/grade/batch", summary="批量更新成绩")
async def batch_update_grades(
    update: BatchGradeUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """批量更新成绩记录，自动处理插入和更新"""
    if not update.grades:
        return {"updated": 0}

    with dblock() as db:
        try:
            db.execute("BEGIN")

            # 新增版本检查（防止覆盖）
            db.execute("""
                SELECT updated_at FROM class 
                WHERE sn = %s FOR UPDATE
            """, (update.grades[0].class_sn,))

            # 构建批量操作SQL
            values = []
            params = {}
            for i, grade in enumerate(update.grades):
                params[f"stu_sn_{i}"] = grade.stu_sn
                params[f"class_sn_{i}"] = grade.class_sn
                params[f"grade_{i}"] = grade.grade
                values.append(
                    f"(%(stu_sn_{i})s, %(class_sn_{i})s, %(grade_{i})s)"
                )

            query = f"""
                INSERT INTO class_grade (stu_sn, class_sn, grade)
                VALUES {','.join(values)}
                ON CONFLICT (stu_sn, class_sn) 
                DO UPDATE SET grade = EXCLUDED.grade
                RETURNING stu_sn, class_sn
            """
            db.execute(query, params)
            updated = len(db.fetchall())

            # 新增更新时间戳
            db.execute("""
                UPDATE class 
                SET updated_at = NOW()
                WHERE sn = %s
            """, (update.grades[0].class_sn,))

            db.execute("COMMIT")
            return {"updated": updated}
        except Exception as e:
            db.execute("ROLLBACK")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"批量更新失败: {str(e)}"
            )
        
    # 记录变更日志
    for grade in update.grades:
        db.execute("""
            INSERT INTO grade_audit_log 
            (class_sn, stu_sn, old_grade, new_grade, operator)
            SELECT %s, %s, g.grade, %s, %s
            FROM class_grade g
            WHERE g.stu_sn = %s AND g.class_sn = %s
        """, (
            grade.class_sn,
            grade.stu_sn,
            grade.grade,
            current_user.user_sn,
            grade.stu_sn,
            grade.class_sn
        ))

@router.get("/api/grade/template/{class_sn}", summary="Excel模板")
async def download_template(class_sn: int):
    # 1. 获取班次学生列表
    with dblock() as db:
        db.execute("""
            SELECT cl.class_no, cl.name 
            FROM class AS cl
            WHERE cl.sn = %s
        """, (class_sn,))
        class_info = db.fetchone()
        
        if not class_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="班次不存在"
            )

        db.execute("""
            SELECT s.sn, s.no, s.name 
            FROM student s
            JOIN class_student cs ON s.sn = cs.stu_sn
            WHERE cs.class_sn = %s
            ORDER BY s.no
        """, (class_sn,))
        students = db.fetchall()

        if len(students) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该班次暂无学生，无法生成模板"
            )

    # 2. 生成Excel模板
    df = pd.DataFrame([{
        "学号": s.no,
        "姓名": s.name,
        "成绩": "",
        "备注": ""
    } for s in students])

    buffer = BytesIO()
    df.to_excel(buffer, index=False, engine="openpyxl")
    buffer.seek(0)

    # 3. 返回文件（修复中文文件名编码问题）
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{quote(f'{class_info.name}({class_info.class_no})成绩导入模板.xlsx')}"
        }
    )

@router.post("/api/grade/import", summary="Excel导入成绩")
async def import_grades(
    request: ImportRequest,
    current_user: User = Depends(get_current_active_user)
):
    """导入Excel成绩并验证"""
    stats = {
        'success': 0,
        'failed': 0,
        'invalid': 0,
        'logs': []
    }
    
    with dblock() as db:
        try:
            db.execute("BEGIN")
            
            # 1. 验证班次有效性
            db.execute("SELECT class_no FROM class WHERE sn = %s", (request.class_sn,))
            class_info = db.fetchone()
            if not class_info:
                raise HTTPException(400, "班次不存在")
            
            # 2. 处理每条记录
            for record in request.records:
                try:
                    # 新增类型检查
                    if record.grade is not None:
                        if not (0 <= record.grade <= 100):
                            stats['logs'].append(f"学号 {record.stu_no} 成绩超出范围")
                            stats['invalid'] += 1
                            continue
                        if not isinstance(record.grade, (int, float)):
                            stats['logs'].append(f"学号 {record.stu_no} 成绩格式错误")
                            stats['invalid'] += 1
                            continue

                    # 验证学生是否存在于此班次
                    db.execute("""
                        SELECT s.sn FROM student s
                        JOIN class_student cs ON s.sn = cs.stu_sn
                        WHERE s.no = %s AND cs.class_sn = %s
                    """, (record.stu_no, request.class_sn))
                    student = db.fetchone()
                    
                    if not student:
                        stats['logs'].append(f"学号 {record.stu_no} 不属于本班次")
                        stats['invalid'] += 1
                        continue
                        
                    # 验证成绩范围
                    if record.grade is not None and (record.grade < 0 or record.grade > 100):
                        stats['logs'].append(f"学号 {record.stu_no} 成绩超出范围")
                        stats['invalid'] += 1
                        continue
                        
                    # 执行插入/更新
                    db.execute("""
                        INSERT INTO class_grade (stu_sn, class_sn, grade)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (stu_sn, class_sn)
                        DO UPDATE SET grade = EXCLUDED.grade
                        RETURNING id
                    """, (student.sn, request.class_sn, record.grade))
                    
                    if db.fetchone():
                        stats['success'] += 1
                        # 记录操作日志
                        db.execute("""
                            INSERT INTO grade_import_logs 
                            (class_sn, stu_sn, operator, grade, created_at)
                            VALUES (%s, %s, %s, %s, %s)
                        """, (
                            request.class_sn,
                            student.sn,
                            current_user.user_sn,
                            record.grade,
                            datetime.now()
                        ))
                    else:
                        stats['failed'] += 1
                        
                except Exception as e:
                    stats['logs'].append(f"学号 {record.stu_no} 处理失败: {str(e)}")
                    stats['failed'] += 1
            
            db.execute("COMMIT")
            return {"stats": stats}
            
        except Exception as e:
            db.execute("ROLLBACK")
            raise HTTPException(500, f"导入过程中出错: {str(e)}")
        
# 冲突检测接口
@router.get("/api/grade/check-conflict/{class_sn}", summary="检测前端成绩数据改动")
async def check_grade_conflict(
    class_sn: int,
    current_user: User = Depends(get_current_active_user)
):
    with dblock() as db:
        db.execute("""
            SELECT updated_at 
            FROM class 
            WHERE sn = %s
        """, (class_sn,))
        row = db.fetchone()
        return {"version": row.updated_at.isoformat() if row else None}

@router.get("/api/grade/query", summary="查询成绩")
async def query_grades(
    params: GradeQueryParams = Depends(),
    current_user: User = Depends(get_current_active_user)
):
    try:
        with dblock() as db:
            where_clauses = []
            query_params = {}

            if params.course_sn:
                where_clauses.append("cl.cou_sn = %(course_sn)s")
                query_params["course_sn"] = params.course_sn

                if params.class_sn:
                    where_clauses.append("g.class_sn = %(class_sn)s")
                    query_params["class_sn"] = params.class_sn

                elif params.semester:
                    where_clauses.append("cl.semester = %(semester)s")
                    query_params["semester"] = params.semester

            where_condition = " AND ".join(where_clauses) if where_clauses else "1=1"

            # 查询总记录数
            count_query = f"""
                SELECT COUNT(*) as total 
                FROM class_grade AS g
                    INNER JOIN student AS s ON g.stu_sn = s.sn
                    INNER JOIN class AS cl ON g.class_sn = cl.sn
                    INNER JOIN course AS c ON cl.cou_sn = c.sn
                WHERE {where_condition}
            """
            db.execute(count_query, query_params)
            total_row = db.fetchone()
            total = total_row.total if total_row else 0

            # 计算偏移量
            offset = (params.page - 1) * params.page_size
                # 查询当前页数据
            data_query = f"""
                SELECT 
                    g.id AS grade_sn,
                    g.stu_sn AS stu_sn, 
                    cl.cou_sn AS course_sn,
                    s.name AS stu_name, 
                    c.name AS course_name, 
                    g.grade AS grade
                FROM class_grade AS g
                    INNER JOIN student AS s ON g.stu_sn = s.sn
                    INNER JOIN class AS cl ON g.class_sn = cl.sn
                    INNER JOIN course AS c ON cl.cou_sn = c.sn
                WHERE {where_condition}
                LIMIT %(page_size)s OFFSET %(offset)s
            """
            query_params["page_size"] = params.page_size
            query_params["offset"] = offset

            db.execute(data_query, query_params)
            rows = db.fetchall()
            data = [asdict(row) for row in rows]

            return {
                "data": data,
                "total": total
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))