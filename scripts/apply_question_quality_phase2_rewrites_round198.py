from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
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
            'explanation': 'Definitely is the only correct spelling; the other choices omit or rearrange letters.',
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
            'explanation': 'Interested takes the preposition in, so the phrase is "interested in music."',
        },
    },
    ROOT / 'data' / 'constitutional_foi.json': {
        'FOI_OP_039': {
            'question': 'Who challenges a denial of access in court?',
            'options': [
                'The Attorney-General.',
                'The applicant.',
                'The Head of Service.',
                'The BPP.',
            ],
            'correct': 1,
            'explanation': 'The applicant is the party that may challenge a denial of access in court.',
        },
        'clg_lc_047': {
            'question': 'Which section of the PPA allows framework agreements for repeated procurements under pre-agreed terms?',
            'options': [
                'Section 35.',
                'Section 44.',
                'Section 42.',
                'Section 32.',
            ],
            'correct': 0,
            'explanation': 'Section 35 provides for framework agreements that allow repeated procurements under pre-agreed terms.',
        },
        'clg_legal_compliance_gen_053': {
            'question': 'Which approach most strongly supports accountable implementation in legal frameworks and statutory compliance work?',
            'options': [
                'Ensure actions remain within statutory authority and constitutional safeguards.',
                'Treat exceptions as normal practice without written justification.',
                'Proceed without validating source records and decision criteria.',
                'Delay escalation until issues become material and difficult to reverse.',
            ],
            'correct': 0,
            'explanation': 'Accountable implementation requires action within statutory authority, constitutional safeguards, and the recorded basis for the decision.',
        },
        'clg_legal_compliance_gen_056': {
            'question': 'Which practice best protects accountability and consistency in legal frameworks and statutory compliance work?',
            'options': [
                'Apply legal authority checks and document basis for each decision.',
                'Delay documentation until after implementation.',
                'Use inconsistent criteria across similar cases.',
                'Treat exceptions as standard practice without justification.',
            ],
            'correct': 0,
            'explanation': 'Accountability and consistency are strongest when the legal basis is checked, documented, and applied the same way in similar cases.',
        },
        'clg_legal_compliance_gen_064': {
            'question': 'What is the chairman’s role regarding the minutes of a meeting?',
            'options': [
                'He should direct the Secretariat on the timing for production and circulation of the minutes.',
                'He should not be concerned with the minutes.',
                'He should tell the Secretariat to keep the minutes secret.',
                'He should write them himself.',
            ],
            'correct': 0,
            'explanation': 'The chairman directs the Secretariat on when the minutes should be produced and circulated; he is not meant to write the minutes personally.',
        },
        'clg_legal_compliance_gen_077': {
            'question': 'Which role may permit emergency procurements, subject to later audit and ratification, under PPA Section 42?',
            'options': [
                'The Permanent Secretary.',
                'The Accountant-General.',
                'The Minister.',
                'The Head of Civil Service of the Federation.',
            ],
            'correct': 0,
            'explanation': 'The Permanent Secretary, as the accounting officer, may permit emergency procurement subject to later audit and ratification.',
        },
        'clg_general_competency_gen_086': {
            'question': 'What is the compulsory retirement age for all civil servants in the Federal Public Service?',
            'options': [
                '60 years of age regardless of pensionable service records.',
                '55 years of age or 35 years of service, whichever comes first.',
                '60 years or 35 years of pensionable service, whichever comes first.',
                '65 years of age or 30 years of service, whichever comes first.',
            ],
            'correct': 2,
            'explanation': 'Federal Public Service retirement is at 60 years of age or 35 years of pensionable service, whichever is earlier.',
        },
        'clg_general_competency_gen_087': {
            'question': 'Which practice best supports citizen-focused service in general competency, ethics, and reforms work?',
            'options': [
                'Rely on informal instructions without documentary evidence.',
                'Delay decisions until issues escalate into avoidable crises.',
                'Treat exceptions as routine without documented justification.',
                'Balance legality, fairness, timeliness, and service quality.',
            ],
            'correct': 3,
            'explanation': 'The strongest citizen-focused service balances legality, fairness, timeliness, and service quality while keeping decisions documented and reviewable.',
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
