from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'public_procurement.json': {
        'proc_bidding_evaluation_gen_001': {
            'options': [
                'Compliance with approved bidding procedures supported by complete records.',
                'Inconsistent application of rules across similar bids.',
                'Bypassing of review controls during evaluation.',
                'Preference for convenience over procurement compliance.',
            ],
        },
        'proc_bidding_evaluation_gen_003': {
            'options': [
                'Early identification of control gaps with prompt escalation of material exceptions.',
                'Bypassing of review controls.',
                'Disregard of feedback after review.',
                'Preference for convenience over compliance.',
            ],
        },
        'proc_bidding_evaluation_gen_007': {
            'options': [
                'Prevention of collusion, favoritism, and conflicts of interest.',
                'Inconsistent application of rules across similar bids.',
                'Bypassing of review controls during evaluation.',
                'Preference for convenience over procurement compliance.',
            ],
        },
        'proc_bidding_evaluation_gen_009': {
            'options': [
                'Recording of each decision step with preserved file evidence.',
                'Inconsistent application of rules across similar bids.',
                'Bypassing of review controls during evaluation.',
                'Preference for convenience over procurement compliance.',
            ],
        },
        'proc_bidding_evaluation_gen_011': {
            'options': [
                'Traceable decisions supported by evidence-based justification.',
                'Bypassing of review controls during evaluation.',
                'Preference for convenience over procurement compliance.',
                'Disregard of feedback after review.',
            ],
        },
        'proc_bidding_evaluation_gen_015': {
            'options': [
                'Approved workflows with verification of outputs before closure.',
                'Disregard of feedback after review.',
                'Inconsistent application of rules.',
                'Bypassing of review controls.',
            ],
        },
        'proc_bidding_evaluation_gen_017': {
            'options': [
                'Accurate files with status updates at each control point.',
                'Inconsistent application of rules.',
                'Bypassing of review controls.',
                'Preference for convenience over compliance.',
            ],
        },
        'proc_bidding_evaluation_gen_019': {
            'options': [
                'Maintenance of an auditable decision trail.',
                'Bypassing of review controls during evaluation.',
                'Preference for convenience over procurement compliance.',
                'Disregard of feedback after review.',
            ],
        },
        'proc_bidding_evaluation_gen_023': {
            'options': [
                'Consistent application of published criteria to all responsive bids.',
                'Disregard of feedback after review.',
                'Inconsistent application of rules.',
                'Bypassing of review controls.',
            ],
        },
        'proc_bidding_evaluation_gen_025': {
            'options': [
                'Disclosure of conflicts with preservation of impartiality.',
                'Inconsistent application of rules across similar bids.',
                'Bypassing of review controls during evaluation.',
                'Preference for convenience over procurement compliance.',
            ],
        },
        'proc_eligibility_consultants_budgeting_gen_013': {
            'options': [
                'Early identification of risk with applied controls and documented mitigation.',
                'Untracked exceptions after a control failure.',
                'Preference for convenience over control requirements.',
                'Repeated non-compliance after feedback.',
            ],
        },
        'proc_implementation_sanctions_gen_016': {
            'options': [
                'Early identification of risk with applied controls and documented mitigation.',
                'Untracked exceptions after a control failure.',
                'Preference for convenience over control requirements.',
                'Repeated non-compliance after feedback.',
            ],
        },
        'proc_implementation_sanctions_gen_029': {
            'options': [
                'Preference for convenience over policy and legal requirements.',
                'Bypassing of review and approval controls to save time.',
                'Application of approved implementation, monitoring, and sanctions procedures with complete records.',
                'Inconsistent application of rules based on personal preference.',
            ],
        },
        'proc_objectives_institutions_gen_001': {
            'options': [
                'Compliance with approved procedures supported by complete records.',
                'Inconsistent application of rules across similar cases.',
                'Bypassing of review controls during implementation.',
                'Preference for convenience over procurement compliance.',
            ],
        },
        'proc_objectives_institutions_gen_003': {
            'options': [
                'Early identification of control gaps with prompt escalation of material exceptions.',
                'Bypassing of review controls.',
                'Disregard of feedback after review.',
                'Preference for convenience over compliance.',
            ],
        },
        'proc_objectives_institutions_gen_007': {
            'options': [
                'Prevention of collusion, favoritism, and conflicts of interest in consultant selection.',
                'Disregard of feedback after review.',
                'Inconsistent application of rules across similar cases.',
                'Bypassing of review controls during implementation.',
            ],
        },
        'proc_objectives_institutions_gen_009': {
            'options': [
                'Recording of each decision step with preserved file evidence.',
                'Inconsistent application of rules across similar cases.',
                'Bypassing of review controls during implementation.',
                'Preference for convenience over procurement compliance.',
            ],
        },
        'proc_objectives_institutions_gen_011': {
            'options': [
                'Traceable decisions supported by evidence-based justification.',
                'Bypassing of review controls during implementation.',
                'Preference for convenience over procurement compliance.',
                'Disregard of feedback after review.',
            ],
        },
        'proc_objectives_institutions_gen_013': {
            'options': [
                'Early identification of risk with applied controls and documented mitigation.',
                'Preference for convenience over compliance.',
                'Disregard of feedback after review.',
                'Inconsistent application of rules.',
            ],
        },
        'proc_objectives_institutions_gen_015': {
            'options': [
                'Approved workflows with verification of outputs before closure.',
                'Disregard of feedback after review.',
                'Inconsistent application of rules.',
                'Bypassing of review controls.',
            ],
        },
        'proc_objectives_institutions_gen_019': {
            'options': [
                'Maintenance of an auditable trail for every decision.',
                'Bypassing of review controls.',
                'Preference for convenience over compliance.',
                'Disregard of feedback after review.',
            ],
        },
        'proc_transparency_ethics_gen_013': {
            'options': [
                'Early identification of risk with applied controls and documented mitigation.',
                'Untracked exceptions after a control failure.',
                'Preference for convenience over control requirements.',
                'Repeated non-compliance after feedback.',
            ],
        },
        'proc_transparency_ethics_gen_026': {
            'options': [
                'Consistent application of published criteria with complete evaluation records.',
                'Bypassing of review checkpoints where timelines are tight.',
                'Preference for convenience over approved process requirements.',
                'Application of discretionary shortcuts regardless of controls.',
            ],
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
