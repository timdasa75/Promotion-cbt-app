from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'psr_rules.json': {
        'psr_admin_068': {
            'options': [
                'Necessary information on the unit\'s acts and procedures.',
                'Only information requested in person.',
                'No information because everything is classified.',
                'Only information already published in newspapers.',
            ],
        },
        'psr_admin_070': {
            'options': [
                'Prompt report to the President.',
                'Prompt report to the Permanent Secretary or Head of Extra-Ministerial Office.',
                'Prompt report to the National Assembly.',
                'Prompt report to the Central Bank.',
            ],
        },
        'psr_allow_014': {
            'options': [
                'Automatic cessation after three months.',
                'Cessation when the officer resumes the substantive post.',
                'Automatic cessation after one year of acting service.',
                'Cessation only after substantive promotion is approved.',
            ],
        },
        'psr_allow_041': {
            'options': [
                'Cessation whenever the officer is transferred.',
                'Cessation whenever the officer proceeds on leave.',
                'Cessation when the officer no longer holds the additional responsibility.',
                'Automatic cessation only on retirement.',
            ],
        },
        'psr_allow_049': {
            'options': [
                'Advance payment whenever an officer is on leave.',
                'Advance payment whenever an officer is retiring from service.',
                'Advance payment where the Accounting Officer has specifically approved it.',
                'Advance payment whenever an officer makes a personal request.',
            ],
        },
        'psr_allow_055': {
            'options': [
                'Casual or special leave taken by the acting officer.',
                'Resumption of duty by the substantive holder.',
                'Movement of the acting officer to another post.',
                'Substantive promotion of the acting officer.',
            ],
        },
        'psr_allow_064': {
            'options': [
                'Suspension of the acting appointment.',
                'Cessation of the acting appointment.',
                'Continuation of the acting appointment without relinquishment of duties.',
                'Automatic extension of the acting appointment.',
            ],
        },
        'psr_app_012': {
            'options': [
                'Automatic reduction for good behaviour.',
                'Reduction by counting prior satisfactory public service in cognate posts.',
                'Reduction on the officer\'s personal request alone.',
                'Reduction because the officer is under thirty years of age.',
            ],
        },
        'psr_app_026': {
            'options': [
                'A guaranteed path to substantive promotion.',
                'An interim administrative arrangement rather than a promotion trial.',
                'A post with a fixed minimum duration of two years.',
                'An arrangement restricted to junior staff only.',
            ],
        },
        'psr_app_030': {
            'options': [
                'No secondment effect because a training grade is always separate.',
                'Secondment treatment for the duration of the training period.',
                'Secondment treatment only with written consent.',
                'Secondment treatment only for foreign training.',
            ],
        },
        'psr_app_047': {
            'options': [
                'Reduction by the Permanent Secretary acting alone in every case.',
                'Reduction by the Head of Service acting without reference to appointing authority.',
                'Reduction by the appointing authority subject to PSR conditions.',
                'No reduction because probation is always fixed.',
            ],
        },
        'psr_discipline_gen_001': {
            'options': [
                'Approved procedure supported by complete records.',
                'Inconsistent treatment of similar cases.',
                'Bypassing of review and approval controls.',
                'Preference for convenience over compliance requirements.',
            ],
        },
        'psr_discipline_gen_003': {
            'options': [
                'Early identification of control gaps with prompt escalation of material exceptions.',
                'Bypassing of review and approval controls.',
                'Disregard of feedback after review.',
                'Preference for convenience over compliance requirements.',
            ],
        },
        'psr_discipline_gen_007': {
            'options': [
                'Eligibility confirmation before recommendation for advancement.',
                'Inconsistent criteria for similar officers.',
                'Bypassing of review controls.',
                'Preference for convenience over compliance requirements.',
            ],
        },
        'psr_discipline_gen_009': {
            'options': [
                'Approved steps supported by complete records.',
                'Inconsistent treatment of similar cases.',
                'Bypassing of review and approval controls.',
                'Preference for convenience over compliance requirements.',
            ],
        },
        'psr_discipline_gen_011': {
            'options': [
                'Opportunity for the officer to respond before a decision is taken.',
                'Bypassing of review and approval controls.',
                'Preference for convenience over compliance requirements.',
                'Disregard of feedback after review.',
            ],
        },
        'psr_discipline_gen_015': {
            'options': [
                'Approved workflow with verification of outputs before closure.',
                'Continuation of non-compliance after feedback.',
                'Inconsistent treatment of similar cases.',
                'Bypassing of review and approval controls.',
            ],
        },
        'psr_discipline_gen_017': {
            'options': [
                'Accurate file maintenance with status updates at each control point.',
                'Inconsistent treatment of similar cases.',
                'Bypassing of review and approval controls.',
                'Preference for convenience over compliance requirements.',
            ],
        },
        'psr_discipline_gen_019': {
            'options': [
                'Approved procedure supported by complete records.',
                'Bypassing of review and approval controls.',
                'Preference for convenience over compliance requirements.',
                'Continuation of non-compliance after feedback.',
            ],
        },
        'psr_discipline_gen_023': {
            'options': [
                'Fair hearing with documented decisions.',
                'Continuation of non-compliance after feedback.',
                'Inconsistent treatment of similar cases.',
                'Bypassing of review and approval controls.',
            ],
        },
        'psr_discipline_gen_025': {
            'options': [
                'Eligibility confirmation before recommendation for advancement.',
                'Inconsistent criteria for similar officers.',
                'Bypassing of review and approval controls.',
                'Preference for convenience over compliance requirements.',
            ],
        },
        'psr_docx_004': {
            'options': [
                'Application in every respect without limitation.',
                'No application at all.',
                'Application only where no inconsistency with the Constitution exists.',
                'Application only at the discretion of the officers concerned.',
            ],
        },
        'psr_docx_021': {
            'options': [
                'Minimum score required for initial employment.',
                'Average score recorded in the examination.',
                'Score below which a candidate is deemed to have failed the promotion examination, currently 60 percent.',
                'Highest score obtained in the examination.',
            ],
        },
        'psr_docx_088': {
            'options': [
                'Reasons for leaving the present job.',
                'Whether the applicant is under any obligation to remain in that employment.',
                'Current job title only.',
                'Name of employer only.',
            ],
        },
        'psr_docx_089': {
            'options': [
                'A full list of assets and liabilities.',
                'Whether the applicant is free from financial embarrassment.',
                'The applicant\'s current credit score.',
                'Recent income tax returns.',
            ],
        },
        'psr_docx_094': {
            'options': [
                'Administration of the oath to all officers at once.',
                'Ensuring newly employed officers sign the Oath of Secrecy and preserving the signed oaths.',
                'Explanation of the oath without recordkeeping.',
                'Exemption of selected officers from the oath.',
            ],
        },
        'psr_eth_029': {
            'options': [
                'Operation of the account with personal presidential approval.',
                'Operation of the account while the officer is on official posting abroad.',
                'Operation of the account after retirement.',
                'Operation of the account on the basis of dual citizenship.',
            ],
        },
        'psr_leave_056': {
            'options': [
                'Exposure to a minor fine only.',
                'Prohibition because the publication is copyrighted and requires express approval for reproduction.',
                'Requirement for verbal notification only.',
                'Encouragement for wider dissemination.',
            ],
        },
        'psr_leave_063': {
            'options': [
                'Refund at the end of the financial year.',
                'Refund as soon as it is due after the necessary checks are completed.',
                'Refund only with explicit approval of the Minister of Finance.',
                'Refund only when the deposit account has a sufficient balance.',
            ],
        },
        'psr_leave_073': {
            'options': [
                'Appointment when an officer is merely being considered for promotion.',
                'Appointment when a duty post of not less than SGL 14 is unattended because the substantive holder is absent.',
                'Appointment only when a substantive post becomes permanently vacant.',
                'Appointment only for a very short period without reference to post level.',
            ],
        },
        'psr_leave_074': {
            'options': [
                'Date of notification to the Federal Civil Service Commission.',
                'First day of the month.',
                'Date of the gazette notice alone.',
                'Date the officer substantively assumes the duties of the post.',
            ],
        },
        'psr_med_040': {
            'options': [
                'Injury sustained during official duty or as its direct consequence.',
                'Injury sustained at home in any circumstance.',
                'Injury sustained while the officer is off duty.',
                'Injury to which negligence contributed.',
            ],
        },
        'psr_med_049': {
            'options': [
                'Treatment whenever the officer prefers foreign care.',
                'Treatment only where adequate facilities are unavailable in Nigeria.',
                'Treatment whenever the officer can afford foreign hospitals.',
                'Treatment whenever a superior officer requests it.',
            ],
        },
        'psr_med_054': {
            'options': [
                'Ensuring officers are conversant with their service rules, regulations, and laws.',
                'Testing of physical fitness only.',
                'Assessment of academic prowess alone.',
                'Identification of promotion candidates only.',
            ],
        },
        'psr_med_057': {
            'options': [
                'Transfer with the consent of the Accounting Officer or in special emergencies with reporting.',
                'Transfer never permitted.',
                'Transfer only when the books are unused.',
                'Transfer at any time without approval.',
            ],
        },
        'psr_med_075': {
            'options': [
                'Permanent ineligibility for advancement.',
                'Advancement based only on long years of service.',
                'Consideration for an enhanced appointment during contract renegotiation.',
                'Placement on a separate routine promotion list.',
            ],
        },
        'psr_ret_051': {
            'options': [
                'Exemption because the examination applies to pensionable probationary appointments.',
                'Requirement triggered by a wish to convert to a pensionable appointment.',
                'Requirement triggered only if the contract provides for it.',
                'Requirement applying to all officers without exception.',
            ],
        },
        'psr_ret_053': {
            'options': [
                'Officers on pensionable appointment who are on probation.',
                'Only officers on GL 07 and above.',
                'Only officers on GL 06 and below.',
                'All officers in the Public Service.',
            ],
        },
        'psr_ret_057': {
            'options': [
                'Date of assumption of duty.',
                'Date of the offer of appointment.',
                'Date the officer signs the contract.',
                'Date the contract is approved.',
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
