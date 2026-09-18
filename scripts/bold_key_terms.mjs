#!/usr/bin/env node
// Bold key terms/concepts in question STEMS (options and explanations untouched).
//
// What gets bolded:
//   1. Statute/rule references: "PSR 100424", "PPA Section 16(3)", "FR 1205", "Chapter 10",
//      "Section 15", "Financial Regulations", "Public Procurement Act", "Public Service Rules",
//      "Constitution" (+ "1999 Constitution")
//   2. Curated domain terms, defined per bank (see TERMS below) — the concepts each bank tests.
//   3. Quoted terms: "the Vote Book" → "the **Vote Book**" (inner quotes stay untouched).
//   4. Keyword-derived multi-word terms (q.keywords) — only phrases of >= 2 words that literally
//      appear in the stem, so they are clearly the concept under test.
//
// Safety rules (avoid making stems noisy):
//   - Never touch a stem that already contains ** or __ (idempotency: we don't re-parse marked text).
//   - At most 2 bold spans per stem; prefer earlier matches.
//   - Skip stems whose focus is the answer itself (options are single words / <= 2 words per option),
//     where bolding a stem word would leak the answer.
//   - Never bold a term that appears in the options (stem-only emphasis, no leakage).
//   - Minimum 2 characters; no bolding inside longer words (word-boundary aware).
//
// Byte-level editing: stems are replaced via their exact JSON-encoded representation, which is
// verified unique in the raw file (the banks' escaping matches JSON.stringify output; the few
// duplicate stems are skipped). No JSON re-serialization => no formatting churn.
//
// Usage:
//   node scripts/bold_key_terms.mjs --dry           # report only
//   node scripts/bold_key_terms.mjs --dry -v 20     # show up to 20 before/after samples per bank
//   node scripts/bold_key_terms.mjs                 # apply
import fs from "node:fs";

const DRY = process.argv.includes("--dry");
const vIdx = process.argv.indexOf("-v");
const VERBOSE = vIdx !== -1 ? Math.max(1, Number(process.argv[vIdx + 1] || 10)) : 0;

const BANKS = [
  "civil_service_ethics", "constitutional_foi", "core_competencies",
  "financial_regulations", "general_current_affairs", "ict_digital",
  "leadership_negotiation", "policy_analysis", "psr_rules", "public_procurement",
];

// ---------------------------------------------------------------- term lists
// Cross-bank statute references (bold the whole phrase; word-boundary aware).
const STATUTE_PATTERNS = [
  /\bPSR\s+\d{5,6}\b/g,                                    // PSR 100424
  /\bPPA\s+(?:Section\s+)?\d+(?:\(\d+\))?/g,               // PPA 16(3) / PPA Section 16
  /\bFR\s+\d{3,4}\b/g,                                     // FR 1205
  /\bFinancial Regulations?\b/g,
  /\bPublic Procurement Act\b/g,
  /\bPublic Service Rules?\b/g,
  /\b1999 Constitution\b/g,
];

