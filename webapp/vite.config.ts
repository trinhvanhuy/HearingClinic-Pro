import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['events', 'util', 'buffer', 'stream'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/parse': {
        target: 'http://localhost:1338',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['parse'],
    exclude: [],
  },
  define: {
    global: 'globalThis',
  },
})

