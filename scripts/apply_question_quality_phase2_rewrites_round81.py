#!/usr/bin/env python3
"""Round 81: normalize psr_discipline non-parallel option sets."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "data" / "psr_rules.json"
SUBCATEGORY_ID = "psr_discipline"

UPDATES = {
    "psr_disc_009": {
        "question": "Who is responsible for initiating disciplinary action against a public officer?",
        "options": [
            "Initiation by the Head of Service in ordinary cases.",
            "Initiation by the Permanent Secretary or Head of Extra-Ministerial Office.",
            "Initiation by the President in routine disciplinary cases.",
            "Initiation by the Auditor-General in ordinary service matters.",
        ],
        "explanation": "PSR 100303 assigns responsibility for initiating disciplinary action to the Permanent Secretary or Head of Extra-Ministerial Office.",
        "keywords": ["disciplinary_authority", "permanent_secretary", "extra_ministerial_office", "psr_100303"],
    },
    "psr_disc_012": {
        "question": "Suspension of an officer is used when what condition exists?",
        "options": [
            "Refusal to attend training.",
            "Investigation of a serious case involving public interest.",
            "Delay in posting arrangements.",
            "Ordinary absence without leave.",
        ],
        "explanation": "PSR 100306 provides that suspension may be used where a serious case involving public interest is under investigation.",
        "keywords": ["suspension", "public_interest", "serious_case", "psr_100306"],
    },
    "psr_disc_019": {
        "question": "In cases involving fraud, falsification, or dishonesty, which agency must be notified?",
        "options": [
            "Notification to the Federal Character Commission.",
            "Notification to the Office of the Auditor-General.",
            "Notification to the Independent Corrupt Practices and Other Related Offences Commission (ICPC).",
            "Notification to the Bureau of Public Service Reforms.",
        ],
        "explanation": "PSR 100307 directs ministries to notify ICPC or another appropriate anti-corruption agency when a case involves fraud, falsification, or dishonesty.",
        "keywords": ["icpc", "fraud_reporting", "dishonesty", "psr_100307"],
    },
    "psr_disc_021": {
        "question": "What happens when an officer under interdiction is found not guilty of the offence?",
        "options": [
            "Continuation of interdiction for record purposes.",
            "Reinstatement with refund of withheld salary.",
            "Compulsory retirement from service.",
            "Closure of file without reinstatement.",
        ],
        "explanation": "PSR 100305 states that when an interdicted officer is exonerated, the officer is reinstated and the balance of salary withheld during interdiction is refunded.",
        "keywords": ["interdiction", "reinstatement", "salary_refund", "psr_100305"],
    },
    "psr_disc_024": {
        "question": "When an officer is suspended, what salary status applies?",
        "options": [
            "No pay during suspension.",
            "Half pay during suspension.",
            "Full pay until conclusion of the case.",
            "One-third pay during suspension.",
        ],
        "explanation": "PSR 100306 states that suspension for a serious offence is normally without pay while the case is under investigation.",
        "keywords": ["suspension", "salary_status", "without_pay", "psr_100306"],
    },
    "psr_disc_025": {
        "question": "If an officer under suspension is acquitted, what should happen?",
        "options": [
            "Continuation of suspension.",
            "Reinstatement with restoration of full salary.",
            "Submission of a separate appeal before return.",
            "Compulsory retirement from service.",
        ],
        "explanation": "PSR 100306(b) requires reinstatement and payment of withheld emoluments when a suspended officer is acquitted.",
        "keywords": ["acquittal", "reinstatement", "full_salary", "psr_100306"],
    },
    "psr_disc_026": {
        "question": "Under the PSR, termination differs from dismissal because what consequence follows termination?",
        "options": [
            "Honourable dismissal with automatic promotion rights.",
            "Payment of benefits that are forfeited on dismissal.",
            "The same consequences as dismissal in every case.",
            "Automatic application to criminal offences only.",
        ],
        "explanation": "PSR 100311 distinguishes termination from dismissal because termination may preserve benefits, while dismissal leads to forfeiture of benefits and disqualification from re-employment.",
        "keywords": ["termination", "dismissal", "benefits", "psr_100311"],
    },
    "psr_disc_028": {
        "question": "An officer may be dismissed without further disciplinary proceedings if what event has occurred?",
        "options": [
            "Conviction by a court of law for a relevant offence.",
            "Receipt of three queries within a year.",
            "Recommendation by a supervisor alone.",
            "Failure in annual performance review.",
        ],
        "explanation": "PSR 100312 allows dismissal without further proceedings where the officer has been convicted by a court for an offence involving dishonesty or moral turpitude.",
        "keywords": ["conviction", "dismissal", "moral_turpitude", "psr_100312"],
    },
    "psr_disc_034": {
        "question": "What should happen to an officer's record after dismissal?",
        "options": [
            "Destruction of the record.",
            "Retention of the record with the dismissal clearly marked.",
            "Forwarding of the record to the civil registry only.",
            "Erasure of the record after five years.",
        ],
        "explanation": "PSR 100311(c) requires the officer's record to be marked as dismissed and retained for administrative reference.",
        "keywords": ["dismissal_record", "administrative_reference", "record_retention", "psr_100311"],
    },
    "psr_disc_039": {
        "question": "If a dismissed officer later wins an appeal, which right is restored under the PSR?",
        "options": [
            "Restoration of gratuity alone.",
            "Restoration of all rights, emoluments, and benefits.",
            "No restoration of benefits after dismissal.",
            "Restoration of half salary only.",
        ],
        "explanation": "PSR 100316(b) provides that a successful appeal restores the officer's rights, emoluments, and benefits as if the dismissal had not occurred.",
        "keywords": ["appeal", "reinstatement_rights", "emoluments", "psr_100316"],
    },
    "psr_disc_043": {
        "question": "If an officer under investigation absconds, what disciplinary action applies?",
        "options": [
            "Indefinite suspension of the case.",
            "Dismissal for desertion.",
            "Salary stoppage with ongoing investigation only.",
            "Transfer to another department.",
        ],
        "explanation": "PSR 100308 treats abscondment as desertion and provides for dismissal where the officer abandons duty while under investigation.",
        "keywords": ["abscondment", "desertion", "dismissal", "psr_100308"],
    },
    "psr_disc_045": {
        "question": "When a disciplinary case involves financial loss to Government, how is the amount treated?",
        "options": [
            "Automatic write-off by Government.",
            "Recovery from the officer after proven culpability.",
            "Equal sharing among officers in the unit.",
            "Payment from the ministry's imprest account.",
        ],
        "explanation": "PSR 100307(b) directs recovery of financial loss from an officer whose culpability has been established through disciplinary proceedings.",
        "keywords": ["financial_loss", "recovery", "culpability", "psr_100307"],
    },
    "psr_disc_051": {
        "question": "What action applies if an officer's date of birth recorded on appointment is changed without due authority?",
        "options": [
            "Suspension from duty.",
            "Termination of appointment.",
            "Treatment as an act of serious misconduct.",
            "No official action.",
        ],
        "explanation": "Rule 020108 states that an unauthorized change of date of birth recorded on appointment is treated as an act of serious misconduct and may lead to dismissal.",
        "keywords": ["date_of_birth", "serious_misconduct", "appointment_record", "rule_020108"],
    },
    "psr_disc_058": {
        "question": "Which statement correctly defines interdiction?",
        "options": [
            "Permanent dismissal from service.",
            "Temporary promotion to another post.",
            "Leave without salary.",
            "Temporary removal from normal duties during dismissal proceedings.",
        ],
        "explanation": "Rule 010105 defines interdiction as the temporary removal of an officer from normal duties while disciplinary proceedings for dismissal are being undertaken or are about to be undertaken, with placement on half salary pending the outcome.",
        "keywords": ["interdiction", "temporary_removal", "disciplinary_proceedings", "rule_010105"],
    },
    "psr_discipline_gen_001": {
        "question": "In Discipline & Misconduct administration, which action best demonstrates sound governance?",
        "options": [
            "Use of approved procedures with complete records.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Sound discipline governance depends on using approved procedures, keeping complete records, and making decisions that can be reviewed later.",
        "keywords": ["psr", "psr_discipline", "governance", "complete_records"],
    },
    "psr_discipline_gen_003": {
        "question": "Which option most strongly aligns with good public-service practice on risk management within Discipline & Misconduct?",
        "options": [
            "Early identification of control gaps with prompt escalation.",
            "Bypassed review and approval controls.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Risk management in discipline cases begins with early identification of control gaps and prompt escalation of material exceptions.",
        "keywords": ["psr", "psr_discipline", "risk_management", "control_gaps"],
    },
    "psr_discipline_gen_007": {
        "question": "For effective Discipline & Misconduct administration, which approach best preserves promotion standards?",
        "options": [
            "Eligibility confirmation before advancement recommendation.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
        ],
        "explanation": "Promotion standards are protected when eligibility is confirmed before any advancement recommendation is made.",
        "keywords": ["psr", "psr_discipline", "promotion_standards", "eligibility_review"],
    },
    "psr_discipline_gen_009": {
        "question": "When handling Discipline & Misconduct matters, which choice best reflects proper documented procedure?",
        "options": [
            "Use of documented procedure with complete recordkeeping.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Proper documented procedure means following the approved steps and keeping complete records that support later review.",
        "keywords": ["psr", "psr_discipline", "documented_procedure", "recordkeeping"],
    },
    "psr_discipline_gen_011": {
        "question": "In Discipline & Misconduct administration, which action best demonstrates public accountability?",
        "options": [
            "Traceable decisions with evidence-based justification.",
            "Bypassed review and approval controls.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Public accountability is strongest when decisions are traceable and supported by evidence-based reasons.",
        "keywords": ["psr", "psr_discipline", "public_accountability", "traceable_decisions"],
    },
    "psr_discipline_gen_013": {
        "question": "Which option most strongly aligns with good public-service practice on risk control within Discipline & Misconduct?",
        "options": [
            "Early risk identification with documented mitigation.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
        ],
        "explanation": "Risk control improves when risks are identified early, mitigation is documented, and corrective action is tracked.",
        "keywords": ["psr", "psr_discipline", "risk_control", "documented_mitigation"],
    },
    "psr_discipline_gen_015": {
        "question": "Which practice should a responsible officer prioritize to sustain operational discipline in Discipline & Misconduct administration?",
        "options": [
            "Approved workflow use with output verification.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
        ],
        "explanation": "Operational discipline is sustained when approved workflows are followed and outputs are checked before closure.",
        "keywords": ["psr", "psr_discipline", "operational_discipline", "workflow_verification"],
    },
    "psr_discipline_gen_017": {
        "question": "For effective Discipline & Misconduct administration, which approach best preserves record management?",
        "options": [
            "Accurate file maintenance with status updates.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Record management is preserved by accurate file maintenance and timely status updates at each control point.",
        "keywords": ["psr", "psr_discipline", "record_management", "status_updates"],
    },
    "psr_discipline_gen_019": {
        "question": "When handling Discipline & Misconduct matters, which choice best reflects proper governance standards?",
        "options": [
            "Use of approved procedures with complete records.",
            "Bypassed review and approval controls.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Proper governance standards require the use of approved procedures, complete records, and decisions that can be reviewed objectively.",
        "keywords": ["psr", "psr_discipline", "governance_standards", "approved_procedures"],
    },
    "psr_discipline_gen_023": {
        "question": "Which option most strongly aligns with good public-service practice on disciplinary process within Discipline & Misconduct?",
        "options": [
            "Due process, fair hearing, and documented decisions.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
        ],
        "explanation": "A sound disciplinary process depends on due process, fair hearing, and documented decisions that can withstand review.",
        "keywords": ["psr", "psr_discipline", "disciplinary_process", "fair_hearing"],
    },
    "psr_discipline_gen_025": {
        "question": "Which practice should a responsible officer prioritize to sustain promotion standards in Discipline & Misconduct administration?",
        "options": [
            "Eligibility confirmation before advancement recommendation.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Promotion standards remain credible when eligibility is confirmed before advancement is recommended.",
        "keywords": ["psr", "psr_discipline", "promotion_standards", "advancement_review"],
    },
    "psr_docx_014": {
        "question": "What does \"Interdiction\" mean under the PSR?",
        "options": [
            "Promotion to a higher post.",
            "Temporary removal from normal duties on half salary during dismissal proceedings.",
            "Ordinary suspension from service.",
            "Transfer to another duty post.",
        ],
        "explanation": "Under Rule 010105, interdiction is the temporary removal of an officer from normal duties while disciplinary proceedings for dismissal are being undertaken or are about to be undertaken, with placement on half salary pending determination.",
        "keywords": ["interdiction", "temporary_removal", "half_salary", "rule_010105"],
    },
    "psr_docx_226": {
        "question": "When may Government refuse a resignation?",
        "options": [
            "No circumstance at all.",
            "Pending disciplinary proceedings against the officer.",
            "Presidential approval requirement alone.",
            "Occupancy of a sensitive position alone.",
        ],
        "explanation": "Government may refuse a resignation when disciplinary proceedings are pending against the officer, because the case must first be resolved under the applicable rules.",
        "keywords": ["resignation", "disciplinary_proceedings", "government_refusal", "psr_discipline"],
    },
    "psr_docx_235": {
        "question": "What condition justifies interdiction?",
        "options": [
            "Mere suspicion without a prima facie case.",
            "Pending dismissal proceedings with a prima facie case.",
            "Commission of a minor offence only.",
            "Routine administrative review.",
        ],
        "explanation": "Interdiction is justified where dismissal proceedings are being undertaken or are about to be undertaken and a prima facie case exists.",
        "keywords": ["interdiction", "prima_facie_case", "dismissal_proceedings", "psr_discipline"],
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
            question["question"] = patch["question"]
            question["options"] = patch["options"]
            question["explanation"] = patch["explanation"]
            question["keywords"] = patch["keywords"]
            updated += 1
        break
    write_json(TARGET, payload)
    print(f"Applied round 81 rewrites to {updated} questions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
