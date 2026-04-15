# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'psr_rules.json'
UPDATES = {
    'circ_leave_welfare_allowances_gen_005': {
        'question': 'What is the best first step when a complaint alleges misuse of leave, welfare, or allowance benefits?',
        'options': [
            'Open a documented case and verify the facts.',
            'Ignore the complaint until the next circular is issued.',
            'Close the matter as soon as it is reported.',
            'Handle it only through informal discussion.',
        ],
        'correct': 0,
        'explanation': 'A misuse allegation should start with a documented case and fact verification.',
        'keywords': ['leave_welfare_allowances', 'complaint_handling', 'documented_case', 'fact_verification'],
    },
    'circ_leave_welfare_allowances_gen_020': {
        'question': 'What control should come before approving a welfare or allowance payment?',
        'options': [
            'Confirm entitlement and supporting records.',
            'Approve first and verify later.',
            'Rely on a verbal instruction alone.',
            'Treat every claim as automatically valid.',
        ],
        'correct': 0,
        'explanation': 'Payment approval should follow confirmation of entitlement and supporting records.',
        'keywords': ['leave_welfare_allowances', 'payment_control', 'entitlement', 'records'],
    },
    'circ_leave_welfare_allowances_gen_023': {
        'question': 'What should disciplinary review of a leave, welfare, or allowance case preserve?',
        'options': [
            'A clear appeal trail and independently checkable records.',
            'Only the final sanction notice.',
            'Private notes that cannot be checked later.',
            'A quick closure with no written trail.',
        ],
        'correct': 0,
        'explanation': 'Disciplinary review should preserve an appeal trail and independently checkable records.',
        'keywords': ['leave_welfare_allowances', 'disciplinary_review', 'appeal_trail', 'records'],
    },
    'circ_leave_welfare_allowances_gen_028': {
        'question': 'What should compliance review of recurring leave or allowance claims check first?',
        'options': [
            'Whether each claim matches the approved circulars and entitlement list.',
            'Whether the claimant is the loudest in the office.',
            'Whether the file can be closed immediately.',
            'Whether the claim can be paid before checking the rules.',
        ],
        'correct': 0,
        'explanation': 'Compliance review should first check the claim against approved circulars and the entitlement list.',
        'keywords': ['leave_welfare_allowances', 'compliance_review', 'circulars', 'entitlement_list'],
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
    print(f'Applied round 129 updates to {changed} questions in {TARGET}')


if __name__ == '__main__':
    main()