// Curated per-bank domain terms (case-sensitive where acronym, else sentence-case variants).
const TERMS = {
  psr_rules: [
    "Federal Civil Service Commission", "Office of the Head of Service", "Head of the Civil Service",
    "Federal Executive Council", "Civil Service", "Public Service", "Extra-Ministerial",
    "Permanent Secretary", "Probation", "Incremental date", "Increment",
    "A-incorporated", "Disciplinary", "Serious Misconduct", "Misconduct",
    "Conflict of interest", "Oath of Secrecy", "Oath of Office", "Declaration of Assets",
    "Code of Conduct", "Confirmation", "Retirement", "Pension", "Gratuity", "Gratuities",
    "Leave", "Transfer", "Secondment", "Promotion", "Appointment",
  ],
  financial_regulations: [
    "Consolidated Revenue Fund", "CRF", "Vote Book", "Virement", "Appropriation",
    "Supplementary (?:Appropriation )?Budget", "Fiscal year", "Expenditure control",
    "Treasury Single Account", "TSA", "Government Integrated Financial Management",
    "GIFMIS", "Recurrent Expenditure", "Capital Expenditure", "Statutory Allocation",
    "Internal Audit", "Auditor-General", "Public Accounts Committee", "Imprest",
    "Charge(?:s|d)? on the Consolidated", "Board of Survey", "Loss of (?:money|funds|stores)",
  ],
  public_procurement: [
    "Bureau of Public Procurement", "BPP", "Procurement Planning Committee", "PPC",
    "Procurement Unit", "Procurement Journal", "National Council on Public Procurement",
    "Open Competitive Bidding", "Selective Bidding", "Restricted Bidding", "Two-Stage (?:Tender|Bidding)",
    "Direct Contracting", "Emergency Procurement", "Force Account", "Evaluation Committee",
    "Tender(?:s| Board|s Board)?", "Mobilization Fee", "Performance (?:Bond|Guarantee)",
    "Advance Payment Guarantee", "Certificate of No Objection", "Due Process",
    "Procuring Entit(?:y|ies)", "Bid(?:s|ding)? Security", "Bid Opening",
  ],
  constitutional_foi: [
    "Constitution", "Fundamental Rights", "Freedom of Information", "FOI Act", "Separation of Powers",
    "Rule of Law", "Federal Character", "Exclusive Legislative List", "Concurrent Legislative List",
    "Residual Legislative List", "National Assembly", "Senate", "House of Representatives",
    "Judicial(?:ly)? Review", "Constituency", "Code of Conduct Bureau", "Code of Conduct Tribunal",
    "Civil Service", "Public Service", "Revenue Mobilization", "Fiscal (?:Federalism|Commission)",
    "Supreme Court", "Court of Appeal", "Federal High Court", "State House of Assembly",
  ],
  civil_service_ethics: [
    "Code of Conduct", "Conflict of interest", "Political (?:Neutrality|neutrality)",
    "Anonymity", "Integrity", "Accountability", "Transparency", "Impartiality",
    "Merit(?:ocracy|-based)?", "Due Process", "Whistle-?blow(?:er|ing)", "Gifts? and Donations",
    "Asset Declaration", "Oath of (?:Office|Secrecy|Allegiance)", "Civil Service Handbook",
    "Anti-Corruption", "Probity", "Public Trust", "Servant Leadership", "Open Government Partnership",
    "OGP", "National Ethics", "Discipline Policy", "Client Charter", "Service Charter",
    "SERVICOM", "Customer Satisfaction", "CSC Handbook",
  ],
  core_competencies: [
    "Strategic (?:Thinking|Planning)", "Change Management", "Emotional Intelligence",
    "Team(?:work| Building)", "Stakeholder Management", "Performance Management",
    "Result(?:s|-)Orientation", "Digital Literacy", "Continuous Learning", "Effective Communication",
    "Time Management", "Problem Solving", "Decision Making", "Core Competenc(?:y|ies)",
    "Creative Thinking", "Attention to Detail", "Interpersonal Skills", "Leadership",
  ],
  leadership_negotiation: [
    "Negotiation", "Distributive Negotiation", "Integrative Negotiation", "BATNA",
    "Collective Bargaining", "Conflict Resolution", "Transformational Leadership",
    "Transactional Leadership", "Servant Leadership", "Situational Leadership",
    "Emotional Intelligence", "Mediation", "Arbitration", "Stakeholder Engagement",
    "Change Management", "Delegation", "Motivation", "Mutual Gains", "Win-Win",
    "Zone of Possible Agreement", "ZOPA",
  ],
  policy_analysis: [
    "Policy Cycle", "Agenda Setting", "Policy Formulation", "Policy Implementation",
    "Policy Evaluation", "Monitoring and Evaluation", "M&E", "Evidence-Based",
    "Stakeholder Analysis", "Cost-Benefit Analysis", "SWOT", "Feasibility",
    "Policy Instrument", "Policy Brief", "Logic Model", "Theory of Change",
    "Impact Assessment", "Policy Analysis", "Public Policy",
  ],
  ict_digital: [
    "ICT", "Information and Communication Technology", "E-Government", "e-Government", "Digital Transformation", "Cloud Computing",
    "Cybersecurity", "Data Protection", "NDPR", "NDPA", "NITDA", "Galaxy Backbone",
    "Digital Literacy", "Digital Inclusion", "Artificial Intelligence", "Machine Learning",
    "Broadband", "Data Centre", "Enterprise Architecture", "ICT Policy", "Information Security",
    "Open Source", "Digital Services", "E-Procurement", "Automation", "Digitization",
  ],
  general_current_affairs: [
    "NNPC", "CBN", "Central Bank of Nigeria", "Federal Executive Council", "ECOWAS",
    "African Union", "United Nations", "National Assembly", "Senate President",
    "Chief Justice", "INEC", "Revenue Allocation", "Federation Account", "Minimum Wage",
  ],
};

