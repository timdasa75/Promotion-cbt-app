# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'civil_service_ethics.json'
UPDATES = {
    'eth_anti_corruption_gen_052': {
        'question': 'What should a supervisor do after identifying compliance gaps to strengthen public accountability?',
        'options': [
            'Issue a corrective action plan and follow up on deadlines.',
            'Leave the gaps open until the next audit cycle.',
            'Ignore the gaps if the file is already approved.',
            'Move the matter out of the record trail.',
        ],
        'correct': 0,
        'explanation': 'Public accountability is strengthened when compliance gaps are answered with a corrective plan and deadline follow-up.',
        'keywords': ['anti_corruption', 'public_accountability', 'corrective_action', 'follow_up'],
    },
    'eth_anti_corruption_gen_070': {
        'question': 'What action most directly strengthens accountability after a compliance review?',
        'options': [
            'Traceable decisions with evidence-based reasons.',
            'Convenience over recordkeeping.',
            'Skipped review checkpoints.',
            'Unrecorded verbal instructions only.',
        ],
        'correct': 0,
        'explanation': 'Accountability is strongest when each decision can be traced and justified with evidence-based reasons.',
        'keywords': ['anti_corruption', 'accountability', 'traceable_decisions', 'evidence'],
    },
    'eth_misconduct_gen_066': {
        'question': 'What should be done to preserve grievance handling in a time-sensitive misconduct file?',
        'options': [
            'Record each complaint step and assign follow-up immediately.',
            'Wait until the matter is closed before writing anything down.',
            'Handle the complaint informally and leave no trail.',
            'Skip the complaint log to save time.',
        ],
        'correct': 0,
        'explanation': 'Grievance handling stays sound when each complaint step is recorded and followed up immediately.',
        'keywords': ['misconduct', 'grievance_handling', 'time_sensitive_file', 'records'],
    },
    'eth_misconduct_gen_093': {
        'question': 'What preserves grievance handling without breaking procedure in a misconduct file?',
        'options': [
            'Keep the file traceable and documented at each stage.',
            'Bypass review checkpoints to move faster.',
            'Use private notes instead of the file record.',
            'Wait until the hearing is over before filing updates.',
        ],
        'correct': 0,
        'explanation': 'Procedure is preserved when the misconduct file stays traceable and documented at each stage.',
        'keywords': ['misconduct', 'grievance_handling', 'procedure', 'traceable_file'],
    },
    'ethics_062': {
        'question': 'Which principle requires civil servants to be answerable for the use of public resources?',
        'options': [
            'Accountability.',
            'Transparency.',
            'Confidentiality.',
            'Integrity.',
        ],
        'correct': 0,
        'explanation': 'Accountability requires civil servants to answer for how they use public resources.',
        'keywords': ['ethics', 'accountability', 'public_resources'],
    },
    'ethics_109': {
        'question': 'Which principle emphasizes honesty in safeguarding public resources?',
        'options': [
            'Integrity.',
            'Transparency.',
            'Confidentiality.',
            'Accountability.',
        ],
        'correct': 0,
        'explanation': 'Integrity emphasizes honest conduct and the proper safeguarding of public resources.',
        'keywords': ['ethics', 'integrity', 'public_resources'],
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
    print(f'Applied round 127 updates to {changed} questions in {TARGET}')


if __name__ == '__main__':
    main()
