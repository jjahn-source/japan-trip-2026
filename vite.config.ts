import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

function injectSwVersion(): Plugin {
  return {
    name: "inject-sw-version",
    writeBundle() {
      const buildId = Date.now().toString(36);
      const swPath = resolve("dist/sw.js");
      const content = readFileSync(swPath, "utf-8").replace("__SW_BUILD__", buildId);
      writeFileSync(swPath, content);
    },
  };
}

export default defineConfig({
  base: "/japan-trip-2026/",
  plugins: [react(), tailwindcss(), injectSwVersion()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          motion: ["motion"],
          icons: ["lucide-react"],
          leaflet: ["leaflet"],
        },
      },
    },
  },
});
