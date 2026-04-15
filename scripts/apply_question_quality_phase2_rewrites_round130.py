# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UPDATES = {
    'data/constitutional_foi.json': {
        'clg_constitutional_governance_gen_009': {
            'question': 'Which recordkeeping practice best supports constitutional-review committee minutes?',
            'options': [
                'Keep a dated record of each review step.',
                'Use personal preference as the guiding rule.',
                'Bypass review checkpoints.',
                'Treat the file as informal notes only.',
            ],
            'correct': 0,
            'explanation': 'Constitutional-review minutes stay reliable when each step is dated and recorded.',
            'keywords': ['constitutional_governance', 'review_minutes', 'dated_record', 'records'],
        },
        'clg_constitutional_governance_gen_011': {
            'question': 'Which action best demonstrates public accountability after a constitutional ruling?',
            'options': [
                'Publish traceable reasons and supporting records.',
                'Keep the ruling unrecorded.',
                'Avoid any review of the decision trail.',
                'Apply inconsistent criteria across similar cases.',
            ],
            'correct': 0,
            'explanation': 'Public accountability is shown when a constitutional ruling is supported by traceable reasons and records.',
            'keywords': ['constitutional_governance', 'public_accountability', 'decision_trail', 'records'],
        },
    },
    'data/general_current_affairs.json': {
        'ca_national_governance_gen_009': {
            'question': 'Which recordkeeping practice best supports national governance briefing notes?',
            'options': [
                'Keep a dated record of each reporting step.',
                'Use personal preference as the guiding rule.',
                'Bypass review checkpoints.',
                'Treat the file as informal notes only.',
            ],
            'correct': 0,
            'explanation': 'National governance briefing notes stay useful when each reporting step is dated and recorded.',
            'keywords': ['national_governance', 'briefing_notes', 'dated_record', 'records'],
        },
        'ca_national_governance_gen_011': {
            'question': 'Which action best demonstrates public accountability after a national governance update?',
            'options': [
                'Publish traceable reasons and supporting records.',
                'Keep the update unrecorded.',
                'Avoid any review of the decision trail.',
                'Apply inconsistent criteria across similar cases.',
            ],
            'correct': 0,
            'explanation': 'Public accountability is shown when a national governance update is supported by traceable reasons and records.',
            'keywords': ['national_governance', 'public_accountability', 'update_trail', 'records'],
        },
    },
    'data/policy_analysis.json': {
        'pol_public_sector_planning_gen_059': {
            'question': 'In a time-sensitive planning file, which step best preserves operational discipline at the approval stage?',
            'options': [
                'Record the approval and file it before closure.',
                'Bypass review checkpoints.',
                'Continue non-compliance after feedback.',
                'Use personal preference in workflow decisions.',
            ],
            'correct': 0,
            'explanation': 'Operational discipline is preserved when the approval is recorded and filed before the case is closed.',
            'keywords': ['planning_file', 'operational_discipline', 'approval_stage', 'records'],
        },
        'pol_public_sector_planning_gen_083': {
            'question': 'In a time-sensitive planning file, which step best preserves operational discipline at the distribution stage?',
            'options': [
                'Record the release and notify the right offices before closure.',
                'Bypass review checkpoints.',
                'Continue non-compliance after feedback.',
                'Use personal preference in workflow decisions.',
            ],
            'correct': 0,
            'explanation': 'Operational discipline is preserved when the release is recorded and the right offices are notified before closure.',
            'keywords': ['planning_file', 'operational_discipline', 'distribution_stage', 'records'],
        },
    },
    'data/psr_rules.json': {
        'psr_retirement_gen_005': {
            'question': 'What should be checked before releasing a retirement pension payment?',
            'options': [
                'Entitlement and supporting records.',
                'The officer’s preferred payment date only.',
                'An informal verbal instruction.',
                'The size of the gratuity before any check.',
            ],
            'correct': 0,
            'explanation': 'Retirement pension payments should be released only after entitlement and supporting records are confirmed.',
            'keywords': ['retirement', 'pension_payment', 'entitlement', 'records'],
        },
        'psr_retirement_gen_023': {
            'question': 'When a retirement-related sanction is appealed, what should the review file preserve?',
            'options': [
                'A clear appeal trail and independently checkable records.',
                'Only the final sanction notice.',
                'Private notes that cannot be checked later.',
                'A quick closure with no written trail.',
            ],
            'correct': 0,
            'explanation': 'A retirement appeal should preserve a clear trail and independently checkable records.',
            'keywords': ['retirement', 'appeal_trail', 'sanction_review', 'records'],
        },
        'circ_leave_welfare_allowances_gen_005': {
            'question': 'What is the best first step when an officer alleges an allowance overpayment?',
            'options': [
                'Open a documented case and verify the facts.',
                'Ignore the complaint until the next circular is issued.',
                'Close the matter as soon as it is reported.',
                'Handle it only through informal discussion.',
            ],
            'correct': 0,
            'explanation': 'An overpayment allegation should start with a documented case and fact verification.',
            'keywords': ['leave_welfare_allowances', 'overpayment', 'complaint_handling', 'fact_verification'],
        },
        'circ_leave_welfare_allowances_gen_020': {
            'question': 'What control should come before approving a welfare or allowance payment?',
            'options': [
                'Confirm entitlement and supporting records.',
                'Approve first and verify later.',
                'Rely on a verbal instruction alone.',
                'Treat every claim as automatically valid.',
            ],
            'correct': 0,
            'explanation': 'Payment approval should follow confirmation of entitlement and supporting records.',
            'keywords': ['leave_welfare_allowances', 'payment_control', 'entitlement', 'records'],
        },
        'circ_leave_welfare_allowances_gen_023': {
            'question': 'What should disciplinary review of a leave, welfare, or allowance case preserve?',
            'options': [
                'A clear appeal trail and independently checkable records.',
                'Only the final sanction notice.',
                'Private notes that cannot be checked later.',
                'A quick closure with no written trail.',
            ],
            'correct': 0,
            'explanation': 'Disciplinary review should preserve an appeal trail and independently checkable records.',
            'keywords': ['leave_welfare_allowances', 'disciplinary_review', 'appeal_trail', 'records'],
        },
        'circ_leave_welfare_allowances_gen_028': {
            'question': 'What should compliance review of recurring leave or allowance claims check first?',
            'options': [
                'Whether each claim matches the approved circulars and entitlement list.',
                'Whether the claimant is the loudest in the office.',
                'Whether the file can be closed immediately.',
                'Whether the claim can be paid before checking the rules.',
            ],
            'correct': 0,
            'explanation': 'Compliance review should first check the claim against approved circulars and the entitlement list.',
            'keywords': ['leave_welfare_allowances', 'compliance_review', 'circulars', 'entitlement_list'],
        },
    }
}


def update(node: object, updates: dict[str, dict[str, object]]) -> int:
    if isinstance(node, list):
        total = 0
        for item in node:
            total += update(item, updates)
        return total
    if isinstance(node, dict):
        qid = node.get('id')
        if qid in updates:
            payload = updates[qid]
            node['question'] = payload['question']
            node['options'] = payload['options']
            node['correct'] = payload['correct']
            node['explanation'] = payload['explanation']
            node['keywords'] = payload['keywords']
            return 1
        total = 0
        for value in node.values():
            total += update(value, updates)
        return total
    return 0


def main() -> None:
    total_changed = 0
    for rel_path, updates in UPDATES.items():
        target = ROOT / rel_path
        data = json.loads(target.read_text(encoding='utf-8'))
        changed = update(data, updates)
        if changed != len(updates):
            raise SystemExit(f'{rel_path}: expected {len(updates)} updates, applied {changed}')
        target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        total_changed += changed
    print(f'Applied round 130 updates to {total_changed} questions across {len(UPDATES)} files')


if __name__ == '__main__':
    main()
