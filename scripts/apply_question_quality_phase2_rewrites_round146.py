# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    (
        ROOT / 'data' / 'ict_digital.json',
        {
            'ict_sec_056': {
                'question': 'What does non-repudiation mean in digital security?',
                'options': [
                    'The sender cannot deny sending the message.',
                    'The message is always encrypted end to end.',
                    'The system is offline.',
                    'The file is compressed before sending.',
                ],
                'correct': 0,
                'explanation': 'Non-repudiation means the sender cannot deny sending the document or message, so the action is traceable and accountable.',
                'keywords': ['non_repudiation', 'digital_security', 'integrity'],
            },
            'ict_sec_079': {
                'question': 'How should strong-rooms or reserve cash safes be secured when they hold cash, stamps, or licence books?',
                'options': [
                    'With not less than two locks held by different officers.',
                    'With one lock held by the cashier alone.',
                    'With a simple padlock.',
                    'Without any lock if the room is secure.',
                ],
                'correct': 0,
                'explanation': 'The rule requires at least two locks with different officers holding the keys so the cash safe cannot be opened by one person alone.',
                'keywords': ['strong_room', 'cash_safes', 'security'],
            },
            'ict_sec_095': {
                'question': 'Who may open a strong-room or safe under Financial Regulation 1118?',
                'options': [
                    'Only authorised key holders, who must remain present while it is open.',
                    'Any officer on duty.',
                    'The cashier alone.',
                    'Security staff without the key holders.',
                ],
                'correct': 0,
                'explanation': 'Only authorised key holders may open the strong-room or safe, and they must remain present so access stays controlled.',
                'keywords': ['strong_room', 'safe', 'authorised_key_holders'],
            },
            'ict_sec_096': {
                'question': 'What approval is required for journeys outside office hours, weekends, or public holidays?',
                'options': [
                    'Written permission from the Accounting Officer or delegated representative.',
                    'No approval is needed.',
                    'Approval from the police.',
                    'Approval only from a junior officer.',
                ],
                'correct': 0,
                'explanation': 'Such journeys require written permission from the Accounting Officer or a delegated representative before the officer travels.',
                'keywords': ['journey_approval', 'accounting_officer', 'travel_control'],
            },
            'ict_sec_099': {
                'question': 'What is the minimum locking arrangement required for a strong-room or reserve cash safe?',
                'options': [
                    'Not less than two locks, with the keys held by different officers.',
                    'One lock held by the cashier alone.',
                    'A simple padlock.',
                    'No lock if the room is guarded.',
                ],
                'correct': 0,
                'explanation': 'Strong-rooms or reserve cash safes must have not less than two locks with different officers holding the keys.',
                'keywords': ['strong_room', 'cash_safe', 'lock_arrangement'],
            },
            'ict_security_gen_001': {
                'question': 'Which action best demonstrates digital security governance?',
                'options': [
                    'Apply approved digital security procedures and maintain complete records.',
                    'Apply rules inconsistently based on preference.',
                    'Bypass review controls to save time.',
                    'Prioritize convenience over policy requirements.',
                ],
                'correct': 0,
                'explanation': 'Digital security governance depends on approved procedures and complete records because security control only works when the process is traceable and auditable.',
                'keywords': ['digital_security', 'governance', 'records'],
            },
            'ict_security_gen_002': {
                'question': 'What is the best first action in a digital security review?',
                'options': [
                    'Check access, audit, and incident controls before implementation.',
                    'Delay documentation until after implementation.',
                    'Use inconsistent criteria across similar cases.',
                    'Bypass review controls to save time.',
                ],
                'correct': 0,
                'explanation': 'The first step is to check access, audit, and incident controls so the review starts from a control perspective.',
                'keywords': ['digital_security', 'audit_controls', 'review'],
            },
            'ict_e_governance_gen_001': {
                'question': 'What is the best first action in an e-governance compliance review?',
                'options': [
                    'Check service controls and documentation before go-live.',
                    'Delay documentation until after implementation.',
                    'Use inconsistent criteria across similar cases.',
                    'Bypass review controls to save time.',
                ],
                'correct': 0,
                'explanation': 'An e-governance review starts by checking service controls and documentation so compliance evidence is in place before go-live.',
                'keywords': ['e_governance', 'digital_services', 'documentation', 'review'],
            },
            'ict_eg_062': {
                'question': 'What is the key difference between IPPIS and GIFMIS?',
                'options': [
                    'IPPIS manages personnel and payroll; GIFMIS manages budget execution and financial reporting.',
                    'IPPIS manages assets; GIFMIS manages debt.',
                    'IPPIS manages revenue; GIFMIS manages taxes.',
                    'They are the same system.',
                ],
                'correct': 0,
                'explanation': 'IPPIS handles personnel and payroll information, while GIFMIS handles budget execution and financial reporting, so they serve different public-finance functions.',
                'keywords': ['ippis', 'gifmis', 'difference'],
            },
            'ict_eg_083': {
                'question': 'What is a key role of the Civil Service in good governance?',
                'options': [
                    'To ensure Nigeria is administered consistently with good-governance principles.',
                    'To formulate all government policies alone.',
                    'To act as an opposition to the government.',
                    'To manage conflicts in society.',
                ],
                'correct': 0,
                'explanation': 'The civil service helps ensure administration follows the attributes of good governance by applying public rules and procedures consistently.',
                'keywords': ['civil_service', 'good_governance', 'administration'],
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
        print(f'Applied round 146 updates to {changed} questions in {target}')
    print(f'Applied round 146 updates to {total_changed} questions across {len(TARGETS)} files')


if __name__ == '__main__':
    main()
