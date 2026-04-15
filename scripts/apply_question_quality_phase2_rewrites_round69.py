import json
from pathlib import Path

DATA_PATH = Path("data/ict_digital.json")

UPDATES = {
    "ict_eg_077": {
        "question": "In due-process administration, which area is the focus of fiscal transparency and procedural compliance?",
        "options": [
            "Private sector investments.",
            "The operations of non-governmental organizations.",
            "Foreign direct investments.",
            "The costing of projects and services."
        ],
        "explanation": "Due-process administration is meant to enforce fiscal transparency and compliance in the costing of projects and services so that public spending is properly scrutinized.",
        "keywords": ["due_process", "fiscal_transparency", "procedural_compliance", "project_costing"]
    },
    "ict_eg_097": {
        "question": "What does the E-Government Master Plan emphasize as the strategic use of ICT in government?",
        "options": [
            "Centralizing political appointments through administrative workflow.",
            "Maintaining paper-based records as the default public-service model.",
            "Restricting citizen access to government information and services.",
            "Digitizing public services, automation, and inter-agency data sharing."
        ],
        "explanation": "The E-Government Master Plan emphasizes using ICT to digitize public services, automate processes, and enable data sharing across government agencies.",
        "keywords": ["e_government_master_plan", "digitization", "public_services", "inter_agency_data_sharing"]
    },
    "ict_eg_099": {
        "question": "Which ICT platform allows government services to be accessed through mobile devices?",
        "options": [
            "BVAS.",
            "GIFMIS.",
            "IPPIS.",
            "Mobile government applications."
        ],
        "explanation": "Mobile government applications provide a platform for users to access government services through mobile devices rather than through office-only channels.",
        "keywords": ["mobile_government", "government_services", "mobile_devices", "digital_access"]
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
