import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'plugin-inspect-react-code'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    ...(mode === 'development' ? [inspectAttr()] : []),
    react(),
  ],
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('lucide-react')) return 'icons-vendor';
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('framer-motion') || id.includes('@gsap/react')) return 'react-vendor';
          if (id.includes('gsap')) return 'motion-vendor';
          if (id.includes('zod') || id.includes('zustand')) return 'state-vendor';
          return 'vendor';
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
