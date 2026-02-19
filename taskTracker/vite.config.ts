import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST as string | undefined;

export default defineConfig(({ command }) => ({
  plugins: [react()],
  clearScreen: false,

  server:
    command === "serve"
      ? {
          port: 1420,
          strictPort: true,
          host: host || false,
          hmr: host
            ? {
                protocol: "ws",
                host,
                port: 1421,
              }
            : undefined,
          watch: {
            ignored: ["**/src-tauri/**"],
          },
        }
      : undefined,

  build:
    command === "build"
      ? {
          outDir: "dist",
          target: "es2021",
          minify: "esbuild",
          sourcemap: false,
        }
      : undefined,
}));
