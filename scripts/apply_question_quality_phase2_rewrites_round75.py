import json
from pathlib import Path

DATA_PATH = Path("data/civil_service_ethics.json")

OPTION_UPDATES = {
    "csh_administrative_procedures_gen_008": [
        "Applying disciplinary rules consistently under approved policy.",
        "Ignoring minor misconduct to avoid complaints.",
        "Punishment before fact verification.",
        "Reliance on informal warnings with no record."
    ],
    "csh_administrative_procedures_gen_010": [
        "Following documented steps and keeping complete records.",
        "Changing process steps without recording the reason.",
        "Relying on informal instructions without documentary support.",
        "Closure before completion of required file evidence."
    ],
    "csh_administrative_procedures_gen_012": [
        "Giving traceable decisions supported by recorded reasons.",
        "Undocumented exceptions under pressure.",
        "Approval before verification of supporting facts.",
        "Important decisions kept off the official file."
    ],
    "csh_administrative_procedures_gen_014": [
        "Reviewing sensitive steps carefully and escalating exceptions in time.",
        "Routine treatment of exceptions after work delay.",
        "Undocumented shortcuts under deadline pressure.",
        "Uncorrected control weaknesses until complaint."
    ],
    "csh_administrative_procedures_gen_016": [
        "Applying approved standards consistently and recording breaches properly.",
        "Tolerance of repeated misconduct under target pressure.",
        "Changing sanctions from case to case without justification.",
        "Resolving conduct issues through unwritten personal arrangements."
    ],
    "csh_administrative_procedures_gen_018": [
        "Maintaining complete files and recording each material action promptly.",
        "Keeping key decisions outside the official file for convenience.",
        "Removing outdated papers without authorization or traceability.",
        "Dependence on memory instead of file references in urgent work."
    ],
    "csh_administrative_procedures_gen_026": [
        "Applying rules consistently and documenting corrective action properly.",
        "Relaxed standards under unit pressure.",
        "Allowing repeated misconduct if output appears satisfactory.",
        "Replacing procedure with ad hoc personal judgment."
    ],
    "csh_administrative_procedures_gen_028": [
        "Using discretionary shortcuts to speed up closure despite control requirements.",
        "Applying approved procedures consistently and documenting each material step.",
        "Skipped review checkpoints under tight timelines.",
        "Putting convenience ahead of approved process requirements."
    ]
}


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    updated = []
    for sub in data["subcategories"]:
        if sub.get("id") != "csh_administrative_procedures":
            continue
        for q in sub.get("questions", []):
            qid = q.get("id")
            if qid in OPTION_UPDATES:
                q["options"] = OPTION_UPDATES[qid]
                updated.append(qid)
    DATA_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Updated {len(updated)} questions")
    for qid in updated:
        print(qid)


if __name__ == "__main__":
    main()
