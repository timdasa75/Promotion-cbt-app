#!/usr/bin/env python3
"""
Quality audit for question bank.
Flags: wrong/mismatched answer signals, duplicates, formatting/encoding issues,
missing fields, ambiguous stems, and outdated-reference heuristics.
Outputs:
  - docs/quality_audit_report.json
  - docs/quality_audit_summary.md
"""

from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any, Iterable, Tuple


ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
OUT_JSON = ROOT / "docs" / "quality_audit_report.json"
OUT_MD = ROOT / "docs" / "quality_audit_summary.md"

MOJIBAKE_MARKERS = ("â", "Ã", "ðŸ", "�")

CURRENT_AFFAIRS_TOPICS = {
    "general_current_affairs",
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def collect_subcategories(payload):
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


def iterate_questions(subcategory):
    questions = subcategory.get("questions")
    if not isinstance(questions, list):
        return []
    sub_id = subcategory.get("id")
    if questions and isinstance(questions[0], dict) and sub_id and isinstance(questions[0].get(sub_id), list):
        return [q for q in questions[0][sub_id] if isinstance(q, dict)]
    return [q for q in questions if isinstance(q, dict)]


def normalize(text: str) -> str:
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def has_mojibake(text: str) -> bool:
    return any(m in text for m in MOJIBAKE_MARKERS)


def extract_option_letter(expl: str | None) -> str | None:
    if not isinstance(expl, str):
        return None
    patterns = [
        r"(?:Correct\s*option|Option)\s*[:\-]?\s*([A-D])\b",
        r"(?:Answer|Correct)\s*[:\-]?\s*([A-D])\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, expl, re.IGNORECASE)
        if match:
            return match.group(1).upper()
    return None


def extract_option_index(expl: str | None) -> int | None:
    if not isinstance(expl, str):
        return None
    match = re.search(r"(?:Correct\s*option|Option|correct\s*index)\s*[:\-]?\s*(\d)\b", expl, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None


def parse_number(raw: str) -> float | None:
    if not raw:
        return None
    cleaned = raw.replace(",", "").replace("₦", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None


def safe_eval_expr(expr: str) -> float | None:
    cleaned = (
        expr.replace(",", "")
        .replace("×", "*")
        .replace("x", "*")
        .replace("X", "*")
        .replace("÷", "/")
        .replace("−", "-")
    )
    if not re.fullmatch(r"[0-9\s\.+\-*/]+", cleaned):
        return None
    try:
        return float(eval(cleaned, {"__builtins__": {}}, {}))
    except Exception:
        return None


def approx_equal(a: float, b: float) -> bool:
    tol = max(0.01, abs(a) * 0.001)
    return abs(a - b) <= tol


def check_arithmetic(explanation: str) -> list[str]:
    issues = []
    arith_re = re.compile(
        r"(?P<expr>(?:[\d,]+(?:\.\d+)?\s*[*xX×÷/\-\+−]\s*)+[\d,]+(?:\.\d+)?)\s*=\s*(?P<result>[\d,]+(?:\.\d+)?)"
    )
    pct_re = re.compile(
        r"(?P<pct>\d+(?:\.\d+)?)%\s*(?:of\s*)?(?P<base>[\d,]+(?:\.\d+)?)\s*=\s*(?P<result>[\d,]+(?:\.\d+)?)",
        re.IGNORECASE,
    )
    for match in pct_re.finditer(explanation):
        pct = parse_number(match.group("pct"))
        base = parse_number(match.group("base"))
        result = parse_number(match.group("result"))
        if pct is None or base is None or result is None:
            continue
        expected = base * (pct / 100.0)
        if not approx_equal(expected, result):
            issues.append(
                f"Percent mismatch: {pct}% of {base} = {result} (expected {expected:.2f})"
            )
    for match in arith_re.finditer(explanation):
        expr = match.group("expr")
        result = parse_number(match.group("result"))
        if result is None:
            continue
        expected = safe_eval_expr(expr)
        if expected is None:
            continue
        if not approx_equal(expected, result):
            issues.append(
                f"Arithmetic mismatch: {expr.strip()} = {result} (expected {expected:.2f})"
            )
    return issues


def main() -> int:
    topics_doc = load_json(TOPICS_FILE)
    topic_map = {t.get("id"): t for t in topics_doc.get("topics", []) if isinstance(t, dict)}

    occurrences = defaultdict(list)
    items = []

    for topic in topic_map.values():
        rel = topic.get("file")
        if not rel:
            continue
        payload = load_json(ROOT / rel)
        for sub in collect_subcategories(payload):
            sub_id = sub.get("id")
            sub_name = sub.get("name", sub_id)
            for q in iterate_questions(sub):
                qid = q.get("id")
                qtext = str(q.get("question") or "").strip()
                norm = normalize(qtext)
                if norm:
                    occurrences[norm].append((topic.get("id"), sub_id, qid))
                items.append(
                    {
                        "topic_id": topic.get("id"),
                        "topic_name": topic.get("name"),
                        "sub_id": sub_id,
                        "sub_name": sub_name,
                        "id": qid,
                        "question": qtext,
                        "options": q.get("options") or [],
                        "correct": q.get("correct"),
                        "explanation": q.get("explanation") or "",
                    }
                )

    duplicates = {k: v for k, v in occurrences.items() if len(v) > 1}

    report = []
    per_sub = defaultdict(lambda: {"count": 0, "issues": 0})

    for item in items:
        issues = []
        qtext = item["question"]
        opts = item["options"]
        expl = item["explanation"]
        correct = item["correct"]

        per_sub[(item["topic_id"], item["sub_id"])]["count"] += 1

        if not qtext:
            issues.append("missing_question_text")
        if not isinstance(opts, list) or len(opts) < 2:
            issues.append("missing_options")
        if not isinstance(correct, int):
            issues.append("missing_correct_index")
        elif isinstance(opts, list) and (correct < 0 or correct >= len(opts)):
            issues.append("correct_index_out_of_range")

        if has_mojibake(qtext) or any(has_mojibake(str(o)) for o in opts) or has_mojibake(expl):
            issues.append("encoding_mojibake")

        letter = extract_option_letter(expl)
        if letter:
            idx = ord(letter) - 65
            if isinstance(correct, int) and idx != correct:
                issues.append("explanation_option_mismatch")

        idx = extract_option_index(expl)
        if idx is not None and isinstance(correct, int) and idx != correct:
            issues.append("explanation_index_mismatch")

        if expl:
            issues.extend(check_arithmetic(expl))

        if "none of the above" in qtext.lower() or "all of the above" in qtext.lower():
            issues.append("ambiguous_stem")

        if item["topic_id"] in CURRENT_AFFAIRS_TOPICS:
            if re.search(r"\b(current|today|this year|recent)\b", qtext.lower()):
                issues.append("outdated_reference_marker")

        norm = normalize(qtext)
        if norm in duplicates:
            issues.append("duplicate_question_text")

        if issues:
            per_sub[(item["topic_id"], item["sub_id"])]["issues"] += 1
            report.append({"item": item, "issues": issues})

    OUT_JSON.write_text(json.dumps({"issues": report, "duplicates": duplicates}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = ["# Quality Audit Summary", "", f"- Total items with issues: **{len(report)}**", ""]
    lines.append("## Issues by Subtopic")
    for (topic_id, sub_id), stats in sorted(per_sub.items(), key=lambda x: (x[0][0], x[0][1])):
        if stats["issues"] == 0:
            continue
        lines.append(f"- {topic_id}/{sub_id}: {stats['issues']} of {stats['count']}")
    lines.append("")
    lines.append(f"Full report: `{OUT_JSON.as_posix()}`")
    OUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"Items with issues: {len(report)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
