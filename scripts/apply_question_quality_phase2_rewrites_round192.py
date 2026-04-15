from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'constitutional_foi.json': {
        'clg_general_competency_gen_042': {
            'question': 'Which practice best supports legal compliance in general competency, ethics, and reform work?',
            'options': [
                'Checking legal authority and documenting the basis.',
                'Delaying documentation until after action.',
                'Using inconsistent criteria across similar cases.',
                'Bypassing review controls to save time.',
            ],
            'correct': 0,
            'explanation': 'Legal compliance is stronger when officers confirm authority before acting and record the basis for the decision.',
        },
        'clg_general_competency_gen_057': {
            'question': 'Which practice best supports risk control under general competency accountability arrangements?',
            'options': [
                'Applying controls with documented mitigation.',
                'Prioritising convenience over control requirements.',
                'Continuing non-compliance after feedback.',
                'Basing control use on personal preference.',
            ],
            'correct': 0,
            'explanation': 'Risk control is strongest when controls are actually applied and the mitigation used is documented for later review.',
        },
        'clg_general_competency_gen_067': {
            'question': 'When reviewing a sensitive constitutional issue, what should be done first?',
            'options': [
                'Delaying documentation until after action.',
                'Checking legal authority and documenting the basis.',
                'Using inconsistent criteria across similar cases.',
                'Bypassing review controls to save time.',
            ],
            'correct': 1,
            'explanation': 'A sensitive constitutional issue should first be checked against the governing legal authority, with the basis recorded before further action.',
        },
        'clg_general_competency_gen_077': {
            'question': 'Which routine best keeps risk control reviewable in general competency work?',
            'options': [
                'Applying controls with documented mitigation.',
                'Prioritising convenience over control requirements.',
                'Continuing non-compliance after feedback.',
                'Basing control use on personal preference.',
            ],
            'correct': 0,
            'explanation': 'Controls are reviewable when mitigation is documented and the same control standard is applied consistently.',
        },
        'clg_general_competency_gen_085': {
            'question': 'Which practice best improves accountability through stronger risk control in general competency work?',
            'options': [
                'Applying controls with documented mitigation.',
                'Prioritising convenience over control requirements.',
                'Continuing non-compliance after feedback.',
                'Basing control use on personal preference.',
            ],
            'correct': 0,
            'explanation': 'Accountability improves when officers can show the controls used, the mitigation taken, and the reason for the decision.',
        },
        'clg_lc_058': {
            'question': 'What happens when an officer on training abroad receives salary from an overseas employer during the training period?',
            'options': [
                'Forfeiture of Nigerian emoluments without OHCSF approval.',
                'Continued payment of full Nigerian emoluments.',
                'Immediate refund of the full training cost.',
                'Automatic promotion after the course.',
            ],
            'correct': 0,
            'explanation': 'Receiving salary from an overseas employer during the training period affects entitlement to Nigerian emoluments unless the required approval has been obtained.',
        },
        'clg_legal_compliance_gen_013': {
            'question': 'Which practice best supports risk control in legal and statutory compliance work?',
            'options': [
                'Applying controls with documented mitigation.',
                'Prioritising convenience over control requirements.',
                'Continuing non-compliance after feedback.',
                'Basing control use on personal preference.',
            ],
            'correct': 0,
            'explanation': 'Risk control is strongest when the officer applies controls, records the mitigation, and keeps the process reviewable.',
        },
        'clg_legal_compliance_gen_036': {
            'question': 'Which practice best supports legal compliance in statutory and constitutional work?',
            'options': [
                'Checking legal authority and documenting the basis.',
                'Delaying documentation until after action.',
                'Using inconsistent criteria across similar cases.',
                'Bypassing review controls to save time.',
            ],
            'correct': 0,
            'explanation': 'Compliance depends on checking authority first and documenting the basis before acting.',
        },
        'clg_legal_compliance_gen_051': {
            'question': 'Which practice best supports risk control under legal-compliance accountability arrangements?',
            'options': [
                'Applying controls with documented mitigation.',
                'Prioritising convenience over control requirements.',
                'Continuing non-compliance after feedback.',
                'Basing control use on personal preference.',
            ],
            'correct': 0,
            'explanation': 'Accountability is stronger when controls are applied consistently and the mitigation is documented for review.',
        },
        'clg_legal_compliance_gen_059': {
            'question': 'What does the principle of anonymity mean for ministerial decisions in the civil service?',
            'options': [
                'No signing of official documents.',
                'No office identification by officials.',
                'No personal responsibility for ministerial decisions.',
                'No naming of ministers in public documents.',
            ],
            'correct': 2,
            'explanation': 'Anonymity means civil servants implement and advise on ministerial decisions without taking personal political responsibility for those decisions.',
        },
        'clg_legal_compliance_gen_060': {
            'question': 'Which statement best reflects anonymity in official advice and implementation?',
            'options': [
                'No identification in correspondence.',
                'Official advice and implementation with ministerial political responsibility.',
                'No signing of official documents.',
                'No ministerial public responsibility.',
            ],
            'correct': 1,
            'explanation': 'Officials advise and implement, but the Minister bears political responsibility for the decision, which is the core of the anonymity principle.',
        },
        'clg_legal_compliance_gen_067': {
            'question': 'Which practice most strongly aligns with sound legal compliance in sensitive statutory work?',
            'options': [
                'Delaying documentation until after action.',
                'Using inconsistent criteria across similar cases.',
                'Checking legal authority and documenting the basis.',
                'Bypassing review controls to save time.',
            ],
            'correct': 2,
            'explanation': 'Sensitive statutory work should begin with a legal-authority check and a clear record of the basis for the action.',
        },
        'clg_legal_compliance_gen_079': {
            'question': 'Which routine best keeps risk control reviewable in legal and statutory compliance work?',
            'options': [
                'Prioritising convenience over control requirements.',
                'Applying controls with documented mitigation.',
                'Continuing non-compliance after feedback.',
                'Basing control use on personal preference.',
            ],
            'correct': 1,
            'explanation': 'Risk control stays reviewable when controls are applied and the mitigation is documented in a way that can be checked later.',
        },
    },
    ROOT / 'data' / 'civil_service_ethics.json': {
        'eth_general_gen_037': {
            'question': 'Which governance practice most strengthens ethical standards across a public institution?',
            'options': [
                'Clear reporting channels with periodic review and documented follow-up.',
                'Unsupervised ethics controls.',
                'Unrecorded minor breaches.',
                'Awareness notices without oversight.',
            ],
            'correct': 0,
            'explanation': 'Ethical standards are strongest when reporting channels are clear, reviews are periodic, and breaches receive documented follow-up.',
        },
        'ethics_089': {
            'question': 'Which responsibility belongs to the Accountant-General regarding accounting systems and controls?',
            'options': [
                'Maintaining adequate accounting systems and controls.',
                'Formulating national economic policy.',
                'Auditing every account personally.',
                'Executing all payments personally.',
            ],
            'correct': 0,
            'explanation': 'The Accountant-General must ensure that adequate accounting systems and controls operate across government institutions.',
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
