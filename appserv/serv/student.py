import asyncio  # noqa: F401
from dataclasses import asdict
from fastapi import status
import datetime as dt
from fastapi import HTTPException

from pydantic import BaseModel, field_validator
from .config import app, dblock
from .error import ConflictError, InvalidError


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


@app.get("/api/student/list")
async def get_student_list() -> list[Student]:
    with dblock() as db:
        db.execute("""
        SELECT sn AS stu_sn, no AS stu_no, name AS stu_name, gender, enrollment_date 
        FROM student
        ORDER BY no, name
        """)
        data = [Student(**asdict(row)) for row in db]

    return data


@app.get("/api/student/{stu_sn}")
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


@app.post("/api/student", status_code=status.HTTP_201_CREATED)
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

        # with dblock() as db:  # 思考：为什么此处不能另起一个连接或事务
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




@app.put("/api/student/{stu_sn}")
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


@app.delete("/api/student/{stu_sn}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(stu_sn):
    with dblock() as db:
        db.execute("DELETE FROM student WHERE sn=%(stu_sn)s", {"stu_sn": stu_sn})