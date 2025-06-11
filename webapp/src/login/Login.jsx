import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetcher } from "../utils";
import "./login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetcher("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      // 确保获取正确的字段
      const { access_token, user_sn } = response;

      // 存储用户信息
      localStorage.setItem("token", access_token);
      localStorage.setItem("userSn", user_sn); // 确保字段名一致

      navigate("/grade/list");
    } catch (err) {
      const message = err.info?.detail || "网络连接异常";
      setError(`登录失败：${message}`);
      console.error("Login error:", err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h2>教秘系统登录</h2>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>用户名：</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>密码：</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="login-button">
          登录
        </button>
      </form>
    </div>
  );
}

export default Login;
