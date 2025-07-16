import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
 
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/SEO-blog--editor/', // Set the base path for GitHub Pages
  build: {
    outDir: 'docs', // Output to docs directory for GitHub Pages
  },
}) 