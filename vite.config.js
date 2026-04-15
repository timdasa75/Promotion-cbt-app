import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";
  return {
    base: isProd ? "/Promotion-cbt-app/" : "/",
    publicDir: false,
    server: {
      port: 5500,
      strictPort: true,
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
    plugins: [
      viteStaticCopy({
        targets: [
          { src: "data/*.json", dest: "data" },
          { src: "config/runtime-auth.js", dest: "config" },
          { src: "config/runtime-auth.example.js", dest: "config" },
        ],
      }),
    ],
  };
});