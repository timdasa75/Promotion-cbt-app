#!/usr/bin/env node
/**
 * Generate a professional single-page promotional PDF for Promotion CBT
 * Uses Playwright headless browser to render HTML → PDF for pixel-perfect output.
 *
 * Usage: node scripts/generatePromoPDF.mjs
 * Output: docs/promo-promotion-cbt.pdf
 */

import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "docs");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "promo-promotion-cbt.pdf");
const HTML_FILE = path.join(OUTPUT_DIR, "preview-promo.html");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

if (!fs.existsSync(HTML_FILE)) {
  console.error(`❌ HTML file not found: ${HTML_FILE}`);
  process.exit(1);
}

async function generatePDF() {
  console.log("🚀 Launching headless browser...");

  const browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Set viewport to match a phone-like card width for the promo design
  await page.setViewportSize({ width: 480, height: 800 });

  // Load the HTML file
  const fileUrl = `file://${HTML_FILE.replace(/\\/g, "/")}`;
  console.log(`📄 Loading: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: "networkidle" });

  // Wait for fonts to load
  await page.waitForTimeout(2000);

  // Get the actual card dimensions
  const cardBox = await page.evaluate(() => {
    const card = document.querySelector(".card");
    if (!card) return null;
    const rect = card.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });

  if (cardBox) {
    console.log(`📐 Card dimensions: ${cardBox.width}x${cardBox.height}px`);
  }

  // Generate PDF — size the page to fit the card exactly
  // Use a custom page size matching the card + small padding
  const padding = 40; // px padding around the card
  const pageWidthPx = (cardBox?.width || 420) + padding * 2;
  const pageHeightPx = (cardBox?.height || 700) + padding * 2;

  // Convert px to mm (96dpi standard)
  const pxToMm = 25.4 / 96;
  const pageWidthMm = pageWidthPx * pxToMm;
  const pageHeightMm = pageHeightPx * pxToMm;

  console.log(`📐 PDF page size: ${pageWidthMm.toFixed(1)}x${pageHeightMm.toFixed(1)}mm`);

  // Center the card on the page with background color
  await page.evaluate(
    ({ bg, pad }) => {
      document.body.style.margin = "0";
      document.body.style.padding = "0";
      document.body.style.background = bg;
      document.body.style.display = "flex";
      document.body.style.justifyContent = "center";
      document.body.style.alignItems = "center";
      document.body.style.minHeight = "100vh";

      // Ensure the card is centered
      const card = document.querySelector(".card");
      if (card) {
        card.style.margin = `${pad}px auto`;
      }
    },
    { bg: "#0a3d2e", pad: padding / 2 }
  );

  await page.pdf({
    path: OUTPUT_FILE,
    width: `${pageWidthMm}mm`,
    height: `${pageHeightMm}mm`,
    printBackground: true,
    margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
  });

  await browser.close();

  // Verify output
  const stats = fs.statSync(OUTPUT_FILE);
  console.log("");
  console.log("✅ Promotional PDF generated successfully!");
  console.log(`📄 Output: ${OUTPUT_FILE}`);
  console.log(`📊 Size: ${(stats.size / 1024).toFixed(1)} KB`);
  console.log(`🔗 CTA Link: https://timdasa75.github.io/Promotion-cbt-app/`);
}

generatePDF().catch((err) => {
  console.error("❌ PDF generation failed:", err);
  process.exit(1);
});
