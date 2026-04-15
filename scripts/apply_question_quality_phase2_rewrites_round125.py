# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'civil_service_ethics.json'
UPDATES = {
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
    'csh_ap_132': {
        'question': 'What information does the Duplicate Note-Book System record when a file is sent out?',
        'options': [
            'File number, date, and destination.',
            'Meeting minutes and action points.',
            'Every officer who has ever handled the file.',
            'Only the title of the file.',
        ],
        'correct': 0,
        'explanation': 'The duplicate note-book records the file number, date, and destination when a file is sent out.',
        'keywords': ['duplicate_note_book', 'file_transmission', 'records'],
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
            'Update the file at each control point and keep the status traceable.',
            'Wait until the negotiation is concluded before filing updates.',
            'Rely on memory instead of written records.',
            'Let each side keep separate private notes.',
        ],
        'correct': 0,
        'explanation': 'Negotiation files stay useful when the status is updated at each control point.',
        'keywords': ['records_management', 'negotiation', 'control_point'],
    },
    'csh_ap_139': {
        'question': 'Which recordkeeping routine best preserves continuity in an ongoing dispute hearing?',
        'options': [
            'Update the hearing record after each sitting and note the next action.',
            'Wait until the dispute is fully concluded before organizing the record.',
            'Record only the final decision.',
            'Let each representative keep separate notes.',
        ],
        'correct': 0,
        'explanation': 'Continuity is preserved when the record is updated after each sitting and the next action is noted.',
        'keywords': ['dispute_hearing', 'continuity', 'records'],
    },
    'csh_ap_141': {
        'question': 'What is the purpose of the Action Points section in meeting minutes?',
        'options': [
            'To state responsibility, action, and due date.',
            'To list the members who spoke the most.',
            'To restate unresolved issues without responsibility.',
            'To reproduce the attendance register.',
        ],
        'correct': 0,
        'explanation': 'Action points identify responsibility, action, and the due date.',
        'keywords': ['meeting_minutes', 'action_points', 'responsibility'],
    },
    'csh_ap_143': {
        'question': 'Which recordkeeping practice best supports fair performance assessment across a department?',
        'options': [
            'Keep appraisal evidence, feedback notes, and agreed targets in a traceable file for each officer.',
            'Rely on memory at the end of the review cycle.',
            'Store only positive examples and discard performance gaps.',
            'Let each supervisor keep notes in any format they prefer.',
        ],
        'correct': 0,
        'explanation': 'Fair assessment depends on traceable appraisal evidence, feedback notes, and agreed targets.',
        'keywords': ['performance_assessment', 'appraisal', 'records'],
    },
    'csh_ap_155': {
        'question': 'What routine best supports an official case file during review?',
        'options': [
            'Keep movement entries current and the file traceable at each control point.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
            'Leave updates until the case is closed.',
        ],
        'correct': 0,
        'explanation': 'A case file stays reviewable when movements are current and traceable at each control point.',
        'keywords': ['case_file', 'records_management', 'status_updates'],
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
    'csh_ap_176': {
        'question': "Should copies of a Head of Department's own letters normally be circulated to subordinates?",
        'options': [
            'No, they are not normally circulated to subordinates.',
            'Yes, they should always be circulated.',
            'Only to the most junior officers.',
            'Only through the confidential registry.',
        ],
        'correct': 0,
        'explanation': "Own letters from the Head of Department are not normally circulated to subordinates.",
        'keywords': ['official_letters', 'circulation', 'subordinates'],
    },
    'csh_ap_204': {
        'question': 'What is the main security rule for a confidential file?',
        'options': [
            'Keep access restricted and storage secure.',
            'Email it to all staff.',
            'Display it on open notice boards.',
            'Treat it like a public circular.',
        ],
        'correct': 0,
        'explanation': 'Confidential files must be kept under restricted access and secure storage.',
        'keywords': ['confidential_files', 'security', 'storage'],
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
    'csh_ap_217': {
        'question': 'Which record-management practice best keeps an objectives-and-institutions file easy to review?',
        'options': [
            'Keep the file indexed, current, and updated at each control point.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'A reviewable file is indexed, current, and updated at each control point.',
        'keywords': ['records_management', 'reviewable_file', 'status_updates'],
    },
    'csh_ap_219': {
        'question': "How should a payee's mark be handled when the payee is illiterate?",
        'options': [
            'It must be witnessed by a literate official other than the paying officer.',
            'It should be ignored if the officer is busy.',
            'It can be witnessed by the paying officer alone.',
            'It does not need to be recorded.',
        ],
        'correct': 0,
        'explanation': "An illiterate payee's mark must be witnessed by a literate official other than the paying officer.",
        'keywords': ['payee_mark', 'witness', 'records'],
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
}


def update(node: object) -> int:
    if isinstance(node, list):
        total = 0
        for item in node:
            total += update(item)
        return total
    if isinstance(node, dict):
        qid = node.get('id')
        if qid in UPDATES:
            payload = UPDATES[qid]
            node['question'] = payload['question']
            node['options'] = payload['options']
            node['correct'] = payload['correct']
            node['explanation'] = payload['explanation']
            node['keywords'] = payload['keywords']
            return 1
        total = 0
        for value in node.values():
            total += update(value)
        return total
    return 0


def main() -> None:
    data = json.loads(TARGET.read_text(encoding='utf-8'))
    changed = update(data)
    if changed != len(UPDATES):
        raise SystemExit(f'Expected {len(UPDATES)} updates, applied {changed}')
    TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Applied round 125 updates to {changed} questions in {TARGET}')


if __name__ == '__main__':
    main()
