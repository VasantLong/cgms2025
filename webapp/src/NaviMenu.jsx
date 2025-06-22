import { NavLink } from "react-router-dom";
import styled from "styled-components";

const StyledNav = styled.nav`
  grid-area: sidebar;
  background-color: hsl(307, 38%, 85%);
  display: flex;
  justify-content: flex-end;
  flex: 1;

  ul {
    list-style: none;
    margin-block-start: unset;
    margin-block-end: unset;
    padding-inline-start: unset;
    padding-top: 1rem;
    padding-left: 1rem;
    font-size: 2.1rem;
  }

  ul > li {
    color: hsl(306, 40%, 25%);
    display: flex;
  }

  ul > li > a {
    flex: 1 1;
    display: block;
    letter-spacing: 0.1em;
    padding: 0.1em 0.5em;
    user-select: none;
    text-decoration: none;
    position: relative;
  }

  ul > li > a:link,
  ul > li > a:visited {
    color: unset;
  }

  ul > li > a:hover {
    background-color: hsl(307, 38%, 65%);
    color: #eee;
  }

  ul > li > a.active {
    background-color: hsl(307, 38%, 75%);
  }

  ul > li > a.active::after {
    content: " ";
    position: absolute;
    width: 0;
    height: 0;
    right: 0;
    margin: 5px 0px;
    border-top: 0.5em solid transparent;
    border-bottom: 0.5em solid transparent;
    border-right: 0.5em solid hsl(307, 38%, 90%);
  }
`;

function NavMenu() {
  return (
    <StyledNav>
      <ul>
        <li>
          <NavLink to="/student/list">学生</NavLink>
        </li>
        <li>
          <NavLink to="/course/list">课程</NavLink>
        </li>
        <li>
          <NavLink to="/class/list">班次</NavLink>
        </li>
        <li>
          <NavLink to="/grade/list">成绩</NavLink>
        </li>
      </ul>
    </StyledNav>
  );
}

export default NavMenu;
