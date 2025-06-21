import { useNavigate } from "react-router-dom";
import React from "react";
import { Button } from "antd";
import StudentTable from "./StudentTable";
import {
  Paper,
  PaperHead,
  PaperBody,
  StatusBar,
  Message,
  ErrorMessage,
  ErrorButton,
} from "../components/StyledPaper";
import StyledButton from "../components//StyledButton";

function StudentList(props) {
  let navigate = useNavigate();

  return (
    <Paper>
      <PaperHead>
        <StyledButton
          className="btn"
          onClick={() => {
            navigate("/student/new");
          }}
        >
          新建学生记录
        </StyledButton>
      </PaperHead>
      <StudentTable />
    </Paper>
  );
}

export default StudentList;
