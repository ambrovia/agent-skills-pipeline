import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { annotationsPlugin } from "./annotations/vite-plugin-annotations.js";
import runtimeConfig from "./viewer-runtime.generated.json";

async function loadProjectTailwindVitePlugin(projectRoot: string) {
  const projectRequire = createRequire(join(projectRoot, "package.json"));
  const pluginPath = projectRequire.resolve("@tailwindcss/vite");
  const mod = await import(pathToFileURL(pluginPath).href);
  const plugin = mod.default;
  return typeof plugin === "function" ? plugin() : null;
}

export default defineConfig(async () => {
  const projectRoot = runtimeConfig.projectRoot;
  const plugins = [react()];

  if (runtimeConfig.toolchain === "tailwind-v4") {
    try {
      const tailwind = await loadProjectTailwindVitePlugin(projectRoot);
      if (tailwind) plugins.push(tailwind);
    } catch (error) {
      console.warn(
        `[viewer] @tailwindcss/vite could not be loaded from ${projectRoot}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  plugins.push(annotationsPlugin());

  return {
    plugins,
    css:
      runtimeConfig.toolchain === "tailwind-v3" && runtimeConfig.postcssConfigDir
        ? { postcss: runtimeConfig.postcssConfigDir }
        : undefined,
    server: {
      port: 5173,
      fs: { allow: [projectRoot] },
    },
  };
});
