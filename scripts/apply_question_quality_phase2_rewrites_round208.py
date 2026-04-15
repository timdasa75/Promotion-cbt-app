from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'psr_rules.json': {
        'csh_pt_044': {
            'question': 'What is the consequence when an officer fails to meet the minimum years required in a post before promotion eligibility?',
            'options': [
                'Automatic transfer to another ministry.',
                'Ineligibility for the promotion exercise.',
                'Award of double increment.',
                'Waiver of the promotion guidelines.',
            ],
            'explanation': 'Failing to meet the minimum tenure requirement makes the officer ineligible for the promotion exercise until the required period in post is completed.',
        },
        'leadership_mpf_041': {
            'question': 'Which leave types, in addition to joining a spouse on grounds of public policy, are listed under the three leave-of-absence categories in Rule 120236?',
            'options': [
                'Annual-holiday leave under normal controls.',
                'Special leave to join a spouse on course of instruction and leave for Technical Aid Programmes.',
                'Deferred leave in an authorized workflow.',
                'Compulsory retirement leave under public-service standards.',
            ],
            'explanation': 'Rule 120236 includes leave of absence to join a spouse on grounds of public policy, special leave to join a spouse on course of instruction, and leave for Technical Aid Programmes.',
        },
        'psr_admin_068': {
            'options': [
                'Necessary information on acts and procedures within the unit\'s domain.',
                'Only information requested in person.',
                'No information because everything is classified.',
                'Only information already published in newspapers.',
            ],
            'explanation': 'Administrative units should make necessary information on their acts and procedures available so the public can understand how the unit is managed and how to engage it properly.',
        },
        'psr_admin_070': {
            'options': [
                'Report to the President under internal controls.',
                'Report to the Permanent Secretary or Head of Extra-Ministerial Office.',
                'Report to the National Assembly during evaluation.',
                'Report to the Central Bank under due-process safeguards.',
            ],
            'explanation': 'The PSR requires an officer charged with a criminal offence to report promptly to the Permanent Secretary or the Head of the relevant Extra-Ministerial Office.',
        },
        'psr_admin_072': {
            'options': [
                'No fixed minimum number of years stated.',
                'Minimum of 15 years.',
                'Minimum of 17 years.',
                'Minimum of 20 years.',
            ],
            'explanation': 'The eligibility rules do not state a fixed minimum number of years of service for appointment as Permanent Secretary.',
        },
        'psr_general_admin_gen_003': {
            'options': [
                'Early identification of control gaps with prompt escalation of material exceptions.',
                'Bypassing review and approval controls to save time.',
                'Convenience ahead of policy and legal requirements.',
                'Ignoring feedback while continuing non-compliant procedures.',
            ],
            'explanation': 'Public-service compliance is strongest when control gaps are identified early and material exceptions are escalated before they become harder to correct.',
        },
        'psr_general_admin_gen_007': {
            'options': [
                'Eligibility confirmation before recommending advancement.',
                'Ignoring feedback while continuing non-compliant procedures.',
                'Personalized rule application across similar cases.',
                'Bypassing review and approval controls to save time.',
            ],
            'explanation': 'Promotion standards are upheld when eligibility is checked before advancement is recommended, keeping the process fair and consistent with the rules.',
        },
        'psr_general_admin_gen_009': {
            'options': [
                'Consistent application of PSR provisions with auditable records.',
                'Bypassing review checkpoints where timelines are tight.',
                'Discretionary shortcuts regardless of controls.',
                'Convenience ahead of approved process requirements.',
            ],
            'explanation': 'Compliance and service quality are preserved when PSR provisions are applied consistently and the record remains auditable throughout the process.',
        },
        'psr_app_012': {
            'options': [
                'Automatic reduction for good behaviour.',
                'Deduction of prior satisfactory public service in cognate posts.',
                'Reduction on the officer\'s personal request alone.',
                'Reduction because the officer is under thirty years of age.',
            ],
            'explanation': 'The probationary period may be reduced by counting prior satisfactory public service in cognate posts, but it cannot be reduced below six months.',
        },
        'psr_app_026': {
            'options': [
                'Guaranteed path to substantive promotion.',
                'Necessary interim measure that is not a promotion trial.',
                'Appointment with a fixed minimum duration of two years.',
                'Arrangement limited to junior staff only.',
            ],
            'explanation': 'The PSR treats acting appointments as interim arrangements made for administrative necessity, not as a trial run for substantive promotion.',
        },
        'psr_app_030': {
            'options': [
                'No secondment effect because training grade is always separate.',
                'Treatment as secondment for the training period.',
                'Treatment as secondment only with written consent.',
                'Treatment as secondment only for foreign training.',
            ],
            'explanation': 'A confirmed officer advanced to a training grade may be treated as seconded for the duration of the approved training arrangement.',
        },
        'psr_app_040': {
            'options': [
                'Appraisal by the releasing agency only.',
                'Appraisal by the receiving MDA.',
                'Self-appraisal by the officer.',
                'Appraisal by the Federal Civil Service Commission only.',
            ],
            'explanation': 'An officer on secondment is appraised by the receiving MDA because that organization supervises the officer\'s actual work during the secondment period.',
        },
        'psr_app_047': {
            'options': [
                'Permanent Secretary acting alone in every case.',
                'Head of Service acting without reference to appointing authority.',
                'Appointing authority subject to PSR provisions.',
                'No authority because probation is always fixed.',
            ],
            'explanation': 'The appointing authority may reduce probation by counting prior satisfactory public service, provided the reduction stays within PSR conditions.',
        },
        'psr_docx_111': {
            'options': [
                'Immediate eligibility on appointment.',
                'Eligibility after satisfactory probation and favourable assessment.',
                'Eligibility after every examination regardless of report.',
                'Eligibility after a ceremonial confirmation exercise.',
            ],
            'explanation': 'An officer becomes eligible for confirmation after satisfactory completion of probation together with a favourable assessment from the appropriate authority.',
        },
        'psr_docx_231': {
            'options': [
                'Poor performance alone in every case.',
                'Termination considered to be in the public interest.',
                'Termination only with the officer\'s consent.',
                'Termination only after a disciplinary conviction.',
            ],
            'explanation': 'The PSR permits termination of appointment when the appointing authority determines that it is in the public interest.',
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
