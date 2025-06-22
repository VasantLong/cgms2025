const API_BASE = import.meta.env.DEV ? "http://localhost:8501" : "";
import React, { createContext, useContext, useNavigate } from "react";

export async function fetcher(url, options = {}) {
  console.log("[API_BASE]", API_BASE); // 打印 API_BASE 的值
  console.log("[NETWORK] 发起请求:", url);
  // 自动添加认证头
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      const error = new Error(errorData.detail || "请求失败");
      error.info = errorData;
      error.status = response.status;

      if (response.status === 401) {
        message.warning("令牌失效，请重新登录");
        localStorage.removeItem("token");
        localStorage.removeItem("userSn");
        navigate("/login");
      }
      throw error;
    } catch (jsonError) {
      // 若响应非 JSON 格式，使用状态文本作为错误信息
      const error = new Error(response.statusText || "请求失败");
      error.status = response.status;
      throw error;
    }
  }

  // 检查响应是否有内容，避免解析空响应
  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return null;
  }

  return await response.json();
}
