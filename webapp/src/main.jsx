import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "styled-components";

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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
