import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

// Content hash of every data/*.json shipped with the app. Injected as
// __BUILD_DATA_VERSION__ (see `define` below) and used by topicSources.js to
// (a) append ?v=<hash> to data-file fetches and (b) namespace the persistent
// JSON cache keys, so a newly deployed bank can never be served from an older
// build's Cache Storage / localStorage entry.
function buildDataVersion() {
  try {
    const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), "data");
    const files = readdirSync(dataDir)
      .filter((name) => name.endsWith(".json"))
      .sort();
    const hash = createHash("sha256");
    for (const name of files) {
      hash.update(name);
      hash.update(readFileSync(resolve(dataDir, name)));
    }
    return hash.digest("hex").slice(0, 12);
  } catch (_error) {
    // Never fall back to a constant here: a fixed version would let every
    // future deploy serve stale banks. A per-build timestamp keeps busting
    // working even if data/ is momentarily unreadable.
    return `ts-${Date.now().toString(36)}`;
  }
}

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";
  const dataVersion = isProd ? buildDataVersion() : "dev";
  return {
    base: isProd ? "/Promotion-cbt-app/" : "/",
    publicDir: false,
    define: {
      __BUILD_DATA_VERSION__: JSON.stringify(dataVersion),
    },
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
