import json
from pathlib import Path

DATA_PATH = Path("data/civil_service_ethics.json")

UPDATES = {
    "eth_anti_corruption_gen_001": [
        "Use of approved safeguards and a complete decision trail.",
        "One-officer handling of the full transaction without oversight.",
        "Tolerance for undocumented exceptions in routine work.",
        "Relaxed approval checks under operational pressure."
    ],
    "eth_anti_corruption_gen_003": [
        "Early identification of control gaps and prompt escalation of material exceptions.",
        "Delayed reporting until an audit query arises.",
        "Routine acceptance of repeated control failures after work completion.",
        "Undocumented shortcuts under target pressure."
    ],
    "eth_anti_corruption_gen_004": [
        "Neutrality, integrity, and professional discipline.",
        "Tolerance of irregularities before any formal complaint.",
        "Dependence on verbal assurances instead of documentary support.",
        "Normal treatment of exceptions involving influential officers."
    ],
    "eth_anti_corruption_gen_006": [
        "Clear indicators, documented reviews, and follow-up on control failures.",
        "Speed-only assessment without regard to procedure.",
        "Weak safeguards left untouched despite warning signs.",
        "Avoidance of formal review and unresolved unit weaknesses."
    ],
    "eth_conflict_interest_gen_003": [
        "Early review of interests and prompt escalation of unresolved conflicts.",
        "Delayed checking until a complaint is filed.",
        "Routine treatment of repeated disclosure failures as minor issues.",
        "Informal exceptions whenever a senior officer is involved."
    ],
    "eth_conflict_interest_gen_004": [
        "Neutrality, transparency, and professional restraint.",
        "Personal relationships shaping how rules are applied.",
        "Private understandings in place of recorded disclosure handling.",
        "Acceptance of incomplete declarations where no protest is raised."
    ],
    "eth_conflict_interest_gen_006": [
        "Disclosure tracking, compliance review, and follow-up on unresolved cases.",
        "Speed of closure as the only performance measure.",
        "Repeated declaration failures left outside formal review.",
        "Informal settlements replacing compliance monitoring."
    ],
    "eth_general_gen_002": [
        "Consistent use of approved rules and recorded reasons for sensitive decisions.",
        "Personal instinct despite an available rule or procedure.",
        "Case-by-case adjustment of ethical standards under pressure.",
        "Acceptance of undocumented exceptions because the outcome seems useful."
    ],
    "eth_general_gen_006": [
        "Objective indicators, documented review, and follow-up on ethical lapses.",
        "Output-only judgment despite ignored ethical safeguards.",
        "Recurring ethical concerns left outside formal review.",
        "Avoidance of written feedback on difficult issues."
    ],
    "eth_misconduct_gen_001": [
        "Approved disciplinary procedure and a complete case record.",
        "Case-by-case standards based on personal preference.",
        "Informal handling of allegations with no official record.",
        "Skipped review checks for faster case closure."
    ],
    "eth_misconduct_gen_003": [
        "Early identification of disciplinary weaknesses and prompt escalation of serious exceptions.",
        "Repeated breaches left to accumulate before any review.",
        "Weak sanctions accepted because the case looks minor.",
        "Undocumented shortcuts in inconvenient cases."
    ],
    "eth_misconduct_gen_004": [
        "Neutrality, integrity, and procedural fairness throughout review.",
        "Personal sympathy determining how rules are applied.",
        "Unwritten understandings in place of recorded procedure.",
        "Incomplete fact-finding treated as enough under pressure."
    ],
    "eth_misconduct_gen_006": [
        "Case tracking, compliance review, and follow-up on unresolved weaknesses.",
        "Closure speed as the only performance measure.",
        "Recurring case-management failures left outside formal review.",
        "Avoidance of written supervision on difficult patterns."
    ]
}


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    updated = []
    for sub in data["subcategories"]:
        for q in sub.get("questions", []):
            qid = q.get("id")
            if qid in UPDATES:
                q["options"] = UPDATES[qid]
                updated.append(qid)
    DATA_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Updated {len(updated)} questions")
    for qid in updated:
        print(qid)


if __name__ == "__main__":
    main()
