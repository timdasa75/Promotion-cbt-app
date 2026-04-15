# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    (
        ROOT / 'data' / 'civil_service_ethics.json',
        {
            'csh_ap_168': {
                'explanation': 'A chair needs the meeting objective and agenda so the discussion stays focused, orderly, and tied to its intended result.',
            },
            'csh_ap_169': {
                'explanation': 'A register of minutes works as an office index that lets staff trace recorded minutes quickly and find past decisions.',
            },
            'csh_ap_172': {
                'explanation': 'In official writing, style means the distinctive manner in which language and ideas are expressed for official readers.',
            },
            'csh_ap_191': {
                'explanation': 'Style means the distinctive way official ideas are expressed in correspondence, reports, and other records.',
            },
            'csh_ap_205': {
                'explanation': 'A file copy preserves the circular with the related matter so the office record remains complete and traceable.',
            },
        },
    ),
    (
        ROOT / 'data' / 'psr_rules.json',
        {
            'psr_discipline_gen_001': {
                'explanation': 'Approved procedures and complete records show that discipline is being managed fairly, consistently, and under control.',
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
        print(f'Applied round 143 updates to {changed} questions in {target}')
    print(f'Applied round 143 updates to {total_changed} questions across {len(TARGETS)} files')


if __name__ == '__main__':
    main()
