import { useParams } from "react-router-dom";
import StudentDetail from "./StudentDetail";
import useSWR from "swr";
import { fetcher } from "../utils";

function StudentEdit(props) {
  const { stuSn } = useParams();

  console.log(`stuSn: ${stuSn}`);

  // 读取学生数据
  const { data: stuinfo, error } = useSWR(`/api/student/${stuSn}`, fetcher);

  if (error) {
    return (
      <div className="paper">
        <div>数据加载失败</div>
      </div>
    );
  }

  if (!stuinfo) {
    return (
      <div className="paper">
        <div>数据加载中...</div>
      </div>
    );
  }

  return (
    <div className="paper">
      <div className="paper-head">
        <h3>{`学生信息：${stuinfo.stu_name} (#${stuinfo.stu_sn})`}</h3>
      </div>
      <StudentDetail stuinfo={stuinfo} />
    </div>
  );
}

export default StudentEdit;
