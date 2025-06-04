import { useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentDetail from "./StudentDetail";
import useSWR from "swr";

function StudentNew(props) {
  let stuinfo = {
    stu_sn: null,
  };

  return (
    <div className="paper">
      <div className="paper-head">
        <h3>新建学生信息</h3>
      </div>
      <StudentDetail stuinfo={stuinfo} />
    </div>
  );
}

export default StudentNew;
