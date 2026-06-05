import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      usePolling: true,
      interval: 500,
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  base: "https://jw7914-portfolio.vercel.app",
});
