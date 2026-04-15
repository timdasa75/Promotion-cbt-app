# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    (
        ROOT / 'data' / 'ict_digital.json',
        {
            'ict_f_048': {
                'explanation': 'Bandwidth is the capacity of a network to transmit data within a given time, so it describes throughput rather than hardware size or software complexity.',
            },
            'ict_f_061': {
                'explanation': 'An algorithm is a step-by-step procedure for solving a problem or performing a task, which is why it is the correct definition in computing.',
            },
            'ict_security_gen_001': {
                'explanation': 'Digital security governance depends on approved procedures and complete records because security control only works when the process is traceable and auditable.',
            },
            'ict_eg_030': {
                'explanation': 'BVAS is used by INEC for voter accreditation in Nigeria, because the system supports biometric verification at polling units during elections.',
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
        print(f'Applied round 145 updates to {changed} questions in {target}')
    print(f'Applied round 145 updates to {total_changed} questions across {len(TARGETS)} files')


if __name__ == '__main__':
    main()
