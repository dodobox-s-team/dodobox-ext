import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __API_DOMAIN_NAME: JSON.stringify(process.env.API_DOMAIN_NAME),
    __WEB_DOMAIN_NAME: JSON.stringify(process.env.WEB_DOMAIN_NAME),
    __API_PORT: JSON.stringify(process.env.API_PORT),
    __WEB_PORT: JSON.stringify(process.env.WEB_PORT),
  },
  server: {
    hmr: {
      protocol: "wss",
      host: process.env.WEB_DOMAIN_NAME,
      port: parseInt(process.env.WEB_PORT),
    },
    watch: {
      usePolling: true,
    },
  },
});
