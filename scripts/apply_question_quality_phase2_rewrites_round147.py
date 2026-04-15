# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    (
        ROOT / 'data' / 'civil_service_ethics.json',
        {
            'csh_ap_006': {
                'explanation': 'The Head of the Civil Service coordinates service-wide reforms and issues Establishment Circulars so administrative rules stay aligned across government.',
            },
            'csh_ap_021': {
                'explanation': 'Circulars issued by the Head of Service or the Presidency are used to update or supplement the Public Service Rules when the rules need clarification or extension.',
            },
            'csh_ap_056': {
                'explanation': 'The civil-service principles listed here are meant to uphold the public trust, which is why that option completes the rule correctly.',
            },
            'csh_ap_059': {
                'question': 'Which role bears the ultimate duty for control of votes to the Federal Executive Council?',
                'explanation': 'Accounting Officers carry the ultimate duty for vote control and must account to the Federal Executive Council for the use of public funds.',
            },
            'csh_ap_065': {
                'explanation': 'The Executive Council of the Federation is responsible for collective duty, oversight, and accountability in federal administration.',
            },
            'csh_ap_086': {
                'explanation': 'Destroying a record subject to a pending FOI request can breach record-control and transparency obligations, so liability may attach under the governing public-service rules.',
            },
            'csh_ap_103': {
                'question': 'Which method may be used to index files for retrieval?',
                'explanation': 'Files may be indexed chronologically, alphabetically, numerically, or by subject, which makes them easier to retrieve quickly and accurately.',
            },
            'csh_ap_104': {
                'question': 'What best describes a service book in civil service records?',
                'explanation': 'A service book records an officer\'s employment history, promotions, postings, and other career details, so it serves as the officer\'s official career record.',
            },
            'csh_ap_141': {
                'explanation': 'The Action Points section records the tasks assigned after a meeting so responsibilities are clear and follow-up can be traced.',
            },
            'csh_ap_220': {
                'explanation': 'Strong-room or safe contents are checked monthly so the officers in charge can confirm that cash, stamps, or licence books remain secure.',
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
        print(f'Applied round 147 updates to {changed} questions in {target}')
    print(f'Applied round 147 updates to {total_changed} questions across {len(TARGETS)} files')


if __name__ == '__main__':
    main()
