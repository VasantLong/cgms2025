import { useNavigate } from "react-router-dom";
import ClassTable from "./ClassTable";

function ClassList(props) {
  let navigate = useNavigate();

  return (
    <div className="paper">
      <div className="paper-head">
        <button
          className="btn"
          onClick={() => {
            navigate("/class/new");
          }}
        >
          新建班次
        </button>
      </div>
      <div className="paper-body">
        <ClassTable />
      </div>
    </div>
  );
}
export default ClassList;
