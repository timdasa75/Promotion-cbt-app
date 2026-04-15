# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'policy_analysis.json'
UPDATES = {
    'pol_formulation_cycle_gen_001': {
        'question': 'What best shows good governance in policy formulation and cycle work?',
        'options': [
            'Apply approved procedures and keep complete records.',
            'Apply rules inconsistently based on preference.',
            'Bypass review controls to save time.',
            'Ignore documentation requirements.',
        ],
        'correct': 0,
        'explanation': 'Good governance in policy formulation and cycle work depends on approved procedures and complete records.',
        'keywords': ['policy_formulation_cycle', 'governance', 'records'],
    },
    'pol_formulation_cycle_gen_003': {
        'question': 'What is the best risk-management practice in policy formulation and cycle work?',
        'options': [
            'Identify control gaps early and escalate material exceptions promptly.',
            'Delay reporting until the case is closed.',
            'Skip review when timelines are tight.',
            'Treat exceptions as routine.',
        ],
        'correct': 0,
        'explanation': 'Risk management is stronger when control gaps are identified early and material exceptions are escalated promptly.',
        'keywords': ['policy_formulation_cycle', 'risk_management', 'exceptions'],
    },
    'pol_formulation_cycle_gen_007': {
        'question': 'What best ensures evidence quality in policy formulation and cycle work?',
        'options': [
            'Use credible data sources and validate assumptions.',
            'Rely on hearsay and assumptions.',
            'Keep evidence unverified to save time.',
            'Use only the most convenient source.',
        ],
        'correct': 0,
        'explanation': 'Evidence quality improves when credible sources are used and assumptions are validated.',
        'keywords': ['policy_formulation_cycle', 'evidence_quality', 'validation'],
    },
    'pol_formulation_cycle_gen_009': {
        'question': 'Which practice best reflects proper documented procedure standards in policy formulation and cycle work?',
        'options': [
            'Follow documented procedure and keep complete records.',
            'Apply rules inconsistently across similar cases.',
            'Bypass review controls when workloads rise.',
            'Leave records incomplete.',
        ],
        'correct': 0,
        'explanation': 'Proper documented procedure means following the required steps and keeping complete records.',
        'keywords': ['policy_formulation_cycle', 'documented_procedure', 'records'],
    },
    'pol_formulation_cycle_gen_011': {
        'question': 'What best demonstrates public accountability in policy formulation and cycle work?',
        'options': [
            'Provide traceable decisions and evidence-based justification.',
            'Hide the reasons for decisions.',
            'Make decisions informally without records.',
            'Rely on private preference.',
        ],
        'correct': 0,
        'explanation': 'Public accountability requires traceable decisions and evidence-based justification.',
        'keywords': ['policy_formulation_cycle', 'public_accountability', 'traceability'],
    },
    'pol_formulation_cycle_gen_012': {
        'question': 'A unit handling policy formulation and cycle faces competing priorities. Which action best preserves compliance and service quality?',
        'options': [
            'Define the problem, compare options, and use measurable criteria before selecting a policy path.',
            'Choose the quickest option without review.',
            'Skip analysis and follow personal preference.',
            'Close the case before evidence is checked.',
        ],
        'correct': 0,
        'explanation': 'Competing priorities are handled best by defining the problem, comparing options, and applying measurable criteria before selection.',
        'keywords': ['policy_formulation_cycle', 'competing_priorities', 'measurable_criteria'],
    },
    'pol_formulation_cycle_gen_014': {
        'question': 'A supervisor is reviewing gaps in policy formulation and cycle work. Which option best strengthens control and consistency?',
        'options': [
            'Set control checkpoints and apply the same criteria to similar cases.',
            'Use different criteria for similar cases.',
            'Ignore review gaps until year end.',
            'Approve shortcuts when timelines are tight.',
        ],
        'correct': 0,
        'explanation': 'Control and consistency improve when checkpoints are set and the same criteria are used for similar cases.',
        'keywords': ['policy_formulation_cycle', 'control_checkpoints', 'consistency'],
    },
    'pol_formulation_cycle_gen_016': {
        'question': 'For sustainable results in policy formulation and cycle work, which practice should be prioritized first?',
        'options': [
            'Sequence the work so each option is checked against agreed criteria before approval.',
            'Approve the first workable option without review.',
            'Skip criteria when cases are complex.',
            'Focus only on closing files quickly.',
        ],
        'correct': 0,
        'explanation': 'Sustainable results depend on sequencing the work and checking each option against agreed criteria before approval.',
        'keywords': ['policy_formulation_cycle', 'sustainability', 'approval_criteria'],
    },
    'pol_formulation_cycle_gen_018': {
        'question': 'A unit handling policy formulation and cycle receives a case with competing priorities. Which action best preserves compliance and service quality?',
        'options': [
            'Assign roles, timelines, resources, and monitoring checkpoints before rollout.',
            'Launch before responsibilities are assigned.',
            'Skip monitoring because the case is urgent.',
            'Let each unit set its own uncontrolled timeline.',
        ],
        'correct': 0,
        'explanation': 'Implementation is stronger when roles, timelines, resources, and monitoring checkpoints are assigned before rollout.',
        'keywords': ['policy_formulation_cycle', 'implementation', 'monitoring'],
    },
    'policy_constitution_035': {
        'question': 'Which phrase best reflects the principle of transparency in public service?',
        'options': [
            'Open and clear processes so stakeholders can see how decisions are made.',
            'Secret decisions with no explanation.',
            'Prefer private arrangements over public notice.',
            'Hide criteria from affected stakeholders.',
        ],
        'correct': 0,
        'explanation': 'Transparency means decisions and processes are open and understandable to stakeholders.',
        'keywords': ['transparency', 'public_service', 'governance'],
    },
    'policy_constitution_056': {
        'question': 'What does virement mean in public finance?',
        'options': [
            'Authorized transfer of funds from one budget head to another.',
            'External borrowing approved by a ministry.',
            'Payment of imprest for petty cash.',
            'Reallocation of staff duties without finance approval.',
        ],
        'correct': 0,
        'explanation': 'Virement is the authorized transfer of funds within the approved budget from one head to another.',
        'keywords': ['virement', 'budget', 'transfer'],
    },
    'policy_constitution_059': {
        'question': 'How should confidential files be handled?',
        'options': [
            'Kept under restricted access and secure storage.',
            'Left on public notice boards.',
            'Circulated to all staff by default.',
            'Treated like public circulars.',
        ],
        'correct': 0,
        'explanation': 'Confidential files contain sensitive material and must be stored securely with restricted access.',
        'keywords': ['confidential', 'secure_storage', 'access_control'],
    },
    'policy_constitution_062': {
        'question': 'What is a good practice when drafting official correspondence?',
        'options': [
            'Be concise, use a formal tone, include reference numbers and a clear signature.',
            'Use informal language and emojis.',
            'Avoid dates and references.',
            'Fill the letter with personal opinions.',
        ],
        'correct': 0,
        'explanation': 'Official correspondence should be concise, formal, and include references, dates, and authorised signatures.',
        'keywords': ['correspondence', 'formal', 'best_practice'],
    },
    'policy_constitution_063': {
        'question': 'What term best describes the return of unspent budget balances at year end to the Treasury?',
        'options': [
            'Remittance to the Consolidated Revenue Fund or Treasury Single Account.',
            'Virement within the same vote.',
            'Imprest retirement with cash recovery.',
            'Supplementary budget approval.',
        ],
        'correct': 0,
        'explanation': 'At year end, unspent budget balances are returned to the Treasury through remittance to the Consolidated Revenue Fund or the Treasury Single Account.',
        'keywords': ['unspent_balances', 'tsa', 'consolidated_revenue'],
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
    print(f'Applied round 133 updates to {changed} questions in {TARGET}')


if __name__ == '__main__':
    main()
