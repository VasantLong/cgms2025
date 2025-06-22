import { useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentDetail from "./StudentDetail";
import useSWR from "swr";
import { Paper } from "../components/StyledPaper";

function StudentNew(props) {
  let stuinfo = {
    stu_sn: null,
  };

  return (
    <Paper>
      <StudentDetail stuinfo={stuinfo} />
    </Paper>
  );
}

export default StudentNew;
