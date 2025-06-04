import { useNavigate } from "react-router-dom";
import StudentTable from "./StudentTable";

function StudentList(props) {
  let navigate = useNavigate();

  return (
    <div className="paper">
      <div className="paper-head">
        <button
          className="btn"
          onClick={() => {
            navigate("/student/new");
          }}
        >
          新建学生记录
        </button>
      </div>
      <div className="paper-body">
        <StudentTable />
      </div>
    </div>
  );
}

export default StudentList;
