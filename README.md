# cgms2025

信息系统开发实践项目——成绩管理系统

## 任务说明

在[信息系统开发课程课内项目《成绩管理系统》](https://gitee.com/lyucg/isdev)的基础上，增加或完善下来内容：

1. 系统的使用对象是“教秘”，不是学生本人，假设本系统没有教师方面信息
2. 增加“课程分班次”功能，因此需要“班次管理”和“选课”功能
3. 完善课程基础信息：课程号、课程名、学分、学时；
4. 创建课程的班次：班次号、班次名、学期、地点、课程；
5. 选课：在班次下，选择学生；
   1. 教秘选择某班次 → 2. 从学生列表中勾选学生 → 3. 提交关联。
6. 按班次录入成绩，注意考虑易用性设计
7. 查询某课程某班次或某学期的所有学生成绩；
8. 列出某个学生所有成绩生成报表；
9. ...

## 项目分析

### 功能模块详解

1. [ x ] **完善课程基础信息**（任务 3）
   - 分支：feature/course-basic-info
   - 前端：React 表单组件(webapp/src/course/CourseList.jsx)
   - 后端：RESTful API(appserv/serv/course.py)
   - 数据库：PostgreSQL 表设计(dbscripts/1_table.sql)
   - 依赖关系：无
   - 用户角色：教秘
2. [ ]**课程分班次功能**（任务 1、2、4）
   - 分支：feature/course-class-scheduling
   - 前端：React 表格组件(webapp/src/grade/GradeList.jsx)
   - 后端：RESTful API(appserv/serv/grade.py)
   - 数据库：PostgreSQL 表设计(dbscripts/1_table.sql)
   - 依赖关系：需要课程基础信息
   - 功能说明：
     1. 创建班次：班次号、班次名、学期、地点、课程
     2. 班次管理：增删改查班次信息
     3. 用户角色：教秘
3. []**选课功能**（任务 5）
   - 分支：feature/student-selection
   - 前端：React 选择器组件(webapp/src/student/StudentTable.jsx)
   - 后端：RESTful API(appserv/serv/student.py)
   - 数据库：PostgreSQL 表设计(dbscripts/1_table.sql)
   - 依赖关系：需要班次管理功能
4. [ ]**成绩录入**（任务 6）
   - 分支：feature/grade-entry
   - 前端：React 表单组件(webapp/src/grade/GradeList.jsx)
   - 后端：批量导入 API(appserv/serv/grade.py)
   - 数据库：PostgreSQL 表设计(dbscripts/1_table.sql)
   - 依赖关系：需要选课功能
5. [ ]**成绩查询**（任务 7）
   - 分支：feature/grade-query
   - 前端：React 查询组件(webapp/src/grade/GradeList.jsx)
   - 后端：复杂查询 API(appserv/serv/grade.py)
   - 数据库：PostgreSQL 索引优化(dbscripts/1_table.sql)
   - 依赖关系：需要成绩录入功能
6. [ ]**报表生成**（任务 8）
   - 分支：feature/report-generation
   - 前端：React 报表组件(webapp/src/student/StudentDetail.jsx)
   - 后端：报表生成 API(appserv/serv/student.py)
   - 数据库：PostgreSQL 视图(dbscripts/1_table.sql)
   - 依赖关系：需要成绩查询功能

### 团队分工方案（4 人）

1. **成员 A**
   - 前端：React 组件开发(webapp/src/course/)
   - 后端：Flask API 开发(appserv/serv/course.py)
   - 负责：课程基础信息模块
2. **成员 B**
   - 前端：React 组件开发(webapp/src/grade/)
   - 后端：Flask API 开发(appserv/serv/grade.py)
   - 负责：课程分班次功能前后端开发
   - 重点：确保教秘用户角色需求得到满足
3. **成员 C**
   - 前端：React 组件开发(webapp/src/grade/)
   - 后端：Flask API 开发(appserv/serv/grade.py)
   - 负责：成绩录入前端和查询后端
4. **成员 D**
   - 前端：React 组件开发(webapp/src/student/)
   - 后端：Flask API 开发(appserv/serv/student.py)
   - 负责：报表生成前后端

## 项目完成情况

- 任务 3：
  需要检查任务 3 的三个关键部分：前端是否有完整的课程基础信息管理界面（如包含课程号、课程名、学分、学时的表单组件），后端是否实现课程信息的 CRUD 接口（如 course.py 中的增删改查 API），以及数据库表 course 是否包含所有基础字段（查看 dbscripts/1_table.sql）。需逐一验证这三部分是否均已完成，以确认任务 3 是否达标。

  webapp\src\course\CourseList.jsx
  appserv\serv\course.py
  需要查看课程新建页面的前端组件，确认是否包含课程号、课程名、学分、学时的表单输入字段，以验证任务 3 的前端部分是否完成。

  webapp\src\course\CourseNew.jsx
  需要查看课程详细信息页面的前端组件 CourseDetail.jsx，确认是否包含课程号、课程名、学分、学时的表单输入字段，以验证任务 3 的前端部分是否完成。

  webapp\src\course\CourseDetail.jsx
  已检查任务 3 的三个关键部分：数据库表 course 包含课程号、课程名、学分、学时字段；后端 appserv/serv/course.py 实现了课程信息的 CRUD 接口；前端 webapp/src/course/CourseDetail.jsx 包含课程号、课程名、学分、学时的表单组件。任务 3 的要求已全部达标。

1. 张三
   1. ….
   2. ….
   3. ….
2. 李四
   1. ….
   2. ….
   3. ….

## 项目开发过程分支
