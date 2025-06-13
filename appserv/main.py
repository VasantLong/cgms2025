from serv.config import app  # noqa: E402, F401
from serv.selection import router as selection_router
from serv.course import router as course_router
from serv.course_class import router as class_router
from serv.student import router as student_router 
from serv.grade import router as grade_router
from serv.login import router as login_router

# 在main.py中添加路由注册
app.include_router(selection_router)
app.include_router(course_router)
app.include_router(class_router)
app.include_router(student_router)
app.include_router(grade_router)
app.include_router(login_router)