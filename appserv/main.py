from serv.config import app  # noqa: E402, F401
from serv.selection import router as selection_router

import serv.student
import serv.grade  # noqa: F401
import serv.course # noqa: F401
import serv.course_class # noqa: F401
import serv.selection # noqa: F401
import serv.auth # noqa: F401
import serv.login # noqa: F401

# 在main.py中添加路由注册
app.include_router(selection_router)