import { useParams } from "react-router-dom";
import { Table, Button, Statistic } from "antd";
import { fetcher } from "../utils";

export default function StudentReport() {
  const { stu_sn } = useParams();
  const { data, error } = useSWR(`/api/student/${stu_sn}/report`, fetcher);

  const columns = [
    { title: "课程名称", dataIndex: "course_name" },
    { title: "班次号", dataIndex: "class_no" },
    { title: "学期", dataIndex: "semester" },
    { title: "成绩", dataIndex: "grade", render: (v) => v ?? "未录入" },
    { title: "学分", dataIndex: "credit" },
    {
      title: "状态",
      render: (_, record) => (record.grade >= 60 ? "合格" : "未通过"),
    },
  ];

  return (
    <div className="report-container">
      <div className="student-info">
        <h2>{data?.student.name} 成绩报告</h2>
        <p>学号：{data?.student.no}</p>
        <p>入学时间：{data?.student.enrollment_date}</p>
      </div>

      <div className="stats-panel">
        <Statistic title="总学分" value={data?.stats.total_credits} />
        <Statistic title="平均绩点" value={data?.stats.gpa.toFixed(2)} />
      </div>

      <Table
        columns={columns}
        dataSource={data?.grades}
        rowKey="class_no"
        bordered
      />

      <Button type="primary" onClick={() => window.print()}>
        导出PDF
      </Button>
    </div>
  );
}
