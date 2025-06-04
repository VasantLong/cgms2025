import asyncio  # noqa: F401
from dataclasses import asdict
from fastapi import status
import datetime as dt
from fastapi import HTTPException

from pydantic import BaseModel
from .config import app, dblock
from .error import ConflictError, InvalidError


class Student(BaseModel):
    stu_sn: int | None
    stu_no: str
    stu_name: str
    gender: str | None
    enrolled: dt.date | None


@app.get("/api/student/list")
async def get_student_list() -> list[Student]:
    with dblock() as db:
        db.execute("""
        SELECT sn AS stu_sn, no AS stu_no, name AS stu_name, gender, enrolled 
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
            SELECT sn AS stu_sn, no AS stu_no, name AS stu_name, gender, enrolled 
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
    if not student.enrolled:
        student.enrolled = dt.date(1900, 1, 1)

    stu_no = student.stu_no
    if len(stu_no.strip()) != 4:
        raise InvalidError(f"学号'{stu_no}'需按照4位学号编制")

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
            INSERT INTO student (no, name, gender, enrolled)
            VALUES(%(stu_no)s, %(stu_name)s, %(gender)s, %(enrolled)s) 
            RETURNING sn""",
            student.model_dump(),
        )
        row = db.fetchone()
        student.stu_sn = row.sn

    return student




@app.put("/api/student/{stu_sn}")
async def update_student(stu_sn: int, student: Student):
    if not student.enrolled:
        student.enrolled = dt.date(1900, 1, 1)

    assert student.stu_sn == stu_sn

    stu_no = student.stu_no
    if len(stu_no.strip()) != 4:
        raise InvalidError(f"学号'{stu_no}'需按照4位学号编制")

    with dblock() as db:
        db.execute(
            """
            UPDATE student SET
                no=%(stu_no)s, name=%(stu_name)s, 
                gender=%(gender)s, enrolled=%(enrolled)s
            WHERE sn=%(stu_sn)s;
            """,
            student.model_dump(),
        )


@app.delete("/api/student/{stu_sn}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(stu_sn):
    with dblock() as db:
        db.execute("DELETE FROM student WHERE sn=%(stu_sn)s", {"stu_sn": stu_sn})
