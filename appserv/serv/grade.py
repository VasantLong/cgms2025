import asyncio
from dataclasses import asdict
from fastapi import status
import datetime as dt
from fastapi import HTTPException

from pydantic import BaseModel, field_validator
from .config import app, dblock
from .error import ConflictError, InvalidError


class Grade(BaseModel):
    stu_sn: int
    course_sn: int# ？？？？？为什么不是 class_sn
    grade: float | None

    @field_validator('grade')
    def validate_grade(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError("成绩必须在0-100之间")
        return v

# 在grade.py添加测试路由
@app.get("/api/debug/test")
async def debug_test():
    with dblock() as db:
        db.execute("SELECT * FROM class_grade")
        return {"count": len(list(db)), "first_5": list(db)[:5]}
    
@app.get("/api/grade/list")
async def get_grade_list() -> list[dict]:
    with dblock() as db:
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
        ORDER BY g.stu_sn, cl.cou_sn;       
        """)
        
        rows = db.fetchall()  # 使用fetchall避免游标问题
        data = [asdict(row) for row in rows]  # 转换为字典列表
    return data


@app.get("/api/grade/student/{stu_sn}/course/{course_sn}")
async def get_grade(stu_sn: int, course_sn: int):
    with dblock() as db:
        db.execute("""
        SELECT g.grade 
        FROM class_grade AS g
        JOIN class AS cl ON g.class_sn = cl.sn
        WHERE g.stu_sn = %s AND cl.cou_sn = %s
        """, (stu_sn, course_sn))
    return db.fetchone()

@app.post("/api/grade", status_code=status.HTTP_201_CREATED)
async def create_grade(grade: Grade) -> dict:
    with dblock() as db:
        db.execute(
            """
            INSERT INTO class_grade (stu_sn, class_sn, grade)
            SELECT %(stu_sn)s, cl.sn, %(grade)s
            FROM class as cl
            WHERE cl.cou_sn = %(cou_sn)s
            RETURNING stu_sn, cou_sn, grade
            """,
            grade.model_dump(),
        )
        row = db.fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="创建成绩失败"
        )

    return row

@app.put("/api/grade/{stu_sn}/{cou_sn}")
async def update_grade(stu_sn: int, cou_sn: int, grade: Grade) -> dict:
    assert stu_sn == grade.stu_sn
    assert cou_sn == grade.course_sn
    
    with dblock() as db:
        db.execute(
            """
            UPDATE class_grade as g
            SET grade = %(grade)s
            FROM class as cl
            WHERE g.stu_sn = %(stu_sn)s 
              AND g.class_sn = cl.sn 
              AND cl.cou_sn = %(cou_sn)s
            RETURNING g.stu_sn, cl.cou_sn, g.grade
            """,
            grade.model_dump(),
        )
        row = db.fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"无此成绩记录(stu_sn={stu_sn}, cou_sn={cou_sn})"
        )

    return row

@app.delete("/api/grade/{stu_sn}/{cou_sn}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_grade(stu_sn: int, cou_sn: int):
    with dblock() as db:
        db.execute(
            """
            DELETE FROM class_grade as g
            USING class as cl
            WHERE g.stu_sn = %(stu_sn)s 
              AND g.class_sn = cl.sn 
              AND cl.cou_sn = %(cou_sn)s
            RETURNING g.stu_sn, cl.cou_sn, g.grade
            """,
            dict(stu_sn=stu_sn, cou_sn=cou_sn),
        )
        row = db.fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"无此成绩记录(stu_sn={stu_sn}, cou_sn={cou_sn})"
        )

    return row