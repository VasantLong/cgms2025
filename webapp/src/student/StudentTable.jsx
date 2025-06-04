import useSWR from "swr";
import { fetcher } from "../utils";

import { Link } from "react-router-dom";
import "./student.css";

function formatGender(v) {
  if (v === "M") return "男";
  else if (v === "F") return "女";
  else return v;
}

function StudentTable(props) {
  const { data: items, error } = useSWR("/api/student/list", fetcher);

  if (error) {
    return <div>数据加载失败</div>;
  }

  if (!items) {
    return <div>数据加载中...</div>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th className="col-stu_name">姓名</th>
          <th className="col-stu_no">学号</th>
          <th className="col-gender">性别</th>
          <th className="col-enrolled">入学时间</th>
        </tr>
      </thead>
      <tbody>
        {items &&
          items.map((item, idx) => (
            <tr key={idx}>
              <td>
                <Link to={`/student/${item.stu_sn}`}>
                  {item.stu_name ? item.stu_name : "（空）"}
                </Link>
              </td>
              <td>{item.stu_no}</td>
              <td>{formatGender(item.gender)}</td>
              <td>{item.enrolled}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

export default StudentTable;
