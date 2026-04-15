# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'core_competencies.json'

UPDATES = {
    'competency_num_003': {
        'explanation': '25% of 120 is 30, so 120 minus 30 leaves 90 staff at work.',
    },
    'competency_num_007': {
        'explanation': '80% of ₦250,000 is ₦200,000, so that is the monthly pension shown by the correct option.',
    },
    'competency_num_008': {
        'explanation': 'Two-thirds of 360 is 240, so the correct answer is the option with that value.',
    },
    'competency_num_009': {
        'explanation': '₦120,000 spread across 12 months gives ₦10,000 per month.',
    },
    'competency_num_012': {
        'explanation': 'Three-fifths of ₦15,000,000 is ₦9,000,000, so that is the amount that goes to salaries.',
    },
    'competency_num_020': {
        'explanation': 'At ₦750 to $1, the value of $200 is ₦150,000.',
    },
    'competency_num_021': {
        'explanation': 'A monthly salary of ₦120,000 becomes ₦1,440,000 in a full year.',
    },
    'competency_num_030': {
        'explanation': 'Five percent of ₦2,000,000 is ₦100,000.',
    },
    'competency_num_035': {
        'explanation': '₦600,000 divided into 6 equal installments gives ₦100,000 per installment.',
    },
    'competency_num_039': {
        'explanation': '2 out of 5 items are defective, so the probability is 2/5, which is 40%.',
    },
    'competency_num_043': {
        'explanation': 'The total cost is ₦1,200,000 and the smallest project is ₦240,000, which is one-fifth of the total.',
    },
    'competency_num_044': {
        'explanation': '15 appears most often in the dataset, so it is the mode.',
    },
    'competency_num_045': {
        'explanation': 'The weighted score is 0.4 × 80 + 0.6 × 90 = 32 + 54 = 86.',
    },
    'competency_num_052': {
        'explanation': 'x + 3x = 800 means 4x = 800, so x = 200.',
    },
    'competency_num_054': {
        'explanation': 'If ₦90,000 is 30% of the basic salary, then the full salary is ₦300,000.',
    },
    'competency_num_055': {
        'explanation': '₦840,000 shared equally by 7 officers gives ₦120,000 each.',
    },
    'competency_num_056': {
        'explanation': '9 litres per day for 22 working days gives 198 litres in total.',
    },
    'competency_num_058': {
        'explanation': '₦450,000 divided by 15 participants gives ₦30,000 per participant.',
    },
    'competency_num_059': {
        'explanation': 'The increase is 60 over a base of 240, so the percentage increase is 25%.',
    },
    'competency_num_060': {
        'explanation': '₦72,000 divided by 120 units gives a unit cost of ₦600.',
    },
    'competency_num_065': {
        'explanation': 'The Budget Office of the Federation prepares revenue estimates in consultation with revenue-generating agencies.',
    },
    'competency_num_079': {
        'question': 'Which role is the Accounting Officer for a Ministry?',
        'options': [
            'The Permanent Secretary',
            'The Minister',
            'The Director of Finance and Accounts',
            'The Head of the Civil Service of the Federation.',
        ],
        'correct': 0,
        'explanation': 'The Permanent Secretary is the Ministry\'s Accounting Officer and is responsible for the ministry\'s finances and records.',
    },
    'competency_num_082': {
        'question': 'Which office is the Accounting Officer of a Ministry?',
        'options': [
            'The Permanent Secretary',
            'The Head of the Civil Service of the Federation',
            'The Minister',
            'The Director of Finance and Accounts.',
        ],
        'correct': 0,
        'explanation': 'The Permanent Secretary is the Accounting Officer of a Ministry because that office is responsible for the ministry\'s funds and administration.',
    },
    'competency_num_083': {
        'question': 'What is the chief role of the Auditor-General for the Federation?',
        'options': [
            'To control the release of funds to MDAs.',
            'To manage all government bank accounts.',
            'To check and report on government expenditures and public accounts.',
            'To prepare the annual budget.',
        ],
        'correct': 2,
        'explanation': 'The Auditor-General audits public expenditure and reports on public accounts, so the option about checking and reporting is correct.',
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
    print(f'Applied round 163 updates to {changed} questions in {TARGET}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
