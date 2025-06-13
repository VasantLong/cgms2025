import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { StudentHome, StudentList, StudentEdit, StudentNew } from "./student";
import { CourseHome, CourseList, CourseEdit, CourseNew } from "./course";
import { GradeHome, GradeList, GradeEdit } from "./grade";
import { ClassHome, ClassList, ClassEdit, ClassNew } from "./class";
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
        <Route element={<AuthProvider />}>
          <Route path="/" element={<PrivateRoutes />}>
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
              <Route path="new" element={<ClassNew />} />
              <Route path=":classSn" element={<ClassEdit />}>
                <Route path="students" element={<ClassStudentSelection />} />
              </Route>
            </Route>
            {/* 默认路由规则 */}
            <Route path="/" element={<Navigate to="/grade/list" replace />} />
            <Route path="*" element={<Navigate to="/grade/list" replace />} />
          </Route>
        </Route>

        {/* 默认重定向 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
