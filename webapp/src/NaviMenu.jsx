import { NavLink } from "react-router-dom";

function NavMenu({ className }) {
  return (
    <nav className={className}>
      <ul>
        <li>
          <NavLink to="/student/list">学生</NavLink>
        </li>
        <li>
          <NavLink to="/course/list">课程</NavLink>
        </li>
        <li>
          <NavLink to="/class/list">班级</NavLink>
        </li>
        <li>
          <NavLink to="/grade/list">成绩</NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default NavMenu;
