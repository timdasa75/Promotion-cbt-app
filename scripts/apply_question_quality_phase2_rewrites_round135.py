# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'ict_digital.json'
UPDATES = {
    'ict_e_governance_gen_001': {
        'question': 'What is the best first action in e-governance and digital-services compliance review?',
        'options': [
            'Apply security, access, and audit controls in digital operations.',
            'Delay documentation until after implementation.',
            'Use inconsistent criteria across similar cases.',
            'Bypass review controls to save time.',
        ],
        'correct': 0,
        'explanation': 'The first step is to apply security, access, and audit controls in digital operations.',
        'keywords': ['e_governance', 'digital_services', 'audit_controls'],
    },
    'ict_eg_012': {
        'question': 'Which platform is designed to track and reduce ghost pensioners?',
        'options': [
            'Integrated Pension Management Information System (IPMIS).',
            'IPPIS.',
            'NIN.',
            'BVAS.',
        ],
        'correct': 0,
        'explanation': 'IPMIS was developed to manage pension records and eliminate ghost pensioners.',
        'keywords': ['ipmis', 'ghost_pensioners', 'pension_records'],
    },
    'ict_eg_023': {
        'question': 'Which ICT platform supports Nigeria\'s electronic customs clearance and trade facilitation?',
        'options': [
            'Nigeria Customs Integrated System (NICIS II).',
            'IPPIS.',
            'GIFMIS.',
            'NOCOPO.',
        ],
        'correct': 0,
        'explanation': 'NICIS II supports electronic customs clearance and trade facilitation.',
        'keywords': ['nicis_ii', 'customs_clearance', 'trade_facilitation'],
    },
    'ict_eg_028': {
        'question': 'Which ICT system helps track and reduce ghost pensioners in the public service?',
        'options': [
            'Integrated Pension Management Information System (IPMIS).',
            'IPPIS.',
            'GIFMIS.',
            'Remita.',
        ],
        'correct': 0,
        'explanation': 'IPMIS was developed to manage pension records and eliminate ghost pensioners.',
        'keywords': ['ipmis', 'ghost_pensioners', 'pension_system'],
    },
    'ict_eg_041': {
        'question': 'Which ICT platform supports electronic voter registration in Nigeria?',
        'options': [
            'INEC Voter Enrolment Device (IVED).',
            'BVAS.',
            'NIN.',
            'NOCOPO.',
        ],
        'correct': 0,
        'explanation': 'The INEC Voter Enrolment Device (IVED) supports biometric voter registration electronically.',
        'keywords': ['ived', 'voter_registration', 'inec'],
    },
    'ict_eg_048': {
        'question': 'What is the purpose of the E-Land Registry initiative?',
        'options': [
            'To digitize land records and reduce disputes.',
            'To manage staff payroll.',
            'To monitor financial transactions.',
            'To track procurement thresholds.',
        ],
        'correct': 0,
        'explanation': 'E-Land Registry digitizes land records to improve transparency and reduce disputes.',
        'keywords': ['e_land_registry', 'land_records', 'digitization'],
    },
    'ict_eg_054': {
        'question': 'What does the E-Government Master Plan emphasize for ICT deployment in government?',
        'options': [
            'Digitizing public services, automation, and inter-agency data sharing.',
            'Maintaining paper-based records.',
            'Restricting citizen access to services.',
            'Centralizing political appointments.',
        ],
        'correct': 0,
        'explanation': 'The e-Government Master Plan aims to digitize services, automate processes, and enable secure data sharing.',
        'keywords': ['egovernment_master_plan', 'automation', 'data_sharing'],
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
        'explanation': 'IPPIS is personnel/payroll focused, while GIFMIS is for integrated budget execution and financial reporting.',
        'keywords': ['ippis', 'gifmis', 'difference'],
    },
    'ict_eg_071': {
        'question': 'Which ICT platform ensures electronic procurement in Nigeria?',
        'options': [
            'Nigerian Open Contracting Portal (NOCOPO).',
            'IPPIS.',
            'GIFMIS.',
            'BVN.',
        ],
        'correct': 0,
        'explanation': 'NOCOPO supports e-procurement in Nigeria.',
        'keywords': ['nocopo', 'e_procurement', 'procurement'],
    },
    'ict_eg_074': {
        'question': 'How does the E-M&E system support governance?',
        'options': [
            'By tracking progress on government programs and performance dashboards in real time.',
            'By monitoring staff salaries only.',
            'By controlling the procurement budget.',
            'By issuing annual leave certificates.',
        ],
        'correct': 0,
        'explanation': 'E-M&E systems track progress on government programs and projects in real time.',
        'keywords': ['e_me', 'monitoring', 'governance'],
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
        'explanation': 'The civil service helps ensure administration follows the attributes of good governance.',
        'keywords': ['civil_service', 'good_governance', 'administration'],
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
    print(f'Applied round 135 updates to {changed} questions in {TARGET}')


if __name__ == '__main__':
    main()
