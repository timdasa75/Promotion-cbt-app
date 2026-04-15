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
            'explanation': 'Definitely is the only correct spelling; the other forms are common misspellings that omit or rearrange letters.',
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
            'explanation': 'Interested takes the preposition in, so the complete phrase is "interested in music."',
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
            'explanation': 'The Federal Public Service retirement rule is 60 years of age or 35 years of pensionable service, whichever comes first.',
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
            'explanation': 'Citizen-focused service is strongest when officers balance legality, fairness, timeliness, and service quality while keeping decisions documented.',
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
        'clg_legal_compliance_gen_078': {
            'question': 'What document confirms that goods or services were delivered satisfactorily before disbursement is processed?',
            'options': [
                'Virement Warrant.',
                'Job Completion Certificate (JCC).',
                'Stores Receipt Voucher (SRV).',
                'Local Purchase Order (LPO).',
            ],
            'correct': 1,
            'explanation': 'A Job Completion Certificate confirms satisfactory delivery or completion before payment is processed.',
        },
        'clg_legal_compliance_gen_080': {
            'question': 'Which safeguard is provided when the head of the officer’s department is excluded from the board of inquiry?',
            'options': [
                'Fair hearing and judicial neutrality.',
                'Anonymity.',
                'Permanence of the service.',
                'Segregation of duties.',
            ],
            'correct': 0,
            'explanation': 'Keeping the head of department off the inquiry board protects impartiality and fair hearing for the officer being investigated.',
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
