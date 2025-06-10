import { Routes, Route, Outlet } from "react-router-dom";
import AuthProvider from "./AuthProvider";
import NaviMenu from "../NaviMenu";
import { StudentHome, StudentList, StudentEdit, StudentNew } from "../student";
import { CourseHome, CourseList, CourseEdit, CourseNew } from "../course";
import { GradeHome, GradeList, GradeEdit } from "../grade";
import { ClassHome, ClassList } from "../class";

export default function PrivateRoutes() {
  return (
    <AuthProvider>
      {/* 公共布局 */}
      <div className="page-header">
        <img className="logo" src="/tgu_logo_256.png" alt="tgu logo" />
        <div className="title">成绩管理系统</div>
      </div>

      <NaviMenu className="page-sidebar" />

      <div className="page-body">
        <div className="page-content">
          <Outlet /> {/* 子路由出口 */}
        </div>
        {/* 页脚... */}
        <div className="page-footer">
          &copy; 天津工业大学经济与管理学院 2025
        </div>
      </div>

      {/* 具体路由配置 */}
      <Routes>
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
      </Routes>
    </AuthProvider>
  );
}
