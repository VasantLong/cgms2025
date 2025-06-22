import { Outlet } from "react-router-dom";
import NaviMenu from "../NaviMenu";
import {
  GlobalBody,
  RootContainer,
  PageHeader,
  Logo,
  Title,
  PageFooter,
  PageSidebar,
  SidebarList,
  SidebarItem,
  SidebarLink,
  PageBody,
} from "../components/StyledApp";

export default function PrivateRoutes() {
  return (
    <>
      {/* 页头 */}
      <PageHeader>
        <Logo src="/tgu_logo_256.png" alt="tgu logo" />
        <Title>成绩管理系统</Title>
      </PageHeader>

      <NaviMenu className="page-sidebar" />

      {/* 页面主体内容 */}
      <PageBody>
        <div className="page-content">
          <Outlet /> {/* 仅保留一个路由出口 */}
        </div>

        {/* 页脚... */}
        <PageFooter>&copy; 天津工业大学经济与管理学院 2025</PageFooter>
      </PageBody>
    </>
  );
}
