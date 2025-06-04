import { useNavigate } from "react-router-dom";
import CourseTable from "./CourseTable";

function CourseList(props) {
  let navigate = useNavigate();

  return (
    <div className="paper">
      <div className="paper-head">
        <button
          className="btn"
          onClick={() => {
            navigate("/course/new");
          }}
        >
          新建课程
        </button>
      </div>
      <div className="paper-body">
        <CourseTable />
      </div>
    </div>
  );
}

export default CourseList;
