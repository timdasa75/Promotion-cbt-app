# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    (
        ROOT / 'data' / 'civil_service_ethics.json',
        {
            'csh_duty_002': {
                'explanation': 'Civil servants exist to serve the public impartially and effectively, so public service is the correct priority rather than private or political interests.',
            },
            'csh_duty_003': {
                'explanation': 'The Permanent Secretary is the accounting officer of a Ministry, so the office carries direct responsibility for accountability and proper public-finance control.',
            },
            'csh_duty_004': {
                'explanation': 'Civil servants are barred from partisan politics because neutrality and professionalism are core duties under the Handbook.',
            },
            'csh_duty_006': {
                'explanation': 'Impartiality guarantees fair and unbiased service to all citizens, which is why it is central to civil-service conduct.',
            },
            'csh_duty_008': {
                'explanation': 'Meritocracy is emphasized in recruitment, appointment, and promotion so that staffing decisions are based on competence and not favoritism.',
            },
            'csh_duty_011': {
                'explanation': 'Loyalty requires officers to remain dedicated to the Government and its official policies, not to personal or partisan interests.',
            },
            'csh_duty_028': {
                'explanation': 'Transparency supports open access to records and accountable decision-making, which is why it is linked to public trust and oversight.',
            },
            'csh_duty_051': {
                'question': 'Which office has the ultimate duty for control of votes to the Federal Executive Council?',
                'explanation': 'Accounting Officers bear the ultimate duty for vote control and must account to the Federal Executive Council for the use of public funds.',
            },
            'csh_duty_067': {
                'question': 'Which two arms of the Federal Government share accountability for the Federal Budget?',
                'explanation': 'The Federal Budget is shared between the Executive and the Legislature, which together provide budget accountability in the federal system.',
            },
            'csh_duty_074': {
                'question': 'What should guide the workflow for creating a new file?',
                'explanation': 'New files should be created based on the existing File Index so the numbering system stays consistent and logically ordered.',
            },
            'csh_duty_080': {
                'question': 'What personnel role does the Board of a parastatal perform?',
                'explanation': 'A parastatal board approves the appointment and promotion of staff, so it plays a key personnel oversight role rather than day-to-day administration.',
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
        print(f'Applied round 150 updates to {changed} questions in {target}')
    print(f'Applied round 150 updates to {total_changed} questions across {len(TARGETS)} files')


if __name__ == '__main__':
    main()
