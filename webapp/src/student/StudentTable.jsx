import useSWRInfinite from "swr/infinite";
import { fetcher } from "../utils";
import { Link } from "react-router-dom";
import useSWR from "swr";
import React, { useState } from "react";
import StyledButton from "../components/StyledButton";
import { StyledTable } from "../components/StyledTable";
import {
  Paper,
  PaperHead,
  PaperBody,
  PaperFooter,
  StatusBar,
  Message,
  ErrorMessage,
  ErrorButton,
} from "../components/StyledPaper";
import {
  PaginationContainer,
  StyledAntPagination,
} from "../components/StyledComponents";

function formatGender(v) {
  if (v === "M") return "男";
  else if (v === "F") return "女";
  else return v;
}

function StudentTable(props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, error } = useSWR(
    `/api/student/list?page=${currentPage}&page_size=${pageSize}`,
    fetcher
  );

  const items = data && Array.isArray(data.data) ? data.data : [];
  const total = data ? data.total : 0;

  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
    }
  };

  const handlePageSizeChange = (current, size) => {
    setCurrentPage(current);
    setPageSize(size);
  };

  if (error) {
    return (
      <>
        <div>数据加载失败</div>
        <ErrorButton onClick={() => window.location.reload()}>×</ErrorButton>
      </>
    );
  }

  if (!data) {
    return <div>数据加载中...</div>;
  }

  return (
    <PaperBody>
      <StyledTable>
        <thead>
          <tr>
            <th className="col-stu_name">姓名</th>
            <th className="col-stu_no">学号</th>
            <th className="col-gender">性别</th>
            <th className="col-enrollment_date">入学时间</th>
          </tr>
        </thead>
        <tbody>
          {items &&
            items.map((item, idx) => (
              <tr key={`${item.stu_sn}-${item.stu_no}`}>
                <td>
                  <Link to={`/student/${item.stu_sn}`}>
                    {item.stu_name ? item.stu_name : "（空）"}
                  </Link>
                </td>
                <td>{item.stu_no}</td>
                <td>{formatGender(item.gender)}</td>
                <td>{item.enrollment_date}</td>
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
          onShowSizeChange={handlePageSizeChange}
          showSizeChanger
          pageSizeOptions={["10", "20", "50"]}
        />
      </PaginationContainer>
    </PaperBody>
  );
}

export default StudentTable;
