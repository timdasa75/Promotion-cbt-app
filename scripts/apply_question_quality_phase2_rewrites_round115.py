#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "data" / "constitutional_foi.json"
SUBS = {"foi_exemptions_public_interest", "foi_offences_penalties"}
UPDATES = {}


def opts(index: int, good: str, bad: list[str]) -> list[str]:
    out = list(bad)
    out.insert(index, good)
    return out


def add(qid: str, question: str, correct: int, good: str, bad: list[str], explanation: str, keywords: list[str]) -> None:
    UPDATES[qid] = {
        "question": question,
        "options": opts(correct, good, bad),
        "explanation": explanation,
        "keywords": keywords,
    }


def add_many(specs: list[tuple[str, int, str]], good: str, bad: list[str], explanation: str, keywords: list[str]) -> None:
    for qid, correct, question in specs:
        add(qid, question, correct, good, bad, explanation, keywords)


BAD_RIGHTS = [
    "Broad secrecy without a stated legal basis.",
    "Informal restriction based on convenience.",
    "Inconsistent treatment of similar requests.",
]
BAD_DOC = [
    "Action without complete file records.",
    "Skipped procedure because the matter seemed routine.",
    "Unrecorded review steps under pressure.",
]
BAD_ACC = [
    "Undocumented decisions left to discretion.",
    "Convenience ahead of review accountability.",
    "Unverifiable reasons for withholding action.",
]
BAD_RISK = [
    "Ignored control weaknesses in routine processing.",
    "Unreported exceptions left in the file.",
    "Personal preference ahead of risk review.",
]
BAD_CTRL = [
    "Untracked exceptions after a control failure.",
    "Convenience ahead of control requirements.",
    "Repeated non-compliance after feedback.",
]
BAD_WORKFLOW = [
    "Skipped workflow checks to save time.",
    "Closure before output verification.",
    "Personal preference in routine case handling.",
]
BAD_FILE = [
    "Incomplete file updates after key actions.",
    "Loose documents without status tracking.",
    "Convenience ahead of records control.",
]
BAD_AUTH = [
    "Action before checking the governing legal power.",
    "Undocumented reliance on informal instructions.",
    "Different standards for similar legal questions.",
]
BAD_LAW = [
    "Shortcuts taken outside the governing legal framework.",
    "Review checkpoints bypassed because deadlines were tight.",
    "Convenience placed above statutory safeguards.",
]


