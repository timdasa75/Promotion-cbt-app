from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'public_procurement.json': {
        'ppa_elb_063': {
            'options': [
                'Prevention of collusion, favoritism, and conflicts of interest in consultant selection.',
                'Continuation of non-compliant procedures after feedback.',
                'Personalized rule application in consultant selection.',
                'Bypassing review and approval controls to save time.',
            ],
            'explanation': 'Procurement ethics in consultant selection are protected when collusion, favoritism, and conflicts of interest are actively prevented rather than tolerated.',
        },
        'ppa_ims_051': {
            'options': [
                'Equal and fair treatment of members of the public.',
                'Preferential treatment for officials over ordinary citizens.',
                'Different treatment based on political views.',
                'Arbitrary exceptions whenever discretion seems convenient.',
            ],
            'explanation': 'Impartiality means members of the public should be treated equally and fairly without bias, favoritism, or arbitrary preference.',
        },
        'proc_bidding_evaluation_gen_001': {
            'options': [
                'Following approved bidding procedures with complete records.',
                'Applying rules inconsistently across similar bids.',
                'Bypassing review controls during evaluation.',
                'Prioritizing convenience over procurement compliance.',
            ],
            'explanation': 'Sound procurement governance in bidding and evaluation depends on following approved procedure and preserving a complete record for later review.',
        },
        'proc_bidding_evaluation_gen_007': {
            'options': [
                'Preventing collusion, favoritism, and conflicts of interest.',
                'Applying rules inconsistently across similar bids.',
                'Bypassing review controls during evaluation.',
                'Prioritizing convenience over procurement compliance.',
            ],
            'explanation': 'Procurement ethics in bidding and evaluation depend on preventing collusion, favoritism, and conflicts of interest throughout the process.',
        },
        'proc_bidding_evaluation_gen_009': {
            'options': [
                'Recording each decision step with preserved file evidence.',
                'Applying rules inconsistently across similar bids.',
                'Bypassing review controls during evaluation.',
                'Prioritizing convenience over procurement compliance.',
            ],
            'explanation': 'Documented procedure in evaluation and award requires each decision step to be recorded and the supporting file evidence to be preserved.',
        },
        'proc_bidding_evaluation_gen_011': {
            'options': [
                'Traceable decisions with evidence-based justification.',
                'Bypassing review controls during evaluation.',
                'Prioritizing convenience over procurement compliance.',
                'Ignoring feedback after review.',
            ],
            'explanation': 'Public accountability in bidding and award depends on decisions that are traceable and justified by evidence rather than convenience.',
        },
        'proc_bidding_evaluation_gen_019': {
            'options': [
                'Maintaining an auditable decision trail.',
                'Bypassing review controls during evaluation.',
                'Prioritizing convenience over procurement compliance.',
                'Ignoring feedback after review.',
            ],
            'explanation': 'Governance in bidding and award is strengthened by an auditable decision trail showing how each step was reviewed and decided.',
        },
        'proc_bidding_evaluation_gen_025': {
            'options': [
                'Disclosing conflicts and preserving impartiality.',
                'Applying rules inconsistently across similar bids.',
                'Bypassing review controls during evaluation.',
                'Prioritizing convenience over procurement compliance.',
            ],
            'explanation': 'Procurement ethics are sustained when conflicts are disclosed and impartiality is preserved throughout bidding and evaluation.',
        },
        'proc_implementation_sanctions_gen_028': {
            'options': [
                'Preventing collusion, favoritism, and conflicts of interest.',
                'Tolerating collusion, favoritism, or conflicts of interest.',
                'Basing procurement choices on personal preference.',
                'Ignoring the duty of impartial treatment.',
            ],
            'explanation': 'Procurement ethics in implementation and sanctions work are strengthened when collusion, favoritism, and conflicts of interest are actively prevented.',
        },
        'proc_objectives_institutions_gen_001': {
            'options': [
                'Following approved procedures with complete records.',
                'Applying rules inconsistently across similar cases.',
                'Bypassing review controls during implementation.',
                'Prioritizing convenience over procurement compliance.',
            ],
            'explanation': 'Sound governance in procurement objectives and institutions work depends on approved procedure and complete records that support oversight.',
        },
        'proc_objectives_institutions_gen_007': {
            'options': [
                'Preventing collusion, favoritism, and conflicts of interest in consultant selection.',
                'Ignoring feedback after review.',
                'Applying rules inconsistently across similar cases.',
                'Bypassing review controls during implementation.',
            ],
            'explanation': 'Ethical objectives-and-institutions work requires preventing collusion, favoritism, and conflicts of interest in consultant selection and related procurement activity.',
        },
        'proc_objectives_institutions_gen_009': {
            'options': [
                'Recording each decision step with preserved file evidence.',
                'Applying rules inconsistently across similar cases.',
                'Bypassing review controls during implementation.',
                'Prioritizing convenience over procurement compliance.',
            ],
            'explanation': 'Documented procedure is preserved when each decision step is recorded and the supporting file evidence is kept for later verification.',
        },
        'proc_objectives_institutions_gen_011': {
            'options': [
                'Traceable decisions with evidence-based justification.',
                'Bypassing review controls during implementation.',
                'Prioritizing convenience over procurement compliance.',
                'Ignoring feedback after review.',
            ],
            'explanation': 'Public accountability in procurement institutions work depends on decisions that are traceable and supported by evidence-based reasons.',
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
