import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Select, Input, Pagination } from "antd";

import useSWR, { mutate } from "swr";
import GradeTable from "./GradeTable";
import { fetcher } from "../utils";
import {
  Paper,
  PaperHead,
  PaperBody,
  StatusBar,
  Message,
  ErrorMessage,
  ErrorButton,
} from "../components/StyledPaper";
import {
  PaginationContainer,
  StyledAntPagination,
} from "../components/StyledComponents";

function GradeList(props) {
  let navigate = useNavigate();

  useEffect(() => {
    console.log("[DEBUG] GradeList 组件已挂载");
  }, []);

  // 在组件顶部添加防抖hook
  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
  };

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 新增查询表单组件
  const GradeQueryForm = () => {
    const [params, setParams] = useState({
      course_sn: undefined,
      class_sn: undefined,
      semester: undefined,
    });
    const [semesterInput, setSemesterInput] = useState("");
    const debouncedSemester = useDebounce(semesterInput, 500);

    const {
      data: courseData,
      isLoading: coursesLoading,
      error: coursesError,
    } = useSWR("/api/course/list", fetcher);
    const {
      data: classData,
      isLoading: classesLoading,
      error: classesError,
    } = useSWR(
      params.course_sn ? `/api/class/list?course_sn=${params.course_sn}` : null,
      fetcher
    );

    // 提取实际的课程列表数据
    const courses =
      courseData && Array.isArray(courseData.data) ? courseData.data : [];
    // 提取实际的班次列表数据
    const classes =
      classData && Array.isArray(classData.data) ? classData.data : [];

    // 学期选项从班次数据中提取
    const semesters = [...new Set(classes?.map((c) => c.semester))].sort();

    useEffect(() => {
      setParams((p) => ({ ...p, semester: debouncedSemester }));
    }, [debouncedSemester]);

    const { data: grades, error: gradesError } = useSWR(() => {
      const validParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
      );
      const pageParams = {
        page: currentPage,
        page_size: pageSize,
      };
      const finalParams = { ...validParams, ...pageParams };
      return Object.keys(finalParams).length
        ? `/api/grade/query?${new URLSearchParams(finalParams).toString()}`
        : null;
    }, fetcher);

    const total = grades?.total || 0;
    const gradeItems = grades?.data || [];

    if (coursesLoading || classesLoading) {
      return <div>加载筛选条件...</div>;
    }

    if (coursesError || classesError) {
      return <div>筛选条件加载失败</div>;
    }

    if (gradesError) {
      return <div>成绩数据加载失败: {gradesError.message}</div>;
    }

    // 处理分页变化
    const handlePageChange = (page, size) => {
      setCurrentPage(page);
      if (size) {
        setPageSize(size);
      }
    };

    return (
      <div className="query-section">
        <div className="query-filters">
          <Select
            placeholder="选择课程"
            options={courses.map((c) => ({
              value: c.course_sn,
              label: `${c.course_name} (${c.course_no})`, // 添加课程号显示
            }))}
            onChange={(v) =>
              setParams({
                course_sn: v,
                class_sn: undefined,
                semester: undefined,
              })
            }
            value={params.course_sn} // 新增value绑定
            showSearch // 添加搜索功能
            optionFilterProp="label" // 按标签过滤
            style={{ minWidth: 200 }} // 新增固定宽度
          />
          <Select
            placeholder="选择班次"
            options={classes.map((c) => ({
              value: c.class_sn,
              label: `${c.name} (${c.class_no})`,
            }))}
            onChange={(v) =>
              setParams((p) => ({
                ...p,
                class_sn: v,
                semester: undefined,
              }))
            }
            value={params.class_sn}
            disabled={!params.course_sn}
            showSearch
            optionFilterProp="label"
            style={{ minWidth: 200 }}
          />
          <Select
            placeholder="或选择学期"
            options={semesters.map((s) => ({ value: s, label: s }))}
            onChange={(v) =>
              setParams((p) => ({
                ...p,
                semester: v,
                class_sn: undefined,
              }))
            }
            value={params.semester}
            showSearch
            optionFilterProp="label"
            style={{ minWidth: 200 }}
          />
        </div>

        {/* 新增统计信息 */}
        {gradeItems.length > 0 && (
          <div
            className="stats-info"
            style={{ margin: "12px 0", color: "#666" }}
          >
            共查询到 {gradeItems.length} 条成绩
          </div>
        )}

        <GradeTable items={gradeItems} />

        <PaginationContainer>
          <StyledAntPagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            showSizeChanger
            onShowSizeChange={handlePageChange}
          />
        </PaginationContainer>
      </div>
    );
  };

  return (
    <Paper>
      <h2>成绩查询</h2>
      <PaperBody>
        <GradeQueryForm />
      </PaperBody>
      {/* 保留原有调试信息 */}
      {props.debug && <pre>{JSON.stringify(grades, null, 2)}</pre>}
    </Paper>
  );
}

export default GradeList;
