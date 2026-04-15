# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TODAY = "2026-04-09"

PROCUREMENT = ROOT / "data" / "public_procurement.json"
PSR = ROOT / "data" / "psr_rules.json"
FINANCE = ROOT / "data" / "financial_regulations.json"

IN_PLACE_UPDATES = {
    "ppa_ims_002": {
        "question": "The **PPA** mandates that contracts must be executed efficiently and in good faith. Which section emphasizes this principle?",
        "options": [
            "Section 32.",
            "Section 35.",
            "Section 40.",
            "Section 53.",
        ],
        "correct": 1,
        "explanation": "Section 35 emphasizes efficient and good-faith implementation of contracts.",
    },
    "ppa_ims_031": {
        "question": "Under Section 35, contract monitoring should verify compliance with contract terms, timeliness, and which overarching principle?",
        "options": [
            "Political alignment.",
            "Efficient and good-faith execution.",
            "Maximum mobilization fee disbursement.",
            "Use of only foreign contractors.",
        ],
        "correct": 1,
        "explanation": "Section 35 emphasizes efficient and good-faith implementation of contracts.",
    },
    "ppa_ims_056": {
        "question": "Which body is responsible for resolving complaints filed by aggrieved bidders?",
        "options": [
            "The National Assembly.",
            "The BPP Audit Section.",
            "The Procurement Complaint Review Committee.",
            "The Federal High Court.",
        ],
        "correct": 2,
        "explanation": "The Procurement Complaint Review Committee handles complaints from aggrieved bidders.",
    },
    "ppa_ims_063": {
        "question": "What sanction applies to a contractor found guilty of fraud, corruption, or collusion under Section 58?",
        "options": [
            "Blacklisting (exclusion from all future federal tenders).",
            "Mandatory staff training.",
            "A written apology.",
            "Automatic reinstatement.",
        ],
        "correct": 0,
        "explanation": "Section 58 requires blacklisting of contractors found guilty of fraud, corruption, or collusion.",
    },
    "ppa_ims_072": {
        "question": "Which bid-evaluation practice best aligns with sound public procurement procedure?",
        "options": [
            "Apply rules inconsistently based on personal preference.",
            "Bypass review and approval controls to save time.",
            "Apply published criteria consistently to all responsive bids.",
            "Ignore feedback and continue non-compliant procedures.",
        ],
        "correct": 2,
        "explanation": "Sound bid evaluation depends on applying the published criteria consistently to every responsive bid rather than introducing arbitrary or undocumented judgment.",
    },
    "ppa_ims_073": {
        "question": "The prohibition on **Contract Splitting** under Section 58(4) is an accountability measure designed to prevent circumvention of what?",
        "options": [
            "The use of SBDs.",
            "Ministerial and FEC approval thresholds.",
            "Mobilization fee limits.",
            "Domestic preference rules.",
        ],
        "correct": 1,
        "explanation": "Contract splitting is prohibited because it prevents circumvention of ministerial and FEC approval thresholds.",
    },
    "ppa_ims_074": {
        "question": "When should implementation, monitoring, and sanctions be handled to keep governance standards proper?",
        "options": [
            "Bypass review and approval controls to save time.",
            "Apply approved implementation, monitoring, and sanctions procedures and keep complete records.",
            "Prioritize convenience over policy and legal requirements.",
            "Ignore feedback and continue non-compliant procedures.",
        ],
        "correct": 1,
        "explanation": "Implementation, monitoring, and sanctions work stays defensible when officers follow the approved procedure and keep complete records of the action taken.",
    },
    "proc_implementation_sanctions_gen_016": {
        "explanation": "Risk control is stronger when identified risks are matched with documented mitigation and follow-up action.",
    },
    "proc_implementation_sanctions_gen_029": {
        "question": "A desk officer handling Implementation, Monitoring & Sanctions receives a case that requires governance. What should be done first while maintaining fairness and legal compliance?",
        "options": [
            "Prioritize convenience over policy and legal requirements.",
            "Bypass review and approval controls to save time.",
            "Apply approved implementation, monitoring, and sanctions procedures and maintain complete records.",
            "Apply rules inconsistently based on personal preference.",
        ],
        "correct": 2,
        "explanation": "Applying the approved procedure and keeping complete records strengthens compliance, consistency, and accountability in implementation, monitoring, and sanctions work.",
    },
}

