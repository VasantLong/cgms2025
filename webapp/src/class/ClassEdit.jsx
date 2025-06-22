import { useParams, useLocation } from "react-router-dom";
import useSWR from "swr";
import ClassDetail from "./ClassDetail";
import { fetcher } from "../utils";
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

function ClassEdit(props) {
  const { classSn } = useParams();
  console.log(`classSn: ${classSn}`);
  const location = useLocation();
  const { data: classinfo, error } = useSWR(`/api/class/${classSn}`, fetcher);

  if (error) {
    return (
      <Paper>
        <ErrorMessage>数据加载失败</ErrorMessage>
      </Paper>
    );
  }

  if (!classinfo) {
    return (
      <Paper>
        <div>数据加载中...</div>
      </Paper>
    );
  }

  // 合并导航传递的状态和从API获取的数据
  const mergedClassInfo = location.state?.preservedValues
    ? { ...classinfo, ...location.state.preservedValues }
    : classinfo;
  console.log("Merged Class Info:", mergedClassInfo);
  console.log("Selected Course SN:", mergedClassInfo.cou_sn);

  return (
    <Paper>
      <ClassDetail classinfo={mergedClassInfo} />
    </Paper>
  );
}

export default ClassEdit;
