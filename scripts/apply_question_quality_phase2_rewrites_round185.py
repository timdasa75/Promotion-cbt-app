from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / 'data' / 'public_procurement.json'
REWRITES = {
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
    'proc_transparency_ethics_gen_026': {
        'question': 'A unit handling transparency, ethics, and accountability receives a case with competing priorities. Which action best preserves compliance and service quality?',
        'options': [
            'Applying published criteria consistently and keeping complete evaluation records.',
            'Bypassing review checkpoints where timelines are tight.',
            'Prioritizing convenience over approved process requirements.',
            'Applying discretionary shortcuts to accelerate closure regardless of controls.',
        ],
        'correct': 0,
        'explanation': 'Published criteria and complete records keep the process compliant, traceable, and serviceable.',
    },
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
            'Ensuring everyone is treated equally and fairly, regardless of background.',
            'Giving officials priority over ordinary citizens.',
            'Letting civil servants treat people differently based on political views.',
            'Allowing arbitrary exceptions whenever discretion is convenient.',
        ],
        'correct': 0,
        'explanation': 'Impartiality means equal treatment and fairness for the public, without bias or special preference.',
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
    updated = update_file(DATA_PATH, REWRITES)
    print(f'Updated {len(updated)} questions in {DATA_PATH.name}')
    for qid in updated:
        print(qid)


if __name__ == '__main__':
    main()
