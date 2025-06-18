import { Table, InputNumber, Button, message } from "antd";
import { useState, useEffect } from "react";
import { fetcher } from "../utils";
import "./grade-entry.css";

export default function GradeInputSection({ classinfo }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 加载班次学生数据及已有成绩
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetcher(
          `/class/${classinfo.class_sn}/students-with-grades`
        );
        setStudents(
          data.map((s) => ({
            ...s,
            key: s.stu_sn,
            // 确保grade是数字或null
            grade: typeof s.grade === "number" ? s.grade : null,
          }))
        );
      } catch (error) {
        console.error("加载学生成绩失败:", error);
        message.error(`加载失败: ${error.info?.detail || error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (classinfo?.class_sn) {
      loadData();
    }
  }, [classinfo.class_sn]);

  // 处理成绩变更
  const handleGradeChange = (stu_sn, value) => {
    setStudents((prev) =>
      prev.map((s) => (s.stu_sn === stu_sn ? { ...s, grade: value } : s))
    );
  };

  // 批量保存成绩
  const handleSave = async () => {
    try {
      setSaving(true);
      const grades = students
        .filter((s) => s.grade !== null && s.grade !== undefined)
        .map((s) => ({
          stu_sn: s.stu_sn,
          class_sn: classinfo.class_sn,
          grade: s.grade,
        }));

      if (grades.length === 0) {
        message.warning("没有可保存的成绩数据");
        return;
      }

      const result = await fetcher("/grade/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ grades }),
      });

      message.success(`成功保存 ${result.updated} 条成绩记录`);
    } catch (error) {
      console.error("保存成绩失败:", error);
      message.error(`保存失败: ${error.info?.detail || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "学号",
      dataIndex: "stu_no",
      key: "stu_no",
      width: 120,
      fixed: "left",
      render: (text) => (
        <span style={{ color: "hsl(306, 40%, 25%)" }}>{text}</span>
      ),
    },
    {
      title: "姓名",
      dataIndex: "stu_name",
      key: "stu_name",
      width: 100,
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: "成绩",
      dataIndex: "grade",
      key: "grade",
      render: (_, record) => (
        <InputNumber
          min={0}
          max={100}
          value={record.grade}
          onChange={(value) => handleGradeChange(record.stu_sn, value)}
          precision={1}
          style={{ width: "100%" }}
          placeholder="输入0-100"
        />
      ),
    },
  ];

  return (
    <div className="grade-entry-container">
      <div className="grade-toolbar">
        <div>
          <Button
            type="primary"
            onClick={handleSave}
            loading={saving}
            disabled={loading || students.length === 0}
          >
            {saving ? "保存中..." : "批量保存成绩"}
          </Button>
        </div>
        <div className="grade-count">
          <span>班级: {classinfo.class_no} | </span>
          <span>学生总数: {students.length} | </span>
          <span>已录入: {students.filter((s) => s.grade !== null).length}</span>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={students}
        loading={loading}
        pagination={false}
        rowKey="stu_sn"
        scroll={{ x: true }}
        className="grade-table"
        locale={{
          emptyText: loading ? "加载学生数据中..." : "暂无学生数据",
        }}
      />
    </div>
  );
}
