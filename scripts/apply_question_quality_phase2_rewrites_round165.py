# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'civil_service_ethics.json'

UPDATES = {
    'eth_values_integrity_gen_024': {
        'question': 'Which practice best supports risk control in civil service values and integrity administration?',
        'options': [
            'Application of approved controls with documented mitigation.',
            'Convenience ahead of control requirements.',
            'Continued non-compliance after feedback.',
            'Personal preference in control use.',
        ],
        'correct': 0,
        'explanation': 'Risk control is stronger when controls are applied early and the mitigation is documented for later review.',
    },
    'ethics_087': {
        'question': 'What remains true after an officer delegates duties to a subordinate?',
        'options': [
            'The delegating officer still retains accountability for the duty.',
            'Accountability passes fully to the subordinate.',
            'Written delegation removes personal responsibility.',
            'Accountability disappears once the duty is accepted.',
        ],
        'correct': 0,
        'explanation': 'Delegation does not remove personal accountability; the delegating officer still answers for the duty performed on the officer’s behalf.',
    },
    'ethics_089': {
        'question': 'What is a key duty of the Accountant-General regarding accounting systems and controls?',
        'options': [
            'Ensuring adequate accounting systems and controls across government.',
            'Formulating national economic policy.',
            'Auditing every public account personally.',
            'Personally executing all government payments.',
        ],
        'correct': 0,
        'explanation': 'The Accountant-General must ensure that adequate accounting systems and controls operate across government institutions.',
    },
    'ethics_093': {
        'question': 'What duty do officers controlling votes owe regarding payment for services rendered?',
        'options': [
            'Ensuring settlement within the financial year in which the service was rendered.',
            'Transfer of all outstanding claims to suspense accounts.',
            'Routine deferral of payment to the next financial year.',
            'Payment only after every claim is perfectly validated beyond the year.',
        ],
        'correct': 0,
        'explanation': 'Officers controlling votes must ensure that payment for services rendered is settled within the same financial year whenever due.',
    },
    'ethics_097': {
        'question': 'What may the Board of Survey\'s findings reveal about an officer in charge?',
        'options': [
            'The officer remains accountable for any discrepancy disclosed by the findings.',
            'The findings have no consequence for the officer.',
            'Dismissal follows automatically once a shortage appears.',
            'Accountability ends before the report is considered.',
        ],
        'correct': 0,
        'explanation': 'The findings may reveal discrepancies, but the officer in charge remains accountable until the matter is resolved satisfactorily.',
    },
    'ethics_099': {
        'question': 'What fiscal rule is observed under the Fiscal Responsibility framework?',
        'options': [
            'Total expenditure must not exceed total revenue.',
            'Total revenue must always exceed expenditure by a fixed margin.',
            'Total revenue is irrelevant to expenditure decisions.',
            'Expenditure may exceed revenue whenever grants are expected.',
        ],
        'correct': 0,
        'explanation': 'A core fiscal-responsibility rule is that total expenditure should not exceed total revenue.',
    },
    'ethics_100': {
        'question': 'What is a key accountability of the Chief Executive of a parastatal to the Board?',
        'options': [
            'Implementation of the decisions and policies of the Board.',
            'Reporting only to the supervising Minister.',
            'Refusal to implement decisions that are personally disliked.',
            "Management of the Board's personal affairs.",
        ],
        'correct': 0,
        'explanation': 'The Chief Executive is accountable to the Board for implementing its approved decisions and policies.',
    },
    'eth_values_integrity_gen_049': {
        'explanation': 'Accountable implementation is stronger when approved procedures are followed consistently and each material step is documented.',
    },
    'eth_values_integrity_gen_051': {
        'explanation': 'Traceability and fairness improve when approved procedures are applied consistently and each material step is documented.',
    },
    'ethics_034': {
        'explanation': 'Accountability ensures civil servants are answerable for their actions and decisions.',
    },
    'ethics_035': {
        'explanation': 'Impartiality requires civil servants to avoid favoritism in hiring and promotions.',
    },
    'ethics_039': {
        'explanation': 'Impartiality requires fair, equal, and non-discriminatory service delivery.',
    },
    'ethics_060': {
        'explanation': 'Integrity discourages corruption and promotes honesty and fairness in service delivery.',
    },
    'ethics_064': {
        'explanation': 'Transparency ensures openness in government contracting and procurement processes.',
    },
    'ethics_070': {
        'explanation': 'Professionalism requires fair and respectful treatment of colleagues and subordinates.',
    },
    'ethics_076': {
        'explanation': 'Impartiality prohibits favoritism and requires fair service to all citizens.',
    },
    'ethics_077': {
        'explanation': 'Accountability ensures responsible and transparent management of public funds.',
    },
    'ethics_079': {
        'explanation': 'Transparency ensures openness in decision-making and builds public trust.',
    },
    'ethics_104': {
        'question': 'When decisions are made in civil service values and integrity work, which step most directly improves traceability and fairness?',
        'options': [
            'Apply approved procedures consistently and document each material step.',
            'Treat exceptions as normal practice without written justification.',
            'Rely on verbal approval and close the file without a documentary trail.',
            'Proceed without validating source records and decision criteria.',
        ],
        'correct': 0,
        'explanation': 'Applying approved procedures consistently and documenting each material step is the best way to make decisions traceable and fair.',
    },
    'ethics_109': {
        'explanation': 'Integrity emphasizes honest conduct and the proper safeguarding of public resources.',
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
    print(f'Applied round 165 updates to {changed} questions in {TARGET}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
