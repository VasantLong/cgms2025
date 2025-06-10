import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { fetcher } from "../utils";

const AuthProvider = () => {
  const [isValidating, setIsValidating] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetcher("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include", // 添加跨域凭证
        });

        if (!response.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      } catch (error) {
        console.error("Token validation failed:", error);
        navigate("/login");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [navigate]);

  if (isValidating) {
    return <div>验证登录状态...</div>;
  }

  return (
    <Routes>
      <Route element={<PrivateLayout />}>
        {/* 包含导航菜单的布局 */}
        <Route path="/*" element={<Outlet />} /> {/* 匹配所有子路由 */}
      </Route>
    </Routes>
  );
};

export default AuthProvider;
