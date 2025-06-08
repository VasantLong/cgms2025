import { useNavigate } from "react-router-dom";
import GradeTable from "./GradeTable";
import "./grade.css";

function GradeList(props) {
  let navigate = useNavigate();

  return (
    <div className="paper">
      <div className="paper-head">
        <button
          className="btn"
          onClick={() => {
            navigate("/grade/new");
          }}
        >
          新建成绩
        </button>
      </div>
      <div className="paper-body">
        <GradeTable />
      </div>
    </div>
  );
}

export default GradeList;
