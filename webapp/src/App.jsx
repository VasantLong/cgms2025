import { BrowserRouter, Routes, Route } from "react-router-dom";

import { StudentHome, StudentList, StudentEdit, StudentNew } from "./student";
import { CourseHome, CourseList, CourseEdit, CourseNew } from "./course";

import GradeList from "./grade/GradeList";
import NaviMenu from "./NaviMenu";
import "./components.css";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      {/* 必须根包含BrowserRouter组件，定义其控制范围 */}
      <div className="page-header">
        <img className="logo" src="/tgu_logo_256.png" alt="tgu logo" />
        <div className="title">成绩管理系统</div>
      </div>

      <NaviMenu className="page-sidebar" />

      <div className="page-body">
        <div className="page-content">
          {/* 根据URL导航路径匹配相应业务功能组件 */}
          <Routes>
            <Route path="/grade/list" element={<GradeList />} />
            <Route path="/student" element={<StudentHome />}>
              <Route path="list" element={<StudentList />} />
              <Route path="new" element={<StudentNew />} />
              <Route path=":stuSn" element={<StudentEdit />} />
            </Route>
            <Route path="/course" element={<CourseHome />}>
              <Route path="list" element={<CourseList />} />
              <Route path="new" element={<CourseNew />} />
              <Route path=":courseSn/edit" element={<CourseEdit />} />
            </Route>
            <Route path="*" element={<GradeList />} />
          </Routes>
        </div>
        <div className="page-footer">
          &copy; 天津工业大学经济与管理学院 2025
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
