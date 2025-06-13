from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import List
import datetime as dt
from dataclasses import asdict

from .config import dblock
from .auth import get_current_active_user, User
from .course_class import validate_jiaomi_role


router = APIRouter(tags=["选课管理"])

class StudentSelection(BaseModel):
    student_sns: List[int]

@router.get("/api/class/{class_sn}/students", 
            summary="获取班次关联学生")
async def get_class_students(
    class_sn: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    """获取指定班次已关联的学生列表"""
    validate_jiaomi_role(current_user.user_name)

    offset = (page - 1) * page_size
    with dblock() as db:
        db.execute("""
            SELECT s.sn AS stu_sn, 
                   s.no AS stu_no, 
                   s.name AS stu_name, 
                   s.gender, 
                   s.enrollment_date,
                   COUNT(*) OVER() AS total_count
            FROM student AS s
            JOIN class_student AS cs ON s.sn = cs.stu_sn
            WHERE cs.class_sn = %(class_sn)s
            ORDER BY s.no
            LIMIT %(limit)s OFFSET %(offset)s
            """, 
            {
                "class_sn": class_sn,
                "limit": page_size,
                "offset": offset
            }
        )
        
        rows = [asdict(row) for row in db]
        total = rows[0]["total_count"] if rows else 0

        return {
            "data": rows,
            "pagination": {
                "total": total,
                "page": page,
                "page_size": page_size
            }
        }


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
            SELECT s.sn, s.no, s.name, s.gender
            FROM student s
            WHERE s.sn NOT IN (
                SELECT stu_sn 
                FROM class_student
                WHERE class_sn = %(class_sn)s
            )
            ORDER BY s.no
            """, {"class_sn": class_sn})
        return [asdict(row) for row in db]

@router.post("/api/class/{class_sn}/students", 
             status_code=status.HTTP_201_CREATED, 
             summary="批量关联学生")
async def link_students_to_class(
    class_sn: int,
    selection: StudentSelection,
    current_user: User = Depends(get_current_active_user)
):
    """批量关联学生到指定班次"""
    validate_jiaomi_role(current_user.user_name)
    
    with dblock() as db:
        # 检查班次是否存在
        db.execute("""
            SELECT sn AS class_sn, class_no, name, semester, location, cou_sn 
            FROM class 
            WHERE sn = %s FOR UPDATE
            """, 
             (class_sn,)
        )
        if not db.fetchone():
            raise HTTPException(404, "班次不存在")
    
        # 检查所有学生是否存在
        db.execute("""
            SELECT array_agg(sn) FROM student 
            WHERE sn = ANY(%s)
            """, 
            (selection.student_sns,)
        )
        existing = db.fetchone()[0] or [] # type: ignore
        if len(existing) != len(selection.student_sns):
            missing = set(selection.student_sns) - set(existing)
            raise HTTPException(404, f"以下学生不存在: {missing}")
        
        try:
            db.execute("BEGIN")
            # 批量插入（使用 PostgreSQL 的 UNNEST 语法）
            db.execute("""
                WITH inserted AS (
                    INSERT INTO class_student (class_sn, stu_sn, created_at)
                    SELECT %(class_sn)s, 
                       unnest(%(student_sns)s), 
                       %(now)s
                    WHERE NOT EXISTS (
                        SELECT 1 FROM class_student 
                        WHERE class_sn = %(class_sn)s 
                        AND stu_sn = unnest(%(student_sns)s)
                    )
                    RETURNING 1
                )
                SELECT COUNT(*) FROM inserted
                """, 
                {
                    "class_sn": class_sn,
                    "student_sns": selection.student_sns,
                    "now": dt.datetime.now()
                }
            )
            count = db.fetchone()
            db.execute("COMMIT")
            return {"added": count[0]}  # type: ignore # 返回实际添加数量
        
        except Exception as e:
            db.execute("ROLLBACK")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"关联失败: {str(e)}"
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
               status_code=204, 
               summary="批量移除学生")
async def batch_unlink_students(
    class_sn: int,
    selection: StudentSelection,
    current_user: User = Depends(get_current_active_user)
):
    validate_jiaomi_role(current_user.user_name)
    
    with dblock() as db:
        try:
            db.execute("BEGIN")
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
            db.execute("COMMIT")
        except Exception as e:
            db.execute("ROLLBACK")
            raise HTTPException(500, detail=f"批量移除失败: {str(e)}")