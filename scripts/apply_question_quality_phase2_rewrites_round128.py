# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'psr_rules.json'
UPDATES = {
    'circ_leave_welfare_allowances_gen_005': {
        'question': 'Which practice best supports disciplinary process in leave, welfare, and allowance administration?',
        'options': [
            'Apply due process, fair hearing, and documented decisions.',
            'Use convenience ahead of policy and legal requirements.',
            'Continue non-compliance after corrective feedback.',
            'Apply rules inconsistently by personal preference.',
        ],
        'correct': 0,
        'explanation': 'Disciplinary matters should be handled through due process, fair hearing, and documented decisions.',
        'keywords': ['leave_welfare_allowances', 'disciplinary_process', 'fair_hearing', 'documented_decisions'],
    },
    'circ_leave_welfare_allowances_gen_020': {
        'question': 'Which practice best supports compliance in leave, welfare, and allowance administration?',
        'options': [
            'Use lawful criteria and transparent documentation for each decision step.',
            'Treat exceptions routinely without justification.',
            'Close the file without verifying facts or required records.',
            'Rely on informal instructions without documentary support.',
        ],
        'correct': 0,
        'explanation': 'Compliance is supported by lawful criteria and transparent documentation of each decision step.',
        'keywords': ['leave_welfare_allowances', 'compliance', 'lawful_criteria', 'transparent_documentation'],
    },
    'circ_leave_welfare_allowances_gen_023': {
        'question': 'Which practice best supports disciplinary review in leave, welfare, and allowance administration?',
        'options': [
            'Use due process, fair hearing, and independently checkable records.',
            'Continue non-compliance after adverse feedback.',
            'Apply rules inconsistently by personal preference.',
            'Skip review checks for convenience.',
        ],
        'correct': 0,
        'explanation': 'Disciplinary review is strongest when the process is fair, documented, and independently checkable.',
        'keywords': ['leave_welfare_allowances', 'disciplinary_review', 'fair_hearing', 'records'],
    },
    'circ_leave_welfare_allowances_gen_028': {
        'question': 'Which practice best supports compliance review in leave, welfare, and allowance administration?',
        'options': [
            'Check each action against approved rules and documented requirements.',
            'Treat exceptions routinely without justification.',
            'Close the file without verifying facts or records.',
            'Follow informal instructions without documentary support.',
        ],
        'correct': 0,
        'explanation': 'Compliance review depends on checking the action against approved rules and documented requirements.',
        'keywords': ['leave_welfare_allowances', 'compliance_review', 'rule_checking', 'records'],
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
    print(f'Applied round 128 updates to {changed} questions in {TARGET}')


if __name__ == '__main__':
    main()
