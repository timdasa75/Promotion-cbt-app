# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'leadership_negotiation.json'
UPDATES = {
    'neg_principles_outcomes_gen_050': {
        'question': 'Which practice best supports risk control in negotiation accountability arrangements?',
        'options': [
            'Apply controls and document the mitigation steps.',
            'Rely on convenience in rule application.',
            'Ignore the control points after the meeting.',
            'Continue non-compliance after feedback.',
        ],
        'correct': 0,
        'explanation': 'Risk control is stronger when controls are applied and the mitigation steps are documented.',
        'keywords': ['negotiation', 'risk_control', 'accountability', 'mitigation'],
    },
    'neg_structure_bodies_gen_051': {
        'question': 'Which practice best supports accountability in negotiating bodies?',
        'options': [
            'Apply controls and document the mitigation steps.',
            'Rely on convenience in control use.',
            'Ignore the control points after the meeting.',
            'Continue non-compliance after feedback.',
        ],
        'correct': 0,
        'explanation': 'Negotiating bodies stay accountable when controls are applied and the mitigation steps are documented.',
        'keywords': ['negotiating_bodies', 'risk_control', 'accountability', 'mitigation'],
    },
}


def update(node: object) -> int:
    if isinstance(node, list):
        total = 0
        for item in node:
            total += update(item)
        return total
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
        total = 0
        for value in node.values():
            total += update(value)
        return total
    return 0


def main() -> None:
    data = json.loads(TARGET.read_text(encoding='utf-8'))
    changed = update(data)
    if changed != len(UPDATES):
        raise SystemExit(f'Expected {len(UPDATES)} updates, applied {changed}')
    TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Applied round 126 updates to {changed} questions in {TARGET}')


if __name__ == '__main__':
    main()