MOVE_UPDATES = {
    "ppa_ims_022": {
        "target_file": FINANCE,
        "target_subcategory": "fin_audits_sanctions",
        "new_id": "fin_aud_080",
        "question": "What administrative response should follow an Audit Alarm that flags a suspected irregularity in a financial transaction?",
        "options": [
            "Immediate payment of the expense.",
            "A detailed investigation into the irregularity.",
            "Mandatory staff transfer.",
            "A salary increase for the Internal Auditor.",
        ],
        "correct": 1,
        "explanation": "An Audit Alarm should trigger a detailed investigation so the suspected irregularity can be checked before any administrative action is taken.",
        "chapter": "Audits, Sanctions & Compliance - Expansion Set",
        "keywords": ["audit_alarm", "investigation", "financial_control", "internal_audit"],
        "sourceDocument": "Financial Regulations (FR)",
        "sourceSection": "Audits, Sanctions & Compliance",
        "sourceTopicId": "financial_regulations",
        "sourceSubcategoryId": "fin_audits_sanctions",
        "sourceSubcategoryName": "Audits, Sanctions & Compliance",
        "tags": ["fin_audits_sanctions", "financial_regulations", "audit_alarm", "internal_audit"],
        "year": 2009,
    },
    "ppa_ims_061": {
        "target_file": FINANCE,
        "target_subcategory": "fin_audits_sanctions",
        "new_id": "fin_aud_081",
        "question": "What control objective is served by raising an Audit Alarm after a suspected irregularity is detected?",
        "options": [
            "A detailed investigation into the irregularity.",
            "Immediate payment of the expense.",
            "Mandatory staff transfer.",
            "A salary increase for the Internal Auditor.",
        ],
        "correct": 0,
        "explanation": "Raising an Audit Alarm is meant to trigger a detailed investigation into the suspected irregularity.",
        "chapter": "Audits, Sanctions & Compliance - Expansion Set",
        "keywords": ["audit_alarm", "investigation", "financial_control", "internal_audit"],
        "sourceDocument": "Financial Regulations (FR)",
        "sourceSection": "Audits, Sanctions & Compliance",
        "sourceTopicId": "financial_regulations",
        "sourceSubcategoryId": "fin_audits_sanctions",
        "sourceSubcategoryName": "Audits, Sanctions & Compliance",
        "tags": ["fin_audits_sanctions", "financial_regulations", "audit_alarm", "internal_audit"],
        "year": 2009,
    },
    "ppa_ims_025": {
        "target_file": FINANCE,
        "target_subcategory": "fin_audits_sanctions",
        "new_id": "fin_aud_082",
        "question": "Which internal control separates approval, custody, and recording duties in a financial process?",
        "options": [
            "Fiscal consolidation.",
            "Segregation of duties.",
            "Pre-auditing.",
            "Joint account management.",
        ],
        "correct": 1,
        "explanation": "Segregation of duties keeps approval, custody, and recording from being handled by one person.",
        "chapter": "Audits, Sanctions & Compliance - Expansion Set",
        "keywords": ["segregation_of_duties", "internal_control", "fraud_prevention", "financial_control"],
        "sourceDocument": "Financial Regulations (FR)",
        "sourceSection": "Audits, Sanctions & Compliance",
        "sourceTopicId": "financial_regulations",
        "sourceSubcategoryId": "fin_audits_sanctions",
        "sourceSubcategoryName": "Audits, Sanctions & Compliance",
        "tags": ["fin_audits_sanctions", "financial_regulations", "internal_control", "segregation_of_duties"],
        "year": 2009,
    },
    "ppa_ims_075": {
        "target_file": FINANCE,
        "target_subcategory": "fin_audits_sanctions",
        "new_id": "fin_aud_083",
        "question": "Which record provides a chronological trace of financial transactions for accountability and audit review?",
        "options": [
            "IPPIS Platform.",
            "Appropriation Act.",
            "Audit Trail.",
            "Virement Warrant.",
        ],
        "correct": 2,
        "explanation": "An audit trail is the sequential record that makes transactions traceable and verifiable for audit review.",
        "chapter": "Audits, Sanctions & Compliance - Expansion Set",
        "keywords": ["audit_trail", "transaction_trace", "financial_record", "audit_review"],
        "sourceDocument": "Financial Regulations (FR)",
        "sourceSection": "Audits, Sanctions & Compliance",
        "sourceTopicId": "financial_regulations",
        "sourceSubcategoryId": "fin_audits_sanctions",
        "sourceSubcategoryName": "Audits, Sanctions & Compliance",
        "tags": ["fin_audits_sanctions", "financial_regulations", "audit_trail", "records"],
        "year": 2009,
    },
    "ppa_ims_052": {
        "target_file": FINANCE,
        "target_subcategory": "fin_budgeting",
        "new_id": "fin_bgt_081",
        "question": "What policy objective is served by limiting funds brought forward by a Development Fund Supplementary Warrant?",
        "options": [
            "It is unlimited.",
            "It can exceed the estimated total cost of the project.",
            "It must be less than 50% of the project cost.",
            "It must not exceed the estimated total project cost shown in the annual or supplementary estimates.",
        ],
        "correct": 3,
        "explanation": "The limit keeps the brought-forward amount within the estimated total project cost shown in the annual or supplementary estimates.",
        "chapter": "Budgeting & Financial Planning - Expansion Set",
        "keywords": ["development_fund_supplementary_warrant", "budget_limit", "project_cost", "estimates"],
        "sourceDocument": "Financial Regulations (FR)",
        "sourceSection": "Budgeting & Financial Planning",
        "sourceTopicId": "financial_regulations",
        "sourceSubcategoryId": "fin_budgeting",
        "sourceSubcategoryName": "Budgeting & Financial Planning",
        "tags": ["fin_budgeting", "financial_regulations", "budget_control", "estimates"],
        "year": 2007,
    },
    "ppa_ims_040": {
        "target_file": PSR,
        "target_subcategory": "psr_general_admin",
        "new_id": "psr_admin_070",
        "question": "If an officer is charged with a criminal offense, to whom must the officer promptly report it?",
        "options": [
            "The President under established controls.",
            "His Permanent Secretary or Head of Extra-Ministerial Office.",
            "The National Assembly in the evaluation process.",
            "The Central Bank of Nigeria under due-process safeguards.",
        ],
        "correct": 1,
        "explanation": "The PSR requires an officer charged with a criminal offense to report promptly to the Permanent Secretary or Head of Extra-Ministerial Office.",
        "chapter": "General Administration & Office Procedures - Expansion Set",
        "keywords": ["criminal_offense", "reporting", "psr", "general_admin"],
        "sourceDocument": "Public Service Rules (PSR 2021)",
        "sourceSection": "General Administration & Office Procedures",
        "sourceTopicId": "psr",
        "sourceSubcategoryId": "psr_general_admin",
        "sourceSubcategoryName": "General Administration & Office Procedures",
        "tags": ["psr", "psr_general_admin", "criminal_offense", "reporting"],
        "year": 2021,
    },
    "ppa_ims_050": {
        "target_file": PSR,
        "target_subcategory": "psr_general_admin",
        "new_id": "psr_admin_071",
        "question": "Who has overall responsibility for monitoring PSR implementation and compliance across all MDAs?",
        "options": [
            "The Civil Service Commission.",
            "The Office of the Head of Civil Service of the Federation (OHCSF).",
            "The Ministry of Finance.",
            "The Attorney General.",
        ],
        "correct": 1,
        "explanation": "The Office of the Head of the Civil Service of the Federation monitors implementation and compliance with the PSR.",
        "chapter": "General Administration & Office Procedures - Expansion Set",
        "keywords": ["psr", "monitoring", "compliance", "general_admin"],
        "sourceDocument": "Public Service Rules (PSR 2021)",
        "sourceSection": "General Administration & Office Procedures",
        "sourceTopicId": "psr",
        "sourceSubcategoryId": "psr_general_admin",
        "sourceSubcategoryName": "General Administration & Office Procedures",
        "tags": ["psr", "psr_general_admin", "monitoring", "compliance"],
        "year": 2021,
    },
    "ppa_ims_045": {
        "target_file": PSR,
        "target_subcategory": "psr_discipline",
        "new_id": "psr_disc_067",
        "question": "Which disciplinary penalty is expressly prohibited under the PSR, even for misconduct?",
        "options": [
            "Surcharge.",
            "Reduction in rank.",
            "Imposition of fines.",
            "Withholding of increment.",
        ],
        "correct": 2,
        "explanation": "The PSR explicitly prohibits the imposition of fines as a disciplinary punishment for misconduct.",
        "chapter": "Discipline & Misconduct - Expansion Set",
        "keywords": ["discipline", "misconduct", "psr", "fines"],
        "sourceDocument": "Public Service Rules (PSR 2021)",
        "sourceSection": "Discipline & Misconduct",
        "sourceTopicId": "psr",
        "sourceSubcategoryId": "psr_discipline",
        "sourceSubcategoryName": "Discipline & Misconduct",
        "tags": ["psr", "psr_discipline", "discipline", "misconduct"],
        "year": 2021,
    },
}


