from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'financial_regulations.json': {
        'fin_gen_085': {
            'question': 'What should be done when an incorrect entry is made on a receipt or licence?',
            'options': [
                'Cancel the document and complete a new one.',
                'Cross it out and leave the document in use.',
                'File it without correction.',
                'Leave the mistake for the paying officer to fix later.',
            ],
            'correct': 0,
            'explanation': 'An incorrect entry on a receipt or licence must be cancelled and replaced with a new document so the record remains valid.',
        },
    },
    ROOT / 'data' / 'general_current_affairs.json': {
        'ca_general_gen_001': {
            'question': 'Which action best demonstrates good governance in general affairs work?',
            'options': [
                'Keeping approved procedures in force and maintaining complete records.',
                'Applying rules inconsistently.',
                'Bypassing review controls.',
                'Prioritizing convenience over compliance.',
            ],
            'correct': 0,
            'explanation': 'Good governance in general affairs depends on consistent procedures, traceable records, and decisions that can be reviewed later.',
        },
        'ca_general_gen_011': {
            'question': 'What best demonstrates public accountability in general affairs work?',
            'options': [
                'Providing traceable decisions with evidence-based justification.',
                'Bypassing review controls.',
                'Prioritizing convenience over compliance.',
                'Ignoring feedback.',
            ],
            'correct': 0,
            'explanation': 'Public accountability requires decisions to be traceable and supported by reasons and evidence that can be reviewed later.',
        },
        'ca_general_gen_019': {
            'question': 'Which action best reflects proper general affairs governance standards?',
            'options': [
                'Applying approved procedures and keeping a complete record trail.',
                'Ignoring feedback and continuing non-compliant procedures.',
                'Prioritizing convenience over policy and legal requirements.',
                'Bypassing review and approval controls to save time.',
            ],
            'correct': 0,
            'explanation': 'Proper governance standards rely on approved procedures, compliance, and records that can be audited later.',
        },
        'PSIR_081': {
            'question': 'When should promotion arrears be paid after an officer is promoted?',
            'options': [
                'Within the same financial year.',
                'After six months only.',
                'On retirement.',
                'Immediately upon issue of the letter in every case.',
            ],
            'correct': 0,
            'explanation': 'Promotion arrears should be paid within the year in which the promotion takes effect, not left indefinitely pending.',
        },
    },
    ROOT / 'data' / 'policy_analysis.json': {
        'policy_constitution_035': {
            'question': 'Which phrase best reflects the principle of transparency in public service?',
            'options': [
                'Open and clear processes so stakeholders can see how decisions are made.',
                'Secret decisions with no explanation.',
                'Prefer private arrangements over public notice.',
                'Hide criteria from affected stakeholders.',
            ],
            'correct': 0,
            'explanation': 'Transparency means decisions and processes are open and understandable to stakeholders so they can see how choices are made.',
        },
    },
    ROOT / 'data' / 'public_procurement.json': {
        'ppa_elb_063': {
            'question': 'Which practice best protects procurement ethics in eligibility and consultant selection?',
            'options': [
                'Preventing collusion, favoritism, and conflicts of interest in consultant selection.',
                'Ignoring feedback and continuing non-compliant procedures.',
                'Applying rules inconsistently based on personal preference.',
                'Bypassing review and approval controls to save time.',
            ],
            'correct': 0,
            'explanation': 'Procurement ethics are protected when collusion, favoritism, and conflicts of interest are prevented during consultant selection.',
        },
        'ppa_ims_051': {
            'question': 'What is the objective of the Principle of Impartiality as it relates to members of the public?',
            'options': [
                'To ensure everyone is treated equally and fairly, regardless of background.',
                'To give officials priority over ordinary citizens.',
                'To let civil servants treat people differently based on political views.',
                'To allow arbitrary exceptions whenever discretion is convenient.',
            ],
            'correct': 0,
            'explanation': 'Impartiality means equal treatment and fairness for the public, without bias or special preference.',
        },
        'proc_bidding_evaluation_gen_001': {
            'question': 'Which action best shows sound procurement governance in bidding, evaluation, and award?',
            'options': [
                'Following approved bidding procedures and preserving complete records.',
                'Applying rules inconsistently.',
                'Bypassing review controls.',
                'Prioritizing convenience over compliance.',
            ],
            'correct': 0,
            'explanation': 'Bidding, evaluation, and award stay sound when approved procedures are followed and a complete record is kept.',
        },
        'proc_bidding_evaluation_gen_007': {
            'question': 'Which practice best supports procurement ethics in bidding, evaluation, and award?',
            'options': [
                'Guarding against collusion, favoritism, and conflicts of interest.',
                'Ignoring feedback.',
                'Inconsistent rule application.',
                'Bypassing review controls.',
            ],
            'correct': 0,
            'explanation': 'Ethical procurement depends on stopping collusion, favoritism, and conflicts of interest.',
        },
        'proc_bidding_evaluation_gen_009': {
            'question': 'Which practice best supports documented procedure during evaluation and award?',
            'options': [
                'Recording each decision step and preserving file evidence.',
                'Inconsistent rule application.',
                'Bypassing review controls.',
                'Convenience over compliance.',
            ],
            'correct': 0,
            'explanation': 'Documented procedure requires each decision step to be recorded and preserved so the process can be checked later.',
        },
        'proc_bidding_evaluation_gen_011': {
            'question': 'Which action best demonstrates public accountability in bidding, evaluation, and award?',
            'options': [
                'Providing traceable decisions with evidence-based justification.',
                'Bypassing review controls.',
                'Convenience over compliance.',
                'Ignoring feedback.',
            ],
            'correct': 0,
            'explanation': 'Accountability depends on traceable decisions and reasons that can be checked later.',
        },
        'proc_bidding_evaluation_gen_019': {
            'question': 'Which action best demonstrates bidding, evaluation, and award governance?',
            'options': [
                'Maintaining an auditable trail for every decision.',
                'Bypassing review controls.',
                'Convenience over compliance.',
                'Ignoring feedback.',
            ],
            'correct': 0,
            'explanation': 'A governance trail shows how each decision was made and recorded.',
        },
        'proc_bidding_evaluation_gen_025': {
            'question': 'Which practice best sustains procurement ethics in bidding, evaluation, and award?',
            'options': [
                'Disclosing conflicts of interest and maintaining an impartial process.',
                'Inconsistent rule application.',
                'Bypassing review controls.',
                'Convenience over compliance.',
            ],
            'correct': 0,
            'explanation': 'Ethics are protected when conflicts are disclosed and the process remains impartial.',
        },
        'proc_objectives_institutions_gen_001': {
            'question': 'Which action best demonstrates sound objectives and institutions governance?',
            'options': [
                'Keeping approved procedures in force and maintaining complete records.',
                'Applying rules inconsistently.',
                'Bypassing review controls.',
                'Prioritizing convenience over compliance.',
            ],
            'correct': 0,
            'explanation': 'Sound governance depends on approved procedures and complete records.',
        },
        'proc_objectives_institutions_gen_007': {
            'question': 'Which practice best supports procurement ethics in objectives and institutions work?',
            'options': [
                'Preventing collusion, favoritism, and conflicts of interest in consultant selection.',
                'Ignoring feedback.',
                'Applying rules inconsistently.',
                'Bypassing review controls.',
            ],
            'correct': 0,
            'explanation': 'Ethical practice requires preventing collusion, favoritism, and conflicts of interest.',
        },
        'proc_objectives_institutions_gen_009': {
            'question': 'Which practice best supports documented procedure in objectives and institutions work?',
            'options': [
                'Recording each decision step and preserving file evidence.',
                'Applying rules inconsistently.',
                'Bypassing review controls.',
                'Prioritizing convenience over compliance.',
            ],
            'correct': 0,
            'explanation': 'Documented procedure requires each decision step to be recorded and preserved so the process can be checked later.',
        },
        'proc_objectives_institutions_gen_011': {
            'question': 'Which action best demonstrates public accountability in objectives and institutions work?',
            'options': [
                'Providing traceable decisions with evidence-based justification.',
                'Bypassing review controls.',
                'Prioritizing convenience over compliance.',
                'Ignoring feedback.',
            ],
            'correct': 0,
            'explanation': 'Accountability depends on traceable decisions and reasons that can be checked later.',
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
