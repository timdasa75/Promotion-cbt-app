#!/usr/bin/env python3
"""Round 87: normalize psr_interpretation non-parallel option sets."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "data" / "psr_rules.json"
SUBCATEGORY_ID = "psr_interpretation"

UPDATES = {
    "psr_docx_004": {
        "question": "To what extent do these rules apply to the offices mentioned in Rule 010102?",
        "options": [
            "Full application in every respect.",
            "No application at all.",
            "Application only to the extent that they are not inconsistent with the Constitution.",
            "Application only at the discretion of the officers concerned.",
        ],
        "explanation": "Rule 010102 provides that the rules apply to the listed offices only to the extent that they are not inconsistent with the Constitution.",
        "keywords": ["rule_010102", "constitutional_consistency", "scope_of_application", "psr_interpretation"],
    },
    "psr_docx_008": {
        "question": "What does \"Civil Service of the Federation\" mean?",
        "options": [
            "Service in any government office at any level.",
            "Service of the Federation in a civil capacity in the offices and ministries of the Federal Government, enjoying continuity of existence.",
            "Service in the armed forces of the Federation.",
            "Contract service rendered to the Federal Government.",
        ],
        "explanation": "The Civil Service of the Federation means service of the Federation in a civil capacity in the offices and ministries assigned responsibility for Federal Government business, with continuity of existence.",
        "keywords": ["civil_service_of_the_federation", "civil_capacity", "federal_government", "continuity"],
    },
    "psr_docx_021": {
        "question": "What does \"Pass Mark\" mean?",
        "options": [
            "Minimum score required for initial employment.",
            "Average score recorded in the examination.",
            "Score below which a candidate is considered to have failed the promotion examination, currently 60%.",
            "Highest score obtained in the examination.",
        ],
        "explanation": "Pass mark means the score below which a candidate is regarded as having failed the promotion examination; under the current rule, that threshold is 60%.",
        "keywords": ["pass_mark", "promotion_examination", "60_percent", "psr_interpretation"],
    },
    "psr_docx_022": {
        "question": "Who is a \"Permanent Secretary\" under the Rules?",
        "options": [
            "Political appointee in a ministry.",
            "Officer in charge of day-to-day administration in a ministry or extra-ministerial office, serving as accounting officer and chief policy adviser to the Minister.",
            "General administrative officer in a department.",
            "Junior officer in a ministry.",
        ],
        "explanation": "A Permanent Secretary is the officer in charge of day-to-day administration in a ministry or extra-ministerial office and also serves as accounting officer and chief policy adviser to the Minister.",
        "keywords": ["permanent_secretary", "accounting_officer", "chief_policy_adviser", "psr_interpretation"],
    },
    "psr_docx_030": {
        "question": "Who is a \"Trainee\"?",
        "options": [
            "New employee undergoing probation.",
            "Person appointed to a training post in any grade, including a pupil.",
            "Intern attached to a ministry.",
            "Contract staff undergoing orientation.",
        ],
        "explanation": "A trainee is a person appointed to a training post in any grade, and the term includes a pupil.",
        "keywords": ["trainee", "training_post", "pupil", "psr_interpretation"],
    },
    "psr_docx_055": {
        "question": "Is the employment of unpaid staff allowed?",
        "options": [
            "Allowance under special circumstances.",
            "Allowance with approval of the Head of Service.",
            "Prohibition of the employment of unpaid staff.",
            "Allowance only for contract staff.",
        ],
        "explanation": "The Rules prohibit the employment of unpaid staff; service must be based on an authorized appointment and the applicable conditions of service.",
        "keywords": ["unpaid_staff", "employment_prohibition", "authorized_appointment", "psr_interpretation"],
    },
    "psr_docx_088": {
        "question": "What must an applicant state if the applicant is still in employment?",
        "options": [
            "Reasons for leaving the present job.",
            "Whether the applicant is under any obligation to remain in that employment.",
            "Current job title only.",
            "Name of employer only.",
        ],
        "explanation": "An applicant still in employment must state whether there is any obligation to remain in that employment.",
        "keywords": ["applicant", "existing_employment", "obligation_to_remain", "psr_interpretation"],
    },
    "psr_docx_089": {
        "question": "What must an applicant declare regarding financial status?",
        "options": [
            "Assets and liabilities in full detail.",
            "Whether the applicant is free from financial embarrassment.",
            "Current credit score.",
            "Recent income tax returns.",
        ],
        "explanation": "The applicant must declare whether he or she is free from financial embarrassment, because financial integrity is relevant to appointment into public service.",
        "keywords": ["applicant", "financial_status", "financial_embarrassment", "psr_interpretation"],
    },
    "psr_docx_094": {
        "question": "What is the duty of every Permanent Secretary regarding the Oath of Secrecy?",
        "options": [
            "Administration of the oath to all officers at once.",
            "Ensuring that newly employed officers sign the Oath of Secrecy and that the signed oaths are preserved.",
            "Explanation of the oath without recordkeeping.",
            "Exemption of selected officers from the oath.",
        ],
        "explanation": "Every Permanent Secretary must ensure that newly employed officers sign the Oath of Secrecy and that the signed forms are properly preserved.",
        "keywords": ["permanent_secretary", "oath_of_secrecy", "newly_employed_officers", "record_preservation"],
    },
    "psr_docx_200": {
        "question": "What does an audit trail ensure?",
        "options": [
            "Automated signing of every transaction.",
            "Chronological traceability of all transactions.",
            "Centralized resolution of every dispute.",
            "Automatic annual increments.",
        ],
        "explanation": "An audit trail ensures that transactions are recorded in a way that makes them chronologically traceable for review and control.",
        "keywords": ["audit_trail", "chronological_traceability", "transactions", "psr_interpretation"],
    },
    "psr_interp_006": {
        "question": "What is the meaning of 'officer' under PSR 180106?",
        "options": [
            "Political office holder in public administration.",
            "Person employed in a civil capacity in the Public Service of the Federation.",
            "Member of the armed forces of the Federation.",
            "Contractor or consultant engaged by government.",
        ],
        "explanation": "PSR 180106 defines an officer as a person employed in a civil capacity in the Public Service of the Federation.",
        "keywords": ["officer", "civil_capacity", "public_service_of_the_federation", "psr_180106"],
    },
    "psr_interp_008": {
        "question": "According to PSR 180108, what does the term 'President' refer to?",
        "options": [
            "Head of the Civil Service of the Federation.",
            "President and Commander-in-Chief of the Armed Forces of the Federal Republic of Nigeria.",
            "President of the Senate.",
            "Chairman of the Federal Civil Service Commission.",
        ],
        "explanation": "PSR 180108 uses 'President' to refer to the President and Commander-in-Chief of the Armed Forces of the Federal Republic of Nigeria.",
        "keywords": ["president", "commander_in_chief", "psr_180108", "federal_republic_of_nigeria"],
    },
    "psr_interp_011": {
        "question": "What does 'Public Service' include under PSR 180111?",
        "options": [
            "Only ministries and parastatals under normal usage.",
            "Federal ministries, departments, and agencies under the executive arm.",
            "Private companies contracted by government.",
            "State parastatals under federal rules.",
        ],
        "explanation": "PSR 180111 includes Federal Ministries, Departments, and Agencies under the executive arm in the meaning of Public Service.",
        "keywords": ["public_service", "federal_mdas", "executive_arm", "psr_180111"],
    },
    "psr_interp_020": {
        "question": "According to PSR 180120, what does 'Extra-Ministerial Office' mean?",
        "options": [
            "Private organization carrying out government business.",
            "Federal Government office that does not form part of a ministry.",
            "State parastatal under a ministry.",
            "Non-governmental body recognized by government.",
        ],
        "explanation": "PSR 180120 defines an Extra-Ministerial Office as a Federal Government office that does not form part of a ministry.",
        "keywords": ["extra_ministerial_office", "federal_government_office", "non_ministry_office", "psr_180120"],
    },
    "psr_interp_032": {
        "question": "According to PSR 180132, what does 'Retirement' refer to?",
        "options": [
            "Dismissal from service.",
            "Cessation of service after attainment of statutory age or years of service.",
            "Temporary suspension from duty.",
            "Voluntary leave of absence.",
        ],
        "explanation": "PSR 180132 defines retirement as cessation of service after attaining the statutory age or prescribed years of service.",
        "keywords": ["retirement", "statutory_age", "years_of_service", "psr_180132"],
    },
    "psr_interp_033": {
        "question": "Under PSR 180133, what does 'Discipline' mean?",
        "options": [
            "Punishment only.",
            "Control exercised over conduct to maintain order and efficiency.",
            "Personal development activity.",
            "Training and education programme.",
        ],
        "explanation": "PSR 180133 defines discipline as the control exercised over conduct in order to maintain order and efficiency in service.",
        "keywords": ["discipline", "conduct_control", "order_and_efficiency", "psr_180133"],
    },
    "psr_interp_038": {
        "question": "Under PSR 180138, what do 'Emoluments' mean?",
        "options": [
            "Basic pay only.",
            "Total monetary and non-monetary benefits payable to an officer.",
            "Travel allowances only.",
            "Casual income from official duties.",
        ],
        "explanation": "PSR 180138 defines emoluments as the total monetary and non-monetary benefits payable to an officer.",
        "keywords": ["emoluments", "monetary_benefits", "non_monetary_benefits", "psr_180138"],
    },
    "psr_interp_039": {
        "question": "Under PSR 180139, who maintains the seniority list?",
        "options": [
            "Accountant-General of the Federation.",
            "Each ministry or department under the supervision of the Commission.",
            "Office of the President.",
            "Staff unions in the service.",
        ],
        "explanation": "PSR 180139 provides that each ministry or department maintains the seniority list under the supervision of the Commission.",
        "keywords": ["seniority_list", "ministry", "department", "commission_supervision"],
    },
    "psr_interp_042": {
        "question": "What happens to disciplinary cases pending before the 2021 Rules under PSR 190102?",
        "options": [
            "Automatic nullification of the cases.",
            "Continuation under the old Rules until conclusion.",
            "Automatic reopening under the new Rules.",
            "Automatic dismissal of the cases.",
        ],
        "explanation": "PSR 190102 provides that disciplinary cases pending before the commencement of the 2021 Rules continue under the old Rules until they are concluded.",
        "keywords": ["disciplinary_cases", "pending_cases", "old_rules", "psr_190102"],
    },
    "psr_interpretation_gen_023": {
        "question": "Which option most strongly aligns with good public-service practice on disciplinary process within Interpretation & Commencement?",
        "options": [
            "Due process, fair hearing, and documented decisions.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
        ],
        "explanation": "A sound disciplinary process depends on due process, fair hearing, and documented decisions that can withstand review.",
        "keywords": ["psr", "psr_interpretation", "disciplinary_process", "fair_hearing"],
    },
    "psr_interpretation_gen_025": {
        "question": "Which practice should a responsible officer prioritize to sustain promotion standards in Interpretation & Commencement?",
        "options": [
            "Eligibility confirmation before advancement recommendation.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Promotion standards remain credible when eligibility is confirmed before advancement is recommended.",
        "keywords": ["psr", "psr_interpretation", "promotion_standards", "advancement_review"],
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
    print(f"Applied round 87 rewrites to {updated} questions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