def find_question_list_and_index(node: object, qid: str):
    if isinstance(node, dict):
        if node.get("questions") and isinstance(node["questions"], list):
            for idx, q in enumerate(node["questions"]):
                if q.get("id") == qid:
                    return node["questions"], idx, q
        for value in node.values():
            if isinstance(value, (dict, list)):
                result = find_question_list_and_index(value, qid)
                if result:
                    return result
    elif isinstance(node, list):
        for item in node:
            result = find_question_list_and_index(item, qid)
            if result:
                return result
    return None


def find_subcategory(node: object, sub_id: str):
    if isinstance(node, dict):
        if node.get("id") == sub_id and "questions" in node:
            return node
        for value in node.values():
            if isinstance(value, (dict, list)):
                result = find_subcategory(value, sub_id)
                if result:
                    return result
    elif isinstance(node, list):
        for item in node:
            result = find_subcategory(item, sub_id)
            if result:
                return result
    return None


def apply_in_place_updates(root: object) -> int:
    changed = 0
    for qid, patch in IN_PLACE_UPDATES.items():
        found = find_question_list_and_index(root, qid)
        if not found:
            raise SystemExit(f"Could not find question {qid}")
        _, _, question = found
        question.update(patch)
        question["lastReviewed"] = TODAY
        changed += 1
    return changed


