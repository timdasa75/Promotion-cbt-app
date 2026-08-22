import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ICT_FILE = path.join(ROOT_DIR, "data", "ict_digital.json");

const ictPayload = JSON.parse(fs.readFileSync(ICT_FILE, "utf8"));

for (const sub of ictPayload.subcategories) {
  if (!Array.isArray(sub.questions)) continue;
  for (const q of sub.questions) {
    if (q.id === "ict_mod_2026_109") {
      const correctText = q.options[q.correct];
      const newOpts = [
        "TLS 1.3 (Transport Layer Security / HTTPS).",
        "Plain FTP (File Transfer Protocol).",
        "Unencrypted Telnet Remote Terminal Protocol.",
        "Simple Network Management Protocol (SNMP)."
      ];
      q.options = newOpts;
      q.correct = newOpts.indexOf(correctText);
    }
    if (q.id === "ict_mod_2026_140") {
      const correctText = q.options[q.correct];
      const newOpts = [
        "OCSP (Online Certificate Status Protocol).",
        "Domain Name System (DNS) Resolver Server.",
        "Dynamic Host Configuration Protocol (DHCP).",
        "Simple Network Management Protocol (SNMP)."
      ];
      q.options = newOpts;
      q.correct = newOpts.indexOf(correctText);
    }
  }
}

fs.writeFileSync(ICT_FILE, JSON.stringify(ictPayload, null, 2) + "\n", "utf8");
console.log("Updated options for ict_mod_2026_109 and ict_mod_2026_140.");
