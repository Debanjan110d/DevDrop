import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@devdrop/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@devdrop/api-types': path.resolve(__dirname, '../../packages/api-types/src/index.ts'),
      '@devdrop/validation': path.resolve(__dirname, '../../packages/validation/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4545',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4545',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
