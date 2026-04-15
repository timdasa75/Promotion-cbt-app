# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    (
        ROOT / 'data' / 'civil_service_ethics.json',
        {
            'csh_ap_137': {
                'question': 'Which record-management routine best supports an ongoing negotiation file?',
                'options': [
                    'The file is updated at each control point and the status remains traceable.',
                    'The file is held until the negotiation is concluded before updates are filed.',
                    'The file is left to memory instead of written records.',
                    'The file is kept as separate private notes for each side.',
                ],
                'correct': 0,
                'explanation': 'Negotiation files stay useful when each control point is recorded, because the file must show the current status of the case as it develops.',
                'keywords': ['records_management', 'negotiation', 'control_point'],
            },
            'csh_ap_139': {
                'question': 'Which recordkeeping routine best preserves continuity in an ongoing dispute hearing?',
                'options': [
                    'The hearing record is updated after each sitting and the next action is noted.',
                    'The hearing record is held until the dispute is fully concluded.',
                    'The hearing record is kept as only the final decision.',
                    'The hearing record is kept as separate notes for each representative.',
                ],
                'correct': 0,
                'explanation': 'Dispute-hearing records remain useful when every sitting is captured and the next action is noted, so continuity is not lost between sessions.',
                'keywords': ['dispute_hearing', 'continuity', 'records'],
            },
            'csh_ap_155': {
                'question': 'What routine best supports an official case file during review?',
                'options': [
                    'The file keeps movement entries current and remains traceable at each control point.',
                    'The file applies rules inconsistently.',
                    'The file bypasses review controls.',
                    'The file leaves updates until the case is closed.',
                ],
                'correct': 0,
                'explanation': 'An official case file should stay current and traceable at each control point so reviewers can follow every movement without gaps.',
                'keywords': ['case_file', 'records_management', 'status_updates'],
            },
            'csh_ap_217': {
                'question': 'Which record-management practice best keeps an objectives-and-institutions file easy to review?',
                'options': [
                    'The file stays indexed and current at each control point.',
                    'The file applies rules inconsistently.',
                    'The file bypasses review controls.',
                    'The file prioritizes convenience over compliance.',
                ],
                'correct': 0,
                'explanation': 'An objectives-and-institutions file is easiest to review when it stays indexed, current, and updated at each control point for quick tracing.',
                'keywords': ['records_management', 'reviewable_file', 'status_updates'],
            },
            'csh_ap_219': {
                'question': 'How should a payee\'s mark be handled when the payee is illiterate?',
                'options': [
                    'The payee\'s mark is witnessed by a literate official other than the paying officer.',
                    'The payee\'s mark is ignored if the officer is busy.',
                    'The payee\'s mark is witnessed by the paying officer alone.',
                    'The payee\'s mark is not recorded.',
                ],
                'correct': 0,
                'explanation': 'An illiterate payee needs the mark witnessed by a literate official other than the paying officer so the payment record remains valid and accountable.',
                'keywords': ['payee_mark', 'witness', 'records'],
            },
            'csh_ap_227': {
                'question': 'What is the best approach to secure log management in an office registry?',
                'options': [
                    'The log is kept accurate and updated at each control point.',
                    'The log is bypassed through review controls.',
                    'The log is prioritized for convenience over compliance.',
                    'The log is applied inconsistently.',
                ],
                'correct': 0,
                'explanation': 'Log management in an office registry is stronger when the file is accurate and updated at each control point, because the record must remain traceable.',
                'keywords': ['civil_service_admin', 'ca_general', 'log_management', 'records', 'csh_administrative_procedures', 'records_management'],
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
        print(f'Applied round 148 updates to {changed} questions in {target}')
    print(f'Applied round 148 updates to {total_changed} questions across {len(TARGETS)} files')


if __name__ == '__main__':
    main()
