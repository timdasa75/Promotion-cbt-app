#!/usr/bin/env python3
"""Round 90: normalize csh_administrative_procedures non-parallel option sets."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "data" / "civil_service_ethics.json"
SUBCATEGORY_ID = "csh_administrative_procedures"

UPDATES = {
    "csh_ap_004": {
        "question": "What is the main value of proper handover during an official transfer?",
        "options": [
            "Personal discretion.",
            "Continuity of duties and accountability.",
            "Indefinite delay of the transfer.",
            "Immediate promotion of the incoming officer.",
        ],
        "explanation": "Proper handover preserves continuity of duties, keeps records current, and makes it clear who is accountable for each stage of the work.",
    },
    "csh_ap_015": {
        "question": "What is the mandatory retirement threshold for officers in the Service?",
        "options": [
            "55 years of age or 30 years of service.",
            "60 years of age or 35 years of pensionable service.",
            "65 years of age for all cadres.",
            "62 years of age or 35 years of service.",
        ],
        "explanation": "The general PSR retirement threshold is 60 years of age or 35 years of pensionable service, whichever comes first.",
    },
    "csh_ap_023": {
        "question": "When may a petition filed more than six months after the decision still be entertained?",
        "options": [
            "Political backing for the petition.",
            "Valid reasons for the delay.",
            "Payment of a fine by the officer.",
            "Existing interdiction of the officer.",
        ],
        "explanation": "A late petition is entertained only where valid reasons are given for the delay; otherwise it falls outside the permitted period.",
    },
    "csh_ap_026": {
        "question": "Who furnishes the performance report of an officer on secondment under PSR 050206?",
        "options": [
            "The parent ministry or extra-ministerial office.",
            "The receiving ministry or extra-ministerial office.",
            "The Federal Civil Service Commission.",
            "The Auditor-General of the Federation.",
        ],
        "explanation": "Under PSR 050206, the receiving ministry or extra-ministerial office is responsible for furnishing the performance report of the seconded officer.",
    },
    "csh_ap_027": {
        "question": "What must delegation of authority preserve while improving efficiency?",
        "options": [
            "Complete transfer of responsibility to subordinates.",
            "Ultimate responsibility of the delegating officer.",
            "Reduced accountability for decisions.",
            "Secrecy of the delegated process.",
        ],
        "explanation": "Delegation may speed up work, but it does not remove the senior officer's ultimate responsibility for what is delegated.",
    },
    "csh_ap_030": {
        "question": "What happens when a petition merely repeats an earlier petition without new relevant matter?",
        "options": [
            "Mandatory referral to the Federal Civil Service Commission.",
            "Refusal to entertain the petition.",
            "Automatic suspension of the officer.",
            "Automatic approval of the petition.",
        ],
        "explanation": "A repeated petition without new relevant matter is not entertained because the review process requires fresh grounds, not repetition alone.",
    },
    "csh_ap_035": {
        "question": "Which authority appraises an officer serving on secondment under the PSR?",
        "options": [
            "The parent MDA only.",
            "The MDA receiving the seconded officer.",
            "The Federal Civil Service Commission.",
            "The Auditor-General of the Federation.",
        ],
        "explanation": "An officer on secondment is appraised by the MDA where the officer is serving during the period of secondment.",
    },
    "csh_ap_039": {
        "question": "What is the government's responsibility where an officer requests posting to the spouse's location under the applicable rule?",
        "options": [
            "Refusal of the request in every case.",
            "Relocation cost where the rule makes the officer's request applicable.",
            "Downgrading of the officer's post before approval.",
            "Transfer of the spouse into federal service first.",
        ],
        "explanation": "Where the rule applies, government bears the relocation cost for a posting made at the officer's request to the spouse's location.",
    },
    "csh_ap_045": {
        "question": "How early must Form Gen. 15A be forwarded when an officer is reverting from acting appointment?",
        "options": [
            "Three working days before cessation of duties.",
            "Two weeks before cessation of the acting appointment.",
            "At the end of the quarter of cessation.",
            "Only after cessation and handover are complete.",
        ],
        "explanation": "The notification on Form Gen. 15A is forwarded not less than two weeks before the acting appointment ceases.",
    },
    "csh_ap_057": {
        "question": "What is the effective date of an acting appointment?",
        "options": [
            "Date of notification to the Commission.",
            "First day of the publication month.",
            "Date the officer assumes the duties of the post.",
            "Date of gazette publication.",
        ],
        "explanation": "The effective date is the date the officer substantively assumes the duties and responsibilities of the acting post.",
    },
    "csh_ap_058": {
        "question": "What is the effect when an officer on acting appointment proceeds on casual or special leave?",
        "options": [
            "Immediate end of the acting appointment.",
            "Automatic extension of the acting appointment.",
            "Suspension of the acting appointment until return.",
            "No relinquishment of the acting duties.",
        ],
        "explanation": "Proceeding on casual or special leave does not mean the officer has relinquished the acting duties under the applicable rule.",
    },
    "csh_ap_062": {
        "question": "What must an Accounting Officer secure in a self-accounting unit?",
        "options": [
            "Transparency and accountability in financial operations.",
            "Minimal record-keeping for faster transactions.",
            "Secret accounts beyond external review.",
            "Freedom from audit once cashbooks balance.",
        ],
        "explanation": "A self-accounting unit must be run with transparent records and accountable financial operations so transactions remain reviewable and controlled.",
    },
    "csh_ap_079": {
        "question": "In a time-sensitive negotiation file, which step best preserves due procedure and an auditable outcome?",
        "options": [
            "Review-control bypass for faster closure.",
            "Continued non-compliance after feedback.",
            "Personal preference in rule application.",
            "Documented commitments reached through principled negotiation.",
        ],
        "explanation": "A time-sensitive file still requires a reviewable record. The strongest approach is to use principled negotiation and document the commitments reached.",
    },
    "csh_ap_080": {
        "question": "In a time-sensitive official file, which step best preserves planning discipline without breaching procedure?",
        "options": [
            "Skipped review checkpoints.",
            "Ignored file comments.",
            "Recorded responsibilities, timelines, and performance measures.",
            "Different rules for similar cases.",
        ],
        "explanation": "Planning discipline is preserved when responsibilities, timelines, and performance measures are recorded without bypassing the required procedure.",
    },
    "csh_ap_087": {
        "question": "A desk officer receives a constitutional-structure file that requires record management. What should be done first?",
        "options": [
            "Personal preference in rule application.",
            "Convenience ahead of legal requirements.",
            "Accurate file updates at each control point.",
            "Bypassed review checkpoints.",
        ],
        "explanation": "The first step is to keep the file accurate and update its status at each control point so audit and oversight can follow the record.",
    },
    "csh_ap_088": {
        "question": "In a time-sensitive constitutional-structure file, which step best preserves legal compliance without breaching process?",
        "options": [
            "Statutory-authority check before sensitive action.",
            "Personal preference in rule application.",
            "Continued non-compliance after feedback.",
            "Bypassed review checkpoints.",
        ],
        "explanation": "Checking statutory authority before acting is the safest way to preserve legal compliance while keeping the file process intact.",
    },
    "csh_ap_089": {
        "question": "A desk officer receives a general-competency and reforms file that requires record management. What should be done first?",
        "options": [
            "Convenience ahead of legal requirements.",
            "Accurate file updates at each control point.",
            "Bypassed review checkpoints.",
            "Personal preference in rule application.",
        ],
        "explanation": "The right first step is to keep the file accurate and current at each control point so later review can follow the record.",
    },
    "csh_ap_090": {
        "question": "How should records generated during any phase of the annual Performance Management cycle be handled?",
        "options": [
            "Immediate destruction under routine controls.",
            "Use only for public consultation.",
            "Administration under sound document and data-management practice.",
            "Automatic transmission to the National Assembly.",
        ],
        "explanation": "Records from the performance-management cycle must be administered in line with sound document and data-management practice so they remain available for review and follow-up.",
    },
    "csh_ap_091": {
        "question": "A desk officer receives a national-events file that requires record management. What should be done first?",
        "options": [
            "Bypassed review checkpoints.",
            "Personal preference in rule application.",
            "Convenience ahead of legal requirements.",
            "Accurate file updates at each control point.",
        ],
        "explanation": "The first requirement is an accurate and current file record so decisions and follow-up remain traceable.",
    },
    "csh_ap_092": {
        "question": "In a time-sensitive national-events file, which step best preserves governance updates without breaching process?",
        "options": [
            "Current tracking of policy changes and service implications.",
            "Continued non-compliance after feedback.",
            "Personal preference in rule application.",
            "Bypassed review checkpoints.",
        ],
        "explanation": "Tracking current policy changes and their service implications keeps the file accurate without bypassing process requirements.",
    },
    "csh_ap_093": {
        "question": "A desk officer receives a dispute-resolution file that requires record management. What should be done first?",
        "options": [
            "Personal preference in rule application.",
            "Accurate file updates at each control point.",
            "Convenience ahead of legal requirements.",
            "Bypassed review checkpoints.",
        ],
        "explanation": "The record should first be brought up to date at each control point so the dispute file remains reviewable and complete.",
    },
    "csh_ap_094": {
        "question": "In a time-sensitive dispute-resolution file, which step best preserves negotiation progress without breaching process?",
        "options": [
            "Personal preference in rule application.",
            "Continued non-compliance after feedback.",
            "Documented commitments reached through principled negotiation.",
            "Bypassed review checkpoints.",
        ],
        "explanation": "Negotiation progress is best preserved by documenting the commitments reached through principled negotiation instead of bypassing process.",
    },
    "csh_ap_095": {
        "question": "A desk officer receives a negotiation-principles file that requires record management. What should be done first?",
        "options": [
            "Accurate file updates at each control point.",
            "Convenience ahead of legal requirements.",
            "Personal preference in rule application.",
            "Bypassed review checkpoints.",
        ],
        "explanation": "The record should first be updated accurately at each control point so the file remains complete for review and follow-up.",
    },
    "csh_ap_096": {
        "question": "In a time-sensitive negotiation-principles file, which step best preserves negotiation progress without breaching process?",
        "options": [
            "Documented commitments reached through principled negotiation.",
            "Bypassed review checkpoints.",
            "Continued non-compliance after feedback.",
            "Personal preference in rule application.",
        ],
        "explanation": "A reviewable record of commitments reached through principled negotiation preserves progress without weakening the process.",
    },
    "csh_ap_097": {
        "question": "A desk officer receives a negotiating-structures file that requires record management. What should be done first?",
        "options": [
            "Bypassed review checkpoints.",
            "Accurate file updates at each control point.",
            "Personal preference in rule application.",
            "Convenience ahead of legal requirements.",
        ],
        "explanation": "The first duty is to maintain an accurate record and update the file at each control point so the process remains auditable.",
    },
    "csh_ap_098": {
        "question": "In a time-sensitive negotiating-structures file, which step best preserves negotiation progress without breaching process?",
        "options": [
            "Personal preference in rule application.",
            "Documented commitments reached through principled negotiation.",
            "Bypassed review checkpoints.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "The best safeguard is a documented record of commitments reached through principled negotiation, not a shortcut around the procedure.",
    },
    "csh_ap_099": {
        "question": "A desk officer receives a public-sector-planning file that requires record management. What should be done first?",
        "options": [
            "Convenience ahead of legal requirements.",
            "Personal preference in rule application.",
            "Bypassed review checkpoints.",
            "Accurate file updates at each control point.",
        ],
        "explanation": "The first administrative step is to keep the file accurate and current at each control point so planning decisions remain traceable.",
    },
    "csh_ap_100": {
        "question": "In a time-sensitive public-sector-planning file, which step best preserves implementation planning without breaching process?",
        "options": [
            "Personal preference in rule application.",
            "Continued non-compliance after feedback.",
            "Recorded responsibilities, timelines, and performance metrics.",
            "Bypassed review checkpoints.",
        ],
        "explanation": "Implementation planning is preserved when responsibilities, timelines, and performance metrics are recorded on the file without breaching process.",
    },
    "csh_ap_101": {
        "question": "How should a file marked 'Confidential' be handled?",
        "options": [
            "Open-registry placement under routine controls.",
            "Restricted access with prescribed security procedures.",
            "Press circulation through policy channels.",
            "General e-mail circulation under workflow rules.",
        ],
        "explanation": "A confidential file must remain under restricted access and be handled only through the prescribed security procedures.",
    },
    "csh_ap_106": {
        "question": "Who is the 'Officer Taking Over' in a handing-over note?",
        "options": [
            "The officer leaving the post.",
            "The Permanent Secretary.",
            "The head of department.",
            "The officer assuming the post.",
        ],
        "explanation": "The 'Officer Taking Over' is the officer assuming the responsibilities of the post from the departing officer.",
    },
    "csh_ap_107": {
        "question": "In a handing-over note, which role receives accountability for taking over the post?",
        "options": [
            "The head of department.",
            "The officer assuming the post.",
            "The officer leaving the post.",
            "The Permanent Secretary.",
        ],
        "explanation": "The receiving accountability rests with the officer taking over the post, because that officer assumes the responsibilities being handed over.",
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
            for key, value in UPDATES[qid].items():
                question[key] = value
            updated += 1
        break
    write_json(TARGET, payload)
    print(f"Applied round 90 rewrites to {updated} questions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
