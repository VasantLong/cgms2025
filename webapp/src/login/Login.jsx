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

      if (response.access_token) {
        localStorage.setItem("token", response.access_token);
        // 存储用户基本信息
        localStorage.setItem(
          "user",
          JSON.stringify({
            username: response.user_info.user_sn,
            realName: response.user_info.real_name,
          })
        );
        navigate("/");
      }
    } catch (err) {
      setError("登录失败，请检查用户名或密码");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="login-container">
      <h2>教秘系统登录</h2>
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
