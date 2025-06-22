import useSWR from "swr";
import { fetcher } from "../utils";
import { Link } from "react-router-dom";
import { StyledTable } from "../components/StyledTable";
import React, { useState } from "react";
import {
  PaginationContainer,
  StyledAntPagination,
} from "../components/StyledComponents";

function CourseTable(props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, error } = useSWR(
    `/api/course/list?page=${currentPage}&page_size=${pageSize}`,
    fetcher
  );

  const items = data && Array.isArray(data.data) ? data.data : [];
  const total = data ? data.total : 0;

  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  if (error) {
    return <div>数据加载失败</div>;
  }

  if (!items) {
    return <div>数据加载中...</div>;
  }

  return (
    <>
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
          {items.map((item) => (
            <tr key={item.course_sn}>
              <td>
                <Link to={`/course/${item.course_sn}`}>{item.course_no}</Link>
              </td>
              <td>{item.course_name}</td>
              <td>{item.credit}</td>
              <td>{item.hours}</td>
            </tr>
          ))}
        </tbody>
      </StyledTable>
      <PaginationContainer>
        <StyledAntPagination
          current={currentPage}
          pageSize={pageSize}
          defaultPageSize={10}
          total={total}
          onChange={handlePageChange}
          showSizeChanger
          pageSizeOptions={["10", "20", "50"]}
        />
      </PaginationContainer>
    </>
  );
}

export default CourseTable;
