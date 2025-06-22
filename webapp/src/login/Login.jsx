import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetcher } from "../utils";
//import "./login.css";
import {
  LoginRoot,
  LoginContainer,
  LoginHeader,
  Field,
  LoginButton,
  ErrorMessage,
} from "../components/StyledLogin";

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
    <LoginRoot>
      <LoginContainer>
        <LoginHeader>
          <h2>成绩管理系统登录</h2>
        </LoginHeader>
        <form onSubmit={handleSubmit}>
          <Field>
            <label>用户名：</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Field>
          <Field>
            <label>密码：</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <LoginButton type="submit">登录</LoginButton>
        </form>
      </LoginContainer>
    </LoginRoot>
  );
}

export default Login;
