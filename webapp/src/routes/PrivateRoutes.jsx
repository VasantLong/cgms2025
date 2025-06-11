import { Outlet } from "react-router-dom";
import NaviMenu from "../NaviMenu";

export default function PrivateRoutes() {
  return (
    <>
      {/* 系统主布局容器 */}
      <div className="app-container">
        {/* 页头 */}
        <div className="page-header">
          <img className="logo" src="/tgu_logo_256.png" alt="tgu logo" />
          <div className="title">成绩管理系统</div>
        </div>

        <NaviMenu className="page-sidebar" />

        {/* 页面主体内容 */}
        <div className="page-body">
          <div className="page-content">
            <Outlet /> {/* 仅保留一个路由出口 */}
          </div>

          {/* 页脚... */}
          <div className="page-footer">
            &copy; 天津工业大学经济与管理学院 2025
          </div>
        </div>
      </div>
    </>
  );
}
