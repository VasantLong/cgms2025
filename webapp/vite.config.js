import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:8501",
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@class": path.resolve(__dirname, "./src/class"),
      "@course": path.resolve(__dirname, "./src/course"),
      "@grade": path.resolve(__dirname, "./src/grade"),
      "@student": path.resolve(__dirname, "./src/student"),
      "@login": path.resolve(__dirname, "./src/login"),
      "@routes": path.resolve(__dirname, "./src/routes"),
    },
  },
});
