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
      // Note: there is intentionally NO manualChunks here. The quiz and
      // analytics modules are loaded via dynamic import() in js/app.js (see
      // loadQuizApi/loadAnalyticsApi), and under rolldown-vite a manualChunks
      // rule forces any matching module back into the entry's static module
      // graph (modulepreload + static namespace import), which defeats the
      // lazy loading. Without the rule they split into natural async chunks
      // that are fetched only when first needed.
      rollupOptions: {
        output: {},
      },
    },
    plugins: [
      viteStaticCopy({
        targets: [
          { src: "data/topics.json", dest: "data" },
          { src: "data/exam_templates.json", dest: "data" },
          { src: "data/gl_band_weights.json", dest: "data" },
          { src: "config/runtime-auth.js", dest: "config" },
          { src: "config/runtime-auth.example.js", dest: "config" },
          { src: "tools/progress-diagnostic.html", dest: "tools" },
        ],
      }),
    ],
  };
});
