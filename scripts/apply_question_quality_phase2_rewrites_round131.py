# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'psr_rules.json'
UPDATES = {
    'psr_disc_058': {
        'question': 'Which PSR term means temporary removal from normal duties during dismissal proceedings?',
        'options': [
            'Interdiction.',
            'Suspension.',
            'Transfer.',
            'Promotion.',
        ],
        'correct': 0,
        'explanation': 'Interdiction means temporary removal from normal duties during dismissal proceedings, usually on half salary pending the outcome.',
        'keywords': ['interdiction', 'temporary_removal', 'disciplinary_proceedings', 'rule_010105'],
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
    print(f'Applied definition fix to {changed} question in {TARGET}')


if __name__ == '__main__':
    main()
