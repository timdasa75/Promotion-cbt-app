#!/usr/bin/env python3
"""Round 90B: separate exact duplicate circulars stems after large-batch cleanup."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'psr_rules.json'
SUBCATEGORY_ID = 'circ_leave_welfare_allowances'

UPDATES = {
    'circ_leave_welfare_allowances_gen_023': {
        'question': 'Which practice best supports disciplinary review in leave, welfare, and allowance administration?',
        'explanation': 'Disciplinary review in leave, welfare, and allowance administration is strongest when the review process is fair, documented, and capable of independent checking.',
        'keywords': ['psr', 'circ_leave_welfare_allowances', 'disciplinary_review', 'documented_review'],
    },
    'circ_leave_welfare_allowances_gen_028': {
        'question': 'Which practice best supports compliance review in leave, welfare, and allowance administration?',
        'explanation': 'Compliance review depends on checking whether leave, welfare, and allowance actions followed the approved rules and documented requirements.',
        'keywords': ['psr', 'circ_leave_welfare_allowances', 'compliance_review', 'rule_checking'],
    },
    'circ_leave_welfare_allowances_gen_029': {
        'question': 'Which practice best demonstrates reviewable public accountability in leave, welfare, and allowance administration?',
        'explanation': 'Public accountability is reviewable when decisions on leave, welfare, and allowance matters are traceable to recorded reasons and supporting evidence.',
        'keywords': ['psr', 'circ_leave_welfare_allowances', 'public_accountability', 'traceable_decisions'],
    },
    'circ_leave_welfare_allowances_gen_033': {
        'question': 'Which practice best supports workflow discipline in leave, welfare, and allowance administration?',
        'explanation': 'Workflow discipline is preserved when each leave, welfare, or allowance step follows the approved sequence and is recorded before the next action is taken.',
        'keywords': ['psr', 'circ_leave_welfare_allowances', 'workflow_discipline', 'approved_sequence'],
    },
    'circ_leave_welfare_allowances_gen_032': {
        'question': 'Which practice reflects proper decision communication in leave, welfare, and allowance administration?',
        'explanation': 'Decision communication is proper when outcomes are conveyed clearly, promptly, and through the documented channels required for leave, welfare, and allowance administration.',
        'keywords': ['psr', 'circ_leave_welfare_allowances', 'decision_communication', 'documented_channels'],
    },
    'circ_leave_welfare_allowances_gen_027': {
        'question': 'Which practice reflects proper traceable documentation in leave, welfare, and allowance administration?',
        'explanation': 'Traceable documentation means that each leave, welfare, or allowance action can be followed through complete and reviewable records.',
        'keywords': ['psr', 'circ_leave_welfare_allowances', 'traceable_documentation', 'reviewable_records'],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def main() -> int:
    payload = load_json(TARGET)
    updated = 0
    for sub in payload.get('subcategories', []):
        if sub.get('id') != SUBCATEGORY_ID:
            continue
        questions = sub.get('questions', [])
        if questions and isinstance(questions[0], dict) and isinstance(questions[0].get(SUBCATEGORY_ID), list):
            bank = questions[0][SUBCATEGORY_ID]
        else:
            bank = questions
        for question in bank:
            qid = question.get('id')
            if qid not in UPDATES:
                continue
            for key, value in UPDATES[qid].items():
                question[key] = value
            updated += 1
        break
    write_json(TARGET, payload)
    print(f'Applied round 90B rewrites to {updated} questions')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
