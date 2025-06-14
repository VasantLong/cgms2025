import useSWRInfinite from "swr/infinite";
import { fetcher } from "../utils";
import { Link } from "react-router-dom";
import "./student.css";
import { Pagination } from "@components/Pagination";

function formatGender(v) {
  if (v === "M") return "男";
  else if (v === "F") return "女";
  else return v;
}

function StudentTable(props) {
  const getKey = (pageIndex, previousPageData) => {
    // 已经到达末尾
    if (previousPageData && !previousPageData.length) return null;

    // 第一页不使用游标
    if (pageIndex === 0) return "/api/student/list?page_size=20";

    // 后续页使用最后一条记录的stu_sn作为游标
    const lastSn = previousPageData[previousPageData.length - 1].stu_sn;
    return `/api/student/list?last_sn=${lastSn}&page_size=20`;
  };

  const { data, size, setSize, isValidating, error } = useSWRInfinite(
    getKey,
    fetcher,
    {
      revalidateFirstPage: false, // 防止第一页重复加载
    }
  );
  // 合并所有页数据
  const items = data ? data.flat() : [];

  if (error) {
    return <div>数据加载失败</div>;
  }

  if (!data) {
    return <div>数据加载中...</div>;
  }

  return (
    <div className="student-table-container">
      <table className="table">
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
      </table>

      <Pagination
        isLoading={isValidating}
        onLoadMore={() => setSize(size + 1)}
        hasMore={data && data[data.length - 1]?.length === 20}
      />
    </div>
  );
}

export default StudentTable;
