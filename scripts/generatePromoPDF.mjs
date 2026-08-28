#!/usr/bin/env node
/**
 * Generate a professional single-page promotional PDF for Promotion CBT
 * Usage: node scripts/generatePromoPDF.mjs
 * Output: docs/promo-promotion-cbt.pdf
 */

import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "docs");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "promo-promotion-cbt.pdf");

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
// Color Palette
// ============================================================
const C = {
  darkGreen: [10, 61, 46],       // #0a3d2e
  midGreen: [15, 90, 64],        // #0f5a40
  brightGreen: [16, 185, 129],   // #10B981
  accent: [52, 211, 153],        // #34D399
  ctaGreen: [5, 150, 105],       // #059669
  white: [255, 255, 255],
  whiteAlpha: (a) => [255, 255, 255, a],
  red: [220, 38, 38],            // #DC2626
  dark: [15, 23, 42],            // #0F172A
};

// Helper functions
function setFill(r, g, b, a = 1) {
  if (a < 1) doc.setFillColor(r, g, b, a);
  else doc.setFillColor(r, g, b);
}
function setText(r, g, b) { doc.setTextColor(r, g, b); }
function drawRoundedRect(x, y, w, h, r, fill = true) {
  doc.roundedRect(x, y, w, h, r, r, fill ? "F" : "S");
}
function drawCircle(cx, cy, r, fill = true) {
  doc.circle(cx, cy, r, fill ? "F" : "S");
}

// ============================================================
// BACKGROUND - Dark green gradient (simulated with rectangles)
// ============================================================
setFill(...C.darkGreen);
doc.rect(0, 0, WIDTH, HEIGHT, "F");

// Gradient overlay (lighter green in center)
setFill(...C.midGreen);
doc.rect(0, 80, WIDTH, 120, "F");

// Decorative circles (subtle)
setFill(16, 185, 129, 0.08);
doc.setGState(new doc.GState({ opacity: 0.08 }));
drawCircle(170, 30, 60);
drawCircle(40, 260, 40);
doc.setGState(new doc.GState({ opacity: 1 }));

// ============================================================
// HEADER
// ============================================================

// Logo icon background
setFill(255, 255, 255, 0.12);
drawRoundedRect(MARGIN, 28, 18, 18, 4);

// Logo icon (clipboard emoji approximation)
setText(...C.white);
doc.setFont("helvetica", "bold");
doc.setFontSize(14);
doc.text("📋", MARGIN + 9, 40, { align: "center" });

// Header text
setText(255, 255, 255, 0.6);
doc.setFont("helvetica", "normal");
doc.setFontSize(8);
doc.text("NIGERIAN FEDERAL CIVIL SERVICE", MARGIN + 24, 34);

setText(...C.white);
doc.setFont("helvetica", "bold");
doc.setFontSize(14);
doc.text("Promotion CBT", MARGIN + 24, 42);

// ============================================================
// BADGE
// ============================================================
setFill(16, 185, 129, 0.2);
drawRoundedRect(MARGIN, 52, 60, 10, 5);

setText(...C.accent);
doc.setFont("helvetica", "bold");
doc.setFontSize(7);
doc.text("DIRECTORATE LEVEL EXAM PREP", MARGIN + 30, 58.5, { align: "center" });

// ============================================================
// HEADLINE
// ============================================================
setText(...C.white);
doc.setFont("helvetica", "bold");
doc.setFontSize(22);

const headlineLines = [
  "Ace Your Directorate",
  "Level Promotion Exam",
  "with"
];
let yPos = 78;
headlineLines.forEach(line => {
  doc.text(line, MARGIN, yPos);
  yPos += 8;
});

// "Confidence" in green
setText(...C.accent);
doc.setFontSize(22);
doc.text("Confidence", MARGIN, yPos);

// ============================================================
// DESCRIPTION
// ============================================================
setText(255, 255, 255, 0.7);
doc.setFont("helvetica", "normal");
doc.setFontSize(9);

const descLines = doc.splitTextToSize(
  "Purpose-built for GL 14 and above — the only CBT practice platform focused exclusively on Directorate Level promotion exams in the Nigerian Federal Civil Service.",
  CONTENT_WIDTH - 10
);
doc.text(descLines, MARGIN + 5, 112);

