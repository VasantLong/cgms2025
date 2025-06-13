import { useParams, useLocation } from "react-router-dom";
import useSWR from "swr";
import ClassDetail from "./ClassDetail";
import { fetcher } from "../utils";

function ClassEdit(props) {
  const { classSn } = useParams();
  console.log(`classSn: ${classSn}`);
  const location = useLocation();
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

  // 合并导航传递的状态和从API获取的数据
  const mergedClassInfo = location.state?.preservedValues
    ? { ...classinfo, ...location.state.preservedValues }
    : classinfo;
  console.log("Merged Class Info:", mergedClassInfo);

  return (
    <div className="paper">
      <div className="paper-head">
        <h3>{`班次信息：${classinfo.name} (#${classinfo.class_sn})`}</h3>
      </div>
      <ClassDetail classinfo={mergedClassInfo} />
    </div>
  );
}

export default ClassEdit;
