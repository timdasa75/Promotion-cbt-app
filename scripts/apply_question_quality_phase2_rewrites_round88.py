#!/usr/bin/env python3
"""Round 88: normalize psr_retirement non-parallel option sets."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "data" / "psr_rules.json"
SUBCATEGORY_ID = "psr_retirement"

UPDATES = {
    "psr_docx_238": {
        "question": "What happens on the death of an officer while in service?",
        "options": [
            "Continuation of the appointment.",
            "Termination of service by reason of death.",
            "Automatic employment of the next of kin.",
            "Treatment as ordinary retirement.",
        ],
        "explanation": "Death while in service brings the appointment to an end by reason of death; it is not treated as continued service or ordinary retirement.",
        "keywords": ["death_in_service", "termination_by_death", "psr_retirement", "service_end"],
    },
    "psr_ret_006": {
        "question": "How much notice must an officer give before resignation under PSR 080106?",
        "options": [
            "One month's notice.",
            "Two months' notice.",
            "Three months' notice or one month's salary in lieu.",
            "Six months' notice.",
        ],
        "explanation": "PSR 080106 requires an officer to give three months' notice before resignation or to pay one month's salary in lieu where the rule so permits.",
        "keywords": ["resignation", "notice_period", "three_months", "psr_080106"],
    },
    "psr_ret_007": {
        "question": "What applies to an officer under disciplinary proceedings under PSR 080107?",
        "options": [
            "Immediate resignation from service.",
            "Withdrawal of a submitted resignation at will.",
            "Inability to resign until the disciplinary case is concluded.",
            "Voluntary retirement during the proceedings.",
        ],
        "explanation": "PSR 080107 prevents an officer from resigning while disciplinary proceedings are pending until the case has been concluded.",
        "keywords": ["disciplinary_proceedings", "resignation_bar", "psr_080107", "case_conclusion"],
    },
    "psr_ret_009": {
        "question": "According to PSR 080109, when may termination of appointment occur?",
        "options": [
            "Death in service.",
            "Finding that the officer is unfit for service or redundant.",
            "Promotion to a higher grade.",
            "Election of a new government.",
        ],
        "explanation": "PSR 080109 allows termination where the officer is found unfit for service or redundant under the applicable service rules.",
        "keywords": ["termination", "unfitness", "redundancy", "psr_080109"],
    },
    "psr_ret_011": {
        "question": "Under PSR 080111, retirement benefits are payable only to officers who meet what condition?",
        "options": [
            "Confirmation on a pensionable appointment.",
            "Less than ten years of service.",
            "Status of probation only.",
            "Dismissal for misconduct.",
        ],
        "explanation": "PSR 080111 makes retirement benefits payable only to officers on pensionable appointment who satisfy the conditions for those benefits.",
        "keywords": ["retirement_benefits", "pensionable_appointment", "confirmation", "psr_080111"],
    },
    "psr_ret_012": {
        "question": "According to PSR 080112, what is the effective date of retirement?",
        "options": [
            "Date of submission of the retirement application.",
            "Date of approval by the authority.",
            "End of the month in which the officer attains the retirement age or service year.",
            "Any day chosen by the officer.",
        ],
        "explanation": "PSR 080112 provides that retirement takes effect at the end of the month in which the officer attains the relevant retirement age or required years of service.",
        "keywords": ["retirement_effective_date", "end_of_month", "statutory_age", "psr_080112"],
    },
    "psr_ret_013": {
        "question": "What notice should an officer due for retirement give under PSR 080113?",
        "options": [
            "One month's notice.",
            "Six months' notice or one month's salary in lieu.",
            "Three months' notice.",
            "No notice at all.",
        ],
        "explanation": "PSR 080113 directs an officer due for retirement to give six months' notice or pay one month's salary in lieu where applicable.",
        "keywords": ["retirement_notice", "six_months", "salary_in_lieu", "psr_080113"],
    },
    "psr_ret_017": {
        "question": "Under PSR 080117, when does an officer's pension become payable?",
        "options": [
            "Immediately after resignation.",
            "On attaining the age specified in the Pension Reform Act.",
            "Only after ten years without employment.",
            "After three years of unemployment.",
        ],
        "explanation": "PSR 080117 links pension payment to the age and conditions stipulated in the Pension Reform Act.",
        "keywords": ["pension_payment", "pension_reform_act", "retirement_age", "psr_080117"],
    },
    "psr_ret_018": {
        "question": "Which category of officer is prohibited from receiving double pension benefits under PSR 080118?",
        "options": [
            "Officer who served in two pensionable positions concurrently.",
            "Officer promoted twice in one year.",
            "Officer who served abroad.",
            "Officer with political affiliation.",
        ],
        "explanation": "PSR 080118 prohibits the receipt of double pension benefits by an officer who has served in two pensionable positions in a way that would create overlapping pension entitlement.",
        "keywords": ["double_pension", "pensionable_positions", "psr_080118", "retirement_benefits"],
    },
    "psr_ret_026": {
        "question": "According to PSR 080126, retirement does not take effect until what condition is satisfied?",
        "options": [
            "Clearing of the officer's file alone.",
            "Return of all government property in the officer's custody.",
            "Signing of a new posting form.",
            "Submission of pension application.",
        ],
        "explanation": "PSR 080126 provides that retirement does not take effect until all government property in the officer's custody has been returned.",
        "keywords": ["retirement_effect", "government_property", "handover", "psr_080126"],
    },
    "psr_ret_037": {
        "question": "Under PSR 080137, gratuity is not payable to officers in which situation?",
        "options": [
            "Annual leave status.",
            "Dismissal for misconduct.",
            "Honourable resignation.",
            "Normal retirement.",
        ],
        "explanation": "PSR 080137 withholds gratuity from an officer who is dismissed for misconduct.",
        "keywords": ["gratuity", "dismissal_for_misconduct", "psr_080137", "retirement_benefits"],
    },
    "psr_ret_046": {
        "question": "Under PSR 080146, what should an officer do where pension overpayment occurs?",
        "options": [
            "Face immediate prosecution in every case.",
            "Refund the excess through deduction or an approved payment arrangement.",
            "Retain the excess without consequence.",
            "Ignore the excess until the next audit.",
        ],
        "explanation": "PSR 080146 requires the excess pension to be refunded, either through deduction or another approved recovery arrangement.",
        "keywords": ["pension_overpayment", "refund", "recovery", "psr_080146"],
    },
    "psr_ret_048": {
        "question": "Under PSR 080148, for what purpose may retirees be called back?",
        "options": [
            "Contract or advisory service where their skills are required.",
            "Political campaign activity.",
            "Training of new entrants only.",
            "Voluntary community work only.",
        ],
        "explanation": "PSR 080148 allows retirees to be called back for contract or advisory service when their skills and experience are still required.",
        "keywords": ["retiree_recall", "contract_service", "advisory_service", "psr_080148"],
    },
    "psr_ret_051": {
        "question": "Can a contract officer on a non-pensionable appointment be required to sit for the compulsory confirmation examination?",
        "options": [
            "No, because the examination applies to officers on pensionable appointments who are on probation.",
            "Yes, if the officer wishes to convert to a pensionable appointment.",
            "Yes, if the contract expressly provides for it.",
            "Yes, because it is mandatory for all officers.",
        ],
        "explanation": "Rule 030501 confines the compulsory confirmation examination to officers on pensionable appointment who are on probation, so it does not apply to contract officers on non-pensionable appointment.",
        "keywords": ["contract_officer", "non_pensionable_appointment", "confirmation_examination", "rule_030501"],
    },
    "psr_ret_052": {
        "question": "Must an officer on probation on a pensionable appointment who is already a confirmed member of the JSC or SSC sit for the confirmation examination?",
        "options": [
            "Yes, but only one paper is required.",
            "Yes, because the examination remains mandatory.",
            "No, because the officer is exempt from the examination.",
            "No clear rule is provided on the matter.",
        ],
        "explanation": "The applicable rule exempts a probationary officer on a pensionable appointment who is already a confirmed member of the JSC or SSC from the confirmation examination.",
        "keywords": ["confirmation_examination", "jsc_ssc_member", "exemption", "psr_retirement"],
    },
    "psr_ret_053": {
        "question": "Who is required to pass the compulsory confirmation examinations under this section?",
        "options": [
            "Only officers on GL 07 and above.",
            "Officers on pensionable appointment who are on probation.",
            "Only officers on GL 06 and below.",
            "All officers in the Public Service.",
        ],
        "explanation": "Rule 030501 requires officers on pensionable appointment who are on probation to pass the compulsory confirmation examinations.",
        "keywords": ["compulsory_confirmation_examination", "probation", "pensionable_appointment", "rule_030501"],
    },
    "psr_ret_055": {
        "question": "What does the term 'officer' mean when used without qualification?",
        "options": [
            "Staff in an established post on pensionable or contract terms.",
            "Any person employed by the Federal Government.",
            "Consultant engaged by government.",
            "Person on a short-term engagement only.",
        ],
        "explanation": "Rule 010106 defines 'officer' without qualification as staff in an established post, whether on pensionable or contract terms.",
        "keywords": ["officer_definition", "established_post", "pensionable_or_contract", "rule_010106"],
    },
    "psr_ret_057": {
        "question": "From when does the term of engagement for a non-pensionable appointment commence?",
        "options": [
            "Date of the offer of appointment.",
            "Date the officer signs the contract.",
            "Date of assumption of duty.",
            "Date the contract is approved.",
        ],
        "explanation": "Rule 021201 states that the term of engagement for a non-pensionable appointment runs from the date of assumption of duty.",
        "keywords": ["non_pensionable_appointment", "term_of_engagement", "assumption_of_duty", "rule_021201"],
    },
    "psr_ret_058": {
        "question": "What must the duties of an officer on a non-pensionable appointment include?",
        "options": [
            "Only the usual duties of the office.",
            "Only additional duties assigned by government.",
            "Both the usual duties of the office and any other duties assigned by government.",
            "Only the duties expressly listed in a gazette notice.",
        ],
        "explanation": "Rule 021203 provides that the duties of a person on non-pensionable appointment include both the usual duties of the office and any other duties the Government may call upon the person to perform.",
        "keywords": ["non_pensionable_appointment", "duties", "usual_duties", "rule_021203"],
    },
    "psr_ret_064": {
        "question": "How do the Rules define a contract appointment?",
        "options": [
            "Temporary appointment with pension provision.",
            "Temporary job of any kind.",
            "Temporary appointment with pension attached to the post.",
            "Temporary appointment to a post for which pension provision is not made.",
        ],
        "explanation": "Rule 020402 defines a contract appointment as a temporary appointment to a post for which provision is not made for the payment of a pension.",
        "keywords": ["contract_appointment", "temporary_appointment", "no_pension_provision", "rule_020402"],
    },
    "psr_retirement_gen_013": {
        "question": "Which practice best supports risk control in separation, retirement, and pension administration?",
        "options": [
            "Early risk identification with documented mitigation.",
            "Convenience ahead of policy requirements.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
        ],
        "explanation": "Risk control in separation, retirement, and pension administration depends on early identification of risks, documented mitigation, and consistent application of the rules.",
        "keywords": ["psr", "psr_retirement", "risk_control", "documented_mitigation"],
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
    print(f"Applied round 88 rewrites to {updated} questions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
