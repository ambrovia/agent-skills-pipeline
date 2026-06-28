import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { annotationsPlugin } from "./annotations/vite-plugin-annotations.js";

export default defineConfig({
  plugins: [react(), annotationsPlugin()],
  server: { port: 5173 },
});
