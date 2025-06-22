import useSWRInfinite from "swr/infinite";
import { fetcher } from "../utils";
import { Link } from "react-router-dom";
import "./student.css";
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
  PaginationButton,
  PaginationSelect,
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

  // 计算当前页显示的数据
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentItems = items.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1); // 切换每页数量时，重置到第一页
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

  // 计算总页数
  const totalPages = Math.ceil(total / pageSize);

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
        <PaginationButton
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          上一页
        </PaginationButton>
        <span>
          第 {currentPage} 页，共 {totalPages} 页
        </span>
        <PaginationSelect
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </PaginationSelect>
        <PaginationButton
          onClick={() =>
            handlePageChange(Math.min(totalPages, currentPage + 1))
          }
          disabled={currentPage === totalPages}
        >
          下一页
        </PaginationButton>
      </PaginationContainer>
    </PaperBody>
  );
}

export default StudentTable;
