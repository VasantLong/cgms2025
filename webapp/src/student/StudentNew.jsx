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
      <StudentDetail stuinfo={stuinfo} />
    </div>
  );
}

export default StudentNew;
