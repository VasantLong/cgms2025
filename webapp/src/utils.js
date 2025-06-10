const API_BASE = import.meta.env.DEV ? "http://localhost:8501" : "";

export async function fetcher(url, options = {}) {
  let response = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: "include", // 如果需要携带 cookies
  });

  if (!response.ok) {
    const error = new Error("请求失败");
    error.info = await response.json();
    error.status = response.status;
    throw error;
  }

  return await response.json();
}
