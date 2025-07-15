import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import packageJson from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: packageJson.homepage,
}) 