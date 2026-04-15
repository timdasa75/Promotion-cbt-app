# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'civil_service_ethics.json'
UPDATES = {
    'csh_ap_140': {
        'question': 'What is the best reason for the chair of an official meeting to arrive promptly and start on time?',
        'options': [
            'To show the meeting objectives are taken seriously.',
            'To show the chair is more senior than the members.',
            'To rush participants into decisions.',
            'To reduce the meeting regardless of the agenda.',
        ],
        'correct': 0,
        'explanation': 'Promptness reinforces seriousness and proper respect for the meeting objectives.',
        'keywords': ['meeting_chair', 'punctuality', 'meeting_objectives'],
    },
    'csh_ap_176': {
        'question': "How should a Head of Department's own letters normally be handled?",
        'options': [
            'Kept on file for reference only.',
            'Circulated to subordinates as routine copies.',
            'Issued as public circulars.',
            'Released through the confidential registry.',
        ],
        'correct': 0,
        'explanation': "A Head of Department's own letters are normally kept on file and not circulated to subordinates.",
        'keywords': ['official_letters', 'circulation', 'subordinates'],
    },
    'csh_ap_217': {
        'question': 'Which record-management practice best keeps an objectives-and-institutions file easy to review?',
        'options': [
            'Keep it indexed and current at each control point.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'A reviewable file stays indexed, current, and updated at each control point.',
        'keywords': ['records_management', 'reviewable_file', 'status_updates'],
    },
    'csh_ap_220': {
        'question': 'How often should the contents of strong-rooms or safes be checked?',
        'options': [
            'Monthly, by the officer in charge of the keys.',
            'Only when a discrepancy is suspected.',
            'Once a year.',
            'Only at handover.',
        ],
        'correct': 0,
        'explanation': 'The rule requires a monthly check by the officer in charge of the keys.',
        'keywords': ['strong_room', 'monthly_check', 'keys'],
    },
    'csh_principles_ethics_gen_014': {
        'question': 'Which risk-control practice best supports civil service principles and ethics administration?',
        'options': [
            'Apply controls and document the mitigation used.',
            'Prefer convenience over control requirements.',
            'Ignore feedback after compliance gaps are found.',
            'Rely on personal preference in control use.',
        ],
        'correct': 0,
        'explanation': 'Risk control is stronger when controls are applied and the mitigation used is documented for later review.',
        'keywords': ['principles_ethics', 'risk_control', 'documented_mitigation'],
    },
    'csh_pt_008': {
        'question': "What may happen to an officer's increment while the officer is under interdiction or suspension?",
        'options': [
            'It may be withheld or deferred.',
            'It is granted in full.',
            'It is doubled automatically.',
            'It is paid without review.',
        ],
        'correct': 0,
        'explanation': 'Under the PSR, an officer under interdiction or suspension may have the normal increment withheld or deferred.',
        'keywords': ['increment', 'interdiction', 'suspension', 'psr'],
    },
}


def update(node: object) -> int:
    if isinstance(node, list):
        return sum(update(item) for item in node)
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
        return sum(update(value) for value in node.values())
    return 0


def main() -> None:
    data = json.loads(TARGET.read_text(encoding='utf-8'))
    changed = update(data)
    if changed != len(UPDATES):
        raise SystemExit(f'Expected {len(UPDATES)} updates, applied {changed}')
    TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Applied round 132 updates to {changed} questions in {TARGET}')


if __name__ == '__main__':
    main()
