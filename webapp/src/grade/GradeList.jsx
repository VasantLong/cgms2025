import useSWR from "swr";
import { fetcher } from "../utils";

import "./GradeList.css";

export default function GradeList(props) {
  const { data: items, error } = useSWR("/api/grade/list", fetcher);

  if (error) {
    return <div>数据加载失败</div>;
  }

  if (!items) {
    return <div>数据加载中...</div>;
  }

  return (
    <div className="paper">
      <div className="paper-body">
        <table className="table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>课程</th>
              <th>成绩</th>
            </tr>
          </thead>
          <tbody>
            {items &&
              items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.stu_name}</td>
                  <td>{item.cou_name}</td>
                  <td>{item.grade}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
