#!/usr/bin/env node
/**
 * Generate a single-page promotional PDF for Promotion CBT App
 * Usage: node scripts/generatePromoPDF.mjs
 * Output: docs/promo-promotion-cbt.pdf
 */

import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "docs");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "promo-promotion-cbt.pdf");

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const doc = new jsPDF({
  orientation: "portrait",
  unit: "mm",
  format: "a4",
});

const WIDTH = 210;
const HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = WIDTH - MARGIN * 2;

// ============================================================
// Color Palette (Forest Green Theme)
// ============================================================
const COLORS = {
  primary: [6, 78, 59],        // #064E3B - Dark green
  primaryLight: [16, 185, 129], // #10B981 - Bright green
  accent: [52, 211, 153],       // #34D399 - Light green
  dark: [15, 23, 42],           // #0F172A - Dark navy
  white: [255, 255, 255],
  lightBg: [248, 250, 252],     // #F8FAFC
  gold: [251, 191, 36],         // #FBBF24
  text: [51, 65, 85],           // #334155
  textLight: [100, 116, 139],   // #64748B
};

// Helper functions
function setFill(r, g, b) { doc.setFillColor(r, g, b); }
function setDraw(r, g, b) { doc.setDrawColor(r, g, b); }
function setText(r, g, b) { doc.setTextColor(r, g, b); }
function drawRoundedRect(x, y, w, h, r, fill = true) { doc.roundedRect(x, y, w, h, r, r, fill ? "F" : "S"); }
function drawCircle(cx, cy, r, fill = true) { doc.circle(cx, cy, r, fill ? "F" : "S"); }

// ============================================================
// BACKGROUND
// ============================================================
setFill(...COLORS.primary);
doc.rect(0, 0, WIDTH, HEIGHT, "F");

// Decorative circles
setFill(...COLORS.primaryLight);
drawCircle(185, 25, 35);
drawCircle(25, 270, 20);

setFill(...COLORS.accent);
drawCircle(175, 250, 12);
drawCircle(35, 50, 8);

// ============================================================
// MAIN WHITE CARD
// ============================================================
setFill(...COLORS.white);
drawRoundedRect(MARGIN, 20, CONTENT_WIDTH, 257, 8);

// ============================================================
// HEADER SECTION
// ============================================================

// App Name Badge
setFill(...COLORS.primary);
drawRoundedRect(60, 30, 90, 18, 4);
setText(...COLORS.white);
doc.setFont("helvetica", "bold");
doc.setFontSize(14);
doc.text("PROMOTION CBT", WIDTH / 2, 42, { align: "center" });

// Main Headline
setText(...COLORS.dark);
doc.setFont("helvetica", "bold");
doc.setFontSize(26);
doc.text("Promotion CBT", WIDTH / 2, 65, { align: "center" });
doc.text("Practice App", WIDTH / 2, 78, { align: "center" });

// Tagline
setText(...COLORS.primary);
doc.setFontSize(11);
doc.setFont("helvetica", "normal");
doc.text("Your Gateway to Promotion Success", WIDTH / 2, 90, { align: "center" });

// Divider
setDraw(...COLORS.primaryLight);
doc.setLineWidth(0.4);
doc.line(55, 98, 155, 98);

// ============================================================
// KEY STATS (3 columns)
// ============================================================
const stats = [
  { value: "10+", label: "Core Topics" },
  { value: "500+", label: "Questions" },
  { value: "24/7", label: "Cloud Sync" },
];

stats.forEach((stat, i) => {
  const x = 50 + i * 40;
  
  setFill(...COLORS.primaryLight);
  drawCircle(x, 115, 14);
  
  setText(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(stat.value, x, 114, { align: "center" });
  
  setText(...COLORS.text);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(stat.label, x, 137, { align: "center" });
});

// ============================================================
// FEATURES GRID (2x3)
// ============================================================
const features = [
  { icon: "📚", title: "Smart Study Modes", desc: "Practice, Mock Exam, Review" },
  { icon: "📊", title: "Analytics", desc: "Heatmaps & Score Trends" },
  { icon: "🔖", title: "Bookmark & Retry", desc: "Master Difficult Questions" },
  { icon: "☁️", title: "Cloud Sync", desc: "Sync Across Devices" },
  { icon: "📱", title: "Offline Support", desc: "Study Without Internet" },
  { icon: "⭐", title: "Premium Content", desc: "All Topics & Questions" },
];

features.forEach((feat, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = MARGIN + 10 + col * (CONTENT_WIDTH / 2);
  const y = 148 + row * 28;
  
  // Card background
  setFill(...COLORS.lightBg);
  drawRoundedRect(x, y, CONTENT_WIDTH / 2 - 15, 22, 3);
  
  // Color accent
  setFill(...COLORS.primaryLight);
  doc.rect(x, y, 3, 22, "F");
  
  // Title
  setText(...COLORS.dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`${feat.icon} ${feat.title}`, x + 10, y + 9);
  
  // Description
  setText(...COLORS.textLight);
  doc.setFontSize(7);
  doc.text(feat.desc, x + 10, y + 17);
});

// ============================================================
// PRICE CARD
// ============================================================
setFill(...COLORS.gold);
drawRoundedRect(55, 240, 100, 28, 5);

setText(...COLORS.dark);
doc.setFont("helvetica", "bold");
doc.setFontSize(9);
doc.text("LAUNCH PLAN", WIDTH / 2, 248, { align: "center" });
doc.setFontSize(10);
doc.text("Monthly", WIDTH / 2, 254, { align: "center" });
doc.setFontSize(18);
doc.text("₦3,000", WIDTH / 2, 264, { align: "center" });

// ============================================================
// CTA BUTTON
// ============================================================
setFill(...COLORS.primary);
drawRoundedRect(50, 272, 110, 16, 4);

setText(...COLORS.white);
doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.text("Start Practicing Now →", WIDTH / 2, 282, { align: "center" });

// Add clickable link to the CTA button
doc.link(50, 272, 110, 16, { url: "https://timdasa75.github.io/Promotion-cbt-app/" });

// ============================================================
// FOOTER
// ============================================================
setText(...COLORS.white);
doc.setFont("helvetica", "normal");
doc.setFontSize(7);
doc.text("Available on Web  |  Works Offline  |  Free & Premium Plans", WIDTH / 2, 290, { align: "center" });

// ============================================================
// SAVE PDF
// ============================================================
const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
fs.writeFileSync(OUTPUT_FILE, pdfBuffer);

console.log("✅ Promotional PDF generated successfully!");
console.log(`📄 Output: ${OUTPUT_FILE}`);
console.log(`📊 Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
console.log(`🔗 CTA Link: https://timdasa75.github.io/Promotion-cbt-app/`);
