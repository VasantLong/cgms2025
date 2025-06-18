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
   - 前端：React 表单组件(webapp/src/course)
   - 后端：RESTful API course.py
   - 数据库：PostgreSQL 表设计 1_table.sql
   - 依赖关系：无
   - 用户角色：教秘
2. [ x ] **课程分班次功能**（任务 1、2、4）
   - 分支：feat/course-class-scheduling
   - 前端：React 表格组件(webapp/src/class)
   - 后端：RESTful API course_class.py
   - 数据库：PostgreSQL 表设计 1_table.sql
   - 依赖关系：需要课程基础信息
   - 功能说明：
     1. 创建班次：班次号、班次名、学期、地点、课程
     2. 班次管理：增删改查班次信息
     3. 用户角色：教秘
3. [ x ] **选课功能**（任务 5）
   - 分支：feat/student-selection
   - 前端：ClassStudentSelection.jsx，公用组件 SearchBar.jsx 和 Pagination.jsx
   - 后端：RESTful API selection.py
   - 数据库：PostgreSQL 表设计
   - 依赖关系：需要班次管理功能
4. [ x ] **成绩录入**（任务 6）
   - 分支：feat/grade-entry
   - 前端：React 表单组件 GradeEntrySelection.jsx
   - 后端：批量导入 API grade.py
   - 数据库：PostgreSQL 表设计 1_table.sql
   - 依赖关系：需要选课功能
5. [ x ] **成绩查询**（任务 7）
   - 分支：feat/grade-query
   - 前端：React 查询组件 GradeQueryForm
   - 后端：复杂查询 API grade.py
   - 数据库：PostgreSQL 索引优化 1_table.sql
   - 依赖关系：需要成绩录入功能
6. [ ] **报表生成**（任务 8）
   - 分支：feature/report-generation
   - 前端：React 报表组件(webapp/src/student/StudentDetail.jsx)
   - 后端：报表生成 API(appserv/serv/student.py)
   - 数据库：PostgreSQL 视图(dbscripts/1_table.sql)
   - 依赖关系：需要成绩查询功能

## 项目完成情况

- 任务 3 ==v3.4.0==：

  - 数据库表 course 包含课程号、课程名、学分、学时字段；

  - 后端 appserv/serv/course.py 实现了课程信息的 CRUD 接口；

  - 前端 webapp/src/course/CourseDetail.jsx 包含课程号、课程名、学分、学时的表单组件

- 任务 1：设置教秘用户角色及登录权限。==v4.0.0==

  - 用户名: jiaomi_admin

  - 密码: Admin@1234

  - 因开发需要，将.env.example 文件重命名为.env，然后修改.env 文件中的 DATABASE_URL 为自己的数据库连接地址。
    ├── appserv/
    │ ├── .env # 实际使用的环境变量
    │ ├── .env.example # 示例模板
    │ └── serv/

    - 配置方式：

      1. 进入后端目录 `cd appserv`

      2. 一键生成密钥并创建 .env（Windows PowerShell）

         ```powershell
         openssl rand -hex 32 | Out-File -Encoding utf8 .env

         Get-Content .env.example | Add-Content .env
         ```

      3. 进入.env 中修改

         把 your_32byte_random_string_here 替换成第一行的一串码，删除第一行的码

- 任务 2、4：班次增删改查与表单自动填写逻辑。==v4.1.0==

  - 班次号逻辑修改成：'课程号-年份学期-序号'（如 10055-2023S1-01）
  - 修改班次信息时，只允许修改地点字段
  - 增加登录状态检验

- 任务 5：某一班次详情下的学生管理栏。 ==v4.2.0==
  - 添加缓存，修改身份认证方法，提供分页（待优化）
  - 数据库表 class_student 包含班级序号、学生序号、选课时间
  - 后端 selection.py 具体实现了选课时的逻辑查询（可选学生、是否有学生已在当前课程其余班次的冲突情况）
  - 前端 ClassStudentSelection.jsx 融入 ClassDetail.jsx 中，在原有的编辑班次界面进行分栏（基本信息、学生管理），区分可选和有冲突的学生。
- 任务 6：班次录入成绩。 ==v4.3.0==

  - 班次成绩录入界面：表格形式展示学生名单，支持在线批量成绩输入与保存
  - /appserv：批量成绩更新，学生成绩查询
  - 可下载成绩导入模板 Excel，具有验证模板文件逻辑

  1.  **实时协作增强**

      - 自动保存防抖机制（30 秒阈值可配置）
      - 数据版本冲突检测（30 秒轮询校验）
      - 离开页面警告提示（防止数据丢失）

  2.  **Excel 导入增强**
      - 动态模板文件名验证（包含班次编号和名称）
      - 成绩有效性实时校验（0-100 范围检查）
      - 错误行高亮显示（含具体错误原因）
      - 导入结果统计面板（成功/失败计数）
  3.  **用户体验优化**

      - 自动保存倒计时可视化
      - 批量保存防重复点击
      - 输入状态持久化（基于 localStorage）
      - 表格固定列优化（学号列始终可见）

  4.  **数据完整性保障**
      - 基准数据快照机制（Map 存储初始值）
      - 双重防抖策略（输入防抖 + 保存节流）
      - 服务端版本校验（通过 check-conflict API 实现）
      - 数据完整性校验（前端 + 后端）

- 任务 7：成绩查询。 ==v4.4.0==

  - /webapp：默认输出所有学生成绩，支持课程单查询和课程＋班次/学期双查询
  - /appserv：学生成绩多级查询 API
  - /dbscripts：优化成绩查询索引

1. 张三
   1. ….
   2. ….
   3. ….
2. 李四
   1. ….
   2. ….
   3. ….

## 项目开发过程分支

1. v3.5.0
   - feature/course-basic-info
2. v3.6.0
   - feat/sql-info-debug
   - feat/stu_cou-info-debug
   - feat/grade-info-debug
3. v4.0.0
   - feat/login-auth
4. v4.1.0
   - feat/course-class-scheduling
5. v4.2.0
   - feat/student-selection
6. v4.3.0
   - feat/grade-entry
7. v4.4.0
   - feat/grade-query
