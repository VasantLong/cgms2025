import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { StudentHome, StudentList, StudentEdit, StudentNew } from "./student";
import { CourseHome, CourseList, CourseEdit, CourseNew } from "./course";
import { GradeHome, GradeList, GradeEdit } from "./grade";
import { ClassHome, ClassList } from "./class";
import { Login } from "./login";
import { PublicRoutes, PrivateRoutes, AuthProvider } from "./routes";
import NaviMenu from "./NaviMenu";
import "./components.css";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公共路由 */}
        <Route path="/login/*" element={<PublicRoutes />} />

        {/* 需要认证的私有路由 */}
        <Route path="/*" element={<PrivateRoutes />} />

        {/* 默认重定向 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
