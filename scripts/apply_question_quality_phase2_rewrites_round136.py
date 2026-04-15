# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'public_procurement.json'
UPDATES = {
    'ppa_objectives_008': {
        'question': 'What is the primary role of the Procurement Unit in an MDA?',
        'options': [
            'Prepare bidding documents and manage procurement processes.',
            'Approve contracts under all circumstances.',
            'Authorize payments in the evaluation stage.',
            'Supervise contractors during due process.',
        ],
        'correct': 0,
        'explanation': 'The procurement unit prepares bidding documents and manages the procurement process for the MDA.',
        'keywords': ['procurement_unit', 'bidding_documents', 'mda'],
    },
    'ppa_objectives_021': {
        'question': 'When is restricted tendering justified under the PPA?',
        'options': [
            'When goods or services are available from only a few qualified suppliers.',
            'When the item is sourced internationally.',
            'When the contract requires FEC approval.',
            'When the MDA wants to prioritize local content.',
        ],
        'correct': 0,
        'explanation': 'Restricted tendering is justified where only a limited number of qualified suppliers are available.',
        'keywords': ['restricted_tendering', 'qualified_suppliers', 'ppa'],
    },
    'ppa_objectives_060': {
        'question': 'What must be done when an incorrect entry is made on a receipt or licence?',
        'options': [
            'Cancel the document and complete a new one.',
            'Cross it out and keep the document as it is.',
            'File the document without correction.',
            'Leave the mistake for the paying officer to fix later.',
        ],
        'correct': 0,
        'explanation': 'An incorrect entry requires cancellation of the document and completion of a new one.',
        'keywords': ['receipt_books', 'licence_books', 'correction'],
    },
    'ppa_objectives_062': {
        'question': 'What is the effect of using a nominee, trustee, or agent to carry out a prohibited act?',
        'options': [
            'It is still treated as a breach of the Code.',
            'It becomes lawful conduct.',
            'It is ignored because the act was not done personally.',
            'It is treated as official duty.',
        ],
        'correct': 0,
        'explanation': 'Using a nominee, trustee, or agent does not remove responsibility; the act still breaches the Code.',
        'keywords': ['nominee', 'trustee', 'code_of_conduct'],
    },
    'ppa_objectives_064': {
        'question': 'Do the eligibility rules specify a minimum number of years of service for appointment as Permanent Secretary?',
        'options': [
            'No specific minimum number of years is stated.',
            'Yes, 15 years.',
            'Yes, 17 years.',
            'Yes, 20 years.',
        ],
        'correct': 0,
        'explanation': 'The stated rules do not give a fixed minimum number of years of service for appointment as Permanent Secretary.',
        'keywords': ['permanent_secretary', 'eligibility', 'service_years'],
    },
    'ppa_objectives_070': {
        'question': 'What is the purpose of maintaining a departmental dishonored cheques register?',
        'options': [
            'To ensure clearances are pursued and recoveries are made.',
            'To provide a summary of daily bank transactions.',
            'To track bank charges.',
            'To log all incoming and outgoing cheques.',
        ],
        'correct': 0,
        'explanation': 'The register helps the department pursue clearances and recoveries after cheques are dishonored.',
        'keywords': ['dishonored_cheques', 'register', 'recoveries'],
    },
    'proc_objectives_institutions_gen_001': {
        'question': 'Which action best demonstrates sound objectives and institutions governance?',
        'options': [
            'Apply approved procedures and keep complete records.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Sound governance depends on approved procedures and complete records.',
        'keywords': ['objectives_and_institutions', 'governance', 'records'],
    },
    'proc_objectives_institutions_gen_003': {
        'question': 'Which action best supports risk management in objectives and institutions work?',
        'options': [
            'Identify control gaps early and escalate material exceptions promptly.',
            'Bypass review controls.',
            'Ignore feedback.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Risk management starts with early identification of gaps and prompt escalation of important exceptions.',
        'keywords': ['objectives_and_institutions', 'risk_management', 'exceptions'],
    },
    'proc_objectives_institutions_gen_007': {
        'question': 'Which practice best supports procurement ethics in objectives and institutions work?',
        'options': [
            'Prevent collusion, favoritism, and conflict of interest.',
            'Ignore feedback.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
        ],
        'correct': 0,
        'explanation': 'Ethical practice requires preventing collusion, favoritism, and conflicts of interest.',
        'keywords': ['objectives_and_institutions', 'procurement_ethics', 'conflict_of_interest'],
    },
    'proc_objectives_institutions_gen_009': {
        'question': 'Which practice best supports documented procedure in objectives and institutions work?',
        'options': [
            'Record each decision step and preserve the file evidence.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Documented procedure requires each decision step to be recorded and preserved.',
        'keywords': ['objectives_and_institutions', 'documented_procedure', 'records'],
    },
    'proc_objectives_institutions_gen_011': {
        'question': 'Which action best demonstrates public accountability in objectives and institutions work?',
        'options': [
            'Provide traceable decisions and evidence-based justification.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
            'Ignore feedback.',
        ],
        'correct': 0,
        'explanation': 'Accountability depends on traceable decisions and reasons that can be checked later.',
        'keywords': ['objectives_and_institutions', 'accountability', 'traceability'],
    },
    'proc_objectives_institutions_gen_013': {
        'question': 'Which practice best supports risk control in objectives and institutions work?',
        'options': [
            'Identify risk early, apply controls, and document mitigation.',
            'Prioritize convenience over compliance.',
            'Ignore feedback.',
            'Apply rules inconsistently.',
        ],
        'correct': 0,
        'explanation': 'Risk control means spotting risks early, applying controls, and documenting how they were managed.',
        'keywords': ['objectives_and_institutions', 'risk_control', 'mitigation'],
    },
    'proc_objectives_institutions_gen_015': {
        'question': 'Which practice best sustains operational discipline in objectives and institutions work?',
        'options': [
            'Follow approved workflows and verify outputs before closure.',
            'Ignore feedback.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
        ],
        'correct': 0,
        'explanation': 'Operational discipline means following the approved workflow and checking the output before closure.',
        'keywords': ['objectives_and_institutions', 'operational_discipline', 'workflows'],
    },
    'proc_objectives_institutions_gen_019': {
        'question': 'Which action best demonstrates objectives and institutions governance?',
        'options': [
            'Maintain an auditable trail for every decision.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
            'Ignore feedback.',
        ],
        'correct': 0,
        'explanation': 'A good governance trail shows how each decision was made and recorded.',
        'keywords': ['objectives_and_institutions', 'governance', 'audit_trail'],
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
    print(f'Applied round 136 updates to {changed} questions in {TARGET}')


if __name__ == '__main__':
    main()
