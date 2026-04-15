# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'public_procurement.json'

UPDATES = {
    'ppa_bid_030': {
        'question': 'Contract negotiations are permitted under the PPA in which procurement situation?',
        'options': [
            'Open competitive bidding without a lawful exception.',
            'Sole sourcing or another lawful exception where negotiation is allowed.',
            'Every Works contract above N50 million.',
            'Any contract approved by the FEC.',
        ],
        'correct': 1,
        'explanation': 'Negotiation is only allowed where the law permits a special procurement method such as sole sourcing or another lawful exception.',
        'keywords': ['procurement_method', 'negotiation', 'lawful_exception'],
    },
    'ppa_bid_032': {
        'question': 'What does an abnormally low bid usually signal during evaluation?',
        'options': [
            'Exceptional efficiency by the bidder.',
            'Risk of contract abandonment or poor-quality execution.',
            'Political connection.',
            'Too much information from the MDA.',
        ],
        'correct': 1,
        'explanation': 'A bid that is unusually low may signal a risk that the bidder cannot complete the work properly or at all.',
        'keywords': ['abnormally_low_bid', 'evaluation', 'risk'],
    },
    'ppa_bid_041': {
        'question': 'What does domestic preference under Section 35 allow?',
        'options': [
            'Only Nigerian companies can bid.',
            'Foreign bidders are automatically disqualified.',
            'A margin of preference or scoring advantage for Nigerian firms.',
            'The contract must be split among local firms.',
        ],
        'correct': 2,
        'explanation': 'Domestic preference allows Nigerian firms to receive a lawful advantage or margin of preference in evaluation.',
        'keywords': ['domestic_preference', 'section_35', 'evaluation'],
    },
    'ppa_bid_045': {
        'question': 'What happens if a contractor fails to provide the required performance bond after award?',
        'options': [
            'The contract is terminated or cannot proceed.',
            'The mobilization fee is doubled.',
            'The MDA proceeds without security.',
            'The MDA seeks BPP approval to vary the contract.',
        ],
        'correct': 0,
        'explanation': 'The contractor must provide the required security before the award can be safely implemented.',
        'keywords': ['performance_bond', 'contract_award', 'security'],
    },
    'ppa_bid_046': {
        'question': 'If a bidder\'s offer is non-responsive, what is the required step?',
        'options': [
            'Engage in negotiation with that bidder.',
            'Notify the BPP and exclude the bid from further evaluation.',
            'Give the bidder 48 hours to fix the error.',
            'Automatically blacklist the bidder.',
        ],
        'correct': 1,
        'explanation': 'A non-responsive bid is excluded from further evaluation and treated according to the procurement rules.',
        'keywords': ['non_responsive_bid', 'evaluation', 'administrative_step'],
    },
    'ppa_bid_050': {
        'question': 'What does a post-qualification audit verify before award?',
        'options': [
            'The bidder\'s political affiliation.',
            'The bidder\'s continued eligibility, technical claims, and financial capacity.',
            'The need for contract splitting.',
            'The mobilization fee amount.',
        ],
        'correct': 1,
        'explanation': 'The audit checks whether the bidder still meets the legal, technical, and financial conditions for award.',
        'keywords': ['post_qualification_audit', 'eligibility', 'award'],
    },
    'proc_bidding_evaluation_gen_001': {
        'question': 'Which action best demonstrates sound bidding, evaluation, and award governance?',
        'options': [
            'Follow approved procedures and keep complete records.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Good governance means using approved procedures and keeping a clear record of each decision.',
        'keywords': ['governance', 'records', 'award'],
    },
    'proc_bidding_evaluation_gen_003': {
        'question': 'Which action best supports risk management during bidding, evaluation, and award?',
        'options': [
            'Identify control gaps early and escalate material exceptions promptly.',
            'Bypass review controls.',
            'Ignore feedback.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Risk management starts with early detection of gaps and prompt escalation of important exceptions.',
        'keywords': ['risk_management', 'control_gaps', 'award'],
    },
    'proc_bidding_evaluation_gen_007': {
        'question': 'Which practice best supports procurement ethics in bidding, evaluation, and award?',
        'options': [
            'Prevent collusion, favoritism, and conflicts of interest.',
            'Ignore feedback.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
        ],
        'correct': 0,
        'explanation': 'Ethical procurement depends on preventing collusion, favoritism, and conflicts of interest.',
        'keywords': ['ethics', 'conflict_of_interest', 'bidding'],
    },
    'proc_bidding_evaluation_gen_009': {
        'question': 'Which practice best supports documented procedure during evaluation and award?',
        'options': [
            'Record each decision step and preserve file evidence.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Documented procedure requires a traceable record of each step in the evaluation and award process.',
        'keywords': ['documented_procedure', 'records', 'evaluation'],
    },
    'proc_bidding_evaluation_gen_011': {
        'question': 'Which action best demonstrates public accountability during bidding, evaluation, and award?',
        'options': [
            'Provide traceable decisions and evidence-based justification.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
            'Ignore feedback.',
        ],
        'correct': 0,
        'explanation': 'Accountability depends on traceable decisions and clear reasons that can be reviewed later.',
        'keywords': ['accountability', 'justification', 'award'],
    },
    'proc_bidding_evaluation_gen_013': {
        'question': 'Which practice best supports risk control in bidding, evaluation, and award?',
        'options': [
            'Identify risk early, apply controls, and document mitigation.',
            'Prioritize convenience over compliance.',
            'Ignore feedback.',
            'Apply rules inconsistently.',
        ],
        'correct': 0,
        'explanation': 'Risk control means finding risks early, applying controls, and documenting what was done to reduce them.',
        'keywords': ['risk_control', 'mitigation', 'award'],
    },
    'proc_bidding_evaluation_gen_015': {
        'question': 'Which practice best sustains operational discipline in bidding, evaluation, and award?',
        'options': [
            'Follow approved workflows and verify outputs before closure.',
            'Ignore feedback.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
        ],
        'correct': 0,
        'explanation': 'Operational discipline means following the approved workflow and checking the output before closing the file.',
        'keywords': ['operational_discipline', 'workflow', 'award'],
    },
    'proc_bidding_evaluation_gen_017': {
        'question': 'Which practice best supports record management during bidding, evaluation, and award?',
        'options': [
            'Maintain accurate files and update status at each control point.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Record management requires complete files and updated status notes at each stage of the process.',
        'keywords': ['records_management', 'files', 'award'],
    },
    'proc_bidding_evaluation_gen_019': {
        'question': 'Which action best demonstrates bidding, evaluation, and award governance?',
        'options': [
            'Maintain an auditable trail for every evaluation decision.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
            'Ignore feedback.',
        ],
        'correct': 0,
        'explanation': 'A good governance trail shows exactly how each evaluation decision was made and recorded.',
        'keywords': ['governance', 'audit_trail', 'decision'],
    },
    'proc_bidding_evaluation_gen_023': {
        'question': 'Which practice best supports fair bid evaluation?',
        'options': [
            'Apply published criteria consistently to all responsive bids.',
            'Ignore feedback.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
        ],
        'correct': 0,
        'explanation': 'Fair evaluation depends on applying the published criteria consistently to every responsive bid.',
        'keywords': ['fairness', 'criteria', 'evaluation'],
    },
    'proc_bidding_evaluation_gen_025': {
        'question': 'Which practice best sustains procurement ethics during bidding, evaluation, and award?',
        'options': [
            'Declare conflicts of interest and keep the process impartial.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Ethics are protected when conflicts are disclosed and the process remains impartial.',
        'keywords': ['ethics', 'impartiality', 'award'],
    },
    'ppa_bid_054': {
        'question': 'When a payee is illiterate, whose mark must be witnessed by a literate official other than the paying officer?',
        'options': [
            'The paying officer\'s mark.',
            'No mark is required.',
            'The illiterate payee\'s mark.',
            'The literate official\'s mark.',
        ],
        'correct': 2,
        'explanation': 'The literate official must witness the illiterate payee\'s mark, not the paying officer\'s own mark.',
        'keywords': ['illiterate_payee', 'witness', 'mark'],
    },
    'ppa_bid_055': {
        'question': 'How often must the contents of strong-rooms or safes be checked under the rule?',
        'options': [
            'Only when a discrepancy is suspected.',
            'Once a year.',
            'Monthly by the officer in charge of the keys, with the register initialed and dated.',
            'Only at handover.',
        ],
        'correct': 2,
        'explanation': 'The rule requires a monthly check by the officer in charge of the keys, with the register initialed and dated.',
        'keywords': ['strong_room', 'safes', 'monthly_check'],
    },
}


def walk(node: object) -> bool:
    if isinstance(node, list):
        for item in node:
            if walk(item):
                return True
        return False
    if isinstance(node, dict):
        qid = node.get('id')
        if qid in UPDATES:
            payload = UPDATES[qid]
            node['question'] = payload['question']
            node['options'] = payload['options']
            node['correct'] = payload['correct']
            node['explanation'] = payload['explanation']
            node['keywords'] = payload['keywords']
            return True
        for value in node.values():
            if walk(value):
                return True
    return False


def main() -> None:
    data = json.loads(TARGET.read_text(encoding='utf-8'))
    seen = set()
    def mark(node: object) -> None:
        if isinstance(node, list):
            for item in node:
                mark(item)
        elif isinstance(node, dict):
            qid = node.get('id')
            if qid in UPDATES:
                seen.add(qid)
            for value in node.values():
                mark(value)
    mark(data)
    missing = sorted(set(UPDATES) - seen)
    if missing:
        raise SystemExit(f'Missing IDs: {missing}')
    walk(data)
    TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Applied round 120 updates to {len(UPDATES)} questions in {TARGET}')


if __name__ == '__main__':
    main()
