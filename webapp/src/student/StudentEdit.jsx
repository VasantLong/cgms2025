import { useParams } from "react-router-dom";
import StudentDetail from "./StudentDetail";
import useSWR from "swr";
import { fetcher } from "../utils";
import { Paper } from "../components/StyledPaper";

function StudentEdit(props) {
  const { stuSn } = useParams();

  console.log(`stuSn: ${stuSn}`);

  // 读取学生数据
  const { data: stuinfo, error } = useSWR(`/api/student/${stuSn}`, fetcher);

  if (error) {
    return (
      <Paper>
        <div>数据加载失败</div>
      </Paper>
    );
  }

  if (!stuinfo) {
    return (
      <Paper>
        <div>数据加载中...</div>
      </Paper>
    );
  }

  return (
    <Paper>
      <StudentDetail stuinfo={stuinfo} />
    </Paper>
  );
}

export default StudentEdit;
