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
            'Approve contracts under established controls.',
            'Prepare bidding documents and manage procurement processes.',
            'Authorize payments in the evaluation stage.',
            'Supervise contractors during due process.',
        ],
        'correct': 1,
        'explanation': 'The procurement unit prepares bidding documents and manages the procurement process for the MDA.',
        'keywords': ['procurement_unit', 'bidding_documents', 'mda'],
    },
    'ppa_objectives_021': {
        'question': 'When is restricted tendering justified under the PPA?',
        'options': [
            'When the item is sourced internationally.',
            'When goods or services are available from only a few qualified suppliers.',
            'When the contract requires FEC approval.',
            'When the MDA wants to prioritize local content.',
        ],
        'correct': 1,
        'explanation': 'Restricted tendering is justified where only a limited number of qualified suppliers are available.',
        'keywords': ['restricted_tendering', 'limited_suppliers', 'approval'],
    },
    'ppa_objectives_043': {
        'question': 'What is the likely consequence if a procuring entity fails to ensure due process and transparency?',
        'options': [
            'The contract automatically defaults to the cheapest bidder.',
            'The Accounting Officer may face disciplinary action, including dismissal or surcharge.',
            'The National Assembly must disband the MDA.',
            'The BPP must issue a commendation.',
        ],
        'correct': 1,
        'explanation': 'A failure to ensure due process and transparency can trigger disciplinary sanctions against the Accounting Officer.',
        'keywords': ['due_process', 'transparency', 'sanction'],
    },
    'ppa_objectives_057': {
        'question': 'At the start of a procurement committee meeting, what practice best reinforces seriousness and order?',
        'options': [
            'Open the meeting on time and restate the agenda clearly.',
            'Delay the meeting until informal discussions end.',
            'Start decisions before confirming the agenda.',
            'Treat punctuality as optional for senior members.',
        ],
        'correct': 0,
        'explanation': 'A timely start and a clear restatement of the agenda establish order and seriousness at the meeting.',
        'keywords': ['procurement_committee', 'agenda', 'order'],
    },
    'ppa_objectives_060': {
        'question': 'What must be done when an incorrect entry is made on a receipt or licence?',
        'options': [
            'Cross it out and keep the document as it is.',
            'Cancel the document and complete a new one.',
            'File the document without correction.',
            'Leave the mistake for the paying officer to fix later.',
        ],
        'correct': 1,
        'explanation': 'An incorrect entry requires cancellation of the document and completion of a new one.',
        'keywords': ['receipt', 'licence', 'correction'],
    },
    'ppa_objectives_062': {
        'question': 'What is the effect of using a nominee, trustee, or agent to carry out a prohibited act?',
        'options': [
            'No consequence because the act was not done personally.',
            'It is treated as a breach of the Code.',
            'It becomes lawful conduct.',
            'It is treated as official duty.',
        ],
        'correct': 1,
        'explanation': 'Using a nominee, trustee, or agent does not remove responsibility; it remains a breach of the Code.',
        'keywords': ['nominee', 'trustee', 'code'],
    },
    'ppa_objectives_064': {
        'question': 'Do the stated eligibility rules specify a minimum number of years of service for appointment as Permanent Secretary?',
        'options': [
            'Yes, 17 years.',
            'Yes, 20 years.',
            'Yes, 15 years.',
            'No specific minimum number of years is stated.',
        ],
        'correct': 3,
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
    'ppa_objectives_071': {
        'question': 'What action is required when an incorrect entry is found on a receipt or licence?',
        'options': [
            'Leave the mistake and file the document.',
            'Cancel the document and issue a new one.',
            'Only cross out the error.',
            'Ask the recipient to amend it privately.',
        ],
        'correct': 1,
        'explanation': 'An incorrect entry must be cancelled and the document reissued correctly.',
        'keywords': ['receipt', 'licence', 'reissue'],
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
        'explanation': 'Good governance depends on approved procedures and complete records.',
        'keywords': ['governance', 'records', 'objectives'],
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
        'keywords': ['risk_management', 'control_gaps', 'institutions'],
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
        'keywords': ['ethics', 'conflict_of_interest', 'objectives'],
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
        'keywords': ['documented_procedure', 'records', 'institutions'],
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
        'keywords': ['accountability', 'justification', 'objectives'],
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
        'keywords': ['risk_control', 'mitigation', 'institutions'],
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
        'keywords': ['operational_discipline', 'workflow', 'objectives'],
    },
    'proc_objectives_institutions_gen_017': {
        'question': 'Which practice best supports record management in objectives and institutions work?',
        'options': [
            'Maintain accurate files and update status at each control point.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Record management depends on accurate files and regular status updates at each stage.',
        'keywords': ['records_management', 'files', 'institutions'],
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
        'keywords': ['governance', 'audit_trail', 'objectives'],
    },
}


def apply_updates(node: object) -> int:
    count = 0
    if isinstance(node, list):
        for item in node:
            count += apply_updates(item)
        return count
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
        for value in node.values():
            count += apply_updates(value)
    return count


def main() -> None:
    data = json.loads(TARGET.read_text(encoding='utf-8'))
    changed = apply_updates(data)
    if changed != len(UPDATES):
        raise SystemExit(f'Expected {len(UPDATES)} updates, applied {changed}')
    TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Applied round 121 updates to {changed} questions in {TARGET}')


if __name__ == '__main__':
    main()
