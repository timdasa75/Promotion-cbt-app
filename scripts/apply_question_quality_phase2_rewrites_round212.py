from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'public_procurement.json': {
        'ppa_elb_056': {
            'question': 'Which law requires an MDA Procurement Planning Committee to classify procurement items correctly as Goods, Works, or Services?',
            'explanation': 'The Public Procurement Act requires the Procurement Planning Committee to classify procurement items correctly as Goods, Works, or Services so the proper procurement method can be applied.',
        },
        'ppa_ethic_048': {
            'question': 'Which PSR rule provides for loss of pay for unauthorized absence from duty?',
            'explanation': 'PSR Rule 040206 provides for loss of pay where an officer is absent from duty without authority, making it the rule tied to that penalty.',
        },
        'ppa_ethic_055': {
            'question': 'Which option best describes the purpose of a register of minutes?',
            'options': [
                'Listing all staff in a ministry.',
                'Logging all official meetings.',
                'Logging all financial transactions.',
                'Listing all minutes written in a ministry.',
            ],
            'explanation': 'A register of minutes is the record that lists the minutes written in a ministry, allowing those minutes to be tracked and retrieved when needed.',
        },
        'ppa_ims_002': {
            'question': 'Which section of the PPA emphasizes efficient and good-faith execution of contracts?',
            'explanation': 'Section 35 of the Public Procurement Act emphasizes that contracts should be implemented efficiently and in good faith once they have been awarded.',
        },
        'ppa_ims_031': {
            'question': 'Under Section 35, contract monitoring should verify timeliness, compliance with contract terms, and what overarching principle?',
            'explanation': 'Section 35 requires contract performance to reflect efficient and good-faith execution, so monitoring must check for that principle alongside time and compliance.',
        },
        'ppa_ims_056': {
            'explanation': 'Complaints from aggrieved bidders are handled by the Procurement Complaint Review Committee, which exists to review such procurement grievances within the process.',
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
