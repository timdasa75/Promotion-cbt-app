# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'general_current_affairs.json'
UPDATES = {
    'ca_general_gen_001': {
        'question': 'Which action best demonstrates good governance in general affairs work?',
        'options': [
            'Apply approved procedures and keep complete records.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Good governance depends on approved procedures and complete records.',
        'keywords': ['ca_general', 'governance', 'records'],
    },
    'ca_general_gen_003': {
        'question': 'Which action best supports risk management in general affairs work?',
        'options': [
            'Identify control gaps early and escalate material exceptions promptly.',
            'Bypass review controls.',
            'Ignore feedback.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Risk management starts with early identification of gaps and prompt escalation of important exceptions.',
        'keywords': ['ca_general', 'risk_management', 'exceptions'],
    },
    'ca_general_gen_007': {
        'question': 'What best improves public communication literacy in general affairs?',
        'options': [
            'Differentiate verified updates from misinformation.',
            'Ignore new information until the end of the month.',
            'Repeat any message without checking it.',
            'Share only the quickest available message.',
        ],
        'correct': 0,
        'explanation': 'Communication literacy improves when verified updates are separated from misinformation.',
        'keywords': ['ca_general', 'communication_literacy', 'verification'],
    },
    'ca_general_gen_009': {
        'question': 'Which practice best reflects proper documented procedure standards in general affairs?',
        'options': [
            'Follow documented procedure and keep complete records.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Documented procedure means following the required steps and keeping complete records.',
        'keywords': ['ca_general', 'documented_procedure', 'records'],
    },
    'ca_general_gen_011': {
        'question': 'What best demonstrates public accountability in general affairs work?',
        'options': [
            'Provide traceable decisions and evidence-based justification.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
            'Ignore feedback.',
        ],
        'correct': 0,
        'explanation': 'Public accountability requires traceable decisions and evidence-based justification.',
        'keywords': ['ca_general', 'public_accountability', 'traceability'],
    },
    'ca_general_gen_013': {
        'question': 'Which practice best supports risk control in general affairs work?',
        'options': [
            'Identify risk early, apply controls, and document mitigation.',
            'Prioritize convenience over compliance.',
            'Ignore feedback.',
            'Apply rules inconsistently.',
        ],
        'correct': 0,
        'explanation': 'Risk control means spotting risks early, applying controls, and documenting how they were managed.',
        'keywords': ['ca_general', 'risk_control', 'mitigation'],
    },
    'ca_general_gen_015': {
        'question': 'Which practice best sustains operational discipline in general affairs work?',
        'options': [
            'Follow approved workflows and verify outputs before closure.',
            'Ignore feedback.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
        ],
        'correct': 0,
        'explanation': 'Operational discipline means following the approved workflow and checking the output before closure.',
        'keywords': ['ca_general', 'operational_discipline', 'workflows'],
    },
    'ca_general_gen_017': {
        'question': 'What is the best approach to secure log management in general affairs?',
        'options': [
            'Keep accurate files and update status at each control point.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
            'Apply rules inconsistently.',
        ],
        'correct': 0,
        'explanation': 'Log management is stronger when files are accurate and updated at each control point.',
        'keywords': ['ca_general', 'log_management', 'records'],
    },
    'ca_general_gen_019': {
        'question': 'Which action best reflects proper general affairs governance standards?',
        'options': [
            'Apply approved general affairs procedures and keep complete records.',
            'Ignore feedback and continue non-compliant procedures.',
            'Prioritize convenience over policy and legal requirements.',
            'Bypass review and approval controls to save time.',
        ],
        'correct': 0,
        'explanation': 'General affairs governance depends on approved procedures and complete records.',
        'keywords': ['ca_general', 'governance', 'records'],
    },
    'ca_general_gen_023': {
        'question': 'What should officials do to keep up with national governance updates in general affairs?',
        'options': [
            'Track policy changes and their implications for service delivery.',
            'Bypass review controls.',
            'Ignore feedback and continue non-compliant procedures.',
            'Apply rules inconsistently based on preference.',
        ],
        'correct': 0,
        'explanation': 'Officials should track policy changes and their implications for service delivery.',
        'keywords': ['ca_general', 'national_governance', 'policy_changes'],
    },
    'ca_general_gen_025': {
        'question': 'Which practice should an accountable officer prioritize to sustain public communication literacy in general affairs?',
        'options': [
            'Differentiate verified updates from misinformation.',
            'Prioritize convenience over policy and legal requirements.',
            'Bypass review controls to save time.',
            'Apply rules inconsistently based on personal preference.',
        ],
        'correct': 0,
        'explanation': 'Public communication literacy improves when verified updates are separated from misinformation.',
        'keywords': ['ca_general', 'communication_literacy', 'accountable_officer'],
    },
    'ca_general_065': {
        'question': 'What should be done if defects are found in receipt or licence books from the Federal Government Printer?',
        'options': [
            'Report the defects immediately to the Accountant-General and the Auditor-General.',
            'Use the books as they are.',
            'Note the defects for future reference only.',
            'Return the books directly to the printer.',
        ],
        'correct': 0,
        'explanation': 'Defects in receipt or licence books must be reported immediately to the Accountant-General and the Auditor-General.',
        'keywords': ['receipt_books', 'licence_books', 'federal_government_printer'],
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
    print(f'Applied round 137 updates to {changed} questions in {TARGET}')


if __name__ == '__main__':
    main()
