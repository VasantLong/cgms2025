import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { fetcher } from "../utils";

const AuthProvider = () => {
  const [isValidating, setIsValidating] = useState(true);
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // 新增状态声明

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");

      // 添加路由验证锁定逻辑
      if (window.location.pathname === "/login") return;
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetcher("/api/users/me/", {
          headers: { Authorization: `Bearer ${token}` },
          //credentials: "include", // 添加跨域凭证
        });

        if (response.user_sn) {
          setUser(response); // 正确设置用户状态
          navigate("/grade/list"); // 明确导航到目标页面
        }
      } catch (error) {
        console.error("Token validation failed:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } finally {
        setIsValidating(false);
      }
    };
    validateToken();
  }, []);

  if (isValidating) {
    return <div>验证登录状态...</div>;
  }

  return <Outlet />;
};

export default AuthProvider;
