#!/usr/bin/env python3
"""
Redistribute imported docx questions from the temporary PSR subcategory into
existing PSR subcategories using rule-based classification.
Outputs:
  - docs/docx_redistribution_report.json
  - docs/docx_redistribution_report.md
"""

from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
PSR_PATH = ROOT / "data" / "psr_rules.json"
TOPICS_PATH = ROOT / "data" / "topics.json"
OUT_JSON = ROOT / "docs" / "docx_redistribution_report.json"
OUT_MD = ROOT / "docs" / "docx_redistribution_report.md"

IMPORT_SUBCATEGORY_ID = "psr_docx_import"

RULES = [
    {
        "id": "psr_interpretation",
        "name": "Interpretation & Commencement",
        "patterns": [
            r"\binterpretation\b",
            r"\bdefinition\b",
            r"\bmeaning\b",
            r"\bwhat does\b",
            r"\bwhat is\b",
            r"\bwho is\b",
            r"\bapply to\b",
            r"\bapplication of\b",
            r"\bthese rules\b",
            r"\bscope\b",
            r"\bcommencement\b",
            r"\beffective date\b",
            r"\bchapter 1\b",
            r"\b0101\d{0,2}\b",
        ],
    },
    {
        "id": "psr_general_admin",
        "name": "General Administration & Office Procedures",
        "patterns": [
            r"\brecords?\b",
            r"\bregistry\b",
            r"\bcorrespondence\b",
            r"\bclassified\b",
            r"\bgazette\b",
            r"\bfile(s)?\b",
            r"\bminute(s)?\b",
            r"\bmemoranda?\b",
            r"\boffice procedure\b",
            r"\bsecurity of records\b",
        ],
    },
    {
        "id": "psr_appointments",
        "name": "Appointments, Promotions & Transfers",
        "patterns": [
            r"\bappointment\b",
            r"\bpromotion\b",
            r"\btransfer\b",
            r"\bconfirmation\b",
            r"\bprobation\b",
            r"\brecruitment\b",
            r"\bposting\b",
            r"\bsecondment\b",
            r"\bacting\b",
            r"\btenure\b",
        ],
    },
    {
        "id": "psr_discipline",
        "name": "Discipline & Misconduct",
        "patterns": [
            r"\bdiscipline\b",
            r"\bmisconduct\b",
            r"\bquery\b",
            r"\binterdiction\b",
            r"\bsuspension\b",
            r"\bdismissal\b",
            r"\btermination\b",
            r"\bdisciplinary\b",
            r"\bserious misconduct\b",
            r"\bminor misconduct\b",
        ],
    },
    {
        "id": "psr_leave",
        "name": "Leave, Absence & Holidays",
        "patterns": [
            r"\bleave\b",
            r"\bholiday\b",
            r"\babsence\b",
            r"\bsick leave\b",
            r"\bmaternity\b",
            r"\bpaternity\b",
            r"\bcasual leave\b",
            r"\bstudy leave\b",
        ],
    },
    {
        "id": "psr_allowances",
        "name": "Allowances, Pay & Benefits",
        "patterns": [
            r"\ballowance\b",
            r"\bsalary\b",
            r"\bpay\b",
            r"\bemoluments?\b",
            r"\bwages?\b",
            r"\bbenefits?\b",
            r"\bbonus\b",
            r"\bduty tour\b",
            r"\bhousing\b",
            r"\btransport\b",
        ],
    },
    {
        "id": "psr_ethics",
        "name": "Conduct & Ethics",
        "patterns": [
            r"\bethics?\b",
            r"\bconduct\b",
            r"\bconflict of interest\b",
            r"\bbribe\b",
            r"\bgift\b",
            r"\bconfidential\b",
            r"\bloyalty\b",
            r"\bpolitical\b",
            r"\bpartisan\b",
            r"\boath\b",
        ],
    },
    {
        "id": "psr_medical",
        "name": "Medical & Welfare",
        "patterns": [
            r"\bmedical\b",
            r"\binjury\b",
            r"\billness\b",
            r"\bhospital\b",
            r"\binvalid\b",
            r"\bwelfare\b",
        ],
    },
    {
        "id": "psr_training",
        "name": "Training, Performance & Career Development",
        "patterns": [
            r"\btraining\b",
            r"\bperformance\b",
            r"\bappraisal\b",
            r"\bcareer\b",
            r"\bdevelopment\b",
            r"\bcourse\b",
            r"\bstudy\b",
        ],
    },
    {
        "id": "psr_retirement",
        "name": "Separation, Retirement & Pensions",
        "patterns": [
            r"\bretirement\b",
            r"\bpension\b",
            r"\bgratuity\b",
            r"\bresignation\b",
            r"\bwithdrawal\b",
            r"\bdeath\b",
            r"\bseparation\b",
        ],
    },
]

