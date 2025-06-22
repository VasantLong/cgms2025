import { useNavigate } from "react-router-dom";
import ClassTable from "./ClassTable";
import StyledButton from "../components/StyledButton";
import {
  Paper,
  PaperHead,
  PaperBody,
  StatusBar,
  Message,
  ErrorMessage,
  ErrorButton,
} from "../components/StyledPaper";

function ClassList(props) {
  let navigate = useNavigate();

  return (
    <Paper>
      <PaperHead>
        <StyledButton
          onClick={() => {
            navigate("/class/new");
          }}
        >
          新建班次
        </StyledButton>
      </PaperHead>
      <PaperBody>
        <ClassTable />
      </PaperBody>
    </Paper>
  );
}
export default ClassList;