// ============================================================
// LEVEL BADGE
// ============================================================
const levelY = 130;
setFill(220, 38, 38, 0.15);
drawRoundedRect(MARGIN, levelY, CONTENT_WIDTH, 18, 6);

// Red circle
setFill(...C.red);
drawCircle(MARGIN + 10, levelY + 9, 6);

setText(...C.white);
doc.setFont("helvetica", "bold");
doc.setFontSize(8);
doc.text("🎯", MARGIN + 10, levelY + 11, { align: "center" });

// Level text
setText(...C.white);
doc.setFont("helvetica", "bold");
doc.setFontSize(9);
doc.text("Directorate Level (GL 14 & Above)", MARGIN + 20, levelY + 8);

setText(255, 255, 255, 0.6);
doc.setFont("helvetica", "normal");
doc.setFontSize(7);
doc.text("Federal Civil Service Commission Promotion Exams", MARGIN + 20, levelY + 14);

// ============================================================
// FEATURES GRID (2x2)
// ============================================================
const features = [
  { icon: "📚", title: "10 Core Topics", desc: "PSR, FR, Constitution & more" },
  { icon: "⏱️", title: "Timed Mock Exams", desc: "Real CBT simulation" },
  { icon: "📊", title: "Performance Analytics", desc: "Know your weak spots" },
  { icon: "🔄", title: "Spaced Practice", desc: "Reinforce what sticks" },
];

const gridStartY = 156;
const cardW = (CONTENT_WIDTH - 8) / 2;
const cardH = 22;
const gapX = 8;
const gapY = 8;

features.forEach((feat, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = MARGIN + col * (cardW + gapX);
  const y = gridStartY + row * (cardH + gapY);
  
  // Card background
  setFill(255, 255, 255, 0.08);
  drawRoundedRect(x, y, cardW, cardH, 5);
  
  // Icon
  setText(...C.white);
  doc.setFontSize(14);
  doc.text(feat.icon, x + 8, y + 10);
  
  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(feat.title, x + 24, y + 9);
  
  // Description
  setText(255, 255, 255, 0.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(feat.desc, x + 24, y + 15);
});

// ============================================================
// CTA BUTTON
// ============================================================
const ctaY = 212;
setFill(...C.brightGreen);
drawRoundedRect(MARGIN, ctaY, CONTENT_WIDTH, 16, 6);

setText(...C.white);
doc.setFont("helvetica", "bold");
doc.setFontSize(12);
doc.text("Start Practicing Free →", WIDTH / 2, ctaY + 10.5, { align: "center" });

// Add clickable link
doc.link(MARGIN, ctaY, CONTENT_WIDTH, 16, { url: "https://timdasa75.github.io/Promotion-cbt-app/" });

// ============================================================
// URL
// ============================================================
setText(255, 255, 255, 0.5);
doc.setFont("helvetica", "normal");
doc.setFontSize(8);
doc.text("timdasa75.github.io/Promotion-cbt-app", WIDTH / 2, ctaY + 24, { align: "center" });

// ============================================================
// STATS BAR
// ============================================================
const statsY = 248;
setFill(0, 0, 0, 0.2);
drawRoundedRect(MARGIN, statsY, CONTENT_WIDTH, 22, 6);

const stats = [
  { value: "10+", label: "CORE TOPICS" },
  { value: "3", label: "STUDY MODES" },
  { value: "₦3,000", label: "PREMIUM/MONTH" },
  { value: "Free", label: "TO START" },
];

const statWidth = CONTENT_WIDTH / 4;
stats.forEach((stat, i) => {
  const x = MARGIN + i * statWidth + statWidth / 2;
  
  // Value
  setText(...C.accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(stat.value, x, statsY + 10, { align: "center" });
  
  // Label
  setText(255, 255, 255, 0.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.text(stat.label, x, statsY + 17, { align: "center" });
});

// ============================================================
// SAVE PDF
// ============================================================
const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
fs.writeFileSync(OUTPUT_FILE, pdfBuffer);

console.log("✅ Promotional PDF generated successfully!");
console.log(`📄 Output: ${OUTPUT_FILE}`);
console.log(`📊 Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
console.log(`🔗 CTA Link: https://timdasa75.github.io/Promotion-cbt-app/`);