DEFAULT_SUBCATEGORY_ID = "psr_interpretation"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def dump_json(path: Path, payload):
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def score_question(text: str, patterns: list[str]) -> tuple[int, list[str]]:
    hits = []
    score = 0
    for pat in patterns:
        if re.search(pat, text):
            hits.append(pat)
            score += 1
    return score, hits


def find_subcategory(psr_payload: dict[str, Any], sub_id: str) -> dict[str, Any] | None:
    for sub in psr_payload.get("subcategories", []):
        if sub.get("id") == sub_id:
            return sub
    return None


def main() -> int:
    psr_payload = load_json(PSR_PATH)
    import_sub = find_subcategory(psr_payload, IMPORT_SUBCATEGORY_ID)
    if not import_sub:
        print("No import subcategory found; nothing to do.")
        return 0

    targets = {rule["id"] for rule in RULES}
    for rule_id in list(targets):
        if not find_subcategory(psr_payload, rule_id):
            raise SystemExit(f"Missing target subcategory: {rule_id}")

    moved = []
    by_target = defaultdict(int)
    unmatched = []

    for q in list(import_sub.get("questions", [])):
        qtext = str(q.get("question") or "")
        combined = normalize(f"{qtext} {q.get('explanation','')}")
        best_score = 0
        best_rule = None
        best_hits = []
        for rule in RULES:
            score, hits = score_question(combined, rule["patterns"])
            if score > best_score:
                best_score = score
                best_rule = rule
                best_hits = hits
        if not best_rule or best_score == 0:
            best_rule = next(r for r in RULES if r["id"] == DEFAULT_SUBCATEGORY_ID)
            best_hits = []
            unmatched.append(q.get("id"))

        target_sub = find_subcategory(psr_payload, best_rule["id"])
        target_sub.setdefault("questions", []).append(q)
        by_target[best_rule["id"]] += 1
        moved.append(
            {
                "id": q.get("id"),
                "question": qtext,
                "target": best_rule["id"],
                "targetName": best_rule["name"],
                "score": best_score,
                "hits": best_hits,
            }
        )

    import_sub["questions"] = []

    # Remove import subcategory from psr payload
    psr_payload["subcategories"] = [
        s for s in psr_payload.get("subcategories", []) if s.get("id") != IMPORT_SUBCATEGORY_ID
    ]

    dump_json(PSR_PATH, psr_payload)

    # Remove import subcategory from topics.json
    topics_payload = load_json(TOPICS_PATH)
    for topic in topics_payload.get("topics", []):
        if topic.get("id") == "psr":
            topic["subcategories"] = [
                s for s in topic.get("subcategories", []) if s.get("id") != IMPORT_SUBCATEGORY_ID
            ]
    dump_json(TOPICS_PATH, topics_payload)

    report = {
        "moved": len(moved),
        "by_target": dict(sorted(by_target.items())),
        "unmatched_defaulted": unmatched,
        "items": moved,
    }
    OUT_JSON.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = ["# Docx Redistribution Report", "", f"- Total moved: **{len(moved)}**"]
    if unmatched:
        lines.append(f"- Defaulted to {DEFAULT_SUBCATEGORY_ID}: **{len(unmatched)}**")
    lines.append("")
    lines.append("## Moves by Subcategory")
    for sub_id, count in sorted(by_target.items()):
        lines.append(f"- {sub_id}: {count}")
    lines.append("")
    lines.append(f"Full machine-readable report: `{OUT_JSON.as_posix()}`")
    OUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"Moved {len(moved)} questions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
