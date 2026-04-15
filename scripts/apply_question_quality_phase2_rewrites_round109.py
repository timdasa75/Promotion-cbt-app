#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "data" / "civil_service_ethics.json"
SUB = "csh_innovation_technology"
UPDATES = {}


def opts(i, good, bad):
    out = list(bad)
    out.insert(i, good)
    return out


def add(qid, q, i, good, bad, exp, kw):
    UPDATES[qid] = {
        "question": q,
        "options": opts(i, good, bad),
        "explanation": exp,
        "keywords": kw,
    }


BAD_DOC = [
    "Personal preference in procedure use.",
    "Bypassed review checkpoints.",
    "Convenience ahead of legal requirements.",
]
BAD_ACC = [
    "Unrecorded decisions under pressure.",
    "Convenience ahead of review duty.",
    "Inconsistent criteria across similar cases.",
]
BAD_RISK = [
    "Unreported exceptions in routine work.",
    "Convenience ahead of risk review.",
    "Personal preference in risk handling.",
]
BAD_CTRL = [
    "Convenience ahead of control requirements.",
    "Repeated non-compliance after feedback.",
    "Personal preference in control use.",
]
BAD_WORKFLOW = [
    "Skipped workflow checks under pressure.",
    "Personal preference in workflow steps.",
    "Repeated non-compliance after feedback.",
]
BAD_FILE = [
    "Personal preference in filing practice.",
    "Bypassed review checkpoints.",
    "Convenience ahead of documentation standards.",
]
BAD_DISC = [
    "Rules applied selectively for convenience.",
    "Known controls bypassed to save time.",
    "Informal practice accepted instead of approved process.",
]
BAD_GRIEV = [
    "Complaints ignored until they escalate.",
    "Undocumented verbal assurances only.",
    "Personal preference instead of approved review channels.",
]

# Generated governance shell
add(
    "csh_innovation_technology_gen_001",
    "Which practice best strengthens governance in public-service technology administration?",
    0,
    "Approved procedures with complete implementation records.",
    BAD_DOC,
    "Governance is stronger when technology administration follows approved procedures and keeps the records needed for review, continuity, and accountability.",
    ["csh_innovation_technology", "governance", "approved_procedure", "complete_records"],
)
add(
    "csh_innovation_technology_gen_003",
    "Which practice best supports risk management in public-service technology administration?",
    0,
    "Early escalation of material system-control exceptions.",
    BAD_RISK,
    "Risk management improves when material system-control exceptions are identified early, escalated promptly, and tracked for follow-up.",
    ["csh_innovation_technology", "risk_management", "system_control_exceptions", "escalation"],
)
add(
    "csh_innovation_technology_gen_007",
    "Which routine best sustains discipline in the use of public-service technology systems?",
    0,
    "Consistent compliance with approved use and review controls.",
    BAD_DISC,
    "Discipline in technology use depends on consistent compliance with approved controls instead of shortcuts or informal practice.",
    ["csh_innovation_technology", "discipline", "approved_controls", "compliance"],
)
add(
    "csh_innovation_technology_gen_009",
    "Which practice best supports documented procedure in public-service technology administration?",
    0,
    "Complete records under the approved procedure.",
    BAD_DOC,
    "Documented procedure depends on following the approved process and keeping complete records of the steps taken.",
    ["csh_innovation_technology", "documented_procedure", "approved_process", "complete_records"],
)
add(
    "csh_innovation_technology_gen_011",
    "Which action best demonstrates public accountability in public-service technology administration?",
    0,
    "Traceable decisions with recorded reasons.",
    BAD_ACC,
    "Public accountability depends on decisions that can be traced to recorded reasons and supporting evidence.",
    ["csh_innovation_technology", "public_accountability", "traceable_decisions", "recorded_reasons"],
)
add(
    "csh_innovation_technology_gen_013",
    "Which practice best supports risk control in public-service technology administration?",
    0,
    "Documented mitigation for identified control risks.",
    BAD_CTRL,
    "Risk control is stronger when identified system risks are matched with documented mitigation and follow-up action.",
    ["csh_innovation_technology", "risk_control", "documented_mitigation", "follow_up"],
)
add(
    "csh_innovation_technology_gen_015",
    "Which routine best sustains operational discipline in public-service technology administration?",
    0,
    "Approved workflow checks before closure.",
    BAD_WORKFLOW,
    "Operational discipline depends on completing approved workflow checks before a matter is closed or advanced.",
    ["csh_innovation_technology", "operational_discipline", "workflow_checks", "case_closure"],
)
add(
    "csh_innovation_technology_gen_017",
    "Which practice best supports record management in public-service technology administration?",
    0,
    "Current files with status updates at each control point.",
    BAD_FILE,
    "Record management depends on keeping files current and updating status at each control point so the matter remains reviewable.",
    ["csh_innovation_technology", "record_management", "current_files", "status_updates"],
)
add(
    "csh_innovation_technology_gen_019",
    "Which routine best strengthens governance discipline in public-service technology administration?",
    0,
    "Approved procedures with complete governance records.",
    BAD_DOC,
    "Governance discipline is strongest when officers use the approved procedure consistently and keep the records needed for review and continuity.",
    ["csh_innovation_technology", "governance_discipline", "approved_procedure", "governance_records"],
)
add(
    "csh_innovation_technology_gen_023",
    "Which practice best supports grievance handling when a technology-service decision affects staff or users?",
    0,
    "Prompt review through the approved complaint channel.",
    BAD_GRIEV,
    "Grievance handling is strongest when complaints are reviewed promptly through the approved channel and documented for follow-up.",
    ["csh_innovation_technology", "grievance_handling", "approved_channel", "follow_up"],
)
add(
    "csh_innovation_technology_gen_025",
    "Which routine best sustains conduct standards in the use of public-service technology systems?",
    0,
    "Consistent compliance with approved conduct controls.",
    BAD_DISC,
    "Conduct standards are sustained when officers apply the approved controls consistently instead of treating system use as an area for informal discretion.",
    ["csh_innovation_technology", "conduct_standards", "approved_controls", "consistent_compliance"],
)

