# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'ict_digital.json'
UPDATES = {
    'ict_sec_006': {
        'question': 'What must a strong password include?',
        'options': [
            'Uppercase and lowercase letters, numbers, and special characters.',
            'Only lowercase letters.',
            'Only numbers.',
            'Only the word password.',
        ],
        'correct': 0,
        'explanation': 'A strong password should combine different character types to improve security.',
        'keywords': ['password', 'security', 'authentication'],
    },
    'ict_sec_015': {
        'question': 'Which Nigerian agency enforces data protection standards and the NDPR?',
        'options': [
            'Nigeria Data Protection Commission (NDPC).',
            'Nigerian Communications Commission (NCC).',
            'National Information Technology Development Agency (NITDA).',
            'Economic and Financial Crimes Commission (EFCC).',
        ],
        'correct': 0,
        'explanation': 'The NDPC enforces data protection standards and the NDPR.',
        'keywords': ['data_protection', 'ndpr', 'ndpc'],
    },
    'ict_sec_033': {
        'question': 'What is the primary objective of Multi-Factor Authentication (MFA)?',
        'options': [
            'Strengthening access security by requiring multiple verification factors.',
            'Increasing internet speed.',
            'Reducing the size of files.',
            'Replacing passwords with paper records.',
        ],
        'correct': 0,
        'explanation': 'MFA strengthens access security by requiring more than one verification factor.',
        'keywords': ['mfa', 'authentication', 'access_security'],
    },
    'ict_sec_049': {
        'question': 'What is the purpose of using Access Control Lists (ACLs) on a network?',
        'options': [
            'To specify which users or systems may access network resources.',
            'To increase network speed.',
            'To manage payroll records.',
            'To create digital signatures.',
        ],
        'correct': 0,
        'explanation': 'ACLs define which users or systems are allowed to access network resources.',
        'keywords': ['acl', 'network_access', 'access_control'],
    },
    'ict_sec_056': {
        'question': 'What does non-repudiation mean in digital security?',
        'options': [
            'The sender cannot deny sending the message.',
            'The message is always encrypted end to end.',
            'The system is offline.',
            'The file is compressed before sending.',
        ],
        'correct': 0,
        'explanation': 'Non-repudiation means the sender cannot deny sending the document or message.',
        'keywords': ['non_repudiation', 'digital_security', 'integrity'],
    },
    'ict_sec_058': {
        'question': 'What does separation of duties help prevent in financial systems?',
        'options': [
            'Fraud from combining approval, custody, and recording roles.',
            'Routine document scanning.',
            'Staff rotation.',
            'Network congestion.',
        ],
        'correct': 0,
        'explanation': 'Separating approval, custody, and recording roles reduces fraud risk.',
        'keywords': ['separation_of_duties', 'financial_control', 'fraud_prevention'],
    },
    'ict_sec_068': {
        'question': 'Which action is prohibited during official virtual meetings under the PSR?',
        'options': [
            'Running email or treating files while participating.',
            'Taking official notes.',
            'Identifying yourself when speaking.',
            'Reporting a technical difficulty.',
        ],
        'correct': 0,
        'explanation': 'Multi-tasking such as running email or treating files is prohibited during official virtual meetings.',
        'keywords': ['psr', 'virtual_meetings', 'discipline'],
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
        'explanation': 'The rule requires at least two locks with different officers holding the keys.',
        'keywords': ['strong_room', 'cash_safes', 'security'],
    },
    'ict_sec_087': {
        'question': 'What is the duty of the Board of Survey concerning cash, stamps, and security documents?',
        'options': [
            'To physically count and verify them against the records.',
            'To auction them off.',
            'To destroy them immediately.',
            'To leave them uncounted.',
        ],
        'correct': 0,
        'explanation': 'The Board of Survey must count and verify the items against the relevant records.',
        'keywords': ['board_of_survey', 'verification', 'records'],
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
        'explanation': 'Only authorised key holders may open the strong-room or safe, and they must remain present.',
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
        'explanation': 'Such journeys require written permission from the Accounting Officer or a delegated representative.',
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
        'explanation': 'Digital security governance depends on approved procedures and complete records.',
        'keywords': ['digital_security', 'governance', 'records'],
    },
    'ict_security_gen_002': {
        'question': 'What is the best first action in a digital security review?',
        'options': [
            'Apply security, access, and audit controls in digital operations.',
            'Delay documentation until after implementation.',
            'Use inconsistent criteria across similar cases.',
            'Bypass review controls to save time.',
        ],
        'correct': 0,
        'explanation': 'The first step is to apply security, access, and audit controls in digital operations.',
        'keywords': ['digital_security', 'audit_controls', 'review'],
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
    print(f'Applied round 134 updates to {changed} questions in {TARGET}')


if __name__ == '__main__':
    main()
