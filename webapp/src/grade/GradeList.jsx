import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import GradeTable from "./GradeTable";
import "./grade.css";

function GradeList(props) {
  let navigate = useNavigate();

  useEffect(() => {
    console.log("[DEBUG] GradeList 组件已挂载");
  }, []);

  return (
    <div className="paper">
      {/* 添加调试信息 */}
      {console.log("[DEBUG] Rendering GradeList")}
      <div className="paper-head">
        <button
          className="btn"
          onClick={() => {
            navigate("/grade/new");
          }}
        >
          新建成绩
        </button>
      </div>
      <div className="paper-body">
        <GradeTable />
      </div>
    </div>
  );
}

export default GradeList;
