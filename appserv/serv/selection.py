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

class ClassStudentsResponse(BaseModel):
    added_count: int = Field(..., gt=0, description="实际新增关联数量")
    students: List[dict] = Field(..., description="更新后的完整学生列表")
    timestamp: str = Field(..., description="数据版本标识")

@router.get("/api/class/{class_sn}/students", 
            summary="获取班次关联学生")
async def get_class_students(
    class_sn: int,
    current_user: User = Depends(get_current_active_user)
):
    """获取指定班次已关联的学生列表"""
    validate_jiaomi_role(current_user.user_name)

    with dblock() as db:
        db.execute("""
            SELECT s.sn AS stu_sn, 
                   s.no AS stu_no, 
                   s.name AS stu_name, 
                   s.gender, 
                   s.enrollment_date
            FROM student AS s
            JOIN class_student AS cs ON s.sn = cs.stu_sn
            WHERE cs.class_sn = %(class_sn)s
            ORDER BY s.no
            """, 
            {"class_sn": class_sn,}
        )
        rows = db.fetchall()

    return rows  # 直接返回数组，不需要包装为 data 字段



@router.get("/api/class/{class_sn}/students/available", 
            summary="获取可选学生列表")
async def get_available_students(
    class_sn: int,
    current_user: User = Depends(get_current_active_user)
) -> List[dict]:
    """获取尚未关联到该班次的学生列表"""
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
                SELECT stu_sn 
                FROM class_student
                WHERE class_sn = %(class_sn)s
            )
            ORDER BY s.no
            """, {"class_sn": class_sn})
        return [asdict(row) for row in db]

@router.post("/api/class/{class_sn}/students", 
             status_code=status.HTTP_200_OK,  # 改为200更符合REST规范
             response_model=ClassStudentsResponse,
             summary="批量关联学生")
async def link_students_to_class(
    class_sn: int,
    selection: StudentSelection,
    current_user: User = Depends(get_current_active_user)
):
    """
    优化后的批量关联接口，返回：
    - added_count: 实际新增数量
    - students: 更新后的完整关联学生列表
    - timestamp: 数据版本标识
    """
    validate_jiaomi_role(current_user.user_name)
    
    with dblock() as db:
        try:
            # 检查班次是否存在
            db.execute("""
                SELECT sn AS class_sn, 
                    class_no, name, semester, location, cou_sn 
                FROM class 
                WHERE sn = %(class_sn)s
                LIMIT 1  -- 明确只取一条记录
                """, 
                {"class_sn": class_sn}
            )
            class_info = db.fetchone()
            if not class_info:
                raise HTTPException(404, "班次不存在")
        
            # 检查所有学生是否存在
            db.execute("""
                SELECT sn
                FROM student 
                WHERE sn = ANY(%(student_sns)s)
                """, 
                {"student_sns": selection.student_sns}
            )
            existing_sns = {row.sn for row in db}
            if missing := set(selection.student_sns) - existing_sns:
                raise HTTPException(404, detail=f"缺失学生ID: {missing}")
            

            db.execute("BEGIN")
            # 批量插入（使用 PostgreSQL 的 UNNEST 语法）
            db.execute("""
                INSERT INTO class_student (class_sn, stu_sn, created_at)
                SELECT %(class_sn)s, 
                    unnest(%(student_sns)s) AS stu_sn, 
                    %(now)s
                ON CONFLICT (class_sn, stu_sn) DO NOTHING
                RETURNING class_sn, stu_sn
                """, 
                    {
                        "class_sn": class_sn,
                        "student_sns": selection.student_sns,
                        "now": dt.datetime.now()
                    }
            )
            added_sns = {row.stu_sn for row in db}

            # 重新获取完整关联学生列表
            db.execute("""
                SELECT s.sn AS stu_sn, 
                    s.no AS stu_no, 
                    s.name AS stu_name, 
                    s.gender, 
                    s.enrollment_date
                FROM student AS s
                JOIN class_student AS cs ON s.sn = cs.stu_sn
                WHERE cs.class_sn = %(class_sn)s
                ORDER BY s.no
                """, 
                {"class_sn": class_sn}
            )
            updated_students = [asdict(row) for row in db]
            
            db.execute("COMMIT")

            return {
                "added_count": len(added_sns),
                "students": updated_students,
                "timestamp": dt.datetime.now().isoformat()
            }
        except Exception as e:
            db.execute("ROLLBACK")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"数据库关联失败: {str(e)}"
            )

@router.delete("/api/class/{class_sn}/students/{stu_sn}", 
               status_code=status.HTTP_204_NO_CONTENT, 
               summary="移除关联")
async def unlink_student(
    class_sn: int,
    stu_sn: int,
    current_user: User = Depends(get_current_active_user)
):
    """从班次中移除指定学生"""
    validate_jiaomi_role(current_user.user_name)
    
    with dblock() as db:
        try:
            db.execute("BEGIN")
            # 先删除成绩记录
            db.execute("""
                DELETE FROM class_grade
                WHERE class_sn = %(class_sn)s AND stu_sn = %(stu_sn)s
                """, {"class_sn": class_sn, "stu_sn": stu_sn})
            
            # 再删除选课记录
            db.execute("""
                DELETE FROM class_student 
                WHERE class_sn = %(class_sn)s AND stu_sn = %(stu_sn)s
                """, 
                {"class_sn": class_sn, "stu_sn": stu_sn}
            )

            db.execute("COMMIT")
            if db.rowcount == 0:
                raise HTTPException(status.HTTP_404_NOT_FOUND, "关联记录不存在")
        
        except Exception as e:
            db.execute("ROLLBACK")
            raise HTTPException(500, detail=f"移除失败: {str(e)}")  

@router.delete("/api/class/{class_sn}/students", 
               status_code=status.HTTP_200_OK, 
               response_model=ClassStudentsResponse,
               summary="批量移除学生")
async def batch_unlink_students(
    class_sn: int,
    selection: StudentSelection,
    current_user: User = Depends(get_current_active_user)
):
    """返回更新后的剩余学生列表"""
    validate_jiaomi_role(current_user.user_name)
    
    with dblock() as db:
        try:
            db.execute("BEGIN")
            # 1. 执行删除
            db.execute("""
                DELETE FROM class_student
                WHERE class_sn = %(class_sn)s 
                AND stu_sn = ANY(%(student_sns)s)
                """, 
                {
                    "class_sn": class_sn,
                    "student_sns": selection.student_sns
                }
            )

            # 2. 获取更新后列表
            db.execute("""
                SELECT s.sn, s.no, s.name, s.gender
                FROM student s
                JOIN class_student cs ON s.sn = cs.stu_sn
                WHERE cs.class_sn = %s
                """, (class_sn,))
            remaining_students = [asdict(row) for row in db]

            db.execute("COMMIT")

            return {
                "removed_count": db.rowcount,
                "students": remaining_students,
                "timestamp": dt.datetime.now().isoformat()
            }
        except Exception as e:
            db.execute("ROLLBACK")
            raise HTTPException(500, detail=f"批量移除失败: {str(e)}")