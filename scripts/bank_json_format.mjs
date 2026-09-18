#!/usr/bin/env node
// The bank files do NOT share one formatting convention, so re-serialising with a fixed
// style would reformat whole files. Detect each file's own style (EOL, indent, trailing
// newline) and prove the round-trip is byte-identical before any script relies on it.
import fs from "node:fs";
import path from "node:path";

const SKIP = new Set(["topics.json", "exam_templates.json", "gl_band_weights.json"]);

export function detectFormat(raw) {
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  // indent = leading whitespace of the first line that is indented
  let indent = " ";
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([ \t]+)\S/);
    if (m) { indent = m[1]; break; }
  }
  const trailingNewline = /\r?\n$/.test(raw);
  return { eol, indent, trailingNewline };
}

export function serializeLike(raw, obj) {
  const { eol, indent, trailingNewline } = detectFormat(raw);
  let out = JSON.stringify(obj, null, indent);
  if (eol !== "\n") out = out.replace(/\n/g, eol);
  if (trailingNewline) out += eol;
  return out;
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` || process.argv[1].endsWith("bank_json_format.mjs")) {
  let allOk = true;
  for (const f of fs.readdirSync("data").filter((f) => f.endsWith(".json"))) {
    const raw = fs.readFileSync(path.join("data", f), "utf8");
    const fmt = detectFormat(raw);
    const round = serializeLike(raw, JSON.parse(raw));
    const ok = raw === round;
    if (!ok) allOk = false;
    console.log(
      `${f.padEnd(32)} eol=${fmt.eol === "\r\n" ? "CRLF" : "LF  "} indent=${JSON.stringify(fmt.indent).padEnd(4)} trailingNL=${fmt.trailingNewline ? "y" : "n"}  round-trip=${ok ? "IDENTICAL" : "DIFFERS"}${ok ? "" : ` (${raw.length} vs ${round.length})`}`
    );
  }
  console.log(`\n${allOk ? "ALL byte-identical" : "SOME FILES DIFFER — do not re-serialise blindly"}`);
}
