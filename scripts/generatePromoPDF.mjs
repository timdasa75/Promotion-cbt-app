#!/usr/bin/env node
/**
 * Generate professional promotional PDFs for Promotion CBT
 * Uses Playwright headless browser for pixel-perfect rendering.
 *
 * Usage:
 *   node scripts/generatePromoPDF.mjs          # generates both variants
 *   node scripts/generatePromoPDF.mjs --green   # green variant only
 *   node scripts/generatePromoPDF.mjs --white   # white variant only
 *
 * Output:
 *   docs/promo-promotion-cbt.pdf       (green/dark variant)
 *   docs/promo-promotion-cbt-white.pdf (white/light variant)
 */

import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "docs");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const variants = [
  {
    name: "green",
    html: "preview-promo.html",
    output: "promo-promotion-cbt.pdf",
    bg: "#0a3d2e",
  },
  {
    name: "white",
    html: "preview-promo-white.html",
    output: "promo-promotion-cbt-white.pdf",
    bg: "#ffffff",
  },
];

// Parse CLI args
const args = process.argv.slice(2);
const requested =
  args.includes("--green") || args.includes("-g")
    ? ["green"]
    : args.includes("--white") || args.includes("-w")
    ? ["white"]
    : ["green", "white"];

async function generatePDF(variant) {
  const htmlFile = path.join(OUTPUT_DIR, variant.html);
  const outputFile = path.join(OUTPUT_DIR, variant.output);

  if (!fs.existsSync(htmlFile)) {
    console.error(`❌ HTML file not found: ${htmlFile}`);
    return false;
  }

  console.log(`\n🎨 Generating ${variant.name} variant...`);

  const browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 480, height: 800 });

  const fileUrl = `file://${htmlFile.replace(/\\/g, "/")}`;
  console.log(`📄 Loading: ${variant.html}`);
  await page.goto(fileUrl, { waitUntil: "networkidle" });

  // Wait for fonts to load
  await page.waitForTimeout(2000);

  // Get card dimensions
  const cardBox = await page.evaluate(() => {
    const card = document.querySelector(".card");
    if (!card) return null;
    const rect = card.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });

  if (cardBox) {
    console.log(`📐 Card: ${cardBox.width}x${cardBox.height}px`);
  }

  // Size the PDF page to fit the card
  const padding = 40;
  const pageWidthPx = (cardBox?.width || 420) + padding * 2;
  const pageHeightPx = (cardBox?.height || 700) + padding * 2;

  const pxToMm = 25.4 / 96;
  const pageWidthMm = pageWidthPx * pxToMm;
  const pageHeightMm = pageHeightPx * pxToMm;

  console.log(`📐 PDF page: ${pageWidthMm.toFixed(1)}x${pageHeightMm.toFixed(1)}mm`);

  // Center the card with appropriate background
  await page.evaluate(
    ({ bg, pad }) => {
      document.body.style.margin = "0";
      document.body.style.padding = "0";
      document.body.style.background = bg;
      document.body.style.display = "flex";
      document.body.style.justifyContent = "center";
      document.body.style.alignItems = "center";
      document.body.style.minHeight = "100vh";

      const card = document.querySelector(".card");
      if (card) {
        card.style.margin = `${pad}px auto`;
      }
    },
    { bg: variant.bg, pad: padding / 2 }
  );

  await page.pdf({
    path: outputFile,
    width: `${pageWidthMm}mm`,
    height: `${pageHeightMm}mm`,
    printBackground: true,
    margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
  });

  await browser.close();

  const stats = fs.statSync(outputFile);
  console.log(`✅ ${variant.name} variant: ${outputFile}`);
  console.log(`📊 Size: ${(stats.size / 1024).toFixed(1)} KB`);
  return true;
}

async function main() {
  console.log("🚀 Generating promotional PDFs...\n");

  let allOk = true;
  for (const v of variants) {
    if (requested.includes(v.name)) {
      const ok = await generatePDF(v);
      if (!ok) allOk = false;
    }
  }

  console.log("\n" + "═".repeat(50));
  if (allOk) {
    console.log("✅ All PDFs generated successfully!");
  } else {
    console.log("⚠️  Some PDFs failed to generate.");
  }
  console.log(`🔗 CTA Link: https://timdasa75.github.io/Promotion-cbt-app/`);
}

main().catch((err) => {
  console.error("❌ PDF generation failed:", err);
  process.exit(1);
});
