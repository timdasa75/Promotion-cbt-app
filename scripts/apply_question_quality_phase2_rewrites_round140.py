# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'psr_rules.json'
UPDATES = {
    'psr_discipline_gen_011': {
        'question': 'Which action best protects fairness in a disciplinary inquiry under the PSR?',
        'options': [
            'Allow the officer to respond before a decision is taken.',
            'Bypass review and approval controls.',
            'Prioritize convenience over compliance.',
            'Ignore feedback after review.',
        ],
        'correct': 0,
        'explanation': 'Fairness is protected when the officer is given a chance to respond before a decision is taken.',
        'keywords': ['psr_discipline', 'fair_hearing', 'disciplinary_inquiry'],
    },
}


def update(node: object) -> int:
    if isinstance(node, list):
        return sum(update(item) for item in node)
    if isinstance(node, dict):
        qid = node.get('id')
        if qid in UPDATES:
            payload = UPDATES[qid]
            node['question'] = payload['question']
            node['options'] = payload['options']
            node['correct'] = payload['correct']
            node['explanation'] = payload['explanation']
            node['keywords'] = payload['keywords']
            return 1
        return sum(update(value) for value in node.values())
    return 0


def main() -> None:
    data = json.loads(TARGET.read_text(encoding='utf-8'))
    changed = update(data)
    if changed != len(UPDATES):
        raise SystemExit(f'Expected {len(UPDATES)} updates, applied {changed}')
    TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Applied round 140 updates to {changed} questions in {TARGET}')


if __name__ == '__main__':
    main()
