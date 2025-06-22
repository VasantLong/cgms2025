import useSWR from "swr";
import { fetcher } from "../utils";
import { Link } from "react-router-dom";
import { StyledTable } from "../components/StyledTable";
import { useState } from "react";
import { Pagination } from "antd";

function GradeTable({ items }) {
  if (!items) {
    return <div>数据加载中...</div>;
  }

  if (items.length === 0) {
    return <div>暂无成绩数据</div>;
  }

  console.log("Grade数据:", items);
  console.log("当前用户token:", localStorage.getItem("token"));

  return (
    <>
      <StyledTable>
        <thead>
          <tr>
            <th className="col-stu_name">学生姓名</th>
            <th className="col-course_name">课程名称</th>
            <th className="col-grade">成绩</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.grade_sn}>
              <td>{item.stu_name}</td>
              <td>{item.course_name}</td>
              <td>{item.grade ?? "未录入"}</td>
            </tr>
          ))}
        </tbody>
      </StyledTable>
    </>
  );
}

export default GradeTable;
