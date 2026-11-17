import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base 使用相对路径，配合 hash 路由可直接部署到 GitHub Pages 项目页
export default defineConfig({
  base: './',
  plugins: [react()],
  // 不使用 5173：Windows 上 Hyper-V / WSL2 / Docker 常保留 5076-5175 端口段，
  // 绑定会报 EACCES。5180 位于保留区间之外。改端口也可直接改这里。
  server: { port: 5180, host: '127.0.0.1', strictPort: true },
});
