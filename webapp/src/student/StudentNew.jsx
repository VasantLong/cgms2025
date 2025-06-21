import { useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentDetail from "./StudentDetail";
import useSWR from "swr";
import StyledPaper from "../components/StyledPaper";

function StudentNew(props) {
  let stuinfo = {
    stu_sn: null,
  };

  return (
    <StyledPaper>
      <StudentDetail stuinfo={stuinfo} />
    </StyledPaper>
  );
}

export default StudentNew;
