import { useParams } from "react-router-dom";
import CourseDetail from "./CourseDetail";
import useSWR from "swr";
import { fetcher } from "../utils";

function CourseEdit() {
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
      <div className="paper">
        <div>数据加载失败</div>
      </div>
    );
  }

  if (!courseinfo) {
    return (
      <div className="paper">
        <div>数据加载中...</div>
      </div>
    );
  }

  return (
    <div className="paper">
      <div className="paper-head">
        <h3>
          {`课程信息：${courseinfo.course_name} (#${courseinfo.course_sn})`}
        </h3>
      </div>
      <CourseDetail courseinfo={courseinfo} />
    </div>
  );
}
export default CourseEdit;
