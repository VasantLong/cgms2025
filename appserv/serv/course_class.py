import asyncio
from dataclasses import asdict
from fastapi import status, Depends
import datetime as dt
from fastapi import HTTPException

from pydantic import BaseModel, field_validator
from .config import app, dblock
from .error import ConflictError, InvalidError
from .auth import get_current_user, get_current_active_user, User

class Class(BaseModel):
    class_sn: int | None
    class_no: str
    name: str | None
    semester: str | None
    location: str | None
    course_sn: int

    @field_validator('class_no')
    def validate_class_no(cls, v):
        try:
            course_no, year = v.split('-')
        except ValueError:
            raise ValueError("班次号格式应为'课程号-年份'（如10055-2023）")
        if not course_no.isdigit() or len(course_no)!=5 or not year.isdigit() or len(year)!=4:
            raise ValueError("班次号格式应为5位数字课程号-4位数字年份")
        return v

# 教秘角色校验函数（感觉没什么大用）
def validate_jiaomi_role(username: str):
    if not username.startswith("jiaomi_"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅教秘用户可执行此操作"
        )

@app.get("/api/class/list")
async def get_class_list() -> list[Class]:
    with dblock() as db:
        db.execute("""
        SELECT sn AS class_sn, class_no, name, semester, location, cou_sn AS course_sn
        FROM class 
        ORDER BY class_no, name
        """)
        data = [Class(**asdict(row)) for row in db]

    return data

@app.get("/api/class/{class_sn}")
async def get_class_profile(class_sn: int) -> Class:
    with dblock() as db:
        db.execute(
            """
            SELECT sn AS class_sn, class_no, name, semester, location, cou_sn AS course_sn
            FROM class WHERE sn=%(class_sn)s
            """,
            dict(class_sn=class_sn),
        )
        row = db.fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"无此班次(sn={class_sn})"
        )
    
    return row

# 确认课程号包含在班次号中
@app.post("/api/class", status_code=status.HTTP_201_CREATED)
async def create_class(
    class_data: Class, 
    current_user: User = Depends(get_current_active_user)
) -> Class:

    validate_jiaomi_role(current_user.user_name)  # 新增角色校验
    class_no = class_data.class_no
    with dblock() as db:
        # 检查班次号是否已存在
        db.execute(
            """
            SELECT sn FROM class 
            WHERE class_no=%(class_no)s
            """,
            dict(class_no=class_no)
        )
        record = db.fetchone()
        if record:
            raise ConflictError(f"班次号'{class_no}'已存在")
        
        # 验证课程号匹配
        course_no_part = class_no.split('-')[0]
        db.execute(
            """SELECT 1 FROM course 
            WHERE sn=%(course_sn)s AND no=%(course_no)s
            """,
            {"course_sn": class_data.course_sn, "course_no": course_no_part}
        )
        if not db.fetchone():
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "班次号中的课程号与关联课程不匹配")
        # 插入数据
        db.execute(
            """
            INSERT INTO class (class_no, name, semester, location, cou_sn) 
            VALUES (%(class_no)s, %(name)s, %(semester)s, %(location)s, %(course_sn)s) 
            RETURNING sn
            """,
            class_data.model_dump()
        )
        row = db.fetchone()
        class_data.class_sn = row.sn  # type: ignore
    return class_data


@app.put("/api/class/{class_sn}")
async def update_class(
    class_sn: int, 
    class_data: Class,
    current_user: User = Depends(get_current_active_user)
) -> Class:
    
    validate_jiaomi_role(current_user.user_name)  # 新增角色校验
    # 参数校验
    if class_sn != class_data.class_sn:
        raise HTTPException(400, "班次SN不匹配")
    class_no = class_data.class_no

    with dblock() as db:
        # 检查班次号是否已存在（排除自身）
        db.execute(
            """
            SELECT sn FROM class 
            WHERE class_no=%(class_no)s AND sn!=%(class_sn)s
            """,
            {"class_no": class_no, "class_sn": class_sn})
        if db.fetchone():
            raise ConflictError(f"班次号'{class_no}'已存在")
        
        # 验证课程号匹配
        course_no_part = class_no.split('-')[0]
        db.execute(
            """
            SELECT 1 FROM course 
            WHERE sn=%(cou_sn)s AND no=%(course_no)s
            """,
            {"cou_sn": class_data.course_sn, "course_no": course_no_part}
        )
        if not db.fetchone():
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "班次号中的课程号与关联课程不匹配")
        
        # 更新数据库
        db.execute("""
            UPDATE class SET 
            class_no=%(class_no)s, 
            name=%(name)s,
            semester=%(semester)s,
            location=%(location)s,
            cou_sn=%(course_sn)s 
            WHERE sn=%(class_sn)s
            """,
            class_data.model_dump()
        )
    return class_data

@app.delete("/api/class/{class_sn}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(
    class_sn: int,
    current_user: User = Depends(get_current_active_user)
):
    validate_jiaomi_role(current_user.user_name)  # 新增角色校验
    with dblock() as db:
        db.execute(
            "DELETE FROM class WHERE sn=%(class_sn)s",
            {"class_sn": class_sn}
        )
        if db.rowcount == 0:
            raise HTTPException(404, "班次不存在")

# 其他辅助函数...