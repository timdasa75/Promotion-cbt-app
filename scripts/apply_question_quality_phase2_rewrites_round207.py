from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'psr_rules.json': {
        'circ_leave_welfare_allowances_gen_028': {
            'question': 'What should a compliance review of recurring leave or allowance claims check first?',
            'options': [
                'Consistency with approved circulars and entitlement lists.',
                'Office pressure from the loudest claimant.',
                'Immediate file closure before review.',
                'Payment before checking the governing rules.',
            ],
            'explanation': 'A compliance review should begin by checking the claim against the approved circulars and entitlement list, because those instruments determine whether the claim is properly payable.',
        },
        'circ_leave_welfare_allowances_gen_037': {
            'question': 'Which action most directly strengthens risk management in leave, welfare, and allowance administration?',
            'options': [
                'Convenience ahead of policy requirements.',
                'Early identification of control gaps with prompt escalation of material exceptions.',
                'Continuation of non-compliant procedures after feedback.',
                'Bypassing review and approval controls.',
            ],
            'explanation': 'Risk management improves when control gaps are identified early and material exceptions are escalated promptly, leaving a record that supervisors and auditors can follow.',
        },
        'circ_leave_welfare_allowances_gen_041': {
            'question': 'Which step best preserves promotion standards in a time-sensitive leave, welfare, or allowance file?',
            'options': [
                'Continuation of non-compliant procedures after feedback.',
                'Inconsistent rule application across similar cases.',
                'Verification of eligibility requirements before recommending advancement.',
                'Bypassing review and approval controls.',
            ],
            'explanation': 'Promotion standards are preserved when eligibility requirements are verified before advancement is recommended, even when the file must be handled quickly.',
        },
        'circ_leave_welfare_allowances_gen_043': {
            'question': 'When a leave, welfare, or allowance case requires documented procedure, what should be done first?',
            'options': [
                'Convenience ahead of policy requirements.',
                'Use of documented procedure with complete recordkeeping.',
                'Inconsistent rule application across similar cases.',
                'Bypassing review and approval controls.',
            ],
            'explanation': 'The first step is to follow the documented procedure and keep a complete record, because approved process and traceable documentation are what make later review possible.',
        },
        'circ_leave_welfare_allowances_gen_045': {
            'question': 'Which action most directly strengthens public accountability in leave, welfare, and allowance administration?',
            'options': [
                'Bypassing review and approval controls.',
                'Convenience ahead of policy requirements.',
                'Traceable decisions with evidence-based justification.',
                'Continuation of non-compliant procedures after feedback.',
            ],
            'explanation': 'Public accountability is strongest when decisions are traceable and justified with evidence, so the basis of the decision can be examined later.',
        },
        'circ_leave_welfare_allowances_gen_049': {
            'question': 'Which step best preserves operational discipline in a time-sensitive leave, welfare, or allowance file?',
            'options': [
                'Bypassing review and approval controls.',
                'Continuation of non-compliant procedures after feedback.',
                'Approved workflow use with output verification before closure.',
                'Inconsistent rule application across similar cases.',
            ],
            'explanation': 'Operational discipline is preserved when officers follow the approved workflow and verify outputs before closing the file or moving it onward.',
        },
        'circ_leave_welfare_allowances_gen_051': {
            'question': 'When a leave, welfare, or allowance case requires record management, what should be done first?',
            'options': [
                'Convenience ahead of policy requirements.',
                'Accurate file maintenance with status updates at each control point.',
                'Bypassing review and approval controls.',
                'Inconsistent rule application across similar cases.',
            ],
            'explanation': 'Good record management begins with accurate file maintenance and status updates at each control point, creating the audit trail needed for later checking.',
        },
        'circ_leave_welfare_allowances_gen_057': {
            'question': 'Which step best preserves disciplinary process in a time-sensitive leave, welfare, or allowance file?',
            'options': [
                'Inconsistent rule application across similar cases.',
                'Bypassing review and approval controls.',
                'Due process, fair hearing, and documented decisions.',
                'Continuation of non-compliant procedures after feedback.',
            ],
            'explanation': 'A disciplinary process is preserved when due process is observed, fair hearing is allowed, and each decision is documented for later review.',
        },
        'circ_leave_welfare_allowances_gen_059': {
            'question': 'When a leave, welfare, or allowance case affects promotion standards, what should be done first?',
            'options': [
                'Inconsistent rule application across similar cases.',
                'Bypassing review and approval controls.',
                'Convenience ahead of policy requirements.',
                'Eligibility confirmation before advancement recommendation.',
            ],
            'explanation': 'Promotion standards are protected when eligibility is confirmed before any recommendation for advancement is made.',
        },
        'circ_leave_welfare_allowances_gen_060': {
            'question': 'Which action best preserves compliance and service quality in leave, welfare, and allowance administration?',
            'options': [
                'Consistent application of PSR provisions with auditable records.',
                'Bypassed review checkpoints under time pressure.',
                'Convenience ahead of approved process requirements.',
                'Discretionary shortcuts regardless of controls.',
            ],
            'explanation': 'Compliance and service quality are preserved when the relevant PSR provisions are applied consistently and the record remains auditable from start to finish.',
        },
    },
}


def update_file(path: Path, rewrites: dict[str, dict[str, object]]) -> list[str]:
    data = json.loads(path.read_text(encoding='utf-8'))
    updated: list[str] = []

    def walk(node):
        if isinstance(node, dict):
            qid = node.get('id')
            if qid in rewrites:
                node.update(rewrites[qid])
                updated.append(qid)
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)

    walk(data)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    return updated


def main() -> None:
    total = 0
    for path, rewrites in FILES.items():
        updated = update_file(path, rewrites)
        print(f'Updated {len(updated)} questions in {path.name}')
        for qid in updated:
            print(qid)
        total += len(updated)
    print(f'Total updated: {total}')


if __name__ == '__main__':
    main()
