import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Relative assets keep the same build deployable at /wow/admin/,
  // a standalone Vercel/Cloudflare project, or another subpath.
  base: "./",
  plugins: [react(), tailwindcss()],
});
