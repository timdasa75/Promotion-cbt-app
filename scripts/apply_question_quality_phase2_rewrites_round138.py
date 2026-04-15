# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'public_procurement.json'
UPDATES = {
    'ppa_bid_045': {
        'question': 'What happens if a contractor fails to provide the required performance bond after award?',
        'options': [
            'The contract should not proceed without the security.',
            'The mobilization fee is doubled.',
            'The MDA proceeds without security.',
            'The MDA seeks BPP approval to vary the contract.',
        ],
        'correct': 0,
        'explanation': 'The contract should not proceed if the required security has not been provided.',
        'keywords': ['performance_bond', 'award', 'contract_security'],
    },
    'proc_bidding_evaluation_gen_001': {
        'question': 'Which action best shows sound procurement governance in bidding, evaluation, and award?',
        'options': [
            'Approved procedures with complete records.',
            'Inconsistent rule application.',
            'Bypassing review controls.',
            'Convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Sound governance depends on approved procedures and complete records.',
        'keywords': ['procurement_governance', 'records', 'approved_procedures'],
    },
    'proc_bidding_evaluation_gen_003': {
        'question': 'Which action best supports risk management in bidding, evaluation, and award?',
        'options': [
            'Early control-gap identification and prompt escalation.',
            'Bypassing review controls.',
            'Ignoring feedback.',
            'Convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Risk management starts with early detection of control gaps and prompt escalation of exceptions.',
        'keywords': ['procurement_risk', 'exceptions', 'escalation'],
    },
    'proc_bidding_evaluation_gen_007': {
        'question': 'Which practice best supports procurement ethics in bidding, evaluation, and award?',
        'options': [
            'Preventing collusion, favoritism, and conflicts of interest.',
            'Ignoring feedback.',
            'Inconsistent rule application.',
            'Bypassing review controls.',
        ],
        'correct': 0,
        'explanation': 'Ethical procurement depends on stopping collusion, favoritism, and conflicts of interest.',
        'keywords': ['procurement_ethics', 'conflict_of_interest', 'collusion'],
    },
    'proc_bidding_evaluation_gen_009': {
        'question': 'Which practice best supports documented procedure during evaluation and award?',
        'options': [
            'Decision-step recording and file evidence preservation.',
            'Inconsistent rule application.',
            'Bypassing review controls.',
            'Convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Documented procedure requires each decision step to be recorded and preserved.',
        'keywords': ['documented_procedure', 'evaluation', 'records'],
    },
    'proc_bidding_evaluation_gen_011': {
        'question': 'Which action best demonstrates public accountability in bidding, evaluation, and award?',
        'options': [
            'Traceable decisions with evidence-based justification.',
            'Bypassing review controls.',
            'Convenience over compliance.',
            'Ignoring feedback.',
        ],
        'correct': 0,
        'explanation': 'Accountability depends on traceable decisions and reasons that can be checked later.',
        'keywords': ['public_accountability', 'traceability', 'procurement'],
    },
    'proc_bidding_evaluation_gen_015': {
        'question': 'Which practice best sustains operational discipline in bidding, evaluation, and award?',
        'options': [
            'Approved workflows with output verification before closure.',
            'Ignoring feedback.',
            'Inconsistent rule application.',
            'Bypassing review controls.',
        ],
        'correct': 0,
        'explanation': 'Operational discipline means following the approved workflow and verifying the output before closure.',
        'keywords': ['operational_discipline', 'workflow', 'verification'],
    },
    'proc_bidding_evaluation_gen_017': {
        'question': 'Which practice best supports record management in bidding, evaluation, and award?',
        'options': [
            'Accurate files with status updates at each control point.',
            'Inconsistent rule application.',
            'Bypassing review controls.',
            'Convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Record management depends on accurate files and status updates at each stage.',
        'keywords': ['record_management', 'control_points', 'files'],
    },
    'proc_bidding_evaluation_gen_019': {
        'question': 'Which action best demonstrates bidding, evaluation, and award governance?',
        'options': [
            'An auditable trail for every decision.',
            'Bypassing review controls.',
            'Convenience over compliance.',
            'Ignoring feedback.',
        ],
        'correct': 0,
        'explanation': 'A governance trail shows how each decision was made and recorded.',
        'keywords': ['governance', 'audit_trail', 'bidding'],
    },
    'proc_bidding_evaluation_gen_023': {
        'question': 'Which practice best supports fair bid evaluation?',
        'options': [
            'Consistent application of published criteria to all responsive bids.',
            'Ignoring feedback.',
            'Inconsistent rule application.',
            'Bypassing review controls.',
        ],
        'correct': 0,
        'explanation': 'Fairness requires the published criteria to be applied consistently to every responsive bid.',
        'keywords': ['fair_evaluation', 'published_criteria', 'responsive_bids'],
    },
    'proc_bidding_evaluation_gen_025': {
        'question': 'Which practice best sustains procurement ethics in bidding, evaluation, and award?',
        'options': [
            'Disclosure of conflicts of interest and an impartial process.',
            'Inconsistent rule application.',
            'Bypassing review controls.',
            'Convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Ethics are protected when conflicts are disclosed and the process remains impartial.',
        'keywords': ['procurement_ethics', 'impartiality', 'conflict_of_interest'],
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
    print(f'Applied round 138 updates to {changed} questions in {TARGET}')


if __name__ == '__main__':
    main()
