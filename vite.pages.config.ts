import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// This standalone build does not load Sites, Cloudflare Workers, or ChatGPT auth.
export default defineConfig({
  base: "./",
  plugins: [react()],
  define: { "process.env.NEXT_PUBLIC_ASSET_BASE": JSON.stringify("./") },
  build: { outDir: "dist-pages" },
  server: { host: "127.0.0.1" },
});
