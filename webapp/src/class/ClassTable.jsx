import useSWR from "swr";
import { fetcher } from "../utils";
import { Link } from "react-router-dom";
import "./class.css";

const ClassTable = (props) => {
  const { data: items, error } = useSWR("/api/class/list", fetcher, {
    onSuccess: (data) => {
      console.log("API Response Data:", data);
    },
  });
  console.log("classitems", items);

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
          <th className="col-class_no">班次号</th>
          <th className="col-name">名称</th>
          <th className="col-semester">学期</th>
          <th className="col-location">地点</th>
          <th className="col-cou_sn">课程SN</th>
        </tr>
      </thead>
      <tbody>
        {items &&
          items.map((item, idx) => (
            <tr key={idx}>
              <td>
                <Link to={`/class/${item.class_sn}`}>
                  {item.class_no ? item.class_no : "（空）"}
                </Link>
              </td>
              <td>{item.name}</td>
              <td>{item.semester}</td>
              <td>{item.location}</td>
              <td>{item.cou_sn}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
};
export default ClassTable;
