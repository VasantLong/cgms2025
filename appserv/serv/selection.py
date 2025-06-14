from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List
import datetime as dt
from dataclasses import asdict

from .config import dblock
from .auth import get_current_active_user, User
from .course_class import validate_jiaomi_role


router = APIRouter(tags=["选课管理"])

class StudentSelection(BaseModel):
    student_sns: List[int]

# 新增请求模型
class ClassStudentsUpdate(BaseModel):
    student_sns: List[int] = Field(..., description="最终需要关联的学生SN列表")

class ClassStudentsResponse(BaseModel):
    total_count: int = Field(..., description="最终关联总数")
    added: List[int] = Field(default_factory=list, description="新增关联的学生SN")
    removed: List[int] = Field(default_factory=list, description="移除关联的学生SN")
    conflicts: List[dict] = Field(default_factory=list, description="冲突学生详情")
    students: List[dict] = Field(..., description="更新后的完整学生列表")
    timestamp: str = Field(default_factory=lambda: dt.datetime.now().isoformat(), 
                         description="操作时间戳")

async def get_current_students(db, class_sn: int) -> List[dict]:
    """辅助函数：获取当前关联学生"""
    db.execute("""
        SELECT s.sn AS stu_sn, 
               s.no AS stu_no, 
               s.name AS stu_name, 
               s.gender, s.enrollment_date
        FROM student AS s
        JOIN class_student AS cs ON s.sn = cs.stu_sn
        WHERE cs.class_sn = %(class_sn)s
        ORDER BY s.no
        """, 
        {"class_sn": class_sn}
    )
    return [asdict(row) for row in db]

@router.get("/api/class/{class_sn}/students", 
            summary="获取班次关联学生")
async def get_class_students(
    class_sn: int,
    current_user: User = Depends(get_current_active_user)
):
    """获取指定班次已关联的学生列表"""
    validate_jiaomi_role(current_user.user_name)
    with dblock() as db:
        return await get_current_students(db, class_sn)


@router.get("/api/class/{class_sn}/students/available",
           summary="获取可选学生列表")
async def get_available_students(
    class_sn: int,
    current_user: User = Depends(get_current_active_user)
):
    validate_jiaomi_role(current_user.user_name)
    with dblock() as db:
        db.execute("""
            SELECT s.sn AS stu_sn, 
                   s.no AS stu_no, 
                   s.name AS stu_name, 
                   s.gender, 
                   s.enrollment_date
            FROM student AS s
            WHERE s.sn NOT IN (
                SELECT stu_sn FROM class_student
                WHERE class_sn = %(class_sn)s
            )
            ORDER BY s.no
            """, 
            {"class_sn": class_sn}
        )
        return [asdict(row) for row in db]

@router.put("/api/class/{class_sn}/students",
            response_model=ClassStudentsResponse,
            summary="批量更新关联学生")
async def update_class_students(
    class_sn: int,
    update: ClassStudentsUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """
    统一更新班次学生关联关系
    1. 自动计算需要添加和移除的学生
    2. 检查课程冲突
    3. 在事务中执行所有变更
    4. 返回详细变更结果
    """
    validate_jiaomi_role(current_user.user_name)
    
    with dblock() as db:
        try:
            # 1. 获取课程和当前关联信息
            db.execute("""
                SELECT c.cou_sn, 
                    ARRAY(
                        SELECT stu_sn 
                        FROM class_student 
                        WHERE class_sn = %(class_sn)s
                    ) AS current_sns
                FROM class c WHERE c.sn = %(class_sn)s
                """, 
                {"class_sn": class_sn}
            )
            class_info = db.fetchone()
            if not class_info:
                raise HTTPException(404, "班次不存在")
            
            current_sns = class_info.current_sns or []
            new_sns = update.student_sns
            
            # 2. 计算差异
            to_add = list(set(new_sns) - set(current_sns))
            to_remove = list(set(current_sns) - set(new_sns))

            # 3. 在事务开始前检查是否修改和冲突
            if not update.student_sns and not current_sns:
                return {
                    "total_count": 0,
                    "added": [],
                    "removed": [],
                    "conflicts": [],
                    "students": await get_current_students(db, class_sn)
                }
            
            if to_add:
                db.execute("""
                    SELECT s.sn AS stu_sn, s.no AS stu_no, s.name AS stu_name, c.class_no AS class_no
                    FROM student AS s
                    JOIN class_student AS cs ON s.sn = cs.stu_sn
                    JOIN class AS c ON cs.class_sn = c.sn
                    WHERE s.sn = ANY(%(sns)s) 
                    AND c.cou_sn = %(cou_sn)s
                    AND c.sn != %(class_sn)s
                    """, 
                    {
                        "sns": to_add,
                        "cou_sn": class_info.cou_sn,
                        "class_sn": class_sn
                    }
                )
                conflicts = [asdict(row) for row in db]
                if conflicts:
                    return {
                        "total_count": len(current_sns),
                        "added": [],
                        "removed": [],
                        "conflicts": conflicts,
                        "students": await get_current_students(db, class_sn)
                    }
            


            db.execute("BEGIN")

            # 4. 执行删除
            if to_remove:
                db.execute("""
                    DELETE FROM class_student
                    WHERE class_sn = %(class_sn)s
                    AND stu_sn = ANY(%(sns)s)
                    """, {"class_sn": class_sn, "sns": to_remove})
                db.execute("""
                    DELETE FROM class_grade
                    WHERE class_sn = %(class_sn)s
                    AND stu_sn = ANY(%(sns)s)
                    """, {"class_sn": class_sn, "sns": to_remove})

            # 5. 执行新增（使用 PostgreSQL 的 UNNEST 语法）
            if to_add:
                db.execute("""
                    INSERT INTO class_student (class_sn, stu_sn)
                    SELECT %(class_sn)s, unnest(%(sns)s)
                    ON CONFLICT DO NOTHING
                    """, 
                    {"class_sn": class_sn, "sns": to_add}
                )

            # 6. 获取最新列表
            students = await get_current_students(db, class_sn)
            
            db.execute("COMMIT")
            
            return {
                "total_count": len(students),
                "added": to_add,
                "removed": to_remove,
                "conflicts": [],
                "students": students
            }
        
        except Exception as e:
            db.execute("ROLLBACK")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"数据库关联失败: {str(e)}"
            )
