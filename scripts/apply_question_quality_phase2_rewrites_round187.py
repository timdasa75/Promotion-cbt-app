from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'public_procurement.json': {
        'proc_bidding_evaluation_gen_007': {
            'question': 'Which practice best supports procurement ethics in bidding, evaluation, and award?',
            'options': [
                'Collusion, favoritism, and conflict prevention.',
                'Rule inconsistency.',
                'Review-control bypass.',
                'Convenience bias.',
            ],
            'correct': 0,
            'explanation': 'Ethical procurement depends on preventing collusion, favoritism, and conflicts of interest.',
        },
        'proc_bidding_evaluation_gen_011': {
            'question': 'Which action best demonstrates public accountability in bidding, evaluation, and award?',
            'options': [
                'Traceable, evidence-based decisions.',
                'Review-control bypass.',
                'Convenience bias.',
                'Feedback avoidance.',
            ],
            'correct': 0,
            'explanation': 'Accountability depends on decisions that are traceable and supported by evidence.',
        },
        'proc_bidding_evaluation_gen_019': {
            'question': 'Which action best demonstrates bidding, evaluation, and award governance?',
            'options': [
                'An auditable decision trail.',
                'Review-control bypass.',
                'Convenience bias.',
                'Feedback avoidance.',
            ],
            'correct': 0,
            'explanation': 'Governance depends on an auditable trail that shows how each decision was made and recorded.',
        },
        'proc_bidding_evaluation_gen_025': {
            'question': 'Which practice best sustains procurement ethics in bidding, evaluation, and award?',
            'options': [
                'Conflict disclosure and impartiality.',
                'Rule inconsistency.',
                'Review-control bypass.',
                'Convenience bias.',
            ],
            'correct': 0,
            'explanation': 'Ethics are protected when conflicts are disclosed and the process remains impartial.',
        },
        'proc_objectives_institutions_gen_001': {
            'question': 'Which action best demonstrates sound objectives and institutions governance?',
            'options': [
                'Approved procedures and complete records.',
                'Rule inconsistency.',
                'Review-control bypass.',
                'Convenience bias.',
            ],
            'correct': 0,
            'explanation': 'Sound governance depends on approved procedures and complete records.',
        },
        'proc_objectives_institutions_gen_007': {
            'question': 'Which practice best supports procurement ethics in objectives and institutions work?',
            'options': [
                'Collusion, favoritism, and conflict prevention in consultant selection.',
                'Feedback avoidance.',
                'Rule inconsistency.',
                'Review-control bypass.',
            ],
            'correct': 0,
            'explanation': 'Ethical practice requires preventing collusion, favoritism, and conflicts of interest in consultant selection.',
        },
        'proc_objectives_institutions_gen_011': {
            'question': 'Which action best demonstrates public accountability in objectives and institutions work?',
            'options': [
                'Traceable, evidence-based decisions.',
                'Review-control bypass.',
                'Convenience bias.',
                'Feedback avoidance.',
            ],
            'correct': 0,
            'explanation': 'Accountability depends on decisions that are traceable and supported by evidence.',
        },
    },
    ROOT / 'data' / 'psr_rules.json': {
        'circ_leave_welfare_allowances_gen_005': {
            'question': 'What is the best first step when an officer alleges an allowance overpayment?',
            'options': [
                'Documented case verification.',
                'Informal discussion.',
                'Immediate closure.',
                'Recordless handling.',
            ],
            'correct': 0,
            'explanation': 'An allowance overpayment allegation should begin with a documented case and fact verification.',
        },
    },
    ROOT / 'data' / 'civil_service_ethics.json': {
        'csh_ap_155': {
            'question': 'What best supports an official case file during review?',
            'options': [
                'Traceable movement entries at control points.',
                'Rule inconsistency.',
                'Unrecorded file movement.',
                'Late record updates.',
            ],
            'correct': 0,
            'explanation': 'An official case file should stay current and traceable at each control point so reviewers can follow every movement without gaps.',
        },
        'csh_duty_064': {
            'question': 'What remains true after a Board of Survey finding for the officer in charge?',
            'options': [
                'Continuing accountability until discrepancy resolution.',
                'Automatic dismissal.',
                'Immediate discharge of accountability.',
                'No consequence.',
            ],
            'correct': 0,
            'explanation': 'The officer in charge remains accountable for discrepancies disclosed by the Board of Survey until the matter is satisfactorily resolved.',
        },
        'csh_duty_068': {
            'question': 'What fiscal rule applies under the Fiscal Responsibility framework?',
            'options': [
                'Expenditure within revenue.',
                'Revenue irrelevance.',
                'Spending above revenue.',
                'Fixed revenue margin.',
            ],
            'correct': 0,
            'explanation': 'A core fiscal-responsibility rule is that total expenditure should not exceed total revenue.',
        },
        'csh_duty_070': {
            'question': 'What should a civil servant who has served for a very long time in one ministry avoid?',
            'options': [
                'Overconfidence in personal experience.',
                'Institutional knowledge sharing.',
                'Ministerial advice.',
                'Improvement suggestions.',
            ],
            'correct': 0,
            'explanation': 'Long service should not lead an officer to assume experience alone is sufficient, because institutional learning still requires openness and discipline.',
        },
        'csh_it_024': {
            'question': 'What is a zero-day vulnerability in cybersecurity?',
            'options': [
                'An unknown flaw with no vendor patch.',
                'A fully patched system.',
                'A routine software update.',
                'A scheduled penetration test.',
            ],
            'correct': 0,
            'explanation': 'A zero-day vulnerability is an unknown security flaw for which no vendor patch is yet available, so it can be exploited before defenders can respond.',
        },
        'csh_it_057': {
            'question': 'Under Financial Regulation 125, what remains with a Revenue Collector after duty is delegated?',
            'options': [
                'Pecuniary responsibility for the delegated duty.',
                'A right to delegate again.',
                'Freedom from accountability.',
                'Conditional responsibility only.',
            ],
            'correct': 0,
            'explanation': 'Delegation does not remove a Revenue Collector\'s pecuniary responsibility; the officer remains accountable for the duty entrusted to another person.',
        },
        'csh_it_061': {
            'question': 'What may happen when an Accounting Officer fails to comply with the Financial Regulations?',
            'options': [
                'Disciplinary action and possible surcharge.',
                'A verbal warning only.',
                'Loss of self-accounting status.',
                'No consequence.',
            ],
            'correct': 0,
            'explanation': 'Failure to comply with the Financial Regulations may attract disciplinary action and surcharge, even where the unit operates as self-accounting.',
        },
        'csh_it_068': {
            'question': 'What remains the chief accountability of federal employees even when union activities exist?',
            'options': [
                'Timely discharge of public duties.',
                'Union placement preferences.',
                'Union-meeting attendance.',
                'Union-affairs reporting.',
            ],
            'correct': 0,
            'explanation': 'Whatever union activities exist, federal employees remain chiefly accountable for the timely and efficient discharge of their assigned public duties.',
        },
        'csh_principle_024': {
            'question': 'How should public resources be used according to the Civil Service Handbook?',
            'options': [
                'Responsible official-purpose use.',
                'Personal benefit.',
                'Private development spending.',
                'Informal sharing.',
            ],
            'correct': 0,
            'explanation': 'Public resources must be used responsibly and strictly for official purposes so accountability can be maintained.',
        },
        'csh_principle_064': {
            'question': 'What should a civil servant do after detecting financial abuse in the public service?',
            'options': [
                'Official-channel submission.',
                'Official silence.',
                'Delayed escalation.',
                'Informal mention.',
            ],
            'correct': 0,
            'explanation': 'Financial abuse should be reported through the proper official channel so it can be investigated and addressed under the right procedure.',
        },
        'csh_principle_069': {
            'question': 'What should the secretary secure after a meeting closes?',
            'options': [
                'Minutes circulation and follow-up.',
                'Closed record.',
                'Transferred responsibility.',
                'No further action.',
            ],
            'correct': 0,
            'explanation': 'After a meeting, the secretary should ensure that the minutes are written and circulated and that agreed follow-up actions are tracked to completion.',
        },
        'csh_principle_072': {
            'question': 'Does delegation remove accountability?',
            'options': [
                'Accountability retention.',
                'Written-delegation release.',
                'Subordinate-acceptance release.',
                'Revenue-duty release.',
            ],
            'correct': 0,
            'explanation': 'Delegation may transfer performance of the task, but it does not remove the delegating officer\'s accountability for the result.',
        },
        'csh_principle_075': {
            'question': 'What does delegation not remove from a Revenue Collector?',
            'options': [
                'Pecuniary responsibility.',
                'Delayed reporting duty.',
                'Written-delegation duty.',
                'Collector-role limitation.',
            ],
            'correct': 0,
            'explanation': 'Delegation does not remove the Revenue Collector\'s pecuniary responsibility for the duty entrusted to another person.',
        },
        'csh_principles_ethics_gen_014': {
            'question': 'Which risk-control practice best supports civil service principles and ethics administration?',
            'options': [
                'Documented risk mitigation.',
                'Convenience bias.',
                'Feedback avoidance.',
                'Personal control preference.',
            ],
            'correct': 0,
            'explanation': 'Risk control is stronger when controls are applied and the mitigation used is documented for later review.',
        },
        'FOI_OP_062': {
            'question': 'Which option best reflects proper decision-transparency standards in FOI offence and penalty handling?',
            'options': [
                'Clear criteria and prompt communication.',
                'Informal instructions without records.',
                'Delayed decisions and escalating crises.',
                'Closure without fact verification.',
            ],
            'correct': 0,
            'explanation': 'Transparency is best shown when criteria are clear, reasons are recorded, and decisions are communicated promptly.',
        },
        'FOI_EX_063': {
            'question': 'What additional information should appear in quarterly returns on government vehicles besides mileage and fuel consumption?',
            'options': [
                'Driver details.',
                'Passenger names.',
                'Cost of repairs.',
                'Vehicle color.',
            ],
            'correct': 2,
            'explanation': 'Financial Regulation 2018 specifically includes cost of repairs in quarterly vehicle returns.',
        },
    },
    ROOT / 'data' / 'constitutional_foi.json': {
        'FOI_EX_029': {
            'explanation': 'Section 12 protects national security and defense information, so the provision aims at the safety of the nation and its strategic interests.'
        },
        'FOI_EX_030': {
            'explanation': 'Section 19 allows withholding only while examination material is pending or unadministered.'
        },
        'FOI_EX_034': {
            'explanation': 'Section 15 covers commercial or financial information held in confidence where disclosure would harm competitiveness.'
        },
        'FOI_EX_037': {
            'explanation': 'Section 13 supports partial disclosure by allowing the exempt part to be removed and the rest released.'
        },
        'FOI_EX_040': {
            'explanation': 'Section 24 places the burden on the institution denying access to show that the harm outweighs the public benefit.'
        },
        'FOI_EX_042': {
            'explanation': 'Section 19 protects research materials and pending academic work until the work is finalized.'
        },
        'FOI_EX_047': {
            'explanation': 'Section 16 protects legal opinions and privileged communications with Ministry lawyers.'
        },
        'FOI_EX_048': {
            'explanation': 'Section 14 protects personal information, including medical records, from disclosure.'
        },
        'FOI_EX_049': {
            'explanation': 'Section 13 allows partial disclosure by excising the exempt information from the document.'
        },
        'FOI_OP_020': {
            'explanation': 'The Attorney-General of the Federation oversees FOI compliance among public institutions.'
        },
        'FOI_OP_029': {
            'explanation': 'Section 28(1) requires exemptions to be read narrowly in favour of disclosure.'
        },
        'FOI_OP_036': {
            'explanation': 'The Attorney-General of the Federation issues the implementation guidelines for the FOI Act.'
        },
        'FOI_OP_038': {
            'explanation': 'A failure to designate an FOI desk officer is a failure of administrative implementation of the Act.'
        },
        'FOI_OP_039': {
            'explanation': 'The applicant is the party entitled to challenge a denial of access in court.'
        },
        'FOI_OP_049': {
            'explanation': 'Section 29 prescribes a fine of N500,000 for willful concealment of records.'
        },
        'FOI_OP_058': {
            'explanation': 'Section 28(1) requires exemptions to be interpreted narrowly in favour of disclosure.'
        },
    },
    ROOT / 'data' / 'core_competencies.json': {
        'competency_verbal_043': {
            'explanation': 'Definitely is the accepted spelling; the other choices are common misspellings.'
        },
        'competency_verbal_055': {
            'explanation': 'Interested in is the fixed collocation, so in completes the phrase correctly.'
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
