import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// BASE_PATH lets a GitHub Pages build (served from a /<repo>/ subpath) resolve
// its assets correctly, while local dev/preview default to "/" unchanged.
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-charts": ["recharts"],
          "vendor-dnd": ["@hello-pangea/dnd"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
});
