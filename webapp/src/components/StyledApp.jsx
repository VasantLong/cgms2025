import styled from "styled-components";

// 全局样式，替代 body 样式
export const GlobalBody = styled.body`
  margin: 0;
  overflow-y: hidden;
`;

// 根容器，使用条件渲染避免影响登录界面
export const RootContainer = styled.div`
  display: ${({ isLogin }) => (isLogin ? "none" : "grid")};
  grid-template-columns: 10rem 1fr;
  grid-template-rows: 4rem 1fr 2rem;
  grid-template-areas:
    "header header"
    "sidebar main"
    "sidebar footer";
  width: 100vw;
  height: 100vh;
`;

export const PageHeader = styled.header`
  grid-area: header;
  background-color: hsl(306, 40%, 25%);
  box-shadow: 0px 2px 5px 0px hsl(307, 38%, 21%);
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 0 2rem;
`;

export const Logo = styled.img`
  width: 3.5rem;
  height: 3.5rem;
  margin-left: 1rem;
  margin-right: 1rem;
`;

export const Title = styled.h1`
  font-size: 2.1rem;
  color: #eee;
  font-weight: bolder;
  letter-spacing: 0.15em;
  user-select: none;
`;

export const PageFooter = styled.footer`
  grid-area: footer;
  line-height: 2;
  color: #999;
  margin-top: 1em;
  text-align: center;
`;

export const PageSidebar = styled.aside`
  grid-area: sidebar;
  background-color: hsl(307, 38%, 85%);
  display: flex;
  justify-content: flex-end;
  flex: 1;
`;

export const SidebarList = styled.ul`
  list-style: none;
  margin-block-start: unset;
  margin-block-end: unset;
  padding-inline-start: unset;
  padding-top: 1rem;
  padding-left: 1rem;
  font-size: 2.1rem;
`;

export const SidebarItem = styled.li`
  color: hsl(306, 40%, 25%);
  display: flex;
`;

export const SidebarLink = styled.a`
  flex: 1 1;
  display: block;
  letter-spacing: 0.1em;
  padding: 0.1em 0.5em;
  user-select: none;
  text-decoration: none;
  position: relative;

  &:link,
  &:visited {
    color: unset;
  }

  &:hover {
    background-color: hsl(307, 38%, 65%);
    color: #eee;
  }

  &.active {
    background-color: hsl(307, 38%, 75%);
  }

  &.active::after {
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

export const PageBody = styled.main`
  grid-area: main;
  min-height: calc(100vh - 4rem); /* 4rem header + 2rem footer */
  position: relative;
  background-color: hsl(307, 38%, 90%);
  overflow-y: auto; /* 改为标准滚动条 */
`;

export const GeneratedValue = styled.span`
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f5f5f5;
  color: #666;
`;
