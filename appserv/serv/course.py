import asyncio
from dataclasses import asdict
from fastapi import status, APIRouter, Query, Depends, HTTPException
from fastapi_cache.decorator import cache
import datetime as dt

from pydantic import BaseModel, field_validator
from .config import app, dblock
from .error import ConflictError, InvalidError
from .auth import get_current_active_user, User

router = APIRouter(tags=["课程管理"])

class Course(BaseModel):
    course_sn: int | None
    course_no: str
    course_name: str
    credit: float | None
    hours: int | None

    @field_validator('course_no')
    def validate_course_no(cls, v):
        if not v.isdigit() or len(v) != 5:
            raise ValueError("api：课程号必须为5位数字")
        return v

    @field_validator('credit')
    def validate_credit(cls, v):
        if v is not None and v <= 0:
            raise ValueError("api：学分必须大于0")
        return v

    @field_validator('hours')
    def validate_hours(cls, v):
        if v is not None and v <= 0:
            raise ValueError("api：学时必须大于0")
        return v

@router.get("/api/course/list", summary="获取课程列表")
@cache(expire=300)  # 添加5分钟缓存
async def get_course_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
) -> dict:
    try:
        with dblock() as db:
            # 计算偏移量
            offset = (page - 1) * page_size

            # 查询总记录数
            db.execute("SELECT COUNT(*) AS total FROM course")
            total_row = db.fetchone()
            total = total_row.total if total_row and hasattr(total_row, "total") else 0

            # 查询当前页数据
            db.execute("""
                    SELECT sn AS course_sn, 
                        no AS course_no, 
                        name AS course_name, 
                        credit, 
                        hours 
                    FROM course
                    LIMIT %(page_size)s OFFSET %(offset)s
                    """, 
                    {"page_size": page_size, "offset": offset})
            result = db.fetchall()

            courses = [
                {
                    "course_sn": row.course_sn,
                    "course_no": row.course_no,
                    "course_name": row.course_name,
                    "credit": row.credit,
                    "hours": row.hours
                }
                for row in result
            ]

            return {
                "data": courses,
                "total": total
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/course/{course_sn}")
async def get_course_profile(course_sn) -> Course:
    with dblock() as db:
        db.execute(
            """
            SELECT sn AS course_sn, no AS course_no, name AS course_name, credit, hours
            FROM course WHERE sn=%(course_sn)s
            """,
            dict(course_sn=course_sn),
        )
        row = db.fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"无此课程(sn={course_sn})"
        )

    return row


@router.post("/api/course", status_code=status.HTTP_201_CREATED)
async def new_course(course: Course) -> Course:
    course_no = course.course_no
    #course_dict = course.model_dump()
    #course_no = course_dict.get('course_no')
    with dblock() as db:
        db.execute(
            """
            SELECT sn AS course_sn, name AS course_name FROM course
            WHERE no=%(course_no)s
            """,
            dict(course_no=course_no),
        )
        record = db.fetchone()
        if record:
            raise ConflictError(
                f"课程号'{course_no}'已被{record.course_name}(#{record.course_sn}占用"
            )

        db.execute(
            """
            INSERT INTO course (no, name, credit, hours)
            VALUES(%(course_no)s, %(course_name)s, %(credit)s, %(hours)s) 
            RETURNING sn""",
            course.model_dump(),
        )
        row = db.fetchone()
        course.course_sn = row.sn # type: ignore

    return course


@router.put("/api/course/{course_sn}")
async def update_course(course_sn: int, course: Course):
    assert course_sn == course.course_sn
    course_no = course.course_no
    with dblock() as db:
        db.execute(
            """
            UPDATE course SET
                no=%(course_no)s, name=%(course_name)s, 
                credit=%(credit)s, hours=%(hours)s
            WHERE sn=%(course_sn)s;""",
            course.model_dump(),
        )


@router.delete("/api/course/{course_sn}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(course_sn):
    with dblock() as db:
        db.execute("DELETE FROM course WHERE sn=%(course_sn)s", {"course_sn": course_sn})