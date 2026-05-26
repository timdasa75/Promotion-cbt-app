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
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("/js/appAnalytics") || id.includes("/js/appAnalyticsView") || id.includes("/js/appRecommendations") || id.includes("/js/appRecommendationDismissals")) {
              return "analytics";
            }
            if (id.includes("/js/quiz.js") || id.includes("/js/quiz/")) {
              return "quiz";
            }
          },
        },
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
