import { defineConfig } from 'vite';
import pluginReact from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    port: 5173,
    host: true
  }
});
