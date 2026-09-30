import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the browser calls /api/* on the Vite origin and Vite forwards
// it to the FastAPI backend (backend/main.py). Foundry, if enabled, is called by
// the backend, so no Azure token or secret ever reaches the browser.
const apiTarget = process.env.UCOMPASS_API_TARGET ?? 'http://127.0.0.1:8000';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
});
