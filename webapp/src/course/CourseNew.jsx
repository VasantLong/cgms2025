import { useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CourseDetail from "./CourseDetail";
import useSWR from "swr";

function CourseNew(props) {
  let courseinfo = {
    course_sn: null,
  };

  return (
    <div className="paper">
      <div className="paper-head">
        <h3>新建课程信息</h3>
      </div>
      <CourseDetail courseinfo={courseinfo} />
    </div>
  );
}

export default CourseNew;
