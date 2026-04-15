# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'public_procurement.json'

UPDATES = {
    'ppa_bid_032': {
        'question': 'What does an abnormally low bid usually suggest during evaluation?',
        'options': [
            'Risk of abandonment or poor-quality execution.',
            'Exceptional efficiency by the bidder.',
            'Political connection.',
            'Too much information from the MDA.',
        ],
        'correct': 0,
        'explanation': 'A bid that is too low may signal a risk that the bidder cannot complete the work properly.',
        'keywords': ['abnormally_low_bid', 'evaluation', 'risk'],
    },
    'ppa_bid_041': {
        'question': 'What does domestic preference under Section 35 allow?',
        'options': [
            'A scoring advantage or margin of preference for Nigerian firms.',
            'Only Nigerian companies can bid.',
            'Automatic disqualification of foreign bidders.',
            'Mandatory contract splitting.',
        ],
        'correct': 0,
        'explanation': 'Domestic preference gives Nigerian firms a lawful advantage in evaluation.',
        'keywords': ['domestic_preference', 'section_35', 'evaluation'],
    },
    'ppa_bid_045': {
        'question': 'What is the usual consequence when a contractor fails to provide the required performance bond after award?',
        'options': [
            'The contract cannot proceed without the security.',
            'The mobilization fee is doubled.',
            'The MDA proceeds without security.',
            'The MDA seeks BPP approval to vary the contract.',
        ],
        'correct': 0,
        'explanation': 'The contract should not proceed if the required security has not been provided.',
        'keywords': ['performance_bond', 'contract_award', 'security'],
    },
    'ppa_bid_046': {
        'question': 'What should be done when a bidder\'s offer is non-responsive?',
        'options': [
            'Exclude it from further evaluation and notify the BPP.',
            'Negotiate with the bidder.',
            'Give the bidder 48 hours to correct the error.',
            'Automatically blacklist the bidder.',
        ],
        'correct': 0,
        'explanation': 'A non-responsive bid is excluded from further evaluation and handled according to the procurement rules.',
        'keywords': ['non_responsive_bid', 'evaluation', 'administrative_step'],
    },
    'ppa_bid_050': {
        'question': 'What does post-qualification audit verify before award?',
        'options': [
            'Continued eligibility, technical claims, and financial capacity.',
            'Political affiliation.',
            'Contract splitting need.',
            'Mobilization fee amount.',
        ],
        'correct': 0,
        'explanation': 'The audit confirms that the bidder still meets the legal, technical, and financial conditions for award.',
        'keywords': ['post_qualification_audit', 'eligibility', 'award'],
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
        'keywords': ['governance', 'records', 'award'],
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
        'keywords': ['risk_management', 'control_gaps', 'award'],
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
        'keywords': ['ethics', 'conflict_of_interest', 'bidding'],
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
        'keywords': ['documented_procedure', 'records', 'evaluation'],
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
        'keywords': ['accountability', 'justification', 'award'],
    },
    'proc_bidding_evaluation_gen_013': {
        'question': 'Which practice best supports risk control in bidding, evaluation, and award?',
        'options': [
            'Early risk identification, control application, and mitigation documentation.',
            'Convenience over compliance.',
            'Ignoring feedback.',
            'Inconsistent rule application.',
        ],
        'correct': 0,
        'explanation': 'Risk control means identifying risks early, applying controls, and documenting mitigation.',
        'keywords': ['risk_control', 'mitigation', 'award'],
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
        'keywords': ['operational_discipline', 'workflow', 'award'],
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
        'keywords': ['records_management', 'files', 'award'],
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
        'keywords': ['governance', 'audit_trail', 'decision'],
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
        'keywords': ['fairness', 'criteria', 'evaluation'],
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
        'keywords': ['ethics', 'impartiality', 'award'],
    },
}


def apply(node: object) -> int:
    if isinstance(node, list):
        total = 0
        for item in node:
            total += apply(item)
        return total
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
        total = 0
        for value in node.values():
            total += apply(value)
        return total
    return 0


def main() -> None:
    data = json.loads(TARGET.read_text(encoding='utf-8'))
    changed = apply(data)
    if changed != len(UPDATES):
        raise SystemExit(f'Expected {len(UPDATES)} updates, applied {changed}')
    TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Applied round 124 updates to {changed} questions in {TARGET}')


if __name__ == '__main__':
    main()
