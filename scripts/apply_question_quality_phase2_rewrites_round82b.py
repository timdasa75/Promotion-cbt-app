#!/usr/bin/env python3
"""Round 82B: clear remaining circ_personnel_performance option-shape tail and separate a new near-duplicate pair."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "data" / "psr_rules.json"
SUBCATEGORY_ID = "circ_personnel_performance"

UPDATES = {
    "circ_personnel_performance_gen_003": {
        "question": "Which option most strongly aligns with good public-service practice on escalation of material compliance gaps within Circulars: Personnel, Performance & Reforms?",
        "options": [
            "Early identification of control gaps with prompt escalation.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Escalation of material compliance gaps is strongest when control weaknesses are identified early and referred promptly for higher review.",
        "keywords": ["psr", "circ_personnel_performance", "compliance_gap_escalation", "early_identification"],
    },
    "circ_personnel_performance_gen_007": {
        "options": [
            "Eligibility confirmation before advancement recommendation.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
        ]
    },
    "circ_personnel_performance_gen_009": {
        "options": [
            "Use of documented procedure with complete recordkeeping.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ]
    },
    "circ_personnel_performance_gen_011": {
        "options": [
            "Traceable decisions with evidence-based justification.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ]
    },
    "circ_personnel_performance_gen_015": {
        "options": [
            "Approved workflow use with output verification.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
        ]
    },
    "circ_personnel_performance_gen_017": {
        "options": [
            "Accurate file maintenance with status updates.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ]
    },
    "circ_personnel_performance_gen_023": {
        "options": [
            "Due process, fair hearing, and documented decisions.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
        ]
    },
    "circ_personnel_performance_gen_025": {
        "options": [
            "Eligibility confirmation before advancement recommendation.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ]
    },
    "circ_personnel_performance_gen_027": {
        "options": [
            "Use of documented procedure with complete recordkeeping.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ]
    },
    "circ_personnel_performance_gen_031": {
        "options": [
            "Early risk identification with documented mitigation.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
        ]
    },
    "circ_personnel_performance_gen_033": {
        "options": [
            "Approved workflow use with output verification.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ]
    },
    "circ_personnel_performance_gen_037": {
        "options": [
            "Continued non-compliant procedures after feedback.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
            "Early identification of control gaps with prompt escalation.",
        ]
    },
    "circ_personnel_performance_gen_041": {
        "options": [
            "Inconsistent rule application across similar cases.",
            "Eligibility confirmation before advancement recommendation.",
            "Continued non-compliant procedures after feedback.",
            "Bypassed review and approval checkpoints.",
        ]
    },
    "circ_personnel_performance_gen_043": {
        "options": [
            "Use of documented procedure with complete recordkeeping.",
            "Convenience over policy requirements.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
        ]
    },
    "circ_personnel_performance_gen_045": {
        "options": [
            "Bypassed review and approval checkpoints.",
            "Continued non-compliant procedures after feedback.",
            "Traceable decisions with evidence-based justification.",
            "Convenience over policy requirements.",
        ]
    },
    "circ_personnel_performance_gen_049": {
        "options": [
            "Bypassed review and approval checkpoints.",
            "Continued non-compliant procedures after feedback.",
            "Approved workflow use with output verification.",
            "Inconsistent rule application across similar cases.",
        ]
    },
    "circ_personnel_performance_gen_051": {
        "options": [
            "Inconsistent rule application across similar cases.",
            "Accurate file maintenance with status updates.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ]
    },
    "circ_personnel_performance_gen_057": {
        "options": [
            "Continued non-compliant procedures after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Due process, fair hearing, and documented decisions.",
        ]
    },
    "circ_personnel_performance_gen_059": {
        "options": [
            "Convenience over policy requirements.",
            "Bypassed review and approval checkpoints.",
            "Inconsistent rule application across similar cases.",
            "Eligibility confirmation before advancement recommendation.",
        ]
    },
    "circ_personnel_performance_gen_060": {
        "options": [
            "Discretionary shortcuts regardless of safeguards.",
            "Convenience over approved process requirements.",
            "Bypassed review checkpoints under time pressure.",
            "Consistent application of PSR provisions with auditable records.",
        ]
    },
    "circ_personnel_performance_gen_064": {
        "options": [
            "Inconsistent criteria across similar cases.",
            "Convenience over approved process requirements.",
            "Discretionary shortcuts regardless of safeguards.",
            "Consistent application of PSR provisions with auditable records.",
        ]
    },
    "circ_personnel_performance_gen_080": {
        "options": [
            "COMPRO II requirement only.",
            "Requirement for both COMPRO I and COMPRO II.",
            "Use of examinations prescribed by the relevant service commission.",
            "Optional examination status across every service.",
        ]
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> int:
    payload = load_json(TARGET)
    updated = 0
    for sub in payload.get("subcategories", []):
        if sub.get("id") != SUBCATEGORY_ID:
            continue
        questions = sub.get("questions", [])
        if questions and isinstance(questions[0], dict) and isinstance(questions[0].get(SUBCATEGORY_ID), list):
            bank = questions[0][SUBCATEGORY_ID]
        else:
            bank = questions
        for question in bank:
            qid = question.get("id")
            if qid not in UPDATES:
                continue
            patch = UPDATES[qid]
            for key, value in patch.items():
                question[key] = value
            updated += 1
        break
    write_json(TARGET, payload)
    print(f"Applied round 82B rewrites to {updated} questions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
