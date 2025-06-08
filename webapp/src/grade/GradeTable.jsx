import useSWR from "swr";
import { fetcher } from "../utils";
import { Link } from "react-router-dom";
import "./grade.css";

function GradeTable(props) {
  const { data: items, error } = useSWR("/api/grade/list", fetcher, {
    onSuccess: (data) => {
      console.log("API Response Data:", data);
    },
  });

  if (error) {
    return <div>数据加载失败</div>;
  }

  if (!items) {
    return <div>数据加载中...</div>;
  }

  const testItems = [
    { grade_sn: 1, stu_name: "张三", course_name: "高等数学", grade: 85.5 },
  ];

  return (
    <table className="table">
      <thead>
        <tr>
          <th className="col-stu_name">学生姓名</th>
          <th className="col-course_name">课程名称</th>
          <th className="col-grade">成绩</th>
        </tr>
      </thead>
      <tbody>
        {items &&
          items.map((item, idx) => (
            <tr key={idx}>
              <td>
                <Link
                  to={`/grade/student/${item.stu_sn}/course/${item.course_sn}`}
                >
                  {item.stu_name ? item.stu_name : "（空）"}
                </Link>
              </td>
              <td>{item.course_name}</td>
              <td>{item.grade}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

export default GradeTable;
