from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'civil_service_ethics.json': {
        'eth_general_gen_037': {
            'question': 'Which governance practice most strengthens ethical standards across a public institution?',
            'options': [
                'Clear channels, periodic review, and documented follow-up.',
                'Unsupervised ethics controls.',
                'Unrecorded minor breaches.',
                'Awareness notices without oversight.',
            ],
            'correct': 0,
            'explanation': 'Institutional ethical standards are strongest when reporting channels are clear, reviews are periodic, and breaches receive documented follow-up.',
        },
        'eth_general_gen_078': {
            'question': 'Who prepares the draft reply to allocated official correspondence?',
            'options': [
                'Allocated schedule officer.',
                'Supervising director.',
                'Secretariat duty.',
                'Registry clerk.',
            ],
            'correct': 0,
            'explanation': 'Where official correspondence demands a reply, the schedule officer to whom it is allocated is responsible for preparing the draft reply.',
        },
        'ethics_089': {
            'question': 'What is a key duty of the Accountant-General regarding accounting systems and controls?',
            'options': [
                'Adequate accounting systems and controls.',
                'National economic policy.',
                'Personal audit of every account.',
                'Personal execution of all payments.',
            ],
            'correct': 0,
            'explanation': 'The Accountant-General must ensure that adequate accounting systems and controls operate across government institutions.',
        },
    },
    ROOT / 'data' / 'core_competencies.json': {
        'comp_numerical_reasoning_gen_001': {
            'question': 'Which option best demonstrates good governance in numerical and mathematical reasoning tasks?',
            'options': [
                'Approved numerical procedures and complete records.',
                'Rule inconsistency.',
                'Review-control bypass.',
                'Convenience bias.',
            ],
            'correct': 0,
            'explanation': 'Approved numerical procedures and complete records strengthen compliance, consistency, and accountability in numerical and mathematical reasoning.',
        },
        'comp_numerical_reasoning_gen_003': {
            'question': 'Which choice best reflects sound risk management in numerical and mathematical reasoning work?',
            'options': [
                'Early risk identification and prompt escalation.',
                'Review-control bypass.',
                'Convenience bias.',
                'Ongoing non-compliance.',
            ],
            'correct': 0,
            'explanation': 'Early identification of control gaps and prompt escalation of material exceptions is the safest way to manage risk.',
        },
        'comp_numerical_reasoning_gen_007': {
            'question': 'What is the best problem-solving approach in numerical and mathematical reasoning?',
            'options': [
                'Structured decomposition of complex issues.',
                'Feedback avoidance.',
                'Rule inconsistency.',
                'Review-control bypass.',
            ],
            'correct': 0,
            'explanation': 'Breaking complex issues into testable, actionable parts makes the reasoning easier to check and resolve.',
        },
        'comp_numerical_reasoning_gen_009': {
            'question': 'Which option best reflects proper documented procedure standards in numerical and mathematical reasoning work?',
            'options': [
                'Documented procedure and complete records.',
                'Rule inconsistency.',
                'Review-control bypass.',
                'Convenience bias.',
            ],
            'correct': 0,
            'explanation': 'Following documented procedure and keeping complete records makes the work traceable and reliable.',
        },
        'comp_numerical_reasoning_gen_011': {
            'question': 'Which option best demonstrates public accountability in numerical and mathematical reasoning work?',
            'options': [
                'Traceable, evidence-based decisions.',
                'Review-control bypass.',
                'Convenience bias.',
                'Feedback avoidance.',
            ],
            'correct': 0,
            'explanation': 'Providing traceable decisions with evidence-based justification allows the work to be reviewed and defended.',
        },
        'comp_numerical_reasoning_gen_013': {
            'question': 'Which option best supports risk control in numerical and mathematical reasoning work?',
            'options': [
                'Early risk identification and documented mitigation.',
                'Convenience bias.',
                'Feedback avoidance.',
                'Rule inconsistency.',
            ],
            'correct': 0,
            'explanation': 'Identifying risk early, applying controls, and documenting mitigation reduces exposure and keeps the process controlled.',
        },
        'comp_numerical_reasoning_gen_015': {
            'question': 'Which practice best supports operational discipline in numerical and mathematical reasoning work?',
            'options': [
                'Approved workflows and output verification.',
                'Feedback avoidance.',
                'Rule inconsistency.',
                'Review-control bypass.',
            ],
            'correct': 0,
            'explanation': 'Following approved workflows and verifying outputs before closure keeps the work disciplined and accurate.',
        },
        'comp_verbal_reasoning_gen_001': {
            'question': 'Which option best demonstrates good governance in verbal and analytical reasoning tasks?',
            'options': [
                'Approved procedures and complete records.',
                'Rule inconsistency.',
                'Review-control bypass.',
                'Convenience bias.',
            ],
            'correct': 0,
            'explanation': 'Approved procedures and complete records support consistency, compliance, and accountability in reasoning tasks.',
        },
        'comp_verbal_reasoning_gen_003': {
            'question': 'Which choice best reflects sound risk management in verbal and analytical reasoning work?',
            'options': [
                'Early risk identification and documented mitigation.',
                'Review-control bypass.',
                'Convenience bias.',
                'Ongoing non-compliance.',
            ],
            'correct': 0,
            'explanation': 'Early risk identification and documented mitigation is the safest way to manage risk.',
        },
        'comp_verbal_reasoning_gen_007': {
            'question': 'What is the best problem-solving approach in verbal and analytical reasoning?',
            'options': [
                'Structured decomposition of complex issues.',
                'Feedback avoidance.',
                'Rule inconsistency.',
                'Review-control bypass.',
            ],
            'correct': 0,
            'explanation': 'Breaking complex issues into testable, actionable parts makes the reasoning easier to check and resolve.',
        },
        'comp_verbal_reasoning_gen_009': {
            'question': 'Which option best reflects proper documented procedure standards in verbal and analytical reasoning work?',
            'options': [
                'Documented procedure and complete records.',
                'Rule inconsistency.',
                'Review-control bypass.',
                'Convenience bias.',
            ],
            'correct': 0,
            'explanation': 'Following documented procedure and keeping complete records makes the work traceable and reliable.',
        },
        'comp_verbal_reasoning_gen_011': {
            'question': 'Which option best demonstrates public accountability in verbal and analytical reasoning work?',
            'options': [
                'Traceable, evidence-based decisions.',
                'Review-control bypass.',
                'Convenience bias.',
                'Feedback avoidance.',
            ],
            'correct': 0,
            'explanation': 'Providing traceable decisions with evidence-based justification allows the work to be reviewed and defended.',
        },
        'comp_verbal_reasoning_gen_013': {
            'question': 'Which option best supports risk control in verbal and analytical reasoning work?',
            'options': [
                'Early risk identification and documented mitigation.',
                'Convenience bias.',
                'Feedback avoidance.',
                'Rule inconsistency.',
            ],
            'correct': 0,
            'explanation': 'Identifying risk early, applying controls, and documenting mitigation reduces exposure and keeps the process controlled.',
        },
        'comp_verbal_reasoning_gen_015': {
            'question': 'Which practice best supports operational discipline in verbal and analytical reasoning work?',
            'options': [
                'Approved workflows and output verification.',
                'Feedback avoidance.',
                'Rule inconsistency.',
                'Review-control bypass.',
            ],
            'correct': 0,
            'explanation': 'Following approved workflows and verifying outputs before closure keeps the work disciplined and accurate.',
        },
        'competency_num_072': {
            'question': 'In official practice, which office is accountable for paying the salary of an officer on secondment?',
            'options': [
                'Receiving-MDA responsibility.',
                'Shared-MDA cost.',
                'Head-of-Service responsibility.',
                'Parent-MDA responsibility.',
            ],
            'correct': 0,
            'explanation': 'The MDA where the officer is seconded to is accountable for the salary, while the parent MDA remains responsible for the higher-level oversight rules stated in the framework.',
        },
        'competency_num_085': {
            'question': 'In official practice, how often must a public officer submit a declaration of assets and liabilities?',
            'options': [
                'At the beginning and end of the term and every four years.',
                'Promotion only.',
                'Annual declaration.',
                'Beginning only.',
            ],
            'correct': 0,
            'explanation': 'Every public officer must submit a written declaration within the required timeframe, at the end of every four years, and at the end of the term of office.',
        },
        'competency_verbal_018': {
            'explanation': 'In indirect speech, the present tense "am" backshifts to "was" after the reporting verb in the past tense.'
        },
        'competency_verbal_056': {
            'explanation': 'In indirect speech, "am going" backshifts to "was going" and "tomorrow" becomes "the next day".'
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
