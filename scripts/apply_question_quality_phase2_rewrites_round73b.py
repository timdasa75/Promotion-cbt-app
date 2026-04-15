import json
from pathlib import Path

DATA_PATH = Path("data/civil_service_ethics.json")

UPDATES = {
    "csh_administrative_procedures_gen_026": {
        "question": "Which practice should a responsible officer prioritize when repeated misconduct threatens administrative order?",
        "explanation": "When repeated misconduct threatens administrative order, the responsible officer should apply rules consistently and document corrective action so the response remains fair, reviewable, and defensible.",
        "keywords": ["administrative_procedure", "repeated_misconduct", "administrative_order", "corrective_action"]
    }
}


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    updated = []
    for sub in data["subcategories"]:
        if sub.get("id") != "csh_administrative_procedures":
            continue
        for q in sub.get("questions", []):
            qid = q.get("id")
            if qid in UPDATES:
                patch = UPDATES[qid]
                q["question"] = patch["question"]
                q["explanation"] = patch["explanation"]
                q["keywords"] = patch["keywords"]
                updated.append(qid)
    DATA_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Updated {len(updated)} questions")
    for qid in updated:
        print(qid)


if __name__ == "__main__":
    main()
