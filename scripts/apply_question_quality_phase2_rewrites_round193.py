from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'constitutional_foi.json': {
        'foi_access_obligations_gen_023': {
            'question': 'Which practice best supports legal compliance in FOI access work?',
            'options': [
                'Checking legal authority and documenting the basis.',
                'Delaying documentation until after action.',
                'Using inconsistent criteria across similar cases.',
                'Bypassing review controls to save time.',
            ],
            'correct': 0,
            'explanation': 'FOI access decisions are sound when the legal basis is checked and the reason for access or refusal is recorded.',
        },
    },
    ROOT / 'data' / 'financial_regulations.json': {
        'fin_aud_018': {
            'question': 'In government audit working papers, what do accruals mean?',
            'options': [
                'Cash received before service delivery.',
                'Recognition when incurred, not when cash changes hands.',
                'Budget reserves kept aside by the Ministry of Finance.',
                'Sanctions for delayed tax remittance.',
            ],
            'correct': 1,
            'explanation': 'Accruals recognize revenue or expense when it is earned or incurred, not when cash is received or paid.',
        },
        'fin_aud_058': {
            'question': 'Who is an Accounting Officer under the Financial Regulations?',
            'options': [
                'The Permanent Secretary or equivalent head with full responsibility for resources.',
                'The internal-audit officer only.',
                'The officer who signs disbursement vouchers.',
                'Any officer who handles public money.',
            ],
            'correct': 0,
            'explanation': 'The Accounting Officer is the permanent secretary or equivalent head responsible for human, material, and financial resources.',
        },
        'fin_audits_sanctions_gen_004': {
            'question': 'Which practice best supports vote-book control in audits, sanctions, and compliance work?',
            'options': [
                'Checking budget availability before commitments.',
                'Raising commitments without vote-book checks.',
                'Treating informal instructions as budget authority.',
                'Skipping commitment records before action.',
            ],
            'correct': 0,
            'explanation': 'Vote-book control is maintained when budget availability is checked before any commitment is raised.',
        },
        'fin_audits_sanctions_gen_022': {
            'question': 'Which routine best sustains vote-book control in audit and sanction work?',
            'options': [
                'Checking budget availability before commitments.',
                'Raising commitments without vote-book checks.',
                'Treating informal instructions as budget authority.',
                'Skipping commitment records before action.',
            ],
            'correct': 0,
            'explanation': 'Vote-book control stays reliable when commitments are raised only after budget availability has been confirmed.',
        },
    },
    ROOT / 'data' / 'civil_service_ethics.json': {
        'eth_general_gen_037': {
            'question': 'Which governance practice most strengthens ethical standards across a public institution?',
            'options': [
                'Clear reporting channels, periodic review, and documented follow-up.',
                'Unsupervised ethics controls.',
                'Unrecorded minor breaches.',
                'Awareness notices without oversight.',
            ],
            'correct': 0,
            'explanation': 'Ethical standards are strongest when reporting channels are clear, reviews are periodic, and breaches receive documented follow-up.',
        },
        'ethics_089': {
            'question': 'Which duty belongs to the Accountant-General regarding accounting systems and controls?',
            'options': [
                'Maintaining adequate accounting systems and controls.',
                'Formulating national economic policy.',
                'Auditing every account personally.',
                'Executing all payments personally.',
            ],
            'correct': 0,
            'explanation': 'The Accountant-General must ensure that adequate accounting systems and controls operate across government institutions.',
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
