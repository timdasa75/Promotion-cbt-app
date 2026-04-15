# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data' / 'leadership_negotiation.json'
TARGET_ID = 'leadership_lsm_061'


def rewrite(node: object) -> bool:
    if isinstance(node, list):
        for item in node:
            if rewrite(item):
                return True
        return False
    if isinstance(node, dict):
        if node.get('id') == TARGET_ID:
            node['question'] = 'What does prompt circulation of minutes help a leadership team preserve?'
            node['options'] = [
                'Retention of fresh decisions.',
                'Meeting formality.',
                'Secretary prestige.',
                'Delayed follow-up.',
            ]
            node['correct'] = 0
            node['explanation'] = 'Prompt circulation helps leaders preserve a fresh, reliable record of decisions before memory fades.'
            node['keywords'] = ['minutes', 'leadership_team', 'follow_up']
            return True
        for value in node.values():
            if rewrite(value):
                return True
    return False


def main() -> None:
    data = json.loads(DATA.read_text(encoding='utf-8'))
    if not rewrite(data):
        raise SystemExit(f'{TARGET_ID} not found')
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Rewrote {TARGET_ID} in {DATA}')


if __name__ == '__main__':
    main()
