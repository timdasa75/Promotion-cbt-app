#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "data" / "constitutional_foi.json"
UPDATES = {
    "FOI_OP_061": {
        "question": "Which action best demonstrates public accountability when enforcing FOI offences and penalties?",
        "explanation": "Public accountability in FOI enforcement is strongest when the enforcement decision can be traced to recorded reasons, supporting evidence, and the legal basis for the sanction or refusal.",
        "keywords": ["foi", "enforcement", "public_accountability", "recorded_reasons"],
    },
    "FOI_OP_066": {
        "question": "Which practice best supports legal compliance before an FOI sanction or enforcement step is taken?",
        "explanation": "Before an FOI sanction or enforcement step is taken, officers should confirm the governing legal authority and record the basis for the action so the decision remains reviewable and lawful.",
        "keywords": ["foi", "enforcement", "legal_compliance", "statutory_authority"],
    },
    "FOI_OP_069": {
        "question": "Which practice best supports documented procedure when an FOI enforcement file is being processed?",
        "explanation": "Documented procedure in an FOI enforcement file depends on following the approved process and keeping complete records of each action taken during the case.",
        "keywords": ["foi", "enforcement", "documented_procedure", "case_records"],
    },
}

data = json.loads(TARGET.read_text(encoding="utf-8"))
updated = 0
for sub in data.get("subcategories", []):
    if sub.get("id") != "foi_offences_penalties":
        continue
    for question in sub.get("questions", []):
        payload = UPDATES.get(question.get("id"))
        if payload:
            question.update(payload)
            updated += 1

TARGET.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Applied round 115B updates to {updated} questions in {TARGET}")
