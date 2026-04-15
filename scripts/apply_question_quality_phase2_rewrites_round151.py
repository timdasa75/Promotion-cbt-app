# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    (
        ROOT / 'data' / 'civil_service_ethics.json',
        {
            'csh_duty_067': {
                'options': [
                    'The Executive and the Legislature',
                    'The Judiciary and the Legislature',
                    'The Executive and the Judiciary',
                    'The President and the Chief Justice',
                ],
                'explanation': 'The Executive prepares and implements the Federal Budget while the Legislature authorizes and oversees it, so both arms share accountability.',
            },
            'ethics_098': {
                'question': 'Which arm of government examines and approves the Federal Budget?',
                'options': [
                    'The Executive',
                    'The Legislature',
                    'The Judiciary',
                    'The President',
                ],
                'correct': 1,
                'explanation': 'The Legislature examines and approves the Federal Budget, while the Executive prepares and implements it.',
            },
        },
    ),
]


def update(node: object, updates: dict[str, dict]) -> int:
    if isinstance(node, list):
        return sum(update(item, updates) for item in node)
    if isinstance(node, dict):
        qid = node.get('id')
        if qid in updates:
            payload = updates[qid]
            for key, value in payload.items():
                node[key] = value
            return 1
        return sum(update(value, updates) for value in node.values())
    return 0


def main() -> None:
    total_changed = 0
    for target, updates in TARGETS:
        data = json.loads(target.read_text(encoding='utf-8'))
        changed = update(data, updates)
        if changed != len(updates):
            raise SystemExit(f'{target.name}: expected {len(updates)} updates, applied {changed}')
        target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        total_changed += changed
        print(f'Applied round 151 updates to {changed} questions in {target}')
    print(f'Applied round 151 updates to {total_changed} questions across {len(TARGETS)} files')


if __name__ == '__main__':
    raise SystemExit(main())