add(
    "FOI_EX_012",
    "When may otherwise exempt information be disclosed under Section 28 of the FOI Act?",
    1,
    "When the public interest in disclosure outweighs the harm of disclosure.",
    [
        "When the applicant pays an additional access fee.",
        "When the record has been held for at least five years.",
        "When a Minister gives informal approval.",
    ],
    "Section 28 creates a public-interest override, so exempt information may still be disclosed when the public value of disclosure outweighs the harm the exemption is meant to prevent.",
    ["foi", "section_28", "public_interest_test", "disclosure_override"],
)
add(
    "FOI_EX_017",
    "How are salary and emolument records of public servants generally treated under the FOI Act?",
    1,
    "As information that is generally disclosable in the public interest.",
    [
        "As private information automatically exempt under Section 14.",
        "As trade-secret material protected under Section 15.",
        "As information released only at political discretion.",
    ],
    "Although the Act protects private information, salary and emolument records of public servants are commonly treated as disclosable because they relate to public expenditure and accountability.",
    ["foi", "public_expenditure", "salary_records", "public_accountability"],
)
add(
    "FOI_EX_038",
    "When may information concerning pending criminal proceedings be released?",
    0,
    "When disclosure will not interfere with the investigation or proceedings.",
    [
        "When the Accountant-General grants prior approval.",
        "When the requester separately proves citizenship status.",
        "When all pending proceedings are treated as exempt without qualification.",
    ],
    "The law-enforcement exemption protects pending proceedings only where disclosure would interfere with the investigation or trial, so release remains possible when that risk is absent.",
    ["foi", "pending_proceedings", "law_enforcement_exemption", "interference_test"],
)
add(
    "FOI_EX_046",
    "Which statement correctly describes exemptions under the FOI Act?",
    1,
    "They remain subject to the public-interest override in Section 28.",
    [
        "They are absolute and cannot be displaced.",
        "They apply only to the Executive branch.",
        "They must be interpreted broadly against disclosure.",
    ],
    "FOI exemptions are not absolute. Section 28 requires a public-interest assessment, and the Act expects exemptions to be read narrowly rather than expansively.",
    ["foi", "exemptions", "section_28", "narrow_interpretation"],
)
add(
    "FOI_EX_074",
    "What attitude should a long-serving civil servant avoid after many years in one ministry?",
    0,
    "Treating personal experience as the only view that matters.",
    [
        "Sharing institutional knowledge with newer officers.",
        "Offering constructive suggestions for improvement.",
        "Advising political leadership from an informed professional position.",
    ],
    "Long service should deepen judgment, not harden it into inflexibility. The unhealthy attitude is assuming that personal experience alone settles every issue in the ministry.",
    ["civil_service", "professional_attitude", "institutional_experience", "rigidity"],
)
add(
    "FOI_OP_013",
    "If an institution defends a denial of access in court under Section 20, what must it show in addition to citing an exemption?",
    2,
    "That the public-interest test does not support disclosure.",
    [
        "That the requester obtained prior ministerial approval.",
        "That copying and certification fees were fully paid.",
        "That a similar record exists somewhere else in government.",
    ],
    "A court challenge requires more than naming an exemption. The institution must justify the refusal and show that disclosure is not required once the public-interest test is considered.",
    ["foi", "court_challenge", "burden_of_justification", "public_interest_test"],
)
add(
    "FOI_OP_054",
    "What does clear writing require in official communication?",
    3,
    "Both legibility and clarity of style.",
    [
        "Writing that is hard to follow.",
        "Legibility without clear expression.",
        "Clarity of style without readable presentation.",
    ],
    "Clear writing is not just neat handwriting or simple wording alone. It requires both readable presentation and a style that communicates the message plainly.",
    ["official_writing", "clear_writing", "legibility", "clarity_of_style"],
)
add(
    "FOI_OP_061",
    "Which action best demonstrates public accountability in FOI enforcement work?",
    2,
    "Traceable decisions supported by recorded evidence and reasons.",
    [
        "Ignored feedback after a compliance concern.",
        "Shortcuts taken to avoid review controls.",
        "Convenience placed above legal requirements.",
    ],
    "Public accountability in FOI enforcement depends on decisions that can be traced to evidence, reasons, and the legal basis for the action taken.",
    ["foi", "enforcement", "public_accountability", "traceable_decisions"],
)
add(
    "FOI_OP_066",
    "Which practice best supports legal compliance in FOI enforcement work?",
    0,
    "Checking statutory authority before acting on a sensitive matter.",
    [
        "Applying different standards based on personal preference.",
        "Ignoring compliance feedback after review.",
        "Bypassing approval controls to save time.",
    ],
    "FOI enforcement remains legally defensible when officers confirm the governing legal authority before taking action and do not rely on convenience or informal shortcuts.",
    ["foi", "enforcement", "legal_compliance", "statutory_authority"],
)
add(
    "FOI_OP_069",
    "Which practice best supports documented procedure in FOI enforcement work?",
    2,
    "Following the approved process and keeping complete records.",
    [
        "Applying rules differently from one file to another.",
        "Choosing convenience over the approved procedure.",
        "Skipping review checkpoints to speed up closure.",
    ],
    "Documented procedure is preserved when the approved process is followed and each enforcement step is captured in the file record.",
    ["foi", "enforcement", "documented_procedure", "complete_records"],
)
add(
    "FOI_OP_072",
    "When does the protection in Section 27 not apply to an officer's disclosure?",
    0,
    "When the disclosure is made maliciously or in bad faith.",
    [
        "When the disclosure is made by formal letter.",
        "When the disclosure follows legal advice.",
        "When the disclosure is made to comply with a court order.",
    ],
    "Section 27 protects disclosures made in good faith. That protection falls away where the officer acts maliciously or without good faith.",
    ["foi", "section_27", "good_faith", "malicious_disclosure"],
)

