from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / "data" / "constitutional_foi.json": {
        "clg_general_competency_gen_042": {
            "options": [
                "Checking legal authority and documenting the basis.",
                "Delaying documentation until after action.",
                "Using inconsistent criteria across similar cases.",
                "Bypassing review controls to save time.",
            ],
            "explanation": "Legal compliance is strongest when an officer first confirms the governing authority and records the basis for the decision before acting.",
        },
        "clg_general_competency_gen_057": {
            "options": [
                "Applying controls and documenting the mitigation.",
                "Prioritising convenience over control requirements.",
                "Continuing non-compliance after feedback.",
                "Basing control use on personal preference.",
            ],
            "explanation": "Risk control works only when the control is actually applied and the mitigating step is recorded for later review.",
        },
        "clg_general_competency_gen_067": {
            "options": [
                "Delaying documentation until after action.",
                "Checking legal authority and documenting the basis.",
                "Using inconsistent criteria across similar cases.",
                "Bypassing review controls to save time.",
            ],
            "explanation": "A sensitive constitutional issue should begin with a check of the relevant legal authority and a clear record of the basis for any action taken.",
        },
        "clg_general_competency_gen_077": {
            "options": [
                "Applying controls and documenting the mitigation.",
                "Prioritising convenience over control requirements.",
                "Continuing non-compliance after feedback.",
                "Basing control use on personal preference.",
            ],
            "explanation": "Risk control remains reviewable when the officer can show both the control applied and the mitigation recorded against the issue.",
        },
        "clg_general_competency_gen_085": {
            "options": [
                "Applying controls and documenting the mitigation.",
                "Prioritising convenience over control requirements.",
                "Continuing non-compliance after feedback.",
                "Basing control use on personal preference.",
            ],
            "explanation": "Accountability improves when officers can point to the controls used, the mitigation taken, and the record supporting the decision.",
        },
        "clg_legal_compliance_gen_013": {
            "options": [
                "Applying controls and documenting the mitigation.",
                "Prioritising convenience over control requirements.",
                "Continuing non-compliance after feedback.",
                "Basing control use on personal preference.",
            ],
            "explanation": "Risk control in legal-compliance work depends on applying the control, recording the mitigation, and leaving a reviewable trail.",
        },
        "clg_legal_compliance_gen_036": {
            "options": [
                "Checking legal authority and documenting the basis.",
                "Delaying documentation until after action.",
                "Using inconsistent criteria across similar cases.",
                "Bypassing review controls to save time.",
            ],
            "explanation": "Statutory and constitutional compliance requires the officer to confirm the legal basis first and document it before proceeding.",
        },
        "clg_legal_compliance_gen_051": {
            "options": [
                "Applying controls and documenting the mitigation.",
                "Prioritising convenience over control requirements.",
                "Continuing non-compliance after feedback.",
                "Basing control use on personal preference.",
            ],
            "explanation": "Legal-compliance accountability is stronger when controls are applied consistently and the mitigation is recorded for checking.",
        },
        "clg_legal_compliance_gen_059": {
            "question": "What does the principle of anonymity require in ministerial decisions within the civil service?",
            "options": [
                "Keeping officials from signing official documents.",
                "Keeping officials from identifying themselves at work.",
                "Keeping political responsibility with the Minister.",
                "Keeping ministers unnamed in public documents.",
            ],
            "explanation": "The anonymity principle means civil servants may advise and implement decisions, but political responsibility for the decision remains with the Minister.",
        },
        "clg_legal_compliance_gen_060": {
            "options": [
                "Officials withholding their names in correspondence.",
                "Officials advising and implementing while the Minister bears political responsibility.",
                "Officials avoiding signatures on official documents.",
                "Ministers being omitted from public responsibility.",
            ],
            "explanation": "Anonymity is preserved when officials provide advice and carry out decisions while the Minister remains politically answerable for them.",
        },
        "clg_legal_compliance_gen_067": {
            "options": [
                "Delaying documentation until after action.",
                "Using inconsistent criteria across similar cases.",
                "Checking legal authority and documenting the basis.",
                "Bypassing review controls to save time.",
            ],
            "explanation": "Sensitive statutory work should start with confirming the legal authority and documenting the basis before any further step is taken.",
        },
        "clg_legal_compliance_gen_079": {
            "options": [
                "Prioritising convenience over control requirements.",
                "Applying controls and documenting the mitigation.",
                "Continuing non-compliance after feedback.",
                "Basing control use on personal preference.",
            ],
            "explanation": "Risk control stays reviewable when the controls used and the mitigation taken are both documented in a way that can be checked later.",
        },
        "foi_access_obligations_gen_023": {
            "options": [
                "Checking legal authority and documenting the basis.",
                "Delaying documentation until after action.",
                "Using inconsistent criteria across similar cases.",
                "Bypassing review controls to save time.",
            ],
            "explanation": "FOI access work is legally safer when the officer checks the statutory basis for disclosure or refusal and records the reason for the decision.",
        },
        "FOI_OP_039": {
            "explanation": "Under the FOI Act, the requester whose access was denied is the person with standing to apply to court and challenge that denial.",
        },
        "foi_access_obligations_gen_027": {
            "question": "During routine FOI access operations, which approach most strongly supports accountable implementation?",
            "explanation": "Accountable FOI implementation requires each action to stay within statutory authority and constitutional safeguards so the decision can be defended and reviewed.",
        },
        "foi_exemptions_public_interest_gen_027": {
            "question": "During routine FOI exemptions and public-interest operations, which approach most strongly supports accountable implementation?",
            "explanation": "FOI exemption and public-interest decisions remain accountable when officers stay within statutory authority and constitutional safeguards rather than treating exceptions casually.",
        },
        "foi_offences_penalties_gen_027": {
            "question": "During routine FOI offences, penalties, and enforcement operations, which approach most strongly supports accountable implementation?",
            "explanation": "FOI enforcement stays accountable when officers act within statutory authority and constitutional safeguards instead of improvising outside the legal framework.",
        },
    },
}


def update_file(path: Path, rewrites: dict[str, dict[str, object]]) -> list[str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    updated: list[str] = []

    def walk(node):
        if isinstance(node, dict):
            qid = node.get("id")
            if qid in rewrites:
                node.update(rewrites[qid])
                updated.append(qid)
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)

    walk(data)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return updated


def main() -> None:
    total = 0
    for path, rewrites in FILES.items():
        updated = update_file(path, rewrites)
        print(f"Updated {len(updated)} questions in {path.name}")
        for qid in updated:
            print(qid)
        total += len(updated)
    print(f"Total updated: {total}")


if __name__ == "__main__":
    main()
