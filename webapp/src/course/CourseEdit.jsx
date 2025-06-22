import { useParams } from "react-router-dom";
import CourseDetail from "./CourseDetail";
import useSWR from "swr";
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

function CourseEdit(props) {
  // 从URL参数中获取课程编号
  const { courseSn } = useParams();
  console.log(`courseSn: ${courseSn}`);

  // 读取学生数据
  const { data: courseinfo, error } = useSWR(
    `/api/course/${courseSn}`,
    fetcher
  );

  if (error) {
    return (
      <Paper>
        <div>数据加载失败</div>
      </Paper>
    );
  }

  if (!courseinfo) {
    return (
      <Paper>
        <div>数据加载中...</div>
      </Paper>
    );
  }

  return (
    <Paper>
      <PaperHead>
        <h3>{`课程信息：${courseinfo.course_name}`}</h3>
      </PaperHead>
      <PaperBody>
        <CourseDetail courseinfo={courseinfo} />
      </PaperBody>
    </Paper>
  );
}
export default CourseEdit;
