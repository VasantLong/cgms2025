import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter, useLocation } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
  body {
    margin: 0;
    overflow-y: hidden;
  }

  #root {
    display: ${({ isLogin }) => (isLogin ? "block" : "grid")};
    grid-template-columns: ${({ isLogin }) => (isLogin ? "auto" : "10rem 1fr")};
    grid-template-rows: ${({ isLogin }) =>
      isLogin ? "auto" : "4rem 1fr 2rem"};
    grid-template-areas: ${({ isLogin }) =>
      isLogin ? "unset" : '"header header" "sidebar main" "sidebar footer"'};
    width: 100vw;
    height: 100vh;
  }
`;
const theme = {
  colors: {
    primary: "hsl(306, 40%, 25%)",
    secondary: "hsl(329, 45%, 38%)",
    error: "#ff4d4f",
    border: "#eee",
    paperBg: "hsl(307, 38%, 90%)",
    danger: "#ff4d4f",
    warning: "#faad14",
    success: "#52c41a",
    paper: "#fff",
  },
  spacing: {
    sm: "8px",
    md: "16px",
    lg: "24px",
  },
  shadows: {
    paper: "4px 5px 4px 2px #aaa",
  },
  sizes: {
    sm: "0.75rem",
    md: "1rem",
    lg: "1.25rem",
  },
  form: {
    labelWidth: "120px",
    inputHeight: "38px",
    errorBorder: "hsl(0, 85%, 65%)",
    focusShadow: "0 0 0 2px hsl(329, 45%, 38% / 0.2)",
    labelColor: "hsl(306, 40%, 25%)",
  },
};

// 封装一个组件，在路由上下文中获取路径信息
const AppWrapper = () => {
  const location = useLocation();
  const isLogin = location.pathname.startsWith("/login");

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles isLogin={isLogin} />
      <App />
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  </React.StrictMode>
);