add_many(
    [
        ("foi_exemptions_public_interest_gen_003", 0, "Which practice best supports risk management when an FOI unit handles exemption and public-interest questions?"),
        ("foi_offences_penalties_gen_003", 0, "Which practice best supports risk management in FOI offences, penalties, and enforcement work?"),
    ],
    "Early escalation of material exceptions.",
    BAD_RISK,
    "Risk management is stronger when material exceptions are identified early, escalated promptly, and tracked before they become legal or service failures.",
    ["foi", "risk_management", "material_exceptions", "early_escalation"],
)
add_many(
    [
        ("foi_exemptions_public_interest_gen_007", 0, "Which practice best supports rights balancing when an FOI unit applies exemptions?"),
        ("foi_exemptions_public_interest_gen_025", 0, "Which routine best sustains rights balancing in FOI exemption decisions?"),
        ("foi_offences_penalties_gen_007", 0, "Which practice best supports rights balancing in FOI offences and penalties work?"),
        ("foi_offences_penalties_gen_025", 0, "Which routine best sustains rights balancing in FOI enforcement decisions?"),
    ],
    "Narrow exemptions with a recorded legal basis.",
    BAD_RIGHTS,
    "Rights balancing is most defensible when exemptions are applied narrowly and every restriction is tied to a clear legal basis on the record.",
    ["foi", "rights_balancing", "narrow_exemptions", "legal_basis"],
)
add_many(
    [
        ("foi_exemptions_public_interest_gen_009", 0, "Which practice best supports documented procedure in FOI exemption work?"),
        ("foi_offences_penalties_gen_009", 0, "Which practice best supports documented procedure in FOI enforcement work?"),
    ],
    "Complete records under the approved procedure.",
    BAD_DOC,
    "Documented procedure depends on following the approved process and keeping complete records of each action taken on the case.",
    ["foi", "documented_procedure", "approved_process", "complete_records"],
)
add_many(
    [
        ("foi_exemptions_public_interest_gen_011", 0, "Which action best demonstrates public accountability in FOI exemption decisions?"),
        ("foi_offences_penalties_gen_011", 0, "Which action best demonstrates public accountability in FOI enforcement work?"),
    ],
    "Traceable decisions with recorded reasons.",
    BAD_ACC,
    "Public accountability depends on decisions that can be traced to recorded reasons, supporting facts, and a reviewable legal basis.",
    ["foi", "public_accountability", "traceable_decisions", "recorded_reasons"],
)
add_many(
    [
        ("foi_exemptions_public_interest_gen_013", 0, "Which practice best supports risk control in FOI exemption work?"),
        ("foi_offences_penalties_gen_013", 0, "Which practice best supports risk control in FOI enforcement work?"),
    ],
    "Documented mitigation for identified risks.",
    BAD_CTRL,
    "Risk control is stronger when identified risks are matched with documented mitigation and follow-up action rather than left to informal discretion.",
    ["foi", "risk_control", "documented_mitigation", "follow_up"],
)
add_many(
    [
        ("foi_exemptions_public_interest_gen_015", 0, "Which practice best sustains operational discipline in FOI exemption work?"),
        ("foi_offences_penalties_gen_015", 0, "Which practice best sustains operational discipline in FOI enforcement work?"),
    ],
    "Approved workflow checks before closure.",
    BAD_WORKFLOW,
    "Operational discipline depends on completing approved workflow checks and verifying outputs before a file is closed or advanced.",
    ["foi", "operational_discipline", "workflow_checks", "case_closure"],
)
add_many(
    [
        ("foi_exemptions_public_interest_gen_017", 0, "Which practice best supports record management in FOI exemption work?"),
        ("foi_offences_penalties_gen_017", 0, "Which practice best supports record management in FOI enforcement work?"),
    ],
    "Current files with status updates at each control point.",
    BAD_FILE,
    "Record management is stronger when files stay current and each control point is reflected in a status update that later reviewers can verify.",
    ["foi", "record_management", "current_files", "status_updates"],
)
add_many(
    [
        ("foi_exemptions_public_interest_gen_023", 0, "Which practice best supports legal compliance in FOI exemption work?"),
        ("foi_offences_penalties_gen_023", 0, "Which practice best supports legal compliance in FOI enforcement work?"),
    ],
    "Legal-authority checks with a documented decision basis.",
    BAD_AUTH,
    "Legal compliance is more defensible when officers confirm the governing legal authority before acting and record the basis for the decision clearly.",
    ["foi", "legal_compliance", "statutory_authority", "decision_basis"],
)
add_many(
    [
        ("foi_exemptions_public_interest_gen_026", 2, "When an FOI exemptions unit faces competing priorities, which action best preserves legal defensibility and service quality?"),
        ("foi_offences_penalties_gen_026", 0, "When an FOI enforcement unit faces competing priorities, which action best preserves legal defensibility and service quality?"),
    ],
    "Action kept within statutory authority and constitutional safeguards.",
    BAD_LAW,
    "FOI work remains defensible when action stays within statutory authority and constitutional safeguards even under pressure to act quickly.",
    ["foi", "legal_defensibility", "statutory_authority", "constitutional_safeguards"],
)


data = json.loads(TARGET.read_text(encoding="utf-8"))
updated = 0
for sub in data.get("subcategories", []):
    if sub.get("id") not in SUBS:
        continue
    for question in sub.get("questions", []):
        payload = UPDATES.get(question.get("id"))
        if payload:
            question.update(payload)
            updated += 1

TARGET.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Applied round 115 updates to {updated} questions in {TARGET}")
