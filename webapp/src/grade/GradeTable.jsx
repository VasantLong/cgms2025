import useSWR from "swr";
import { fetcher } from "../utils";
import { Link } from "react-router-dom";
import "./grade.css";

function GradeTable({ items: externalItems }) {
  // 优先使用外部传入数据，无数据时保持独立请求能力
  const { data: internalItems, error } = useSWR(
    !externalItems ? "/api/grade/list" : null,
    fetcher,
    {
      onSuccess: (data) => {
        console.log("[DEBUG] Grade data:", data); // 添加数据日志
      },
      onError: (err) => {
        console.error("[ERROR] Grade fetch error:", err); // 添加错误日志
      },

      shouldRetryOnError: false, // 添加请求重试配置
      revalidateOnFocus: false,
      revalidateOnReconnect: false, // 添加防缓存配置
    }
  );

  const items = externalItems || internalItems;

  if (error) {
    return <div>数据加载失败：{error.message}</div>;
  }
  if (!items) {
    return <div>数据加载中...</div>;
  }

  console.log("Grade数据:", items);
  console.log("当前用户token:", localStorage.getItem("token"));

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
        {items?.map((item) => (
          <tr key={item.grade_sn}>
            <td>{item.stu_name}</td>
            <td>{item.course_name}</td>
            <td>{item.grade ?? "未录入"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default GradeTable;
