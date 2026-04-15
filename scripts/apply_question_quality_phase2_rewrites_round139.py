# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'psr_rules.json'
UPDATES = {
    'psr_disc_026': {
        'question': 'Under the PSR, what follows termination rather than dismissal?',
        'options': [
            'Payment of benefits that are forfeited on dismissal.',
            'Honourable dismissal with automatic promotion rights.',
            'The same consequences as dismissal in every case.',
            'Automatic application to criminal offences only.',
        ],
        'correct': 0,
        'explanation': 'Termination may preserve benefits, while dismissal leads to forfeiture of benefits and disqualification from re-employment.',
        'keywords': ['termination', 'dismissal', 'benefits', 'psr_100311'],
    },
    'psr_discipline_gen_001': {
        'question': 'Which action best demonstrates sound governance in discipline and misconduct administration?',
        'options': [
            'Use approved procedures and keep complete records.',
            'Apply rules inconsistently across similar cases.',
            'Bypass review and approval controls.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Sound discipline governance depends on approved procedures and complete records.',
        'keywords': ['psr_discipline', 'governance', 'records'],
    },
    'psr_discipline_gen_003': {
        'question': 'Which action best supports risk management in discipline and misconduct cases?',
        'options': [
            'Identify control gaps early and escalate material exceptions promptly.',
            'Bypass review and approval controls.',
            'Ignore feedback after review.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Risk management starts with early identification of gaps and prompt escalation of exceptions.',
        'keywords': ['psr_discipline', 'risk_management', 'exceptions'],
    },
    'psr_discipline_gen_007': {
        'question': 'Which approach best preserves promotion standards in discipline and misconduct administration?',
        'options': [
            'Confirm eligibility before recommending advancement.',
            'Apply inconsistent criteria to similar officers.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Promotion standards are protected when eligibility is confirmed before advancement is recommended.',
        'keywords': ['psr_discipline', 'promotion_standards', 'eligibility'],
    },
    'psr_discipline_gen_009': {
        'question': 'Which practice best reflects proper documented procedure in discipline and misconduct matters?',
        'options': [
            'Follow approved steps and keep complete records.',
            'Apply rules inconsistently across similar cases.',
            'Bypass review and approval controls.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Proper documented procedure means following approved steps and keeping complete records.',
        'keywords': ['psr_discipline', 'documented_procedure', 'recordkeeping'],
    },
    'psr_discipline_gen_011': {
        'question': 'Which action best demonstrates public accountability in discipline and misconduct administration?',
        'options': [
            'Traceable decisions with evidence-based justification.',
            'Bypass review and approval controls.',
            'Prioritize convenience over compliance.',
            'Ignore feedback after review.',
        ],
        'correct': 0,
        'explanation': 'Public accountability is strongest when decisions are traceable and supported by evidence-based reasons.',
        'keywords': ['psr_discipline', 'public_accountability', 'traceability'],
    },
    'psr_discipline_gen_015': {
        'question': 'Which practice should a responsible officer prioritize to sustain operational discipline in discipline and misconduct administration?',
        'options': [
            'Follow approved workflows and verify outputs before closure.',
            'Continue non-compliance after feedback.',
            'Apply rules inconsistently across similar cases.',
            'Bypass review and approval controls.',
        ],
        'correct': 0,
        'explanation': 'Operational discipline is sustained when approved workflows are followed and outputs are checked before closure.',
        'keywords': ['psr_discipline', 'operational_discipline', 'workflow'],
    },
    'psr_discipline_gen_017': {
        'question': 'Which approach best preserves record management in discipline and misconduct administration?',
        'options': [
            'Maintain accurate files and update status at each control point.',
            'Apply rules inconsistently across similar cases.',
            'Bypass review and approval controls.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Record management is preserved by accurate file maintenance and timely status updates at each control point.',
        'keywords': ['psr_discipline', 'record_management', 'status_updates'],
    },
    'psr_discipline_gen_019': {
        'question': 'Which action best reflects proper governance standards in discipline and misconduct matters?',
        'options': [
            'Use approved procedures and keep complete records.',
            'Bypass review and approval controls.',
            'Prioritize convenience over compliance.',
            'Continue non-compliance after feedback.',
        ],
        'correct': 0,
        'explanation': 'Proper governance standards require approved procedures, complete records, and decisions that can be reviewed objectively.',
        'keywords': ['psr_discipline', 'governance_standards', 'approved_procedures'],
    },
    'psr_discipline_gen_023': {
        'question': 'Which practice best aligns with due process in discipline and misconduct administration?',
        'options': [
            'Ensure fair hearing and document decisions.',
            'Continue non-compliance after feedback.',
            'Apply rules inconsistently across similar cases.',
            'Bypass review and approval controls.',
        ],
        'correct': 0,
        'explanation': 'A sound disciplinary process depends on due process, fair hearing, and documented decisions.',
        'keywords': ['psr_discipline', 'due_process', 'fair_hearing'],
    },
    'psr_discipline_gen_025': {
        'question': 'Which practice should a responsible officer prioritize to sustain promotion standards in discipline and misconduct administration?',
        'options': [
            'Confirm eligibility before recommending advancement.',
            'Apply inconsistent criteria to similar officers.',
            'Bypass review and approval controls.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Promotion standards remain credible when eligibility is confirmed before advancement is recommended.',
        'keywords': ['psr_discipline', 'promotion_standards', 'advancement_review'],
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
    print(f'Applied round 139 updates to {changed} questions in {TARGET}')


if __name__ == '__main__':
    main()
