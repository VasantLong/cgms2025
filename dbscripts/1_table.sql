DROP TABLE IF EXISTS student;
CREATE TABLE IF NOT EXISTS student  (
    sn       INTEGER,           -- 自增序号（从10000开始）
    no       VARCHAR(10)        -- 学号（格式：230650118）
        CHECK (no ~ '^\d{9}$'), -- 8位数字校验
    name     TEXT NOT NULL,
    gender   CHAR(1)            -- 性别F/M/O
        CHECK (gender IN ('F', 'M', 'O')),
    enrollment_date DATE        -- 入学日期
        CHECK (enrollment_date > '2000-01-01'), -- 合理范围校验
    PRIMARY KEY (sn),
    UNIQUE (no)                 -- 学号唯一
);

-- 给sn创建一个自增序号
CREATE SEQUENCE seq_student_sn 
    START 10000 INCREMENT 1 OWNED BY student.sn;
ALTER TABLE student ALTER sn 
    SET DEFAULT nextval('seq_student_sn');
-- 学号唯一
CREATE UNIQUE INDEX idx_student_no ON student(no);

-- === 课程表
DROP TABLE IF EXISTS course;
CREATE TABLE IF NOT EXISTS course  (
    sn       INTEGER,          -- 自增序号（从20000开始）
    no       VARCHAR(5)        -- 课程号（格式：10055）
        CHECK (no ~ '^\d{5}$'),
    name     TEXT NOT NULL,    -- 课程名
    credit   NUMERIC(5,2)      -- 学分
        CHECK (credit > 0),
    hours    INTEGER           -- 学时
        CHECK (hours > 0),
    PRIMARY KEY (sn),
    UNIQUE (no)                -- 课程号唯一
);

CREATE SEQUENCE seq_course_sn 
    START 20000 INCREMENT 1 OWNED BY course.sn;
ALTER TABLE course ALTER sn 
    SET DEFAULT nextval('seq_course_sn');
-- CREATE UNIQUE INDEX idx_course_no ON course(no);



-- === 班次表
DROP TABLE IF EXISTS class;
CREATE TABLE IF NOT EXISTS class  (
    sn       INTEGER,          -- 自增序号（从30000开始）
    class_no VARCHAR(15)       -- 班次号（格式：10055-2023）
        CHECK (class_no ~ '^\d{5}-\d{4}$'), -- 课程号-年份
    name     TEXT,             -- 可选的班次描述
    semester VARCHAR(11)       -- 学期（格式：2024-2025-1）
        CHECK (semester ~ '^\d{4}-\d{4}-[12]$'),
    location TEXT,
    cou_sn   INTEGER,          -- 关联课程sn
    PRIMARY KEY (sn),
    FOREIGN KEY (cou_sn) REFERENCES course(sn),
    UNIQUE (class_no)          -- 班次号唯一
);

CREATE SEQUENCE seq_class_sn 
    START 30000 INCREMENT 1 OWNED BY class.sn;
ALTER TABLE class ALTER COLUMN sn 
    SET DEFAULT nextval('seq_class_sn');
CREATE INDEX idx_class_cou_sn ON class(cou_sn);

-- === 成绩表
DROP TABLE IF EXISTS class_grade;
CREATE TABLE IF NOT EXISTS class_grade  (
    id       SERIAL PRIMARY KEY,  -- 自增主键（便于单独操作记录）
    stu_sn   INTEGER NOT NULL,    -- 学生序号（关联student.sn）
    class_sn INTEGER NOT NULL,    -- 班次序号（关联class.sn）
    grade    NUMERIC(5,2)         -- 成绩（允许NULL表示未录入）
        CHECK (grade BETWEEN 0 AND 100 OR grade IS NULL),
    -- 唯一约束：一个学生在同一班次只能有一条成绩记录
    UNIQUE (stu_sn, class_sn),
    -- 外键约束
    CONSTRAINT fk_student FOREIGN KEY (stu_sn) 
        REFERENCES student(sn) ON DELETE CASCADE,
    CONSTRAINT fk_class FOREIGN KEY (class_sn) 
        REFERENCES class(sn) ON DELETE CASCADE
);

-- === 教秘用户表（存储基础信息）
DROP TABLE IF EXISTS sys_users;
CREATE TABLE IF NOT EXISTS sys_users (
    user_sn SERIAL PRIMARY KEY,          -- 自增序号
    username VARCHAR(50) UNIQUE NOT NULL, -- 用户名（唯一）
    real_name VARCHAR(50) NOT NULL,       -- 真实姓名（用于显示）
    created_at TIMESTAMP DEFAULT NOW()    -- 创建时间
);

CREATE SEQUENCE seq_users_sn 
    START 90000 INCREMENT 1 OWNED BY sys_users.user_sn;
ALTER TABLE sys_users ALTER COLUMN user_sn
    SET DEFAULT nextval('seq_users_sn');

-- === 密码表（存储哈希值，与用户表关联）
DROP TABLE IF EXISTS user_passwords;
CREATE TABLE IF NOT EXISTS user_passwords (
    id SERIAL PRIMARY KEY,
    user_sn INTEGER UNIQUE NOT NULL REFERENCES sys_users(user_sn), -- 关联用户
    hashed_password VARCHAR(100) NOT NULL                          -- 密码哈希值
);


-- 为常用查询添加索引
CREATE INDEX idx_class_grade_student ON class_grade(stu_sn);
CREATE INDEX idx_class_grade_class ON class_grade(class_sn);
CREATE INDEX idx_user_passwords_user_sn ON user_passwords(user_sn);

-- 优化多条件查询
CREATE INDEX idx_grade_stu_class ON class_grade(stu_sn, class_sn);

-- 加速课程关联查询
CREATE INDEX idx_class_course ON class 
    USING BTREE (sn, cou_sn);