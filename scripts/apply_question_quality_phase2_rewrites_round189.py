from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'civil_service_ethics.json': {
        'csh_service_delivery_grievance_gen_014': {
            'question': 'Which practice best supports risk control in service delivery and grievance administration?',
            'options': [
                'Documented control mitigation.',
                'Convenience bias.',
                'Ongoing non-compliance.',
                'Personal control preference.',
            ],
            'correct': 0,
            'explanation': 'Risk control is stronger when risks are identified early, appropriate controls are applied, and the mitigation used is documented for later review.',
        },
        'eth_anti_corruption_gen_031': {
            'question': 'Which action best demonstrates active risk control in anti-corruption administration?',
            'options': [
                'Early risk identification and documented mitigation.',
                'Ongoing non-compliance.',
                'Personal control preference.',
                'Review-checkpoint bypass.',
            ],
            'correct': 0,
            'explanation': 'Active risk control requires early identification of risk, application of controls, and documented mitigation for follow-up.',
        },
        'eth_anti_corruption_gen_054': {
            'question': 'Which practice best supports risk control under anti-corruption accountability controls?',
            'options': [
                'Documented control mitigation.',
                'Convenience bias.',
                'Personal rule preference.',
                'Ongoing non-compliance.',
            ],
            'correct': 0,
            'explanation': 'Risk control is improved when identified risks are met with applied controls and documented mitigation rather than informal handling.',
        },
        'eth_conflict_interest_gen_059': {
            'question': 'Which practice best supports risk control under conflict-of-interest accountability controls?',
            'options': [
                'Documented control mitigation.',
                'Convenience bias.',
                'Personal rule preference.',
                'Ongoing non-compliance.',
            ],
            'correct': 0,
            'explanation': 'Risk control under conflict-of-interest accountability is stronger when applied controls are paired with documented mitigation and follow-up.',
        },
        'eth_conflict_interest_gen_072': {
            'question': 'Which practice best supports risk control in conflict-of-interest management?',
            'options': [
                'Documented control mitigation.',
                'Ongoing non-compliance.',
                'Personal rule preference.',
                'Convenience bias.',
            ],
            'correct': 0,
            'explanation': 'Conflict-of-interest risk is best controlled when risks are identified early, appropriate controls are applied, and mitigation is documented for review.',
        },
        'eth_general_gen_013': {
            'question': 'Which practice best supports risk control in general ethics?',
            'options': [
                'Documented control mitigation.',
                'Convenience bias.',
                'Ongoing non-compliance.',
                'Personal control preference.',
            ],
            'correct': 0,
            'explanation': 'Risk control in general ethics is stronger when identified risks are matched with applied controls and documented mitigation.',
        },
        'eth_general_gen_031': {
            'question': 'Which action best demonstrates active risk control in general ethics administration?',
            'options': [
                'Documented control mitigation.',
                'Convenience bias.',
                'Ongoing non-compliance.',
                'Personal control preference.',
            ],
            'correct': 0,
            'explanation': 'Risk control in general ethics is stronger when identified risks are matched with applied controls and documented mitigation.',
        },
        'eth_general_gen_037': {
            'question': 'Which governance practice most strengthens ethical standards across a public institution?',
            'options': [
                'Clear reporting channels and documented follow-up.',
                'Unsupervised ethics controls.',
                'Unrecorded minor breaches.',
                'Awareness notices without oversight.',
            ],
            'correct': 0,
            'explanation': 'Institutional ethical standards are strongest when reporting channels are clear, reviews are periodic, and breaches receive documented follow-up.',
        },
        'eth_general_gen_060': {
            'question': 'Which practice best supports risk control under general-ethics accountability arrangements?',
            'options': [
                'Documented control mitigation.',
                'Convenience bias.',
                'Ongoing non-compliance.',
                'Personal control preference.',
            ],
            'correct': 0,
            'explanation': 'Risk control in general ethics is stronger when identified risks are matched with applied controls and documented mitigation.',
        },
        'eth_general_gen_075': {
            'question': 'Who should prepare a draft reply when official correspondence requires one?',
            'options': [
                'The schedule officer.',
                'The supervising director.',
                'The secretariat.',
                'The registry clerk.',
            ],
            'correct': 0,
            'explanation': 'A schedule officer prepares a draft reply whenever the item of correspondence allocated to the officer requires a reply.',
        },
        'eth_general_gen_078': {
            'question': 'Who should prepare a draft reply when official correspondence requires one?',
            'options': [
                'The schedule officer to whom the correspondence is allocated.',
                'The supervising director.',
                'The secretariat regardless of allocation.',
                'Any registry clerk on duty.',
            ],
            'correct': 0,
            'explanation': 'Where official correspondence demands a reply, the schedule officer to whom it is allocated is responsible for preparing the draft reply.',
        },
        'eth_general_gen_084': {
            'question': 'How does the attendance register distinguish between staff who arrive on time and those who are late?',
            'options': [
                'Red-line signing.',
                'Shared signing sheet.',
                'Supervisor-only marks.',
                'Late-name sheet.',
            ],
            'correct': 3,
            'explanation': 'The attendance register is marked with a red line each morning so that late arrivals sign below it and punctual staff sign above it.',
        },
        'eth_misconduct_gen_056': {
            'question': 'Which practice best supports risk control under misconduct accountability controls?',
            'options': [
                'Documented control mitigation.',
                'Convenience bias.',
                'Personal rule preference.',
                'Ongoing non-compliance.',
            ],
            'correct': 0,
            'explanation': 'Risk control under misconduct accountability is stronger when applied controls are paired with documented mitigation and follow-up.',
        },
        'eth_misconduct_gen_066': {
            'question': 'What should be done to preserve grievance handling in a time-sensitive misconduct file?',
            'options': [
                'Immediate complaint recording and follow-up.',
                'Delayed file notes.',
                'Informal handling.',
                'Skipped complaint log.',
            ],
            'correct': 0,
            'explanation': 'Grievance handling stays sound when each complaint step is recorded and followed up immediately.',
        },
        'eth_misconduct_gen_084': {
            'question': 'Which action best demonstrates risk control in misconduct-case management?',
            'options': [
                'Documented control mitigation.',
                'Personal preference in rule application.',
                'Review-checkpoint bypass.',
                'Ongoing non-compliance.',
            ],
            'correct': 0,
            'explanation': 'Risk control in misconduct-case management is demonstrated by identifying risks early, applying the necessary controls, and documenting the mitigation steps taken.',
        },
        'eth_misconduct_gen_090': {
            'question': 'Which practice best supports accountability and risk control in misconduct cases?',
            'options': [
                'Documented control mitigation.',
                'Ongoing non-compliance.',
                'Convenience bias.',
                'Personal rule preference.',
            ],
            'correct': 0,
            'explanation': 'Accountability and risk control are best supported when risks are identified early, controls are applied, and mitigating steps are documented for later review.',
        },
        'eth_misconduct_gen_093': {
            'question': 'What preserves grievance handling without breaking procedure in a misconduct file?',
            'options': [
                'Traceable, documented file handling.',
                'Review-checkpoint bypass.',
                'Private-note handling.',
                'Delayed file updates.',
            ],
            'correct': 0,
            'explanation': 'Procedure is preserved when the misconduct file stays traceable and documented at each stage.',
        },
        'eth_values_integrity_gen_024': {
            'question': 'Which practice best supports risk control in civil service values and integrity administration?',
            'options': [
                'Documented control mitigation.',
                'Convenience bias.',
                'Ongoing non-compliance.',
                'Personal control preference.',
            ],
            'correct': 0,
            'explanation': 'Risk control is stronger when controls are applied early and the mitigation is documented for later review.',
        },
        'ethics_087': {
            'question': 'What remains true after an officer delegates duties to a subordinate?',
            'options': [
                'Delegating-officer accountability.',
                'Subordinate-only accountability.',
                'Written-delegation release.',
                'Acceptance-based release.',
            ],
            'correct': 0,
            'explanation': 'Delegation does not remove personal accountability; the delegating officer still answers for the duty performed on the officer’s behalf.',
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
        'ethics_093': {
            'question': 'What duty do officers controlling votes owe regarding payment for services rendered?',
            'options': [
                'Settlement within the financial year.',
                'Suspense-account transfer.',
                'Deferred next-year payment.',
                'Perfect-validation delay.',
            ],
            'correct': 0,
            'explanation': 'Officers controlling votes must ensure that payment for services rendered is settled within the same financial year whenever due.',
        },
        'ethics_097': {
            'question': 'What may the Board of Survey\'s findings reveal about an officer in charge?',
            'options': [
                'Officer accountability for disclosed discrepancies.',
                'No consequence.',
                'Automatic dismissal.',
                'Pre-report accountability end.',
            ],
            'correct': 0,
            'explanation': 'The findings may reveal discrepancies, but the officer in charge remains accountable until the matter is resolved satisfactorily.',
        },
        'ethics_099': {
            'question': 'What fiscal rule is observed under the Fiscal Responsibility framework?',
            'options': [
                'Expenditure within revenue.',
                'Fixed revenue margin.',
                'Revenue irrelevance.',
                'Grant-based overspending.',
            ],
            'correct': 0,
            'explanation': 'A core fiscal-responsibility rule is that total expenditure should not exceed total revenue.',
        },
        'ethics_100': {
            'question': 'What is a key accountability of the Chief Executive of a parastatal to the Board?',
            'options': [
                'Board decision implementation.',
                'Supervising Minister reporting.',
                'Personal preference.',
                'Board personal affairs.',
            ],
            'correct': 0,
            'explanation': 'The Chief Executive is accountable to the Board for implementing its approved decisions and policies.',
        },
    },
    ROOT / 'data' / 'core_competencies.json': {
        'comp_numerical_reasoning_gen_001': {
            'question': 'Which practice best supports numerical and mathematical reasoning governance?',
            'options': [
                'Approved numerical procedures and complete records.',
                'Rule inconsistency.',
                'Review-control bypass.',
                'Convenience bias.',
            ],
            'correct': 0,
            'explanation': 'Approved numerical procedures and complete records strengthen compliance, consistency, and accountability in numerical and mathematical reasoning.',
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
