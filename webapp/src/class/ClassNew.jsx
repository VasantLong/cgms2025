import ClassDetail from "./ClassDetail";
import {
  Paper,
  PaperHead,
  PaperBody,
  StatusBar,
  Message,
  ErrorMessage,
  ErrorButton,
} from "../components/StyledPaper";

function ClassNew(props) {
  let classinfo = {
    class_sn: null,
  };

  return (
    <Paper>
      <ClassDetail classinfo={classinfo} />
    </Paper>
  );
}

export default ClassNew;
