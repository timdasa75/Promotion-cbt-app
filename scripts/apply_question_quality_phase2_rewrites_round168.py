# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'psr_rules.json'

UPDATES = {
    'psr_ret_007': {
        'question': 'What applies to an officer under disciplinary proceedings under PSR 080107?',
        'options': [
            'Resignation is not allowed until the disciplinary case is concluded.',
            'Immediate resignation from service.',
            'Withdrawal of a submitted resignation at will.',
            'Voluntary retirement during the proceedings.',
        ],
        'correct': 0,
        'explanation': 'PSR 080107 prevents an officer from resigning while disciplinary proceedings are pending until the case is concluded.',
    },
    'psr_ret_009': {
        'question': 'According to PSR 080109, when may termination of appointment occur?',
        'options': [
            'When the officer is found unfit for service or redundant.',
            'Death in service.',
            'Promotion to a higher grade.',
            'Election of a new government.',
        ],
        'correct': 0,
        'explanation': 'PSR 080109 allows termination where the officer is found unfit for service or redundant under the applicable service rules.',
    },
    'psr_ret_037': {
        'question': 'Under PSR 080137, gratuity is not payable to officers in which situation?',
        'options': [
            'Dismissal for misconduct.',
            'Annual leave status.',
            'Honourable resignation.',
            'Normal retirement.',
        ],
        'correct': 0,
        'explanation': 'PSR 080137 withholds gratuity from an officer who is dismissed for misconduct.',
    },
    'psr_ret_048': {
        'question': 'Under PSR 080148, for what purpose may retirees be called back?',
        'options': [
            'Contract or advisory service where their skills are still required.',
            'Political campaign activity.',
            'Training of new entrants only.',
            'Voluntary community work only.',
        ],
        'correct': 0,
        'explanation': 'PSR 080148 allows retirees to be called back for contract or advisory service when their skills and experience are still required.',
    },
    'psr_ret_051': {
        'question': 'Can a contract officer on a non-pensionable appointment be required to sit for the compulsory confirmation examination?',
        'options': [
            'No, because the examination applies to officers on pensionable appointments who are on probation.',
            'Yes, if the officer wishes to convert to a pensionable appointment.',
            'Yes, if the contract expressly provides for it.',
            'Yes, because it is mandatory for all officers.',
        ],
        'correct': 0,
        'explanation': 'The compulsory confirmation examination applies to officers on pensionable appointment who are on probation, so it does not apply to a contract officer on a non-pensionable appointment.',
    },
    'psr_ret_052': {
        'question': 'Must an officer on probation on a pensionable appointment who is already a confirmed member of the JSC or SSC sit for the confirmation examination?',
        'options': [
            'No, because the officer is exempt from the examination.',
            'Yes, but only one paper is required.',
            'Yes, because the examination remains mandatory.',
            'No clear rule is provided on the matter.',
        ],
        'correct': 0,
        'explanation': 'The applicable rule exempts a probationary officer on a pensionable appointment who is already a confirmed member of the JSC or SSC from the confirmation examination.',
    },
    'psr_ret_053': {
        'question': 'Who is required to pass the compulsory confirmation examinations under this section?',
        'options': [
            'Officers on pensionable appointment who are on probation.',
            'Only officers on GL 07 and above.',
            'Only officers on GL 06 and below.',
            'All officers in the Public Service.',
        ],
        'correct': 0,
        'explanation': 'Rule 030501 requires officers on pensionable appointment who are on probation to pass the compulsory confirmation examinations.',
    },
    'psr_ret_057': {
        'question': 'From when does the term of engagement for a non-pensionable appointment commence?',
        'options': [
            'From the date of assumption of duty.',
            'From the date of the offer of appointment.',
            'From the date the officer signs the contract.',
            'From the date the contract is approved.',
        ],
        'correct': 0,
        'explanation': 'Rule 021201 states that the term of engagement for a non-pensionable appointment runs from the date of assumption of duty.',
    },
    'psr_ret_064': {
        'question': 'How do the Rules define a contract appointment?',
        'options': [
            'A temporary appointment to a post for which provision is not made for the payment of a pension.',
            'A temporary appointment with pension attached to the post.',
            'A temporary job of any kind.',
            'A permanent appointment with probation.',
        ],
        'correct': 0,
        'explanation': 'Rule 020402 defines a contract appointment as a temporary appointment to a post for which provision is not made for the payment of a pension.',
    },
    'psr_docx_222': {
        'explanation': 'An officer may leave the Public Service by resignation, retirement, termination, dismissal, or death.',
    },
    'psr_docx_224': {
        'explanation': 'An officer should tender resignation by a written letter submitted through the proper channel.',
    },
    'psr_docx_225': {
        'explanation': 'Resignation becomes effective from the date specified in the letter if the resignation is accepted.',
    },
    'psr_docx_227': {
        'explanation': 'Retirement is compulsory withdrawal on attaining the prescribed age or stipulated number of years of service.',
    },
    'psr_docx_228': {
        'question': 'What is the current mandatory retirement age in the Federal Public Service?',
        'options': [
            '60 years.',
            '55 years.',
            '65 years.',
            '70 years.',
        ],
        'correct': 0,
        'explanation': 'The current mandatory retirement age in the Federal Public Service is 60 years.',
    },
    'psr_docx_229': {
        'question': 'What is the current mandatory length of service for retirement?',
        'options': [
            '35 years.',
            '25 years.',
            '40 years.',
            '30 years.',
        ],
        'correct': 0,
        'explanation': 'The current mandatory length of service for retirement is 35 years.',
    },
    'psr_docx_239': {
        'explanation': 'When an officer dies, the death should be reported immediately to the OHCSF.',
    },
    'psr_docx_240': {
        'explanation': 'The documents to forward to OHCSF for a deceased officer are the death certificate, particulars of the deceased, and a statement of service.',
    },
}


def update(node: object) -> int:
    if isinstance(node, list):
        return sum(update(item) for item in node)
    if isinstance(node, dict):
        qid = node.get('id')
        patch = UPDATES.get(qid)
        if patch:
            for field, value in patch.items():
                node[field] = value
            return 1
        return sum(update(value) for value in node.values())
    return 0


def main() -> int:
    data = json.loads(TARGET.read_text(encoding='utf-8'))
    changed = update(data)
    if changed != len(UPDATES):
        raise SystemExit(f'expected {len(UPDATES)} updates, applied {changed}')
    TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Applied round 168 updates to {changed} questions in {TARGET}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
