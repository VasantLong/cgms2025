import asyncio
from dataclasses import asdict
from fastapi import status, Depends, Query, Body
import datetime as dt
from fastapi import HTTPException, APIRouter
import re

from pydantic import BaseModel, field_validator
from .config import app, dblock
from .error import ConflictError, InvalidError
from .auth import get_current_user, get_current_active_user, User

router = APIRouter(tags=["班次管理"])

class Class(BaseModel):
    class_sn: int | None
    class_no: str
    name: str | None
    semester: str | None
    location: str | None
    cou_sn: int

    @field_validator('class_no')
    def validate_class_no(cls, v):
        # 还需要检查课程号是否存在，学期格式是否正确，序号是否合法等
        pattern = r'^\d{5}-\d{4}S[12]-\d{2}$'
        if not re.match(pattern, v):
            raise ValueError("班次号格式应为'课程号-年份学期-序号'（如10055-2023S1-01）")
        return v

# 教秘角色校验函数（感觉没什么大用）
def validate_jiaomi_role(username: str):
    if not username.startswith("jiaomi_"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅教秘用户可执行此操作"
        )

@router.get("/api/class/list", summary="获取班次列表")
async def get_class_list(
    course_sn: int = Query(None),  # 新增过滤参数
    current_user: User = Depends(get_current_active_user)
):
    with dblock() as db:
        base_query = """
            SELECT cl.sn AS class_sn, cl.class_no, cl.name, 
                   cl.semester, cl.location, c.name AS course_name
            FROM class cl
            JOIN course c ON cl.cou_sn = c.sn
        """
        params = {}
        if course_sn:
            base_query += " WHERE cl.cou_sn = %(course_sn)s"
            params["course_sn"] = course_sn
            
        base_query += " ORDER BY cl.semester DESC, cl.class_no"
        db.execute(base_query, params)
        return [asdict(row) for row in db]

# 获取指定课程在特定学年学期下的最新班次序号
@router.get("/api/class/sequence", summary="获取最新班次序号")
async def get_class_sequence(
    cou_sn: int, 
    year: int, 
    semester_type: str = Query(..., alias="semesterType"),
    exclude_class_sn: int | None = Query(None)
):  # 使用别名# 新增参数，用于排除当前班次
    
    # 匹配某课程特定学期（比如2023S1）的班次，返回最大的序号
    with dblock() as db:
        query = """
            SELECT MAX(CAST(SPLIT_PART(class_no, '-', 3) AS INTEGER)) AS max_seq
            FROM class 
            WHERE cou_sn = %(cou_sn)s 
              AND class_no LIKE %(pattern)s
        """
        params = {
            "cou_sn": cou_sn,
            "pattern": f"%-{year}S{semester_type}-%"
        }

        # 如果传入了排除的class_sn，则添加到查询条件
        if exclude_class_sn:
            query += " AND sn != %(exclude_sn)s"
            params["exclude_sn"] = exclude_class_sn
            
        db.execute(query, params)
        row = db.fetchone()

        max_sequence = row.max_seq if (row and row.max_seq is not None) else 0
        return {"max_sequence": max_sequence}

@router.get("/api/class/{class_sn}", summary="获取班次详情")
async def get_class_profile(class_sn) -> Class:
    with dblock() as db:
        db.execute(
            """
            SELECT sn AS class_sn, class_no, name, semester, location, cou_sn
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
@router.post("/api/class", summary="创建班次", status_code=status.HTTP_201_CREATED)
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
            """SELECT sn AS course_sn, no AS course_no FROM course 
            WHERE sn=%(cou_sn)s AND no=%(course_no)s
            """,
            {"cou_sn": class_data.cou_sn, "course_no": course_no_part}
        )
        if not db.fetchone():
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "班次号中的课程号与关联课程不匹配")
        # 插入数据
        db.execute(
            """
            INSERT INTO class (class_no, name, semester, location, cou_sn) 
            VALUES (%(class_no)s, %(name)s, %(semester)s, %(location)s, %(cou_sn)s) 
            RETURNING sn AS class_sn
            """,
            class_data.model_dump()
        )
        row = db.fetchone()
        class_data.class_sn = row.class_sn  # type: ignore
    return class_data


@router.put("/api/class/{class_sn}")
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
            SELECT sn AS course_sn, no AS course_no FROM course 
            WHERE sn=%(cou_sn)s AND no=%(course_no)s
            """,
            {"cou_sn": class_data.cou_sn, "course_no": course_no_part}
        )
        if not db.fetchone():
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "班次号中的课程号与关联课程不匹配")
        
        # 更新数据库 - 确保只更新允许的字段（地点）
        update_data = {
            "class_sn": class_sn,
            "location": class_data.location,
            # 确保其他字段保持不变
            "class_no": class_data.class_no,
            "name": class_data.name,
            "semester": class_data.semester,
            "cou_sn": class_data.cou_sn
        }

        db.execute("""
            UPDATE class SET 
            location=%(location)s
            WHERE sn=%(class_sn)s
            RETURNING sn as class_sn, class_no, name, semester, location, cou_sn
            """,
            update_data
        )
        row = db.fetchone()
        if not row:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "班次不存在")
    
    return class_data

@router.delete("/api/class/{class_sn}", summary="删除班次", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(
    class_sn: int,
    current_user: User = Depends(get_current_active_user)
):
    validate_jiaomi_role(current_user.user_name)
    with dblock() as db:
        try:
            # 检查班次下是否有学生记录
            db.execute(
                "SELECT COUNT(*) AS student_count FROM class_student WHERE class_sn = %(class_sn)s",
                {"class_sn": class_sn}
            )
            student_row = db.fetchone()
            student_count = student_row.student_count if student_row else 0

            # 检查班次下是否有成绩记录
            db.execute(
                "SELECT COUNT(*)  AS grade_count FROM class_grade WHERE class_sn = %(class_sn)s",
                {"class_sn": class_sn}
            )
            grade_row = db.fetchone()
            grade_count = grade_row.grade_count if grade_row else 0

            if student_count > 0 or grade_count > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="该班次下有学生或成绩记录，不能删除"
                )
            
            db.execute(
                "DELETE FROM class WHERE sn=%(class_sn)s",
                {"class_sn": class_sn}
            )
            if db.rowcount == 0:
                raise HTTPException(404, "班次不存在")
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"删除班次时发生错误: {str(e)}"
            )          

@router.patch("/api/class/{class_sn}", status_code=status.HTTP_200_OK)
async def update_class_location(
    class_sn: int, 
    location: str = Body(..., embed=True),
    current_user: User = Depends(get_current_active_user)
):
    validate_jiaomi_role(current_user.user_name)
    
    with dblock() as db:
        # 仅更新location字段
        db.execute(
            "UPDATE class SET location=%(loc)s WHERE sn=%(sn)s",
            {"loc": location, "sn": class_sn}
        )
            # 修改返回数据，包含完整班次信息
        db.execute("""
            SELECT sn AS class_sn, class_no, 
                   name, semester, location, cou_sn
            FROM class WHERE sn=%(sn)s
            """,
            {"sn": class_sn}
        )
        updated_class = db.fetchone()
    return updated_class
