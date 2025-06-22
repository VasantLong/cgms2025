import { useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CourseDetail from "./CourseDetail";
import useSWR from "swr";
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

function CourseNew(props) {
  let courseinfo = {
    course_sn: null,
  };

  return (
    <Paper>
      <PaperHead>
        <h3>新建课程信息</h3>
      </PaperHead>
      <PaperBody>
        <CourseDetail courseinfo={courseinfo} />
      </PaperBody>
    </Paper>
  );
}

export default CourseNew;
