import json
from pathlib import Path

DATA_PATH = Path("data/civil_service_ethics.json")
SUBCATEGORY_ID = "csh_administrative_procedures"

UPDATES = {
    "csh_administrative_procedures_gen_001": {
        "question": "Which practice best demonstrates sound administrative procedure in government service?",
        "options": [
            "Following approved procedures and keeping complete records.",
            "Acting on personal preference instead of established rules.",
            "Skipping review and approval steps to save time.",
            "Putting convenience ahead of policy and legal requirements."
        ],
        "explanation": "Sound administrative procedure requires approved process steps to be followed and properly documented so decisions remain lawful, traceable, and reviewable.",
        "keywords": ["administrative_procedure", "approved_process", "record_keeping", "government_service"]
    },
    "csh_administrative_procedures_gen_004": {
        "question": "Which practice best supports risk control in administrative procedures?",
        "options": [
            "Identifying control gaps early and escalating material exceptions promptly.",
            "Skipping control checks whenever workload increases.",
            "Treating undocumented departures from procedure as normal.",
            "Waiting for an audit query before reporting obvious weaknesses."
        ],
        "explanation": "Risk control in administrative procedures depends on early detection of control gaps and prompt escalation of material exceptions before they become larger compliance failures.",
        "keywords": ["administrative_procedure", "risk_control", "control_gaps", "escalation"]
    },
    "csh_administrative_procedures_gen_008": {
        "question": "Which approach best supports discipline and conduct in administrative procedures?",
        "options": [
            "Applying disciplinary rules consistently under approved policy.",
            "Ignoring minor misconduct to avoid complaints.",
            "Punishing staff before the facts are verified.",
            "Relying only on informal warnings with no record."
        ],
        "explanation": "Discipline and conduct are best maintained when misconduct is handled consistently under approved policy and backed by a proper record of the action taken.",
        "keywords": ["administrative_procedure", "discipline", "conduct", "approved_policy"]
    },
    "csh_administrative_procedures_gen_010": {
        "question": "Which practice reflects proper documented procedure in administrative work?",
        "options": [
            "Following documented steps and keeping complete records.",
            "Changing process steps without recording the reason.",
            "Relying on informal instructions without documentary support.",
            "Closing a matter before the required file evidence is complete."
        ],
        "explanation": "Proper documented procedure requires officers to follow recorded process steps and maintain complete records that show what was done, by whom, and on what authority.",
        "keywords": ["administrative_procedure", "documented_steps", "records", "file_evidence"]
    },
    "csh_administrative_procedures_gen_012": {
        "question": "Which action best demonstrates public accountability in administrative procedures?",
        "options": [
            "Giving traceable decisions supported by recorded reasons.",
            "Making undocumented exceptions when pressure is high.",
            "Approving actions before the supporting facts are checked.",
            "Keeping important decisions off the official file."
        ],
        "explanation": "Public accountability is shown when administrative decisions can be traced to the evidence, reasons, and authority recorded on the file.",
        "keywords": ["administrative_procedure", "public_accountability", "traceable_decisions", "recorded_reasons"]
    },
    "csh_administrative_procedures_gen_014": {
        "question": "Which practice best supports risk control within administrative procedures?",
        "options": [
            "Reviewing sensitive steps carefully and escalating exceptions in time.",
            "Treating every exception as routine once work is delayed.",
            "Allowing undocumented shortcuts whenever deadlines are tight.",
            "Leaving weak controls in place until a complaint is received."
        ],
        "explanation": "Administrative risk control requires careful review of sensitive steps and timely escalation of exceptions before weak controls lead to errors or abuse.",
        "keywords": ["administrative_procedure", "risk_control", "exception_handling", "sensitive_steps"]
    },
    "csh_administrative_procedures_gen_016": {
        "question": "Which practice should a responsible officer prioritize to sustain discipline and conduct in administrative procedures?",
        "options": [
            "Applying approved standards consistently and recording breaches properly.",
            "Overlooking repeated misconduct when work targets are met.",
            "Changing sanctions from case to case without justification.",
            "Resolving conduct issues through unwritten personal arrangements."
        ],
        "explanation": "Discipline and conduct are sustained when approved standards are applied consistently and breaches are documented properly for fairness and accountability.",
        "keywords": ["administrative_procedure", "discipline", "conduct", "documented_breaches"]
    },
    "csh_administrative_procedures_gen_018": {
        "question": "Which approach best supports record management in administrative procedures?",
        "options": [
            "Maintaining complete files and recording each material action promptly.",
            "Keeping key decisions outside the official file for convenience.",
            "Removing outdated papers without authorization or traceability.",
            "Depending on memory instead of file references when work is urgent."
        ],
        "explanation": "Good record management depends on complete files and prompt recording of each material action so the history of the matter can be followed and reviewed.",
        "keywords": ["administrative_procedure", "record_management", "complete_files", "file_history"]
    },
    "csh_administrative_procedures_gen_020": {
        "question": "Which practice reflects proper standards when handling administrative procedures?",
        "options": [
            "Using approved procedure, complete documentation, and lawful review channels.",
            "Acting first and reconstructing the file later if questions arise.",
            "Treating verbal direction as enough authority for every case.",
            "Dropping mandatory checks when the matter seems straightforward."
        ],
        "explanation": "Proper standards in administrative procedures require approved process steps, complete documentation, and the lawful review channels that protect fairness and accountability.",
        "keywords": ["administrative_procedure", "approved_procedure", "documentation", "review_channels"]
    },
    "csh_administrative_procedures_gen_024": {
        "question": "Which practice best supports grievance handling in administrative procedures?",
        "options": [
            "Resolving complaints through fair, timely, and documented steps.",
            "Closing complaints quickly without checking the file record.",
            "Treating every grievance as a personal dispute instead of an official matter.",
            "Ignoring procedural breaches once the complaint has reduced."
        ],
        "explanation": "Grievance handling should be fair, timely, and documented so the complaint is addressed on its merits and the official record supports later review if needed.",
        "keywords": ["administrative_procedure", "grievance_handling", "fairness", "documentation"]
    },
    "csh_administrative_procedures_gen_026": {
        "question": "Which practice should a responsible officer prioritize to sustain discipline and conduct in administrative procedures?",
        "options": [
            "Applying rules consistently and documenting corrective action properly.",
            "Relaxing standards whenever a unit is under pressure.",
            "Allowing repeated misconduct if output appears satisfactory.",
            "Replacing procedure with ad hoc personal judgment."
        ],
        "explanation": "A responsible officer sustains discipline and conduct by applying rules consistently and documenting corrective action in a way that can be reviewed.",
        "keywords": ["administrative_procedure", "discipline", "conduct", "corrective_action"]
    },
    "csh_administrative_procedures_gen_027": {
        "question": "A desk officer handling an administrative matter receives a case that requires careful compliance. What should be done first?",
        "options": [
            "Applying inconsistent rules based on personal preference.",
            "Putting convenience ahead of policy and legal requirements.",
            "Checking the approved procedure and opening a proper record trail.",
            "Skipping review steps so the matter can close quickly."
        ],
        "explanation": "The first step is to check the approved procedure and create a proper record trail so the matter can be handled lawfully and reviewed later if necessary.",
        "keywords": ["administrative_procedure", "desk_officer", "approved_procedure", "record_trail"]
    },
    "csh_administrative_procedures_gen_028": {
        "question": "A unit handling administrative procedures faces competing priorities. Which action best preserves compliance and service quality?",
        "options": [
            "Using discretionary shortcuts to speed up closure despite control requirements.",
            "Applying approved procedures consistently and documenting each material step.",
            "Skipping review checkpoints whenever timelines are tight.",
            "Putting convenience ahead of approved process requirements."
        ],
        "explanation": "Where priorities compete, compliance and service quality are protected by applying approved procedure consistently and documenting each material step on the record.",
        "keywords": ["administrative_procedure", "competing_priorities", "approved_process", "service_quality"]
    },
    "csh_ap_057": {
        "question": "What is meant by the effective date of an acting appointment?",
        "options": [
            "The date the Federal Civil Service Commission is notified.",
            "The first day of the month in which the appointment is published.",
            "The date the officer substantively takes over the duties of the post.",
            "The date the gazette notice is printed."
        ],
        "explanation": "The effective date of an acting appointment is the date on which the officer substantively assumes the duties and responsibilities of the post, as recognized under the governing rule.",
        "keywords": ["acting_appointment", "effective_date", "duties_of_post", "psr_020705"]
    },
    "csh_ap_058": {
        "question": "What is the effect when an officer on acting appointment proceeds on casual or special leave?",
        "options": [
            "The acting appointment ends immediately.",
            "The acting appointment is extended automatically.",
            "The acting appointment is suspended until the officer returns.",
            "The officer is not regarded as having relinquished the acting duties."
        ],
        "explanation": "Proceeding on casual or special leave does not mean the officer has relinquished the duties and responsibilities of the acting appointment under the applicable rule.",
        "keywords": ["acting_appointment", "casual_leave", "special_leave", "psr_020708"]
    },
    "csh_ap_080": {
        "question": "In a time-sensitive official file, which step best preserves planning discipline without breaching procedure?",
        "options": [
            "Skipping review and approval controls to save time.",
            "Ignoring file comments and continuing outside procedure.",
            "Assigning responsibilities, timelines, and performance measures on the record.",
            "Applying different rules to similar cases for convenience."
        ],
        "explanation": "Planning discipline is preserved when responsibilities, timelines, and performance measures are clearly assigned on the record without bypassing required procedure.",
        "keywords": ["official_file", "planning_discipline", "responsibilities", "performance_measures"]
    }
}


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    updated = []
    for sub in data["subcategories"]:
        if sub.get("id") != SUBCATEGORY_ID:
            continue
        for q in sub.get("questions", []):
            qid = q.get("id")
            if qid not in UPDATES:
                continue
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
