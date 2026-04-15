# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'financial_regulations.json'
TODAY = '2026-04-09'

UPDATES = {
    'fin_aud_083': {
        'question': 'What does an audit trail help establish during a financial review?',
        'options': [
            'Traceability and accountability.',
            'Automatic approval of all payments.',
            'Budget expansion without controls.',
            'Removal of all record-keeping duties.',
        ],
        'correct': 0,
        'explanation': 'An audit trail helps reviewers trace transactions and hold officers accountable for what was done and when.',
    },
}


def walk(node: object) -> int:
    if isinstance(node, list):
        return sum(walk(item) for item in node)
    if isinstance(node, dict):
        qid = node.get('id')
        patch = UPDATES.get(qid)
        if patch:
            for key, value in patch.items():
                node[key] = value
            node['lastReviewed'] = TODAY
            return 1
        return sum(walk(value) for value in node.values())
    return 0


def main() -> int:
    data = json.loads(TARGET.read_text(encoding='utf-8'))
    changed = walk(data)
    if changed != len(UPDATES):
        raise SystemExit(f'expected {len(UPDATES)} updates, applied {changed}')
    TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Applied audit-trail fix to {changed} question in {TARGET}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
