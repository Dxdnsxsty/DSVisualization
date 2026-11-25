import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base 使用相对路径，配合 hash 路由可直接部署到 GitHub Pages 项目页
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 8888, host: '127.0.0.1', strictPort: true },
});
