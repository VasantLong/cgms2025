import { useParams } from "react-router-dom";
import useSWR from "swr";
import ClassDetail from "./ClassDetail";
import { fetcher } from "../utils";

function ClassEdit(props) {
  const { classSn } = useParams();
  console.log(`classSn: ${classSn}`);
  const { data: classinfo, error } = useSWR(`/api/class/${classSn}`, fetcher);

  if (error) {
    return (
      <div className="paper">
        <div>数据加载失败</div>
      </div>
    );
  }

  if (!classinfo) {
    return (
      <div className="paper">
        <div>数据加载中...</div>
      </div>
    );
  }

  return (
    <div className="paper">
      <div className="paper-head">
        <h3>{`课程信息：${classinfo.name} (#${classinfo.class_sn})`}</h3>
      </div>
      <ClassDetail classinfo={classinfo} />
    </div>
  );
}

export default ClassEdit;
