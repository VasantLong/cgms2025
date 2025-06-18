import asyncio  # noqa: F401
from dataclasses import asdict
from fastapi import status, Query, Depends
import datetime as dt
from fastapi import HTTPException, APIRouter
from .auth import get_current_active_user, User
from .course_class import validate_jiaomi_role

from pydantic import BaseModel, field_validator
from .config import app, dblock
from .error import ConflictError, InvalidError

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
    last_sn: int = Query(None)  # 新增参数
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
        # 获取学生基本信息
        db.execute("""
            SELECT s.sn AS stu_sn, 
                   s.no AS stu_no, 
                   s.name AS stu_name, 
                   s.gender, s.enrollment_date 
            FROM student s WHERE s.sn = %s
            """, (stu_sn,))
        student = db.fetchone()
        
        # 获取成绩数据（基于已有视图）
        db.execute("""
            SELECT 
                c.name AS course_name,
                cl.class_no,
                cl.semester,
                g.grade,
                c.credit
            FROM student_grade_report g
            JOIN class cl ON g.class_sn = cl.sn
            JOIN course c ON cl.cou_sn = c.sn
            WHERE g.stu_sn = %s
            ORDER BY cl.semester DESC
        """, (stu_sn,))
        grades = db.fetchall()
        
    return {
        "student": student,
        "grades": grades,
        "stats": {
            "total_credits": sum(g.credit for g in grades if g.grade >= 60),
            "gpa": sum(g.grade * g.credit for g in grades) / sum(g.credit for g in grades) if grades else 0
        }
    }
