# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    (
        ROOT / 'data' / 'civil_service_ethics.json',
        {
            'csh_ap_140': {
                'question': 'Why should the chair of an official meeting arrive promptly and start on time?',
                'options': [
                    'Showing that the meeting objectives are taken seriously.',
                    'Showing that the chair is more senior than the members.',
                    'Rushing participants into decisions.',
                    'Reducing the meeting regardless of the agenda.',
                ],
                'correct': 0,
                'explanation': 'Promptness shows that the chair takes the meeting objectives seriously and keeps the discussion orderly.',
                'keywords': ['meeting_chair', 'punctuality', 'meeting_objectives'],
            },
            'csh_ap_220': {
                'question': 'How often should the contents of strong-rooms or safes be checked?',
                'options': [
                    'Monthly, by the officer in charge of the keys.',
                    'Only when a discrepancy is suspected.',
                    'Once a year.',
                    'Only at handover.',
                ],
                'correct': 0,
                'explanation': 'The rule requires a monthly check by the officer in charge of the keys.',
                'keywords': ['strong_room', 'monthly_check', 'keys'],
            },
            'csh_ap_045': {
                'question': 'How far in advance should Form Gen. 15A be forwarded before an acting appointment ends?',
                'options': [
                    'Two weeks before the end date.',
                    'Three working days before duties cease.',
                    'At the end of the quarter of cessation.',
                    'Only after handover is complete.',
                ],
                'correct': 0,
                'explanation': 'Form Gen. 15A should be forwarded two weeks before the acting appointment ends.',
                'keywords': ['form_gen_15a', 'acting_appointment', 'handover'],
            },
            'csh_ap_101': {
                'question': 'How should a file marked Confidential be routed in registry practice?',
                'options': [
                    'Through restricted access and secure handling.',
                    'Through open-registry circulation under routine controls.',
                    'Through public circulation channels.',
                    'Through general e-mail distribution.',
                ],
                'correct': 0,
                'explanation': 'A confidential file should move only through restricted access and secure handling.',
                'keywords': ['confidential_file', 'registry', 'access_control'],
            },
            'csh_ap_136': {
                'question': 'When may a document be removed from a file?',
                'options': [
                    'Only to correct a grave error with approval.',
                    'As soon as it is no longer needed.',
                    'Whenever an officer is in a hurry.',
                    'Whenever the document is personal.',
                ],
                'correct': 0,
                'explanation': 'A document may be removed only to correct a grave error and only with approval.',
                'keywords': ['file_control', 'document_removal', 'approval'],
            },
            'csh_ap_137': {
                'question': 'Which record-management routine best supports an ongoing negotiation file?',
                'options': [
                    'Updating the file at each control point and keeping the status traceable.',
                    'Waiting until the negotiation is concluded before filing updates.',
                    'Relying on memory instead of written records.',
                    'Letting each side keep separate private notes.',
                ],
                'correct': 0,
                'explanation': 'Negotiation files stay useful when the status is updated at each control point.',
                'keywords': ['records_management', 'negotiation', 'control_point'],
            },
            'csh_ap_139': {
                'question': 'Which recordkeeping routine best preserves continuity in an ongoing dispute hearing?',
                'options': [
                    'Updating the hearing record after each sitting and noting the next action.',
                    'Waiting until the dispute is fully concluded before organizing the record.',
                    'Recording only the final decision.',
                    'Letting each representative keep separate notes.',
                ],
                'correct': 0,
                'explanation': 'Continuity is preserved when the record is updated after each sitting and the next action is noted.',
                'keywords': ['dispute_hearing', 'continuity', 'records'],
            },
            'csh_ap_155': {
                'question': 'What routine best supports an official case file during review?',
                'options': [
                    'Keeping movement entries current and the file traceable at each control point.',
                    'Applying rules inconsistently.',
                    'Bypassing review controls.',
                    'Leaving updates until the case is closed.',
                ],
                'correct': 0,
                'explanation': 'A case file stays reviewable when movements are current and traceable at each control point.',
                'keywords': ['case_file', 'records_management', 'status_updates'],
            },
            'csh_ap_217': {
                'question': 'Which record-management practice best keeps an objectives-and-institutions file easy to review?',
                'options': [
                    'Keeping it indexed and current at each control point.',
                    'Applying rules inconsistently.',
                    'Bypassing review controls.',
                    'Prioritizing convenience over compliance.',
                ],
                'correct': 0,
                'explanation': 'A reviewable file stays indexed, current, and updated at each control point.',
                'keywords': ['records_management', 'reviewable_file', 'status_updates'],
            },
            'csh_ap_219': {
                'question': 'How should a payee\'s mark be handled when the payee is illiterate?',
                'options': [
                    'It must be witnessed by a literate official other than the paying officer.',
                    'It should be ignored if the officer is busy.',
                    'It can be witnessed by the paying officer alone.',
                    'It does not need to be recorded.',
                ],
                'correct': 0,
                'explanation': 'An illiterate payee\'s mark must be witnessed by a literate official other than the paying officer.',
                'keywords': ['payee_mark', 'witness', 'records'],
            },
            'csh_ap_227': {
                'question': 'What is the best approach to secure log management in an office registry?',
                'options': [
                    'Keeping accurate files and updating status at each control point.',
                    'Bypassing review controls.',
                    'Prioritizing convenience over compliance.',
                    'Applying rules inconsistently.',
                ],
                'correct': 0,
                'explanation': 'Log management is stronger when files are accurate and updated at each control point.',
                'keywords': ['civil_service_admin', 'ca_general', 'log_management', 'records', 'csh_administrative_procedures', 'records_management'],
            },
            'csh_disc_051': {
                'question': 'How does the attendance register distinguish staff who arrive on time from those who arrive late?',
                'options': [
                    'A red line is drawn, and latecomers sign below it.',
                    'A supervisor writes a note beside each late name.',
                    'Everyone signs in exactly the same place without distinction.',
                    'Latecomers sign on a separate attendance sheet.',
                ],
                'correct': 0,
                'explanation': 'The attendance register uses a red line drawn at the prescribed time so that officers who arrive late sign below it.',
                'keywords': ['attendance_register', 'lateness', 'red_line', 'official_attendance_control'],
            },
            'csh_ap_168': {
                'question': 'What must a chair understand before guiding a meeting?',
                'options': [
                    'The objective of the gathering.',
                    'The payroll status of each member.',
                    'The rank of the most senior officer.',
                    'Who will draft the minutes.',
                ],
                'correct': 0,
                'explanation': 'A chair should understand the meeting objective before guiding the discussion.',
                'keywords': ['meeting_chair', 'objective', 'leadership'],
            },
            'csh_ap_169': {
                'question': 'What is the purpose of a register of minutes?',
                'options': [
                    'To list all minutes recorded in a ministry.',
                    'To document all financial transactions.',
                    'To document all official meetings only.',
                    'To list all staff in a ministry.',
                ],
                'correct': 0,
                'explanation': 'A register of minutes is maintained as a record of the minutes written in a ministry or office.',
                'keywords': ['register_of_minutes', 'minutes', 'recordkeeping', 'administrative_procedure'],
            },
            'csh_ap_172': {
                'question': 'In official writing, what does the term style mean?',
                'options': [
                    'The distinctive manner of writing.',
                    'The length of the writing.',
                    'The type of pen used for writing.',
                    'The speed at which one writes.',
                ],
                'correct': 0,
                'explanation': 'In official writing, style refers to the distinctive manner in which writing is expressed.',
                'keywords': ['style', 'official_writing', 'communication', 'administrative_procedure'],
            },
            'csh_ap_191': {
                'question': 'Which expression best describes style in official writing?',
                'options': [
                    'The distinctive manner of writing.',
                    'The speed at which one writes.',
                    'The length of the writing.',
                    'The type of pen used for writing.',
                ],
                'correct': 0,
                'explanation': 'In official writing, style refers to the distinctive manner in which ideas are expressed.',
                'keywords': ['style', 'official_writing', 'expression', 'administrative_procedure'],
            },
            'csh_ap_205': {
                'question': 'What is the purpose of a file copy of an official circular?',
                'options': [
                    'Keep the circular in the file with the related matter.',
                    'Circulate it to the public.',
                    'Discard it after reading.',
                    'Keep it for personal use only.',
                ],
                'correct': 0,
                'explanation': 'The file copy is kept with the matter to which the circular relates.',
                'keywords': ['official_circular', 'file_copy', 'records'],
            },
        },
    ),
    (
        ROOT / 'data' / 'psr_rules.json',
        {
            'psr_general_admin_gen_009': {
                'question': 'Which action best preserves compliance and service quality in general administration and office procedures?',
                'options': [
                    'Applying applicable PSR provisions consistently and keeping auditable records.',
                    'Bypassing review checkpoints where timelines are tight.',
                    'Applying discretionary shortcuts to accelerate closure regardless of controls.',
                    'Prioritizing convenience over approved process requirements.',
                ],
                'correct': 0,
                'explanation': 'Compliance and service quality are preserved when PSR provisions are applied consistently and the record remains auditable.',
                'keywords': ['psr', 'general_administration', 'compliance', 'auditable_records'],
            },
            'psr_general_admin_gen_003': {
                'question': 'Which action best supports public-service compliance in general administration and office procedures?',
                'options': [
                    'Identify control gaps early and escalate material exceptions promptly.',
                    'Bypass review and approval controls to save time.',
                    'Prioritize convenience over policy and legal requirements.',
                    'Ignore feedback and continue non-compliant procedures.',
                ],
                'correct': 0,
                'explanation': 'Identifying control gaps early and escalating material exceptions promptly strengthens compliance, consistency, and accountability.',
                'keywords': ['psr', 'general_administration', 'risk_management', 'compliance'],
            },
            'psr_general_admin_gen_007': {
                'question': 'What is the most appropriate approach to promotion standards in general administration and office procedures?',
                'options': [
                    'Confirm eligibility requirements before recommending advancement.',
                    'Ignore feedback and continue non-compliant procedures.',
                    'Apply rules inconsistently based on personal preference.',
                    'Bypass review and approval controls to save time.',
                ],
                'correct': 0,
                'explanation': 'Promotion standards are upheld when eligibility requirements are confirmed before advancement is recommended.',
                'keywords': ['psr', 'general_administration', 'promotion_standards', 'compliance'],
            },
            'psr_admin_025': {
                'question': 'According to PSR 110118, government vehicles and equipment shall be used only for:',
                'options': [
                    'Official purposes.',
                    'Personal errands when official work is done.',
                    'Emergencies at night.',
                    "Supervisor's informal consent.",
                ],
                'correct': 0,
                'explanation': 'PSR 110118 prohibits personal use of government vehicles and equipment; they must be used strictly for official duties.',
                'keywords': ['vehicles', 'equipment', 'PSR 110118'],
            },
            'psr_admin_026': {
                'question': 'Under PSR 110119, the head of a department is responsible for ensuring that:',
                'options': [
                    'Government property and records are properly maintained.',
                    'Staff arrive early to work.',
                    'Only senior officers sign correspondence.',
                    'All staff attend weekly meetings.',
                ],
                'correct': 0,
                'explanation': 'PSR 110119 assigns responsibility to departmental heads for proper maintenance of government property and official records.',
                'keywords': ['head_of_department', 'property', 'PSR 110119'],
            },
            'psr_admin_068': {
                'question': 'What should administrative units make available to the public?',
                'options': [
                    'All necessary information on acts and procedures in their respective domains.',
                    'Only information requested in person.',
                    'No information, as it is all classified.',
                    'Only information already published in a newspaper.',
                ],
                'correct': 0,
                'explanation': 'Administrative units must make available all necessary information on acts and procedures in their domains, along with the information needed to assess management.',
                'keywords': ['public_access', 'acts_and_procedures', 'administrative_units'],
            },
        },
    ),
]


def update(node: object, updates: dict[str, dict]) -> int:
    if isinstance(node, list):
        return sum(update(item, updates) for item in node)
    if isinstance(node, dict):
        qid = node.get('id')
        if qid in updates:
            payload = updates[qid]
            node['question'] = payload['question']
            node['options'] = payload['options']
            node['correct'] = payload['correct']
            node['explanation'] = payload['explanation']
            node['keywords'] = payload['keywords']
            return 1
        return sum(update(value, updates) for value in node.values())
    return 0


def main() -> None:
    total_changed = 0
    for target, updates in TARGETS:
        data = json.loads(target.read_text(encoding='utf-8'))
        changed = update(data, updates)
        if changed != len(updates):
            raise SystemExit(f'{target.name}: expected {len(updates)} updates, applied {changed}')
        target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        total_changed += changed
        print(f'Applied round 141 updates to {changed} questions in {target}')
    print(f'Applied round 141 updates to {total_changed} questions across {len(TARGETS)} files')


if __name__ == '__main__':
    main()


