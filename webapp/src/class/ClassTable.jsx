import useSWR from "swr";
import { fetcher } from "../utils";
import { Link } from "react-router-dom";
import { StyledTable } from "../components/StyledTable";
import {
  PaginationContainer,
  StyledAntPagination,
} from "../components/StyledComponents";
import { useState } from "react";

const ClassTable = (props) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, error } = useSWR(
    `/api/class/list?page=${currentPage}&page_size=${pageSize}`,
    fetcher,
    {
      onSuccess: (data) => {
        console.log("API Response Data:", data);
      },
    }
  );

  const items = data && Array.isArray(data.data) ? data.data : [];
  const total = data ? data.total : 0;

  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
    }
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
            <th>班次号</th>
            <th>名称</th>
            <th>学期</th>
            <th>地点</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.class_sn}>
              <td>
                <Link to={`/class/${item.class_sn}`}>{item.class_no}</Link>
              </td>
              <td>{item.name}</td>
              <td>{item.semester}</td>
              <td>{item.location}</td>
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
};
export default ClassTable;
