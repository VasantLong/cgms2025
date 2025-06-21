import useSWR from "swr";
import { fetcher } from "../utils";
import { Link } from "react-router-dom";
import { StyledTable } from "../components/StyledTable";
import "./course.css";

function CourseTable(props) {
  const { data: items, error } = useSWR("/api/course/list", fetcher);
  console.log("courseitems", items);

  if (error) {
    return <div>数据加载失败</div>;
  }

  if (!items) {
    return <div>数据加载中...</div>;
  }

  return (
    <StyledTable>
      <thead>
        <tr>
          <th className="col-course_no">课程编号</th>
          <th className="col-course_name">课程名称</th>
          <th className="col-credit">学分</th>
          <th className="col-hours">学时</th>
        </tr>
      </thead>
      <tbody>
        {items &&
          items.map((item, idx) => (
            <tr key={idx}>
              <td>
                <Link to={`/course/${item.course_sn}/edit`}>
                  {item.course_no ? item.course_no : "（空）"}
                </Link>
              </td>
              <td>{item.course_name}</td>
              <td>{item.credit}</td>
              <td>{item.hours}</td>
            </tr>
          ))}
      </tbody>
    </StyledTable>
  );
}

export default CourseTable;
