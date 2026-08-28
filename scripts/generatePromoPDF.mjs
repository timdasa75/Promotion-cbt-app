#!/usr/bin/env node
/**
 * Generate a promotional PDF for Promotion CBT App
 * Usage: node scripts/generatePromoPDF.mjs
 * Output: docs/promo-freebuff-cbt.pdf
 */

import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "docs");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "promo-freebuff-cbt.pdf");

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
const MARGIN = 20;
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

// ============================================================
// Helper Functions
// ============================================================
function setFill(r, g, b) {
  doc.setFillColor(r, g, b);
}

function setDraw(r, g, b) {
  doc.setDrawColor(r, g, b);
}

function setText(r, g, b) {
  doc.setTextColor(r, g, b);
}

function drawRoundedRect(x, y, w, h, r, fill = true) {
  doc.roundedRect(x, y, w, h, r, r, fill ? "F" : "S");
}

function drawCircle(cx, cy, r, fill = true) {
  doc.circle(cx, cy, r, fill ? "F" : "S");
}

// ============================================================
// PAGE 1: Hero Section
// ============================================================

// Background gradient effect (simulated with rectangles)
setFill(...COLORS.primary);
doc.rect(0, 0, WIDTH, HEIGHT, "F");

// Decorative circles
setFill(...COLORS.primaryLight);
drawCircle(180, 30, 40);
drawCircle(20, 250, 25);

setFill(...COLORS.accent);
drawCircle(170, 260, 15);
drawCircle(40, 60, 10);

// White card in center
setFill(...COLORS.white);
drawRoundedRect(MARGIN, 40, CONTENT_WIDTH, 200, 8);

// App Logo Area
setFill(...COLORS.primary);
drawRoundedRect(70, 55, 70, 25, 5);
setText(...COLORS.white);
doc.setFont("helvetica", "bold");
doc.setFontSize(16);
doc.text("FREEBUFF", 105, 71, { align: "center" });

// Main Headline
setText(...COLORS.dark);
doc.setFont("helvetica", "bold");
doc.setFontSize(28);
doc.text("Promotion CBT", WIDTH / 2, 105, { align: "center" });
doc.text("Practice App", WIDTH / 2, 118, { align: "center" });

// Subheadline
setText(...COLORS.primary);
doc.setFontSize(14);
doc.setFont("helvetica", "normal");
doc.text("Your Gateway to Promotion Success", WIDTH / 2, 135, { align: "center" });

// Divider line
setDraw(...COLORS.primaryLight);
doc.setLineWidth(0.5);
doc.line(60, 145, 150, 145);

// Key Features (3 columns)
const features = [
  { icon: "10+", label: "Core Topics" },
  { icon: "500+", label: "Practice Questions" },
  { icon: "24/7", label: "Cloud Sync" },
];

features.forEach((feat, i) => {
  const x = 45 + i * 45;
  
  setFill(...COLORS.primaryLight);
  drawCircle(x, 165, 12);
  
  setText(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(feat.icon, x, 164, { align: "center" });
  
  setText(...COLORS.text);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(feat.label, x, 185, { align: "center" });
});

// Price Tag
setFill(...COLORS.gold);
drawRoundedRect(65, 195, 80, 30, 5);

setText(...COLORS.dark);
doc.setFont("helvetica", "bold");
doc.setFontSize(12);
doc.text("Starting at", 105, 207, { align: "center" });
doc.setFontSize(16);
doc.text("N3,000/month", 105, 218, { align: "center" });

// CTA Button
setFill(...COLORS.primary);
drawRoundedRect(55, 240, 100, 18, 4);

setText(...COLORS.white);
doc.setFont("helvetica", "bold");
doc.setFontSize(12);
doc.text("Download Now", 105, 252, { align: "center" });

// Add clickable link to the button
doc.link(55, 240, 100, 18, { url: "https://timdasa75.github.io/Promotion-cbt-app/" });

// Footer on page 1
setText(...COLORS.white);
doc.setFont("helvetica", "normal");
doc.setFontSize(8);
doc.text("Available on Web  |  Works Offline  |  Free & Premium Plans", WIDTH / 2, 275, { align: "center" });

// ============================================================
// PAGE 2: Features & Benefits
// ============================================================
doc.addPage();

// Header bar
setFill(...COLORS.primary);
doc.rect(0, 0, WIDTH, 40, "F");

setText(...COLORS.white);
doc.setFont("helvetica", "bold");
doc.setFontSize(20);
doc.text("Why Choose Freebuff CBT?", WIDTH / 2, 26, { align: "center" });

// Features Grid
const featureList = [
  {
    title: "Smart Study Modes",
    desc: "Practice, Mock Exam, and Review modes adapt to your learning style",
    color: COLORS.primary,
  },
  {
    title: "Detailed Analytics",
    desc: "Track progress with heatmaps, mistake analysis, and score trends",
    color: COLORS.primaryLight,
  },
  {
    title: "Bookmark & Retry",
    desc: "Save difficult questions and retry your mistakes until mastered",
    color: COLORS.accent,
  },
  {
    title: "Cloud Sync",
    desc: "Your progress syncs across all devices automatically",
    color: COLORS.primary,
  },
  {
    title: "Offline Support",
    desc: "Study anywhere - the app works without internet connection",
    color: COLORS.primaryLight,
  },
  {
    title: "Premium Content",
    desc: "Access all 10+ topics with hundreds of exam-standard questions",
    color: COLORS.accent,
  },
];

featureList.forEach((feat, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = MARGIN + col * (CONTENT_WIDTH / 2 + 5);
  const y = 55 + row * 55;
  
  // Card background
  setFill(...COLORS.lightBg);
  drawRoundedRect(x, y, CONTENT_WIDTH / 2 - 5, 45, 5);
  
  // Color accent bar
  setFill(...feat.color);
  doc.rect(x, y, 4, 45, "F");
  
  // Title
  setText(...COLORS.dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(feat.title, x + 12, y + 15);
  
  // Description
  setText(...COLORS.textLight);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(feat.desc, CONTENT_WIDTH / 2 - 25);
  doc.text(lines, x + 12, y + 25);
});

// CTA Section
setFill(...COLORS.primary);
drawRoundedRect(MARGIN, 230, CONTENT_WIDTH, 45, 8);

setText(...COLORS.white);
doc.setFont("helvetica", "bold");
doc.setFontSize(14);
doc.text("Start Your Promotion Journey Today!", WIDTH / 2, 248, { align: "center" });

doc.setFont("helvetica", "normal");
doc.setFontSize(10);
doc.text("Visit: timdasa75.github.io/Promotion-cbt-app", WIDTH / 2, 258, { align: "center" });

// Add clickable link
doc.link(MARGIN, 230, CONTENT_WIDTH, 45, { url: "https://timdasa75.github.io/Promotion-cbt-app/" });

// Footer
setText(...COLORS.textLight);
doc.setFontSize(8);
doc.text("Freebuff CBT - Your Path to Promotion Success", WIDTH / 2, 285, { align: "center" });

// ============================================================
// Save PDF
// ============================================================
const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
fs.writeFileSync(OUTPUT_FILE, pdfBuffer);

console.log("✅ Promotional PDF generated successfully!");
console.log(`📄 Output: ${OUTPUT_FILE}`);
console.log(`📊 Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
console.log(`🔗 CTA Link: https://timdasa75.github.io/Promotion-cbt-app/`);