// Grade-level references (kept separate because they are regex fragments, not literals).
const GRADE_PATTERNS = [
  /\bGL\.?\s?\d{2}\b/g,          // GL.07 / GL 07
  /\bGrade Level \d{2}\b/g,       // Grade Level 12
];

const TERM_SOURCE = new Map(BANKS.map((b) => [b, TERMS[b] || []]));

// ---------------------------------------------------------------- helpers
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Split terms into all-caps acronyms (case-sensitive: avoid matching "crf" inside words)
// and everything else (case-insensitive so "Vote Book" matches "vote book").
function buildTermRegexes(bank) {
  const terms = TERM_SOURCE.get(bank);
  if (!terms.length) return [];
  const acronyms = terms.filter((t) => /^[A-Z0-9&.\-]+$/.test(t));
  const words = terms.filter((t) => !/^[A-Z0-9&.\-]+$/.test(t));
  const out = [];
  if (acronyms.length) out.push(new RegExp(`(?<![\\w*])(?:${acronyms.map(esc).join("|")})(?![\\w*])`, "g"));
  if (words.length) out.push(new RegExp(`(?<![\\w*])(?:${words.map(esc).join("|")})(?![\\w*])`, "gi"));
  return out;
}

const QUOTED = /"([^"]{3,60})"/g;

function quotedSpans(stem) {
  const spans = [];
  QUOTED.lastIndex = 0;
  for (const m of stem.matchAll(QUOTED)) {
    // Bold the inner text, leaving the quote marks outside the emphasis.
    const start = m.index + 1, end = m.index + 1 + m[1].length;
    spans.push({ start, end, text: m[1], rank: 1 });
  }
  return spans;
}

function overlap(a, b) {
  return a.start < b.end && b.start < a.end;
}

// Bold at most N non-overlapping matches, earliest first.
function boldMatches(text, matches, max = 2) {
  const chosen = [];
  for (const m of matches) {
    if (chosen.length >= max) break;
    if (chosen.some((c) => overlap(c, m))) continue;
    chosen.push(m);
  }
  chosen.sort((x, y) => y.start - x.start);
  let out = text;
  for (const c of chosen) out = out.slice(0, c.start) + "**" + c.text + "**" + out.slice(c.end);
  return out;
}

// Decide whether the stem's focus is the answer itself (options too short to risk leaking).
function optionsTooShort(q) {
  const opts = Array.isArray(q.options) ? q.options : [];
  return opts.length > 0 && opts.every((o) => typeof o === "string" && o.trim().split(/\s+/).length <= 2);
}

function keywordSpans(q) {
  const spans = [];
  const kws = Array.isArray(q.keywords) ? q.keywords : [];
  for (const kwRaw of kws) {
    if (typeof kwRaw !== "string") continue;
    const kw = kwRaw.trim().replace(/\s+/g, " ");
    // Only multi-word phrases, 4..48 chars, so generic one-word keywords don't blanket-bold.
    if (kw.split(" ").length < 2 || kw.length < 4 || kw.length > 48) continue;
    if (/\d/.test(kw)) continue; // rule numbers handled by statute pass
    const re = new RegExp(`(?<![\\w*])${esc(kw)}(?![\\w*])`, "g");
    for (const m of q.question.matchAll(re)) spans.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
  }
  return spans;
}

