from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'civil_service_ethics.json': {
        'csh_pt_010': {
            'question': 'What is true when a withheld increment is restored?',
            'options': [
                'No retrospective restoration.',
                'Automatic retrospective restoration.',
                'Three-month restoration.',
                'Ministerial restoration approval.',
            ],
            'correct': 0,
            'explanation': 'A withheld increment is normally restored prospectively; the rule does not call for automatic retrospective restoration.',
        },
    },
    ROOT / 'data' / 'core_competencies.json': {
        'competency_verbal_043': {
            'question': 'Choose the correctly spelt word.',
            'options': [
                'Definately.',
                'Definitely.',
                'Definitly.',
                'Defenetly.',
            ],
            'correct': 1,
            'explanation': 'Definitely is the correct spelling; the other options are common misspellings.',
        },
        'competency_verbal_055': {
            'question': 'Fill in the blank: "She is interested ___ music."',
            'options': [
                'in.',
                'on.',
                'at.',
                'for.',
            ],
            'correct': 0,
            'explanation': 'The adjective interested takes the preposition in.',
        },
    },
    ROOT / 'data' / 'constitutional_foi.json': {
        'FOI_EX_063': {
            'question': 'What information should be included in the quarterly returns on government vehicles, in addition to mileage and fuel consumption?',
            'options': [
                "Driver's personal details.",
                'Passenger names.',
                'Cost of repairs.',
                'Vehicle color.',
            ],
            'correct': 2,
            'explanation': 'Quarterly vehicle returns should also capture repair cost so the running cost of the vehicle can be reviewed.',
        },
        'FOI_OP_036': {
            'question': 'The authority to issue guidelines for FOI implementation rests with the:',
            'options': [
                "President's Chief of Staff.",
                'Attorney-General of the Federation.',
                'Federal Civil Service Commission.',
                'Head of Service.',
            ],
            'correct': 1,
            'explanation': 'The FOI Act places the guideline-making authority with the Attorney-General of the Federation.',
        },
        'FOI_OP_039': {
            'question': 'Who challenges a denial of access in court?',
            'options': [
                'The Attorney-General.',
                'The applicant.',
                'The Head of Service.',
                'The BPP.',
            ],
            'correct': 1,
            'explanation': 'The applicant is the person who can challenge a denial of access in court.',
        },
        'FOI_OP_062': {
            'question': 'Which practice best reflects proper decision transparency in FOI offences, penalties, and enforcement?',
            'options': [
                'Relying on informal instructions without documentary evidence.',
                'Delaying decisions until issues escalate into avoidable crises.',
                'Using clear criteria and communicating decisions promptly.',
                'Closing cases without validating facts or demand records.',
            ],
            'correct': 2,
            'explanation': 'Transparency is stronger when officers use clear criteria, record the basis for the decision, and communicate promptly.',
        },
        'FOI_OP_064': {
            'question': 'Section 29 prohibits the destruction of records needed for pending FOI requests. This is intended to secure:',
            'options': [
                'Automatic promotion for desk officers.',
                'Centralization of all government funds.',
                'The integrity and availability of evidence for disclosure.',
                'Compliance with the Pension Reform Act.',
            ],
            'correct': 2,
            'explanation': 'The section protects the evidence needed for disclosure by preventing the destruction of records for pending FOI requests.',
        },
        'FOI_OP_070': {
            'question': 'When drafts are given to the Secretary for fairing, what should be clearly recorded at the top of page 1?',
            'options': [
                "The secretary's name.",
                'The date.',
                'The number of copies needed.',
                'The file number.',
            ],
            'correct': 3,
            'explanation': 'The file number should be recorded prominently so the draft can be identified and tracked correctly.',
        },
        'clg_constitutional_governance_gen_057': {
            'question': 'Which approach most strongly supports accountable implementation in constitutional structure, bodies, and principles work?',
            'options': [
                'Ensure actions remain within statutory authority and constitutional safeguards.',
                'Delay escalation until issues become material and difficult to reverse.',
                'Treat exceptions as normal practice without written justification.',
                'Proceed without validating source records and decision criteria.',
            ],
            'correct': 0,
            'explanation': 'Accountable implementation requires action within statutory authority, constitutional safeguards, and the recorded basis for the decision.',
        },
        'clg_constitutional_governance_gen_059': {
            'question': 'Which step most directly improves traceability and fairness in constitutional structure, bodies, and principles decisions?',
            'options': [
                'Treat exceptions as normal practice without written justification.',
                'Proceed without validating source records and decision criteria.',
                'Ensure actions remain within statutory authority and constitutional safeguards.',
                'Rely on verbal approval and close the file without documentary trail.',
            ],
            'correct': 2,
            'explanation': 'Traceability and fairness improve when decisions are tied to authority, records, and constitutional safeguards rather than verbal shortcuts.',
        },
        'clg_constitutional_governance_gen_073': {
            'question': 'Which report must be obtained for accidents involving government vehicles under FR 2014?',
            'options': [
                'Eyewitness reports.',
                'Legal counsel.',
                'Insurance company reports.',
                'Police reports.',
            ],
            'correct': 3,
            'explanation': 'Police reports provide the formal incident record required for accidents involving government vehicles.',
        },
        'clg_general_competency_gen_064': {
            'question': 'Which approach most strongly supports accountable implementation in general competency, ethics, and reforms work?',
            'options': [
                'Ensure actions remain within statutory authority and constitutional safeguards.',
                'Delay escalation until issues become material and difficult to reverse.',
                'Proceed without validating source records and decision criteria.',
                'Treat exceptions as normal practice without written justification.',
            ],
            'correct': 0,
            'explanation': 'Accountable implementation requires action within statutory authority, constitutional safeguards, and the recorded basis for the decision.',
        },
        'clg_general_competency_gen_066': {
            'question': 'Which step most directly improves traceability and fairness in general competency, ethics, and reforms decisions?',
            'options': [
                'Rely on verbal approval and close the file without documentary trail.',
                'Ensure actions remain within statutory authority and constitutional safeguards.',
                'Treat exceptions as normal practice without written justification.',
                'Proceed without validating source records and decision criteria.',
            ],
            'correct': 1,
            'explanation': 'Traceability and fairness improve when decisions are tied to authority, records, and constitutional safeguards rather than verbal shortcuts.',
        },
        'clg_general_competency_gen_068': {
            'question': 'Which practice best protects accountability and consistency in general competency, ethics, and reforms?',
            'options': [
                'Treat exceptions as standard practice without justification.',
                'Use inconsistent criteria across similar cases.',
                'Apply legal authority checks and document basis for each decision.',
                'Delay documentation until after implementation.',
            ],
            'correct': 2,
            'explanation': 'Accountability and consistency are strongest when the same legal basis is checked, documented, and applied across similar cases.',
        },
    },
}


def update_file(path: Path, rewrites: dict[str, dict[str, object]]) -> list[str]:
    data = json.loads(path.read_text(encoding='utf-8'))
    updated: list[str] = []

    def walk(node):
        if isinstance(node, dict):
            qid = node.get('id')
            if qid in rewrites:
                node.update(rewrites[qid])
                updated.append(qid)
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)

    walk(data)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    return updated


def main() -> None:
    total = 0
    for path, rewrites in FILES.items():
        updated = update_file(path, rewrites)
        print(f'Updated {len(updated)} questions in {path.name}')
        for qid in updated:
            print(qid)
        total += len(updated)
    print(f'Total updated: {total}')


if __name__ == '__main__':
    main()
