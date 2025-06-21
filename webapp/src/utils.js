const API_BASE = import.meta.env.DEV ? "http://localhost:8501" : "";

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
    const error = new Error("请求失败");
    error.info = await response.json();
    error.status = response.status;
    throw error;
  }

  return await response.json();
}
