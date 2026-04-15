import json
from pathlib import Path

DATA_PATH = Path("data/constitutional_foi.json")

UPDATES = {
    "clg_legal_compliance_gen_076": {
        "question": "What is the maximum further extension allowed in exceptional circumstances after a one-year acting appointment?",
        "options": [
            "Three months.",
            "One year.",
            "Two years.",
            "Six months."
        ],
        "explanation": "An acting appointment should not ordinarily exceed one year, though it may be extended once in exceptional circumstances for a further six months.",
        "keywords": ["acting_appointment", "maximum_extension", "exceptional_circumstances", "six_months"]
    },
    "clg_general_competency_gen_074": {
        "question": "Which action best demonstrates sound risk management in general competency, ethics, and reform work?",
        "options": [
            "Apply rules inconsistently based on personal preference.",
            "Identify control gaps early and escalate material exceptions promptly.",
            "Prioritize convenience over policy and legal requirements.",
            "Ignore feedback and continue non-compliant procedures."
        ],
        "explanation": "Risk management is strongest when control gaps are identified early and material exceptions are escalated before they become harder to correct.",
        "keywords": ["risk_management", "general_competency", "control_gaps", "escalation"]
    },
    "clg_general_competency_gen_075": {
        "question": "Which approach best supports compliance in routine general competency, ethics, and reform work?",
        "options": [
            "Delay decisions until issues escalate into avoidable crises.",
            "Close cases without validating facts or keeping proper records.",
            "Treat exceptions as routine without documented justification.",
            "Use lawful criteria and document each decision step transparently."
        ],
        "explanation": "Compliance is strengthened when officers use lawful criteria and document each decision step clearly enough for later review.",
        "keywords": ["compliance", "general_competency", "lawful_criteria", "decision_documentation"]
    },
    "clg_general_competency_gen_077": {
        "question": "Which practice best supports risk control in general competency, ethics, and reforms?",
        "options": [
            "Identify risk early, apply controls, and document mitigation.",
            "Prioritize convenience over policy and legal requirements.",
            "Apply rules inconsistently based on personal preference.",
            "Ignore feedback and continue non-compliant procedures."
        ],
        "explanation": "Risk control requires early identification of risk, active use of appropriate controls, and documentation of how mitigation was applied.",
        "keywords": ["risk_control", "general_competency", "controls", "mitigation"]
    },
    "clg_general_competency_gen_078": {
        "question": "In a time-sensitive file, which step best preserves rights balancing without breaking the workflow?",
        "options": [
            "Apply rules inconsistently based on personal preference.",
            "Bypass review and approval controls to save time.",
            "Ignore feedback and continue non-compliant procedures.",
            "Apply exemptions narrowly and justify decisions with legal basis."
        ],
        "explanation": "Rights balancing is preserved when exemptions are applied narrowly and every decision is supported by a clear legal basis.",
        "keywords": ["rights_balancing", "time_sensitive_file", "narrow_exemptions", "legal_basis"]
    },
    "clg_general_competency_gen_079": {
        "question": "In the civil service, what primarily determines seniority?",
        "options": [
            "The geopolitical zone of origin.",
            "Grade level and date of promotion or appointment.",
            "The age of the officer.",
            "Academic qualifications."
        ],
        "explanation": "Seniority in the civil service is primarily determined by grade level together with the date of promotion or appointment within that level.",
        "keywords": ["seniority", "civil_service", "grade_level", "date_of_promotion"]
    },
    "clg_general_competency_gen_080": {
        "question": "Which practice best supports document management in general competency, ethics, and reform work?",
        "options": [
            "Maintain accurate files and update status at each control point.",
            "Apply rules inconsistently based on personal preference.",
            "Prioritize convenience over policy and legal requirements.",
            "Bypass review and approval controls to save time."
        ],
        "explanation": "Document management is strengthened when files remain accurate and their status is updated consistently at each control point.",
        "keywords": ["document_management", "accurate_files", "status_updates", "control_points"]
    },
    "clg_general_competency_gen_081": {
        "question": "What does the principle of efficiency in service delivery primarily seek to achieve?",
        "options": [
            "That operational records are restricted to confidential circulation.",
            "That all administrative decisions remain politically neutral in content.",
            "That senior officers receive priority treatment over service recipients.",
            "That services meet public needs effectively and deliver value for money."
        ],
        "explanation": "Efficiency in service delivery is concerned with meeting public needs effectively while obtaining value for the resources used.",
        "keywords": ["efficiency", "service_delivery", "public_needs", "value_for_money"]
    },
    "clg_general_competency_gen_082": {
        "question": "Which practice should an accountable officer prioritize to sustain operational discipline?",
        "options": [
            "Apply rules inconsistently based on personal preference.",
            "Follow approved workflows and verify outputs before closure.",
            "Ignore feedback and continue non-compliant procedures.",
            "Bypass review and approval controls to save time."
        ],
        "explanation": "Operational discipline depends on following approved workflows and verifying outputs before a matter is closed.",
        "keywords": ["operational_discipline", "accountable_officer", "approved_workflows", "verification"]
    },
    "clg_general_competency_gen_083": {
        "question": "Which practice best upholds service integrity in general competency, ethics, and reforms?",
        "options": [
            "Rely on informal instructions without documentary evidence.",
            "Close cases without validating facts or keeping proper records.",
            "Avoid conflicts of interest and disclose relevant constraints.",
            "Treat exceptions as routine without documented justification."
        ],
        "explanation": "Service integrity is protected when officers avoid conflicts of interest and disclose any constraint that could affect impartial judgment.",
        "keywords": ["service_integrity", "conflict_of_interest", "disclosure", "general_competency"]
    },
    "clg_general_competency_gen_084": {
        "question": "What system is used to manage digital HR records such as leave, postings, and promotions?",
        "options": [
            "HRMIS.",
            "IPPIS.",
            "TSA.",
            "BPP."
        ],
        "explanation": "The Human Resource Management Information System is designed to manage digital HR records such as leave, postings, and promotions.",
        "keywords": ["hrmis", "digital_hr_records", "postings", "promotions"]
    },
    "clg_general_competency_gen_085": {
        "question": "Which practice best improves accountability through stronger risk control in general competency work?",
        "options": [
            "Identify risk early, apply controls, and document mitigation.",
            "Prioritize convenience over policy and legal requirements.",
            "Ignore feedback and continue non-compliant procedures.",
            "Apply rules inconsistently based on personal preference."
        ],
        "explanation": "Accountability improves when risks are identified early, controls are applied deliberately, and mitigation is documented clearly.",
        "keywords": ["accountability", "risk_control", "general_competency", "mitigation"]
    },
    "clg_general_competency_gen_089": {
        "question": "How long is the mandatory pre-retirement leave for an officer who has given notice of retirement?",
        "options": [
            "One month.",
            "Two months.",
            "Three months.",
            "Six months."
        ],
        "explanation": "An officer who has given notice of retirement is required to proceed on a mandatory pre-retirement leave of three months.",
        "keywords": ["pre_retirement_leave", "retirement_notice", "three_months", "civil_service"]
    },
    "clg_general_competency_gen_090": {
        "question": "Which approach best supports rights balancing in general competency and reform work?",
        "options": [
            "Bypass review and approval controls to save time.",
            "Ignore feedback and continue non-compliant procedures.",
            "Apply exemptions narrowly and justify decisions with legal basis.",
            "Apply rules inconsistently based on personal preference."
        ],
        "explanation": "Rights balancing is stronger when exemptions are used narrowly and each decision is justified with a clear legal basis.",
        "keywords": ["rights_balancing", "narrow_exemptions", "legal_basis", "general_competency"]
    },
    "clg_general_competency_gen_091": {
        "question": "Which practice best protects accountability and consistency in routine general competency work?",
        "options": [
            "Use inconsistent criteria across similar cases.",
            "Treat exceptions as standard practice without justification.",
            "Delay documentation until after implementation.",
            "Apply legal authority checks and document the basis for each decision."
        ],
        "explanation": "Accountability and consistency improve when officers test their decisions against legal authority and document the basis for each one.",
        "keywords": ["accountability", "consistency", "legal_authority", "decision_basis"]
    },
    "clg_general_competency_gen_093": {
        "question": "Which action best supports public-law standards in general competency and reform work?",
        "options": [
            "Delay decisions until issues escalate into avoidable crises.",
            "Treat exceptions as routine without documented justification.",
            "Sustain fairness, reasonableness, and procedural propriety.",
            "Rely on informal instructions without documentary evidence."
        ],
        "explanation": "Public-law standards are upheld when decisions remain fair, reasonable, and procedurally proper.",
        "keywords": ["public_law_standards", "fairness", "reasonableness", "procedural_propriety"]
    },
    "FOI_AO_075": {
        "question": "Which FOI provision allows public institutions to charge fees for duplication and transcription of records?",
        "options": [
            "Section 9(2).",
            "Section 8(1).",
            "Section 5(3).",
            "Section 7(5)."
        ],
        "explanation": "Section 8(1) allows the institution to charge fees that cover the cost of duplicating or transcribing the requested records.",
        "keywords": ["foi_act", "duplication_fees", "transcription_cost", "section_8_1"]
    },
    "FOI_OP_060": {
        "question": "Which public officer has oversight responsibility for FOI Act compliance among public institutions?",
        "options": [
            "Attorney-General of the Federation.",
            "The Minister of Justice.",
            "Bureau of Public Procurement.",
            "Federal Civil Service Commission."
        ],
        "explanation": "The Attorney-General of the Federation has the statutory oversight role for FOI compliance reporting and monitoring among public institutions.",
        "keywords": ["foi_compliance", "attorney_general", "oversight", "public_institutions"]
    },
    "FOI_OP_061": {
        "question": "Which action best demonstrates public accountability under FOI offences, penalties, and enforcement rules?",
        "options": [
            "Ignore feedback and continue non-compliant procedures.",
            "Bypass review and approval controls to save time.",
            "Provide traceable decisions and evidence-based justification.",
            "Prioritize convenience over policy and legal requirements."
        ],
        "explanation": "Public accountability under the FOI regime depends on traceable decisions backed by evidence-based justification rather than undocumented discretion.",
        "keywords": ["public_accountability", "foi_enforcement", "traceable_decisions", "evidence_based_justification"]
    },
    "FOI_OP_063": {
        "question": "If an applicant is denied access under Section 20, how many days do they have to seek redress in court?",
        "options": [
            "14 days.",
            "7 days.",
            "30 days.",
            "60 days."
        ],
        "explanation": "Section 20 gives the applicant 14 days from the denial or deemed denial to seek judicial redress in a court of competent jurisdiction.",
        "keywords": ["section_20", "denial_of_access", "judicial_redress", "14_days"]
    },
    "FOI_OP_065": {
        "question": "Section 29 does not apply where records are destroyed as part of what lawful process?",
        "options": [
            "Falsification processes.",
            "Political appointments.",
            "Records management and retention policies.",
            "Procurement actions."
        ],
        "explanation": "Section 29 targets improper destruction of records tied to pending FOI requests, not lawful destruction carried out under valid records-management and retention policies.",
        "keywords": ["section_29", "record_destruction", "retention_policy", "lawful_process"]
    },
    "FOI_OP_068": {
        "question": "What does Section 27 encourage when it protects officers who disclose information in good faith?",
        "options": [
            "Political patronage.",
            "Proactive compliance and information release.",
            "Strict adherence to the Official Secrets Act only.",
            "Willful destruction of records."
        ],
        "explanation": "By protecting good-faith disclosure, Section 27 encourages proactive compliance and responsible release of information where disclosure is justified.",
        "keywords": ["section_27", "good_faith_disclosure", "proactive_compliance", "information_release"]
    },
    "FOI_OP_069": {
        "question": "Which practice best supports documented procedure in FOI enforcement work?",
        "options": [
            "Apply rules inconsistently based on personal preference.",
            "Prioritize convenience over policy and legal requirements.",
            "Follow documented procedure and keep complete records.",
            "Bypass review and approval controls to save time."
        ],
        "explanation": "Documented procedure is preserved when officers follow the approved process and keep complete records of the actions taken.",
        "keywords": ["documented_procedure", "foi_enforcement", "complete_records", "approved_process"]
    },
    "FOI_OP_071": {
        "question": "Failure to provide records in accessible, machine-readable form under Section 6(2) undermines what objective of the Act?",
        "options": [
            "The calculation of the Contingencies Fund.",
            "The Attorney-General's authority.",
            "The power of the FCSC.",
            "The accessibility objective of the Act."
        ],
        "explanation": "Section 6(2) is tied to accessibility, so failure to provide records in accessible, machine-readable form undermines that objective directly.",
        "keywords": ["section_6_2", "machine_readable_records", "accessibility", "foi_objective"]
    },
    "FOI_OP_072": {
        "question": "When does the protection in Section 27 not apply to an officer's disclosure?",
        "options": [
            "When the disclosure is made in bad faith or maliciously.",
            "When it is made in a formal letter.",
            "When it follows legal advice.",
            "When it is made to comply with a court order."
        ],
        "explanation": "The good-faith protection in Section 27 does not extend to malicious or bad-faith disclosure.",
        "keywords": ["section_27", "bad_faith", "malicious_disclosure", "legal_protection"]
    },
    "FOI_OP_074": {
        "question": "To which legislative body must the Attorney-General submit the annual FOI compliance report?",
        "options": [
            "The House of Representatives only.",
            "The Senate only.",
            "The Economic and Financial Crimes Commission.",
            "The National Assembly."
        ],
        "explanation": "The annual FOI compliance report is submitted to the National Assembly, covering both legislative chambers.",
        "keywords": ["annual_compliance_report", "attorney_general", "national_assembly", "foi_act"]
    },
    "FOI_OP_075": {
        "question": "Which FOI provision stresses that exemptions must be construed narrowly?",
        "options": [
            "Section 32(1).",
            "Section 27(1).",
            "Section 1(2).",
            "Section 28(1)."
        ],
        "explanation": "Section 28(1) underscores the principle that FOI exemptions should be narrowly construed rather than read expansively.",
        "keywords": ["foi_exemptions", "narrow_construction", "section_28_1", "interpretation"]
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
