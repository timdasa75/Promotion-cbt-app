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
            'Open competitive bidding without exception.',
            'Sole sourcing or another lawful negotiation exception.',
            'Every Works contract above N50 million.',
            'Any contract approved by the FEC.',
        ],
        'correct': 1,
        'explanation': 'Negotiation is allowed only where the law creates a lawful exception to ordinary competitive bidding.',
        'keywords': ['procurement_method', 'negotiation', 'lawful_exception'],
    },
    'ppa_bid_032': {
        'question': 'What does an abnormally low bid usually signal during evaluation?',
        'options': [
            'Exceptional efficiency.',
            'Risk of abandonment or poor-quality execution.',
            'Political connection.',
            'Too much information from the MDA.',
        ],
        'correct': 1,
        'explanation': 'An unusually low price may signal that the bidder cannot complete the work properly or on time.',
        'keywords': ['abnormally_low_bid', 'evaluation', 'risk'],
    },
    'ppa_bid_041': {
        'question': 'What does domestic preference under Section 35 allow?',
        'options': [
            'Only Nigerian companies can bid.',
            'Automatic disqualification of foreign bidders.',
            'A preference margin for Nigerian firms.',
            'Mandatory contract splitting.',
        ],
        'correct': 2,
        'explanation': 'Domestic preference gives Nigerian firms a lawful advantage or margin of preference in evaluation.',
        'keywords': ['domestic_preference', 'section_35', 'evaluation'],
    },
    'ppa_bid_045': {
        'question': 'What is the primary consequence when a contractor fails to provide the required performance bond after award?',
        'options': [
            'Termination or non-progression of the contract.',
            'Double mobilization fee.',
            'Proceeding without security.',
            'BPP approval for variation.',
        ],
        'correct': 0,
        'explanation': 'The contract cannot safely proceed if the required security is not provided.',
        'keywords': ['performance_bond', 'contract_award', 'security'],
    },
    'ppa_bid_046': {
        'question': 'If a bidder\'s offer is non-responsive, what is the required step?',
        'options': [
            'Negotiation with the bidder.',
            'Exclusion from further evaluation and notice to the BPP.',
            'A 48-hour correction window.',
            'Automatic blacklisting.',
        ],
        'correct': 1,
        'explanation': 'A non-responsive bid is excluded from further evaluation and handled according to the procurement rules.',
        'keywords': ['non_responsive_bid', 'evaluation', 'administrative_step'],
    },
    'ppa_bid_050': {
        'question': 'What does a post-qualification audit verify before award?',
        'options': [
            'Political affiliation.',
            'Continued eligibility, technical claims, and financial capacity.',
            'Contract splitting need.',
            'Mobilization fee amount.',
        ],
        'correct': 1,
        'explanation': 'The audit confirms that the bidder still meets the legal, technical, and financial conditions for award.',
        'keywords': ['post_qualification_audit', 'eligibility', 'award'],
    },
    'proc_bidding_evaluation_gen_001': {
        'question': 'Which action best demonstrates sound bidding, evaluation, and award governance?',
        'options': [
            'Approved procedures and complete records.',
            'Inconsistent rule application.',
            'Bypassing review controls.',
            'Convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Good governance keeps the process on approved procedures and leaves a complete record trail.',
        'keywords': ['governance', 'records', 'award'],
    },
    'proc_bidding_evaluation_gen_003': {
        'question': 'Which action best supports risk management during bidding, evaluation, and award?',
        'options': [
            'Early control-gap identification and escalation of material exceptions.',
            'Bypassing review controls.',
            'Ignoring feedback.',
            'Convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Risk management starts with spotting gaps early and escalating material exceptions without delay.',
        'keywords': ['risk_management', 'control_gaps', 'award'],
    },
    'proc_bidding_evaluation_gen_007': {
        'question': 'Which practice best supports procurement ethics in bidding, evaluation, and award?',
        'options': [
            'Prevention of collusion, favoritism, and conflicts of interest.',
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
        'explanation': 'Documented procedure requires each decision step to be recorded and preserved in the file.',
        'keywords': ['documented_procedure', 'records', 'evaluation'],
    },
    'proc_bidding_evaluation_gen_011': {
        'question': 'Which action best demonstrates public accountability during bidding, evaluation, and award?',
        'options': [
            'Traceable decisions and evidence-based justification.',
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
        'explanation': 'Risk control means identifying risks early, applying controls, and recording how they were managed.',
        'keywords': ['risk_control', 'mitigation', 'award'],
    },
    'proc_bidding_evaluation_gen_015': {
        'question': 'Which practice best sustains operational discipline in bidding, evaluation, and award?',
        'options': [
            'Approved workflows and output verification before closure.',
            'Ignoring feedback.',
            'Inconsistent rule application.',
            'Bypassing review controls.',
        ],
        'correct': 0,
        'explanation': 'Operational discipline means following the approved workflow and verifying the output before closure.',
        'keywords': ['operational_discipline', 'workflow', 'award'],
    },
    'proc_bidding_evaluation_gen_017': {
        'question': 'Which practice best supports record management during bidding, evaluation, and award?',
        'options': [
            'Accurate files and status updates at each control point.',
            'Inconsistent rule application.',
            'Bypassing review controls.',
            'Convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Record management depends on complete files and up-to-date status notes at each stage.',
        'keywords': ['records_management', 'files', 'award'],
    },
    'proc_bidding_evaluation_gen_019': {
        'question': 'Which action best demonstrates bidding, evaluation, and award governance?',
        'options': [
            'An auditable trail for every evaluation decision.',
            'Bypassing review controls.',
            'Convenience over compliance.',
            'Ignoring feedback.',
        ],
        'correct': 0,
        'explanation': 'A good governance trail shows how every evaluation decision was made and recorded.',
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
        'question': 'Which practice best sustains procurement ethics during bidding, evaluation, and award?',
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
    'ppa_bid_054': {
        'question': 'When a payee is illiterate, whose mark must be witnessed by a literate official other than the paying officer?',
        'options': [
            'The paying officer\'s mark.',
            'No mark required.',
            'The illiterate payee\'s mark.',
            'The literate official\'s mark.',
        ],
        'correct': 2,
        'explanation': 'The illiterate payee\'s mark is the one that must be witnessed by the literate official.',
        'keywords': ['illiterate_payee', 'witness', 'mark'],
    },
    'ppa_bid_055': {
        'question': 'How often must strong-room or safe contents be checked under the rule?',
        'options': [
            'Only when a discrepancy is suspected.',
            'Once a year.',
            'Monthly, by the officer in charge of the keys, with the register initialed and dated.',
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
    print(f'Applied round 120B updates to {len(UPDATES)} questions in {TARGET}')


if __name__ == '__main__':
    main()