function planBolding(q, bank) {
  const stem = q.question;
  if (/\*\*|__/.test(stem)) return null;               // already emphasized — leave alone
  if (optionsTooShort(q)) return null;                  // stem focus = the answer; don't leak

  // Options text (lowercased) — never bold anything the options themselves contain.
  const optText = (Array.isArray(q.options) ? q.options : [])
    .map((o) => String(o || "").toLowerCase()).join(" \n ");

  const candidates = [];

  // 1. Statutes and grade levels — always eligible (they are references, not answers).
  for (const re of [...STATUTE_PATTERNS, ...GRADE_PATTERNS]) {
    re.lastIndex = 0;
    for (const m of stem.matchAll(re)) candidates.push({ start: m.index, end: m.index + m[0].length, text: m[0], rank: 0 });
  }

  // 2. Quoted terms — the question explicitly quotes the concept (bold inside the quotes).
  candidates.push(...quotedSpans(stem));

  // 3. Curated domain terms.
  for (const termRe of buildTermRegexes(bank)) {
    termRe.lastIndex = 0;
    for (const m of stem.matchAll(termRe)) candidates.push({ start: m.index, end: m.index + m[0].length, text: m[0], rank: 2 });
  }

  // 4. Keyword-derived phrases.
  for (const s of keywordSpans(q)) candidates.push({ ...s, rank: 3 });

  // Filter: drop candidates whose text appears in options (leak guard); dedupe by position.
  const seen = new Set();
  const kept = [];
  for (const c of candidates.sort((a, b) => a.rank - b.rank || a.start - b.start)) {
    if (optText.includes(c.text.toLowerCase())) continue;
    if (c.text.trim().length < 3) continue;
    const key = `${c.start}:${c.end}`;
    if (seen.has(key)) continue;
    // Skip if inside an already-kept span (overlap handled later, but exact dup positions skip).
    seen.add(key);
    kept.push(c);
  }
  if (!kept.length) return null;
  const out = boldMatches(stem, kept, 2);
  if (out === stem) return null;
  return out;
}

// ---------------------------------------------------------------- main
for (const bank of BANKS) {
  const path = `data/${bank}.json`;
  const raw = fs.readFileSync(path, "utf8");
  const parsed = JSON.parse(raw);

  let applied = 0, skippedDup = 0, skippedMarked = 0, skippedShort = 0, noCandidate = 0, skippedNested = 0, malformed = 0, samples = [];
  let nextRaw = raw;

  for (const sub of parsed.subcategories) {
    if (!Array.isArray(sub.questions)) { skippedNested++; console.log(`  !! ${sub.id}: questions is not an array (${typeof sub.questions}) — subcategory skipped`); continue; }
    for (const q of sub.questions) {
      if (!q || typeof q.question !== "string") { malformed++; continue; }
      const next = planBolding(q, bank);
      if (!next) {
        if (/\*\*|__/.test(q.question)) skippedMarked++;
        else if (optionsTooShort(q)) skippedShort++;
        else noCandidate++;
        continue;
      }
      const encOld = JSON.stringify(q.question);
      const encNew = JSON.stringify(next);
      const n = nextRaw.split(encOld).length - 1;
      if (n !== 1) { skippedDup++; continue; }
      nextRaw = nextRaw.replace(encOld, encNew);
      applied++;
      if (samples.length < VERBOSE) samples.push({ id: q.id, before: q.question, after: next });
    }
  }

  if (!DRY && applied > 0) {
    fs.writeFileSync(path, nextRaw);
  }
  console.log(`${bank.padEnd(26)} bolded=${String(applied).padStart(4)} alreadyMarked=${String(skippedMarked).padStart(4)} shortOpts=${String(skippedShort).padStart(4)} noCandidate=${String(noCandidate).padStart(4)} dupStem=${skippedDup} nested=${skippedNested} malformed=${malformed} ${DRY ? "(dry)" : "WRITTEN"}`);
  for (const s of samples) {
    console.log(`  --- ${s.id}`);
    console.log(`  before: ${s.before}`);
    console.log(`  after : ${s.after}`);
  }
  if (applied > 0 && !DRY) {
    // Post-write sanity: file must still parse and round-trip to the same question count.
    const re = JSON.parse(fs.readFileSync(path, "utf8"));
    const cnt = re.subcategories.reduce((a, s) => a + s.questions.length, 0);
    const cntOld = parsed.subcategories.reduce((a, s) => a + s.questions.length, 0);
    if (cnt !== cntOld) throw new Error(`${bank}: question count changed ${cntOld} -> ${cnt}`);
  }
}
console.log(DRY ? "\ndry run — no files written" : "\ndone — files written");
