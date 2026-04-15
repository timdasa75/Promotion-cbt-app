import json
from pathlib import Path

DATA_PATH = Path("data/public_procurement.json")

UPDATES = {
    "ppa_ims_059": {
        "question": "Which practice best reflects open-competition standards in public procurement?",
        "options": [
            "Close cases without validating facts or keeping proper records.",
            "Treat exceptions as routine without documented justification.",
            "Rely on informal instructions without documentary evidence.",
            "Use competitive procurement methods except where lawful exceptions apply."
        ],
        "explanation": "Open competition in procurement is protected when competitive methods are used as the default and departures occur only where the law permits a specific exception.",
        "keywords": ["open_competition", "competitive_methods", "lawful_exceptions", "public_procurement"]
    },
    "ppa_ims_064": {
        "question": "Which practice best supports document management during procurement implementation and monitoring?",
        "options": [
            "Bypass review and approval controls to save time.",
            "Apply rules inconsistently based on personal preference.",
            "Keep accurate files and update status at each control point.",
            "Prioritize convenience over policy and legal requirements."
        ],
        "explanation": "Procurement implementation is easier to monitor and audit when records stay accurate and file status is updated at each control point.",
        "keywords": ["document_management", "procurement_implementation", "accurate_files", "control_points"]
    },
    "ppa_ims_072": {
        "question": "Which bid-evaluation practice best aligns with sound public procurement procedure?",
        "options": [
            "Ignore feedback and continue non-compliant procedures.",
            "Apply rules inconsistently based on personal preference.",
            "Bypass review and approval controls to save time.",
            "Apply published criteria consistently to all responsive bids."
        ],
        "explanation": "Sound bid evaluation depends on applying the published criteria consistently to every responsive bid rather than introducing arbitrary or undocumented judgment.",
        "keywords": ["bid_evaluation", "published_criteria", "responsive_bids", "procurement_procedure"]
    }
}


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    updated = []
    for sub in data["subcategories"]:
        for q in sub.get("questions", []):
            qid = q.get("id")
            if qid in UPDATES:
                patch = UPDATES[qid]
                q["question"] = patch["question"]
                q["options"] = patch["options"]
                q["explanation"] = patch["explanation"]
                q["keywords"] = patch["keywords"]
                updated.append(qid)
    DATA_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Updated {len(updated)} questions")
    for qid in updated:
        print(qid)


if __name__ == "__main__":
    main()