# Factual tail
add(
    "csh_it_006",
    "What is the main e-governance effect of the Treasury Single Account (TSA)?",
    1,
    "Consolidated government accounts for stronger revenue monitoring.",
    [
        "Decentralized government accounts across ministries.",
        "Manual retirement-benefit processing.",
        "Foreign-currency salary payment for civil servants.",
    ],
    "The Treasury Single Account strengthens e-governance by consolidating government accounts so revenue can be monitored more transparently and leakages can be reduced.",
    ["tsa", "e_governance", "revenue_monitoring", "account_consolidation"],
)
add(
    "csh_it_024",
    "In cybersecurity, what is a zero-day vulnerability?",
    1,
    "An unknown vulnerability for which no vendor fix is yet available.",
    [
        "A fully patched and secured system.",
        "A routine software update released by the vendor.",
        "A scheduled penetration test for network security.",
    ],
    "A zero-day vulnerability is one that is unknown to the vendor or defenders and therefore has no patch available at the time it is discovered or exploited.",
    ["cybersecurity", "zero_day", "vulnerability", "unpatched_risk"],
)
add(
    "csh_it_046",
    "Why is the National Identity Number (NIN) integrated into systems such as IPPIS?",
    1,
    "Unique identification and stronger data integrity for staff records.",
    [
        "Automatic exemption from the Public Service Rules.",
        "Foreign-allowance eligibility for public officers.",
        "Reduced staff turnover through payroll policy.",
    ],
    "NIN integration supports unique identification and stronger data integrity across public-service records and payroll-linked systems.",
    ["nin", "ippis", "data_integrity", "unique_identification"],
)
add(
    "csh_it_057",
    "Under Financial Regulation 125, what remains with a Revenue Collector after duty is delegated?",
    1,
    "Pecuniary responsibility for the delegated duty.",
    [
        "Only the right to delegate the same task again.",
        "Freedom from accountability once the instruction is written.",
        "Responsibility only when the substitute is not also a collector.",
    ],
    "Delegation does not remove the Revenue Collector's pecuniary responsibility; the officer remains accountable for the delegated duty.",
    ["financial_regulation_125", "revenue_collector", "delegation", "pecuniary_responsibility"],
)
add(
    "csh_it_059",
    "How should deposits held in foreign currency be treated in official accounting procedure?",
    3,
    "The same way as deposits held in local currency.",
    [
        "Immediate conversion to naira in every case.",
        "Exclusion from the normal accounting rules.",
        "Transfer outside accounting procedure to the Central Bank alone.",
    ],
    "Foreign-currency deposits remain subject to the same accounting discipline as local-currency deposits, so they should be handled under the normal official procedure.",
    ["foreign_currency_deposits", "official_accounting", "financial_procedure", "deposit_control"],
)
add(
    "csh_it_060",
    "Under Financial Regulation 1419, what is the consequence when an officer fails to secure full repayment of an advance?",
    2,
    "Possible disciplinary action for non-compliance.",
    [
        "Automatic conversion of the advance into a grant.",
        "Automatic extension without further review.",
        "Transfer of the outstanding balance to another department.",
    ],
    "Failure to secure full repayment of an advance is treated as non-compliance with financial rules and may attract disciplinary action.",
    ["financial_regulation_1419", "advance_repayment", "disciplinary_action", "financial_compliance"],
)
add(
    "csh_it_061",
    "What may happen when an Accounting Officer in a self-accounting unit fails to comply with the Financial Regulations?",
    3,
    "Disciplinary action and possible surcharge.",
    [
        "A verbal warning only.",
        "Automatic loss of the unit's self-accounting status.",
        "No consequence because the unit is self-accounting.",
    ],
    "Failure to comply with the Financial Regulations may attract disciplinary action and surcharge, even in a self-accounting unit.",
    ["accounting_officer", "self_accounting_unit", "financial_regulations", "surcharge"],
)
add(
    "csh_it_067",
    "What does responsiveness mean as a principle of service delivery?",
    3,
    "Serving stakeholders within a reasonable time.",
    [
        "Serving only those who ask first.",
        "Serving only powerful stakeholders.",
        "Delaying services as much as possible.",
    ],
    "Responsiveness means public institutions and processes should serve stakeholders within a reasonable time rather than delaying action unnecessarily.",
    ["service_delivery", "responsiveness", "stakeholders", "reasonable_time"],
)
add(
    "csh_it_068",
    "What remains the chief accountability of federal employees even when union activities exist?",
    1,
    "Discharging assigned duties to the public efficiently and on time.",
    [
        "Ensuring union executives are posted to preferred locations.",
        "Attending every union meeting as a condition of service.",
        "Reporting directly to the Head of Service on union affairs.",
    ],
    "Whatever union activities exist, the chief accountability of employees remains the timely and efficient discharge of duties assigned to them for service to the public.",
    ["union_activities", "public_service_duty", "timely_service", "employee_accountability"],
)
add(
    "csh_it_073",
    "Why is it dangerous for a civil servant to accept gifts from contractors or business people?",
    0,
    "It can compromise official integrity and create conflict of interest.",
    [
        "It is simply an act of kindness in official business.",
        "It is a normal feature of contractor relations.",
        "It is a reliable way to build workplace relationships.",
    ],
    "Accepting gifts from contractors or business people can compromise a civil servant's integrity and create a conflict between official duty and private influence.",
    ["gifts", "contractors", "integrity", "conflict_of_interest"],
)


def main():
    data = json.loads(TARGET.read_text(encoding="utf-8"))
    updated = 0
    found = set()
    for sub in data.get("subcategories", []):
        if sub.get("id") != SUB:
            continue
        for q in sub.get("questions", []):
            patch = UPDATES.get(q.get("id"))
            if not patch:
                continue
            q.update(patch)
            updated += 1
            found.add(q.get("id"))
        break
    else:
        raise RuntimeError(f"Missing subcategory: {SUB}")

    missing = sorted(set(UPDATES) - found)
    if missing:
        raise RuntimeError(f"Missing questions: {missing}")

    TARGET.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Applied round 109 rewrites to {updated} questions")


if __name__ == "__main__":
    main()
