import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { StudentHome, StudentList, StudentEdit, StudentNew } from "./student";
import { CourseHome, CourseList, CourseEdit, CourseNew } from "./course";
import { GradeHome, GradeList, GradeEdit } from "./grade";
import { ClassHome, ClassList } from "./class";
import { Login, AuthProvider } from "./login";
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
            {/* 需要认证的路由组 */}
            <Route element={<AuthProvider />}>
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
              <Route path="/grade" element={<GradeHome />}>
                <Route path="list" element={<GradeList />} />
                <Route
                  path="student/:stuSn/course/:courseSn"
                  element={<GradeEdit />}
                />
              </Route>
              <Route path="/class" element={<ClassHome />}>
                <Route path="list" element={<ClassList />} />
              </Route>
              <Route path="*" element={<GradeList />} />
            </Route>
            {/* 不需要认证的公共路由 */}
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
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
