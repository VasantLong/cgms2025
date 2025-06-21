# 测试

前端端口 5173，后端端口 8501

## 1.学生

1. 新建学生档案
   1. 逻辑问题：输入学号的前两位应该与入学时间的年相对应【优化】
   2. 字段都输入好了后，点击保存，POST 8501，然后 GET 8501 进入学生详情页。
   3. 在学生详情页的 active tab 来回切换（GET 8501）后，回到基本信息栏，字段内容都消失了。【问题】
   4. 点击返回列表按钮后，GET 8501
2. 进入某学生的编辑模式 GET 8501
   1. 点击删除（DELETE 8501 返回 http204）后，没有请求更新学生列表。【问题】

## 2.课程

1. 从其他界面点到课程页（GET 8501 但是读取的 disk cache），后来也有 GET 8501 无 disk
2. 新建课程
   1. 界面输入提示上面可以优化：在用户不输入/焦点离开输入框/点击了其他输入框时，如果当前字段没按照要求输入完成，再弹出错误提示。【优化】
   2. 按照既定的字段要求填写完后，点击保存（POST 8501），返回 http500，API 端日志错误如下：

> ERROR: Exception in ASGI application
> Traceback (most recent call last):
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
> result = await app( # type: ignore[func-returns-value]
> ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> self.scope, self.receive, self.send
> ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> )
> ^
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in **call**
> return await self.app(scope, receive, send)
> ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\fastapi\applications.py", line 1054, in **call**
> await super().**call**(scope, receive, send)
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\applications.py", line 112, in **call**
> await self.middleware_stack(scope, receive, send)
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\middleware\errors.py", line 187, in **call**
> raise exc
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\middleware\errors.py", line 165, in **call**
> await self.app(scope, receive, \_send)
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\middleware\cors.py", line 93, in **call**
> await self.simple_response(scope, receive, send, request_headers=headers)
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\middleware\cors.py", line 144, in simple_response
> await self.app(scope, receive, send)
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in **call**
> await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette_exception_handler.py", line 53, in wrapped_app
> raise exc
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette_exception_handler.py", line 42, in wrapped_app
> await app(scope, receive, sender)
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\routing.py", line 714, in **call**
> await self.middleware_stack(scope, receive, send)
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\routing.py", line 734, in app
> await route.handle(scope, receive, send)
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\routing.py", line 288, in handle
> await self.app(scope, receive, send)
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\routing.py", line 76, in app
> await wrap_app_handling_exceptions(app, request)(scope, receive, send)
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette_exception_handler.py", line 53, in wrapped_app
> raise exc
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette_exception_handler.py", line 42, in wrapped_app
> await app(scope, receive, sender)
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\routing.py", line 73, in app
> response = await f(request)
> ^^^^^^^^^^^^^^^^
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\fastapi\routing.py", line 301, in app
> raw_response = await run_endpoint_function(
> ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> ...<3 lines>...
> )
> ^
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\fastapi\routing.py", line 212, in run_endpoint_function
> return await dependant.call(\*\*values)
> ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> File "D:\WEB\cgms2025\appserv\serv\course.py", line 103, in new_course
> db.execute(
> """
> ^^^
> ...<3 lines>...
> course.model_dump(),
> ^^^^^^^^^^^^^^^^^^^^
> )
> ^
> File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\psycopg\cursor.py", line 97, in execute
> raise ex.with_traceback(None)
> psycopg.errors.UniqueViolation: 重复键违反唯一约束"course_pkey"
> DETAIL: 键值"(sn)=(20000)" 已经存在

    3. 保存失败后，点击返回列表（GET 8501），停留了一段时间，仍有带着disk cache的http200信息，所以有时候课程列表更新不及时【问题】
    4. 进入某课程的编辑模式（GET 8501），每隔一段时间就会有GET请求
          1. 修改了课程名字，点击保存后，PUT 8501，但是界面标题的课程名字没有相对更新；过了一会儿自动GET，倒是更新了。【问题】
          2. 点击返回列表按钮（GET 8501但是disk），列表未更新修改后的状态；过了一会儿自动GET，倒是更新了。【问题】
          3. 删除某个课程（DELETE 8501）后，自动返回列表（仍然是带有disk的GET 8501）；过了一会儿自动GET，倒是更新了。【问题】

## 3.班次

1. 新建班次，先 GET 8501 课程的 disk

   1. 选择了课程、学年、学期后，自动生成字段正常（GET 8501）
   2. 点击保存，POST 8501，进入了班次详情页 GET 8501
   3. 在班次详情页的基本信息 tab 中，还在 GET 8501 课程的 disk【问题】
   4. 点进学生管理 tab，GET 8501，之后每隔一段时间也会 GET 8501
      1. 选择了一些学生，点击保存关联（PUT 8501），后面显示正常（GET 8501）
   5. 点进成绩录入 tab（GET 8501），会有记录时间的 GET 8501 请求
      1. 输入成绩后，开始显示倒计时自动保存，保存按钮可被点击。
      2. 倒计时结束开始自动保存（POST 8501），修改后的状态保持在页面上；过了一会儿弹出 message“检测到页面更新”，之后自动 GET 8501 了一次界面。

2. 编辑班次的基本信息，现在只允许更改地点

   1. 修改了地点字段后，点击保存（PATCH 8501）后字段状态是保持的，之后又 GET 8501 课程的 disk

   2. 点击删除按钮（DELETE 8501），有两种情况：

      1. 该班次下没有学生、没有成绩时，成功删除，返回列表

      2. 该班次下有学生、有成绩时，返回 http500，API 层报出外键约束错误如下【问题】
         INFO: 127.0.0.1:59522 - "DELETE /api/class/30034 HTTP/1.1" 500 Internal Server Error
         ERROR: Exception in ASGI application
         Traceback (most recent call last):
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\uvicorn\protocols\http\h11_impl.py", line 403, in run_asgi
         result = await app( # type: ignore[func-returns-value]
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
         self.scope, self.receive, self.send
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
         )
         ^
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 60, in **call**
         return await self.app(scope, receive, send)
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\fastapi\applications.py", line 1054, in **call**
         await super().**call**(scope, receive, send)
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\applications.py", line 112, in **call**
         await self.middleware_stack(scope, receive, send)
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\middleware\errors.py", line 187, in **call**
         raise exc
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\middleware\errors.py", line 165, in **call**
         await self.app(scope, receive, \_send)
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\middleware\cors.py", line 93, in **call**
         await self.simple_response(scope, receive, send, request_headers=headers)
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\middleware\cors.py", line 144, in simple_response
         await self.app(scope, receive, send)
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in **call**
         await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette_exception_handler.py", line 53, in wrapped_app
         raise exc
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette_exception_handler.py", line 42, in wrapped_app
         await app(scope, receive, sender)
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\routing.py", line 714, in **call**
         await self.middleware_stack(scope, receive, send)
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\routing.py", line 734, in app
         await route.handle(scope, receive, send)
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\routing.py", line 288, in handle
         await self.app(scope, receive, send)
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\routing.py", line 76, in app
         await wrap_app_handling_exceptions(app, request)(scope, receive, send)
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette_exception_handler.py", line 53, in wrapped_app
         raise exc
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette_exception_handler.py", line 42, in wrapped_app
         await app(scope, receive, sender)
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\starlette\routing.py", line 73, in app
         response = await f(request)
         ^^^^^^^^^^^^^^^^
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\fastapi\routing.py", line 301, in app
         raw_response = await run_endpoint_function(
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
         ...<3 lines>...
         )
         ^
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\fastapi\routing.py", line 212, in run_endpoint_function
         return await dependant.call(\*\*values)
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
         File "D:\WEB\cgms2025\appserv\serv\course_class.py", line 226, in delete_class
         db.execute(

         ```^
             "DELETE FROM class WHERE sn=%(class_sn)s",
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
             {"class_sn": class_sn}
             ^^^^^^^^^^^^^^^^^^^^^^
         )
         ^
         File "D:\PythonWorking\campus_MIS\cgms\Lib\site-packages\psycopg\cursor.py", line 97, in execute
         raise ex.with_traceback(None)
         psycopg.errors.ForeignKeyViolation: 在 "class" 上的更新或删除操作违反了在 "class_student" 上的外键约束 "class_student_class_sn_fkey"
         DETAIL:  键值对(sn)=(30034)仍然是从表"class_student"引用的.
         ```

## 4.成绩

1. 从其他界面点到成绩页（GET 8501），也存在 disk cache 的情况
   1. 初始会自动 GET 8501 的 query 参数，显示全部成绩
   2. 选择了课程后，有多次 GET 8501，一次是寻找对应班次，一次是查询学生和成绩，最后显示正常的页面。
      1. 再选择班次（GET 8501），query 后显示正常，但中途出现先弹出显示初始的全部成绩再显示正常查询结果的情况。
      2. 再选择学期（GET 8501），query 后显示正常，也是有先弹出显示初始的全部成绩的情况。

## 5.登录

1. 如果令牌 cookie 失效了，界面应该提示需要重新登录，然后自动弹到登录界面【问题】
