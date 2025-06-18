import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Select, Input } from "antd";
import useSWR from "swr";
import GradeTable from "./GradeTable";
import { fetcher } from "../utils";
import "./grade.css";

function GradeList(props) {
  let navigate = useNavigate();

  useEffect(() => {
    console.log("[DEBUG] GradeList 组件已挂载");
  }, []);

  // 新增查询表单组件
  const GradeQueryForm = () => {
    const { data: courses, isLoading: coursesLoading } = useSWR(
      "/api/course/list",
      fetcher
    );
    const { data: classes, isLoading: classesLoading } = useSWR(
      "/api/class/list",
      fetcher
    );

    const [params, setParams] = useState({});
    const { data: grades, error } = useSWR(
      () =>
        params
          ? `/api/grade/query?${new URLSearchParams(params).toString()}`
          : null,
      fetcher
    );
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
              label: c.course_name,
            }))}
            onChange={(v) => setParams((p) => ({ ...p, course_sn: v }))}
          />
          <Select
            placeholder="选择班次"
            options={classes?.map((c) => ({
              value: c.class_sn,
              label: c.class_no,
            }))}
            onChange={(v) => setParams((p) => ({ ...p, class_sn: v }))}
          />
          <Input
            placeholder="输入学期（格式：2023-2024-1）"
            onChange={(e) =>
              setParams((p) => ({ ...p, semester: e.target.value }))
            }
          />
        </div>
      </div>
    );
  };

  return (
    <div className="paper">
      <h2>成绩查询</h2>
      <div className="paper-head">
        <GradeQueryForm />
      </div>
      <div className="paper-body">
        <GradeTable />
      </div>
      {/* 保留原有调试信息 */}
      {props.debug && <pre>{JSON.stringify(grades, null, 2)}</pre>}
    </div>
  );
}

export default GradeList;
