import { useNavigate } from "react-router-dom";
import CourseTable from "./CourseTable";
import StyledButton from "../components/StyledButton";
import StyledTable from "../components/StyledTable";
import {
  Paper,
  PaperHead,
  PaperBody,
  StatusBar,
  Message,
  ErrorMessage,
  ErrorButton,
} from "../components/StyledPaper";

function CourseList(props) {
  let navigate = useNavigate();

  return (
    <Paper>
      <PaperHead>
        <StyledButton
          onClick={() => {
            navigate("/course/new");
          }}
        >
          新建课程
        </StyledButton>
      </PaperHead>
      <PaperBody>
        <CourseTable />
      </PaperBody>
    </Paper>
  );
}

export default CourseList;
