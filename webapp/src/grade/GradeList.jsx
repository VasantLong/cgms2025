import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Select, Input } from "antd";
import useSWR from "swr";
import GradeTable from "./GradeTable";
import { fetcher } from "../utils";
import { StyledTable } from "../components/StyledTable";
import {
  Paper,
  PaperHead,
  PaperBody,
  StatusBar,
  Message,
  ErrorMessage,
  ErrorButton,
} from "../components/StyledPaper";

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

  // 新增查询表单组件
  const GradeQueryForm = () => {
    const [params, setParams] = useState({
      course_sn: undefined,
      class_sn: undefined,
      semester: undefined,
    });
    const [semesterInput, setSemesterInput] = useState("");
    const debouncedSemester = useDebounce(semesterInput, 500);

    const { data: courses, isLoading: coursesLoading } = useSWR(
      "/api/course/list",
      fetcher
    );
    const { data: classes, isLoading: classesLoading } = useSWR(
      params.course_sn ? `/api/class/list?course_sn=${params.course_sn}` : null,
      fetcher
    );

    // 学期选项从班次数据中提取
    const semesters = [...new Set(classes?.map((c) => c.semester))].sort();

    useEffect(() => {
      setParams((p) => ({ ...p, semester: debouncedSemester }));
    }, [debouncedSemester]);

    const { data: grades, error } = useSWR(() => {
      // 过滤无效参数
      const validParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
      );
      return Object.keys(validParams).length
        ? `/api/grade/query?${new URLSearchParams(validParams).toString()}`
        : null;
    }, fetcher);
    if (coursesLoading || classesLoading) {
      return <div>加载筛选条件...</div>;
    }
    if (error) {
      return <div>筛选条件加载失败</div>;
    }

    return (
      <div className="query-section">
        <div className="query-filters">
          <Select
            placeholder="选择课程"
            options={courses?.map((c) => ({
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
            options={classes?.map((c) => ({
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
            options={semesters?.map((s) => ({ value: s, label: s }))}
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
        {grades?.length > 0 && (
          <div
            className="stats-info"
            style={{ margin: "12px 0", color: "#666" }}
          >
            共查询到 {grades.length} 条成绩
            {params.class_sn && `（班次：${params.class_sn}）`}
            {params.semester && `（学期：${params.semester}）`}
          </div>
        )}

        <GradeTable items={grades} />
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
