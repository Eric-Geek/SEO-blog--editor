import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/seo-blog--editor/', // <--- 添加这一行
  plugins: [react()],
})