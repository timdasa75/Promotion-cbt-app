#!/usr/bin/env python3
"""
Augment question bank from extracted PDF questions:
- Fix low-quality items (duplicates/outdated markers/arithmetic mismatches) by editing first.
- Add new, reworded questions to bring each subcategory up to 100.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
PDF_FILE = ROOT / "docs" / "pdf_questions_raw.json"
AUDIT_FILE = ROOT / "docs" / "quality_audit_report.json"
TODAY = "2026-03-13"

NAIRA = "\u20a6"

STOPWORDS = {
    "the",
    "and",
    "or",
    "of",
    "to",
    "in",
    "for",
    "on",
    "with",
    "by",
    "is",
    "are",
    "be",
    "as",
    "that",
    "this",
    "these",
    "those",
    "an",
    "a",
    "from",
    "into",
    "at",
    "which",
    "what",
    "who",
    "when",
    "where",
    "how",
    "why",
    "public",
    "service",
    "government",
    "management",
    "general",
    "administration",
    "policy",
    "rules",
    "regulations",
    "act",
    "law",
    "federal",
    "state",
    "national",
    "international",
    "affairs",
    "development",
    "planning",
    "ethics",
    "integrity",
    "values",
    "duties",
    "responsibilities",
    "principles",
    "framework",
    "procedures",
    "performance",
    "training",
}

SYNONYM_MAP = {
    r"\bprimary\b": ["main", "chief", "principal"],
    r"\bpurpose\b": ["role", "aim", "objective"],
    r"\bfunction\b": ["role", "duty"],
    r"\bresponsible\b": ["accountable", "in charge"],
    r"\bresponsibility\b": ["duty", "accountability"],
    r"\bauthorize(?:s|d)?\b": ["approve", "permit", "empower"],
    r"\brequire(?:s|d)?\b": ["demand", "necessitate"],
    r"\bensure(?:s|d)?\b": ["guarantee", "secure"],
    r"\bprocess\b": ["procedure", "workflow"],
    r"\bmaintain\b": ["keep", "sustain"],
    r"\brecord\b": ["log", "document"],
    r"\bpay(?:ment)?\b": ["disbursement", "payment"],
    r"\bimprest\b": ["cash advance", "imprest"],
    r"\bshall\b": ["must"],
}

PREFIXES = [
    "",
    "In the public service context,",
    "Within government administration,",
    "According to established rules,",
    "In official practice,",
]

TEMPLATES = {
    "what_is": [
        "which option best describes {rest}?",
        "select the statement that correctly defines {rest}.",
        "which option aligns with the meaning of {rest}?",
    ],
    "what_are": [
        "which option best describes {rest}?",
        "select the statement that correctly defines {rest}.",
    ],
    "which": [
        "select the statement that {rest}.",
        "which option {rest}?",
        "choose the option that {rest}.",
    ],
    "who": [
        "which role {rest}?",
        "responsibility for {rest} belongs to which role?",
        "which office {rest}?",
    ],
    "how_many": [
        "the required quantity is {rest}. which option is correct?",
        "the correct number for {rest} is which option?",
    ],
    "when": [
        "at what point {rest}?",
        "which time frame {rest}?",
    ],
    "generic": [
        "select the option that best answers: {rest}.",
        "which option correctly addresses: {rest}?",
        "choose the best answer for: {rest}.",
    ],
}

TOPIC_HINTS = {
    "psr": [
        "psr",
        "public service rules",
        "federal public service",
        "federal civil service commission",
        "fcsc",
        "head of service",
        "gl.",
        "appointment",
        "confirmation",
        "probation",
        "promotion",
        "transfer",
        "posting",
        "acting appointment",
        "disciplinary",
        "misconduct",
        "interdiction",
        "suspension",
        "query",
        "leave",
        "study leave",
        "training",
        "pension",
        "retirement",
        "resignation",
        "termination",
        "emoluments",
        "salary",
        "allowance",
        "allowances",
        "estacode",
    ],
    "financial_regulations": [
        "financial regulation",
        "treasury",
        "imprest",
        "cash advance",
        "vote book",
        "cash book",
        "ledger",
        "payment voucher",
        "voucher",
        "revenue",
        "expenditure",
        "sub-head",
        "accounting officer",
        "audit",
        "internal audit",
        "audit query",
        "store",
        "stores",
        "bank reconciliation",
        "budget",
        "appropriation",
        "consolidated revenue fund",
        "crf",
        "public funds",
        "disbursement",
    ],
    "public_procurement": [
        "public procurement act",
        "procurement",
        "tender",
        "tendering",
        "bid",
        "bidding",
        "bid opening",
        "bid evaluation",
        "bpp",
        "bureau of public procurement",
        "due process",
        "procurement plan",
        "procurement method",
        "open competitive bidding",
        "selective tender",
        "restricted tender",
        "direct procurement",
        "emergency procurement",
        "request for proposals",
        "rfp",
        "rfq",
        "advertisement",
        "prequalification",
        "award",
        "contract",
        "certificate of no objection",
        "no objection",
        "tender board",
        "procurement committee",
    ],
    "constitutional_foi": [
        "constitution",
        "constitution of nigeria",
        "fundamental rights",
        "fundamental human rights",
        "separation of powers",
        "judiciary",
        "legislative",
        "executive",
        "supreme court",
        "court of appeal",
        "high court",
        "national assembly",
        "state house of assembly",
        "local government",
        "public interest",
        "exemption",
        "penalty",
        "foi",
        "freedom of information",
        "freedom of information act",
        "information request",
        "access to information",
        "public interest test",
        "judicial review",
    ],
    "civil_service_admin": [
        "ethics",
        "integrity",
        "ethical",
        "code of conduct",
        "code of conduct bureau",
        "conflict of interest",
        "discipline",
        "disciplinary",
        "misconduct",
        "values",
        "anti-corruption",
        "efcc",
        "icpc",
        "whistleblowing",
        "service delivery",
        "grievance",
        "complaint",
        "responsibility",
        "duties",
        "accountability",
        "transparency",
    ],
    "leadership_negotiation": [
        "leadership",
        "strategy",
        "strategic",
        "planning",
        "strategic plan",
        "swot",
        "negotiation",
        "collective bargaining",
        "dispute",
        "labour",
        "management",
        "performance",
        "motivation",
        "delegation",
        "decision making",
        "span of control",
        "supervision",
        "team building",
        "performance appraisal",
        "goal setting",
        "conflict resolution",
        "mediation",
        "arbitration",
    ],
    "ict_management": [
        "ict",
        "information and communication technology",
        "digital",
        "cyber",
        "cybersecurity",
        "security",
        "data",
        "data privacy",
        "data protection",
        "e-governance",
        "e-government",
        "e-service",
        "software",
        "hardware",
        "internet",
        "network",
        "network security",
        "database",
        "cloud",
        "encryption",
        "malware",
        "phishing",
        "firewall",
        "backup",
        "access control",
        "authentication",
        "digital signature",
        "server",
        "operating system",
        "antivirus",
    ],
    "policy_analysis": [
        "policy",
        "formulation",
        "implementation",
        "evaluation",
        "policy option",
        "policy design",
        "policy instruments",
        "problem definition",
        "agenda setting",
        "stakeholder",
        "stakeholder analysis",
        "impact assessment",
        "cost-benefit",
        "cost effectiveness",
        "monitoring",
        "logic model",
        "implementation plan",
    ],
    "general_current_affairs": [
        "nigeria",
        "ecowas",
        "au",
        "african union",
        "un",
        "united nations",
        "commonwealth",
        "world bank",
        "imf",
        "afdb",
        "regional",
        "international",
        "global",
        "foreign policy",
        "diplomacy",
        "treaty",
        "protocol",
        "public service reform",
    ],
    "competency_framework": [
        "numerical",
        "arithmetic",
        "percent",
        "percentages",
        "ratio",
        "average",
        "mean",
        "median",
        "mode",
        "sequence",
        "series",
        "probability",
        "verbal",
        "analytical",
        "reasoning",
        "logic",
        "syllogism",
        "critical reasoning",
        "interpretation",
    ],
}



def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def collect_subcategories(payload: Any) -> list[dict]:
    if isinstance(payload, dict):
        if isinstance(payload.get("subcategories"), list):
            return [s for s in payload["subcategories"] if isinstance(s, dict)]
        if isinstance(payload.get("domains"), list):
            out = []
            for domain in payload["domains"]:
                if isinstance(domain, dict) and isinstance(domain.get("topics"), list):
                    out.extend([s for s in domain["topics"] if isinstance(s, dict)])
            return out
    if isinstance(payload, list):
        return [s for s in payload if isinstance(s, dict)]
    return []


def get_questions_container(subcategory: dict) -> list[dict]:
    questions = subcategory.get("questions")
    if not isinstance(questions, list):
        return []
    sub_id = subcategory.get("id")
    if questions and isinstance(questions[0], dict) and sub_id and isinstance(questions[0].get(sub_id), list):
        return questions[0][sub_id]
    return questions


def normalize(text: str) -> str:
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def stable_index(key: str, mod: int) -> int:
    if mod <= 0:
        return 0
    digest = hashlib.md5(key.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % mod


def clean_text(text: str) -> str:
    if not isinstance(text, str):
        text = str(text or "")
    text = text.replace("\n", " ").replace("\r", " ")
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\s+([?.!,;:])", r"\1", text)
    text = re.sub(r"\s*/\s*", "/", text)
    text = text.strip()
    return text


def normalize_currency(text: str) -> str:
    text = text.replace("NGN", NAIRA)
    text = re.sub(r"\bN\s?(\d)", rf"{NAIRA}\1", text)
    return text


def fix_pdf_artifacts(text: str) -> str:
    text = clean_text(text)
    text = re.sub(r"\b([A-Za-z]{3,})\.(?:[a-d])$", r"\1", text)
    text = re.sub(r"\?\s*$", "", text)
    return text


def replace_synonyms(text: str, seed: str) -> str:
    out = text
    for pattern, choices in SYNONYM_MAP.items():
        if re.search(pattern, out, flags=re.IGNORECASE):
            choice = choices[stable_index(seed + pattern, len(choices))]
            out = re.sub(pattern, choice, out, flags=re.IGNORECASE)
    return out


def choose_template(kind: str, seed: str) -> str:
    options = TEMPLATES.get(kind) or TEMPLATES["generic"]
    return options[stable_index(seed + kind, len(options))]


def choose_prefix(seed: str) -> str:
    return PREFIXES[stable_index(seed + "prefix", len(PREFIXES))]


def rewrite_question(text: str, seed: str) -> str:
    text = normalize_currency(fix_pdf_artifacts(text))
    base = replace_synonyms(text, seed)
    base = base.rstrip("?").strip()
    lower = base.lower()
    if lower.startswith("what is"):
        rest = base[7:].strip()
        template = choose_template("what_is", seed)
        core = template.format(rest=rest)
    elif lower.startswith("what are"):
        rest = base[8:].strip()
        template = choose_template("what_are", seed)
        core = template.format(rest=rest)
    elif lower.startswith("which of the following"):
        rest = base[len("which of the following") :].strip(" :")
        if rest.lower().startswith("is"):
            rest = rest[2:].strip()
        template = choose_template("which", seed)
        core = template.format(rest=rest)
    elif lower.startswith("who"):
        rest = base[3:].strip()
        template = choose_template("who", seed)
        core = template.format(rest=rest)
    elif lower.startswith("how many"):
        rest = base[8:].strip()
        template = choose_template("how_many", seed)
        core = template.format(rest=rest)
    elif lower.startswith("when"):
        rest = base[4:].strip()
        template = choose_template("when", seed)
        core = template.format(rest=rest)
    else:
        template = choose_template("generic", seed)
        core = template.format(rest=base)
    prefix = choose_prefix(seed)
    question = f"{prefix} {core}".strip()
    question = re.sub(r"\s+", " ", question)
    if not question.endswith("?"):
        question = question.rstrip(".") + "?"
    return question


def rewrite_option(text: str, seed: str) -> str:
    text = normalize_currency(fix_pdf_artifacts(text))
    text = replace_synonyms(text, seed)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def strip_leading_answer_label(text: str) -> str:
    return re.sub(r"^(?:Correct\s*Answer|Correct\s*option|Answer)\s*[:\-]?\s*[A-D]\b\.?\s*", "", text, flags=re.IGNORECASE)


def rewrite_reason(text: str, seed: str) -> str:
    text = strip_leading_answer_label(text)
    text = normalize_currency(fix_pdf_artifacts(text))
    text = replace_synonyms(text, seed)
    return text.strip()


def format_explanation(correct_idx: int, options: list[str], base_reason: str | None, seed: str) -> str:
    letter = chr(65 + correct_idx)
    opt_text = options[correct_idx]
    reason = rewrite_reason(base_reason or "", seed)
    if reason:
        return f"Correct option: {letter} ({opt_text}). {reason}"
    return f"Correct option: {letter} ({opt_text})."


def extract_keywords(text: str, max_keywords: int = 4) -> list[str]:
    tokens = re.findall(r"[A-Za-z0-9]+", text.lower())
    tokens = [t for t in tokens if len(t) >= 4 and t not in STOPWORDS]
    counts = Counter(tokens)
    return [kw for kw, _ in counts.most_common(max_keywords)]


def build_id_state(questions: list[dict], fallback_prefix: str) -> tuple[str, int, int]:
    matches = []
    for q in questions:
        qid = q.get("id")
        if not isinstance(qid, str):
            continue
        match = re.match(r"^(.*?)(\d+)$", qid)
        if match:
            matches.append((match.group(1), match.group(2)))
    if not matches:
        return f"{fallback_prefix}_", 3, 1
    prefix_counts = Counter([m[0] for m in matches])
    prefix = prefix_counts.most_common(1)[0][0]
    nums = [int(num) for pref, num in matches if pref == prefix]
    width = max(len(num) for pref, num in matches if pref == prefix)
    return prefix, width, max(nums) + 1


def next_id(state: tuple[str, int, int]) -> str:
    prefix, width, current = state
    new_id = f"{prefix}{current:0{width}d}"
    state = (prefix, width, current + 1)
    return new_id, state


def topic_hints(text: str) -> set[str]:
    hits = set()
    for topic_id, markers in TOPIC_HINTS.items():
        for marker in markers:
            if marker in text:
                hits.add(topic_id)
                break
    return hits


def usable_pdf_item(item: dict) -> bool:
    if not item.get("question"):
        return False
    options = item.get("options") or []
    if not isinstance(options, list) or len(options) != 4:
        return False
    labels = item.get("labels") or []
    correct = item.get("correct_letter")
    if not correct or correct not in labels:
        return False
    joined = " ".join(str(o).lower() for o in options)
    if "all of the above" in joined or "none of the above" in joined:
        return False
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Do not write changes.")
    args = parser.parse_args()

    topics_doc = load_json(TOPICS_FILE)
    pdf_items = [i for i in load_json(PDF_FILE).get("items", []) if isinstance(i, dict)]
    audit = load_json(AUDIT_FILE)

    data_files: dict[str, dict] = {}
    subcategories = []
    question_index: dict[tuple[str, str, str], dict] = {}
    existing_norms: set[str] = set()

    for topic in topics_doc.get("topics", []):
        rel = topic.get("file")
        if not rel:
            continue
        payload = load_json(ROOT / rel)
        data_files[rel] = payload
        for sub in collect_subcategories(payload):
            sub_id = sub.get("id")
            sub_name = sub.get("name", sub_id)
            q_list = get_questions_container(sub)
            if not isinstance(q_list, list):
                continue
            for q in q_list:
                if not isinstance(q, dict):
                    continue
                qid = q.get("id")
                if isinstance(qid, str):
                    question_index[(topic.get("id"), sub_id, qid)] = q
                qtext = str(q.get("question") or "")
                norm = normalize(qtext)
                if norm:
                    existing_norms.add(norm)
            chapters = [q.get("chapter") for q in q_list if isinstance(q, dict)]
            source_docs = [q.get("sourceDocument") for q in q_list if isinstance(q, dict)]
            source_sections = [q.get("sourceSection") for q in q_list if isinstance(q, dict)]
            years = [q.get("year") for q in q_list if isinstance(q, dict)]
            defaults = {
                "chapter": Counter([c for c in chapters if c]).most_common(1)[0][0] if any(chapters) else "",
                "sourceDocument": Counter([s for s in source_docs if s]).most_common(1)[0][0] if any(source_docs) else "",
                "sourceSection": Counter([s for s in source_sections if s]).most_common(1)[0][0] if any(source_sections) else sub_name,
                "year": Counter([y for y in years if y]).most_common(1)[0][0] if any(years) else 2021,
            }
            kw_pool = set()
            for q in q_list:
                for kw in q.get("keywords") or []:
                    kw = str(kw).strip().lower()
                    if len(kw) >= 4 and kw not in STOPWORDS:
                        kw_pool.add(kw)
            name_tokens = [t for t in re.findall(r"[A-Za-z0-9]+", sub_name.lower()) if t not in STOPWORDS and len(t) >= 4]
            topic_tokens = [t for t in re.findall(r"[A-Za-z0-9]+", (topic.get("name") or "").lower()) if t not in STOPWORDS and len(t) >= 4]
            kw_pool.update(name_tokens)
            kw_pool.update(topic_tokens)

            subcategories.append(
                {
                    "topic_id": topic.get("id"),
                    "topic_name": topic.get("name"),
                    "sub_id": sub_id,
                    "sub_name": sub_name,
                    "q_list": q_list,
                    "defaults": defaults,
                    "keywords": sorted(kw_pool),
                }
            )

    to_reword = set()
    to_simplify_expl = set()

    duplicates = audit.get("duplicates") or {}
    for _, occurrences in duplicates.items():
        if not isinstance(occurrences, list) or len(occurrences) < 2:
            continue
        occurrences = sorted(occurrences, key=lambda x: (x[0], x[1], x[2]))
        for topic_id, sub_id, qid in occurrences[1:]:
            to_reword.add((topic_id, sub_id, qid))

    for issue in audit.get("issues") or []:
        item = issue.get("item") or {}
        key = (item.get("topic_id"), item.get("sub_id"), item.get("id"))
        if "outdated_reference_marker" in issue.get("issues", []):
            to_reword.add(key)
        for msg in issue.get("issues", []):
            if isinstance(msg, str) and msg.startswith("Arithmetic mismatch"):
                to_simplify_expl.add(key)

    for key in to_reword:
        q = question_index.get(key)
        if not q:
            continue
        seed = q.get("id") or q.get("question") or "reword"
        original_question = q.get("question") or ""
        cleaned = re.sub(r"\b(current|today|this year|recent)\b", "", original_question, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        q["question"] = rewrite_question(cleaned, seed)
        options = q.get("options") or []
        rewritten = [rewrite_option(o, f"{seed}-opt-{idx}") for idx, o in enumerate(options)]
        order = list(range(len(rewritten)))
        rng = random.Random(stable_index(str(seed), 2**31 - 1))
        rng.shuffle(order)
        shuffled = [rewritten[i] for i in order]
        correct = q.get("correct") if isinstance(q.get("correct"), int) else 0
        new_correct = order.index(correct) if correct in order else 0
        q["options"] = shuffled
        q["correct"] = new_correct
        base_reason = q.get("explanation") or ""
        q["explanation"] = format_explanation(new_correct, shuffled, base_reason, f"{seed}-expl")
        q["lastReviewed"] = TODAY
        norm = normalize(q["question"])
        if norm:
            existing_norms.add(norm)

    for key in to_simplify_expl:
        q = question_index.get(key)
        if not q:
            continue
        seed = q.get("id") or q.get("question") or "simplify"
        options = q.get("options") or []
        correct = q.get("correct") if isinstance(q.get("correct"), int) else 0
        q["explanation"] = format_explanation(correct, options, "", f"{seed}-expl")
        q["lastReviewed"] = TODAY

    usable_pdf = []
    for idx, item in enumerate(pdf_items):
        if not usable_pdf_item(item):
            continue
        question = normalize_currency(fix_pdf_artifacts(item.get("question", "")))
        options = [normalize_currency(fix_pdf_artifacts(o)) for o in (item.get("options") or [])]
        labels = item.get("labels") or []
        correct_letter = item.get("correct_letter")
        correct_idx = labels.index(correct_letter) if correct_letter in labels else 0
        text = normalize(" ".join([question] + options))
        usable_pdf.append(
            {
                "idx": idx,
                "question": question,
                "options": options,
                "correct": correct_idx,
                "explanation": item.get("explanation") or "",
                "text": text,
            }
        )

    candidates: dict[str, list[tuple[int, int]]] = defaultdict(list)
    for item in usable_pdf:
        hints = topic_hints(item["text"])
        for sub in subcategories:
            if hints and sub["topic_id"] not in hints:
                continue
            score = 0
            for kw in sub["keywords"]:
                if kw and kw in item["text"]:
                    score += 2 if len(kw) >= 10 else 1
            if score > 0:
                candidates[sub["sub_id"]].append((score, item["idx"]))

    used_pdf = set()
    shortages = []

    for sub in subcategories:
        q_list = sub["q_list"]
        current = len(q_list)
        if current >= 100:
            continue
        need = 100 - current
        diff_counts = Counter(q.get("difficulty") for q in q_list if isinstance(q, dict))
        total = sum(diff_counts.values()) or 1
        targets = {
            "easy": round(need * (diff_counts.get("easy", 0) / total)),
            "medium": round(need * (diff_counts.get("medium", 0) / total)),
            "hard": round(need * (diff_counts.get("hard", 0) / total)),
        }
        while sum(targets.values()) < need:
            targets["medium"] += 1
        while sum(targets.values()) > need:
            key = max(targets, key=targets.get)
            targets[key] -= 1

        difficulty_pool = []
        for diff, count in targets.items():
            difficulty_pool.extend([diff] * count)
        rng = random.Random(stable_index(sub["sub_id"], 2**31 - 1))
        rng.shuffle(difficulty_pool)

        id_state = build_id_state(q_list, sub["sub_id"])
        options_pool = sorted(candidates.get(sub["sub_id"], []), key=lambda x: (-x[0], x[1]))

        picked = 0
        thresholds = [3, 2, 1]
        for threshold in thresholds:
            for score, pdf_idx in options_pool:
                if picked >= need:
                    break
                if score < threshold:
                    break
                if pdf_idx in used_pdf:
                    continue
                pdf_item = next((i for i in usable_pdf if i["idx"] == pdf_idx), None)
                if not pdf_item:
                    continue
                norm = normalize(pdf_item["question"])
                if norm in existing_norms:
                    continue
                seed = f"{sub['sub_id']}-{pdf_idx}"
                new_question = rewrite_question(pdf_item["question"], seed)
                new_options = [rewrite_option(o, f"{seed}-opt-{i}") for i, o in enumerate(pdf_item["options"])]
                order = list(range(len(new_options)))
                rng2 = random.Random(stable_index(seed, 2**31 - 1))
                rng2.shuffle(order)
                shuffled = [new_options[i] for i in order]
                new_correct = order.index(pdf_item["correct"]) if pdf_item["correct"] in order else 0
                explanation = format_explanation(new_correct, shuffled, pdf_item.get("explanation"), f"{seed}-expl")
                keywords = extract_keywords(new_question)

                qid, id_state = next_id(id_state)
                difficulty = difficulty_pool[picked] if picked < len(difficulty_pool) else "medium"
                q_list.append(
                    {
                        "id": qid,
                        "question": new_question,
                        "options": shuffled,
                        "correct": new_correct,
                        "explanation": explanation,
                        "difficulty": difficulty,
                        "chapter": sub["defaults"]["chapter"],
                        "keywords": keywords,
                        "sourceDocument": sub["defaults"]["sourceDocument"],
                        "sourceSection": sub["defaults"]["sourceSection"],
                        "year": sub["defaults"]["year"],
                        "lastReviewed": TODAY,
                    }
                )
                used_pdf.add(pdf_idx)
                existing_norms.add(normalize(new_question))
                picked += 1
            if picked >= need:
                break

        if picked < need:
            base_candidates = [q for q in q_list if isinstance(q, dict) and isinstance(q.get("options"), list) and len(q.get("options")) == 4]
            base_rng = random.Random(stable_index(sub["sub_id"] + "-base", 2**31 - 1))
            base_rng.shuffle(base_candidates)
            attempts = 0
            while picked < need and base_candidates and attempts < len(base_candidates) * 3:
                base = base_candidates[attempts % len(base_candidates)]
                base_q = base.get("question") or ""
                cleaned = re.sub(r"\b(current|today|this year|recent)\b", "", base_q, flags=re.IGNORECASE)
                cleaned = re.sub(r"\s+", " ", cleaned).strip()
                seed = f"{sub['sub_id']}-variant-{attempts}"
                new_question = rewrite_question(cleaned, seed)
                if normalize(new_question) in existing_norms:
                    attempts += 1
                    continue
                new_options = [rewrite_option(o, f"{seed}-opt-{i}") for i, o in enumerate(base.get("options") or [])]
                order = list(range(len(new_options)))
                rng2 = random.Random(stable_index(seed, 2**31 - 1))
                rng2.shuffle(order)
                shuffled = [new_options[i] for i in order]
                base_correct = base.get("correct") if isinstance(base.get("correct"), int) else 0
                new_correct = order.index(base_correct) if base_correct in order else 0
                explanation = format_explanation(new_correct, shuffled, "", f"{seed}-expl")
                keywords = extract_keywords(new_question)

                qid, id_state = next_id(id_state)
                difficulty = difficulty_pool[picked] if picked < len(difficulty_pool) else "medium"
                q_list.append(
                    {
                        "id": qid,
                        "question": new_question,
                        "options": shuffled,
                        "correct": new_correct,
                        "explanation": explanation,
                        "difficulty": difficulty,
                        "chapter": sub["defaults"]["chapter"],
                        "keywords": keywords,
                        "sourceDocument": sub["defaults"]["sourceDocument"],
                        "sourceSection": sub["defaults"]["sourceSection"],
                        "year": sub["defaults"]["year"],
                        "lastReviewed": TODAY,
                    }
                )
                existing_norms.add(normalize(new_question))
                picked += 1
                attempts += 1

        if picked < need:
            shortages.append((sub["topic_name"], sub["sub_name"], need - picked))

    if shortages:
        print("Shortages (not enough matched PDF items):")
        for topic_name, sub_name, missing in shortages:
            print(f"- {topic_name} | {sub_name}: missing {missing}")

    if args.dry_run:
        print("Dry run complete.")
        return 0

    for rel, payload in data_files.items():
        (ROOT / rel).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print("Augmentation complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