def move_question(source_root: object, target_root: object, qid: str, config: dict[str, object]) -> None:
    found = find_question_list_and_index(source_root, qid)
    if not found:
        raise SystemExit(f"Could not find question {qid}")
    question_list, idx, question = found
    question_list.pop(idx)

    target_sub = find_subcategory(target_root, config["target_subcategory"])
    if not target_sub:
        raise SystemExit(f"Could not find target subcategory {config['target_subcategory']}")

    moved = deepcopy(question)
    moved.update(
        {
            "id": config["new_id"],
            "question": config["question"],
            "options": config["options"],
            "correct": config["correct"],
            "explanation": config["explanation"],
            "chapter": config["chapter"],
            "keywords": config["keywords"],
            "source": "moved_from_public_procurement",
            "sourceDocument": config["sourceDocument"],
            "sourceSection": config["sourceSection"],
            "year": config["year"],
            "lastReviewed": TODAY,
            "sourceTopicId": config["sourceTopicId"],
            "sourceSubcategoryId": config["sourceSubcategoryId"],
            "sourceSubcategoryName": config["sourceSubcategoryName"],
            "legacyQuestionIds": [qid],
            "tags": config["tags"],
        }
    )
    target_sub["questions"].append(moved)


def main() -> int:
    procurement = json.loads(PROCUREMENT.read_text(encoding="utf-8"))
    psr = json.loads(PSR.read_text(encoding="utf-8"))
    finance = json.loads(FINANCE.read_text(encoding="utf-8"))

    changed = apply_in_place_updates(procurement)
    for qid, config in MOVE_UPDATES.items():
        target_root = psr if config["target_file"] == PSR else finance
        move_question(procurement, target_root, qid, config)
        changed += 1

    expected = len(IN_PLACE_UPDATES) + len(MOVE_UPDATES)
    if changed != expected:
        raise SystemExit(f"expected {expected} updates, applied {changed}")

    PROCUREMENT.write_text(json.dumps(procurement, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    PSR.write_text(json.dumps(psr, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    FINANCE.write_text(json.dumps(finance, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Applied round 169 updates to {changed} questions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
