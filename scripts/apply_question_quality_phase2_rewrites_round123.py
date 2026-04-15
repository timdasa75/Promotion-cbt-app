# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'civil_service_ethics.json'
UPDATES = {
    'csh_ap_045': {
        'question': 'How early should Form Gen. 15A be forwarded when an officer reverts from acting appointment?',
        'options': [
            'Three working days before duties cease.',
            'Two weeks before the acting appointment ends.',
            'At the end of the quarter of cessation.',
            'Only after cessation and handover are complete.',
        ],
        'correct': 1,
        'explanation': 'The form should be forwarded two weeks before the acting appointment ends.',
        'keywords': ['form_gen_15a', 'acting_appointment', 'handover'],
    },
    'csh_ap_090': {
        'question': 'How should records created during the annual performance management cycle be handled?',
        'options': [
            'Routine destruction.',
            'Public consultation only.',
            'Sound document and data-management practice.',
            'Automatic transmission to the National Assembly.',
        ],
        'correct': 2,
        'explanation': 'Performance-management records should be handled under proper document and data-management practice.',
        'keywords': ['performance_management', 'records', 'data_management'],
    },
    'csh_ap_101': {
        'question': 'How should a file marked Confidential be handled?',
        'options': [
            'Open-registry placement under routine controls.',
            'Restricted access with prescribed security procedures.',
            'Press circulation through policy channels.',
            'General e-mail circulation under workflow rules.',
        ],
        'correct': 1,
        'explanation': 'Confidential files require restricted access and secure handling procedures.',
        'keywords': ['confidential_file', 'security', 'access_control'],
    },
    'csh_ap_132': {
        'question': 'What is the purpose of the Duplicate Note-Book System?',
        'options': [
            'To record meeting minutes.',
            'To create duplicate files for every case.',
            'To keep an officer\'s private notes.',
            'To record the file number, date, and destination when a file is sent out.',
        ],
        'correct': 3,
        'explanation': 'The system records the file number, date, and destination whenever a file is transmitted.',
        'keywords': ['duplicate_note_book', 'file_transmission', 'records'],
    },
    'csh_ap_136': {
        'question': 'When may a document be removed from a file?',
        'options': [
            'To correct a grave error with proper approval.',
            'Because it is no longer needed.',
            'Because an officer is in a hurry.',
            'Because the document is personal.',
        ],
        'correct': 0,
        'explanation': 'Removal is allowed only for a grave error and only with proper approval.',
        'keywords': ['file_control', 'document_removal', 'approval'],
    },
    'csh_ap_137': {
        'question': 'Which routine best sustains record management in negotiation processes?',
        'options': [
            'Maintain accurate files and update status at each control point.',
            'Bypass review and approval controls to save time.',
            'Prioritize convenience over policy and legal requirements.',
            'Ignore feedback and continue non-compliant procedures.',
        ],
        'correct': 0,
        'explanation': 'Record management is strongest when the file stays accurate and each control point is reflected in the record.',
        'keywords': ['records_management', 'negotiation', 'control_point'],
    },
    'csh_ap_139': {
        'question': 'Which routine best preserves continuity in the records of an ongoing dispute hearing?',
        'options': [
            'Update the hearing record after each sitting and note the next required action.',
            'Wait until the dispute is fully concluded before organizing the record.',
            'Record only final decisions.',
            'Let each representative keep separate notes.',
        ],
        'correct': 0,
        'explanation': 'Continuity is preserved when the record is updated after each sitting and the next action is noted.',
        'keywords': ['dispute_hearing', 'continuity', 'records'],
    },
    'csh_ap_140': {
        'question': 'Why should the chair of an official meeting arrive promptly and start on time?',
        'options': [
            'To show the meeting and its objectives are taken seriously.',
            'To show the chair is more important than the members.',
            'To rush participants into decisions.',
            'To shorten the meeting regardless of the agenda.',
        ],
        'correct': 0,
        'explanation': 'Promptness reinforces seriousness and gives proper weight to the meeting objectives.',
        'keywords': ['meeting_chair', 'punctuality', 'seriousness'],
    },
    'csh_ap_141': {
        'question': 'What is the purpose of the Action Points section in meeting minutes?',
        'options': [
            'To state who is responsible, what must be done, and when it is due.',
            'To list the members who spoke the most.',
            'To restate unresolved issues without assigning responsibility.',
            'To reproduce the attendance register.',
        ],
        'correct': 0,
        'explanation': 'Action points identify responsibility, required action, and the completion time.',
        'keywords': ['meeting_minutes', 'action_points', 'responsibility'],
    },
    'csh_ap_143': {
        'question': 'Which recordkeeping practice best supports fair performance assessment across a department?',
        'options': [
            'Keep current appraisal evidence, feedback notes, and agreed targets in a traceable file for each officer.',
            'Rely on memory at the end of the review cycle.',
            'Store only positive examples and discard performance gaps.',
            'Let each supervisor keep notes in any format they prefer.',
        ],
        'correct': 0,
        'explanation': 'Fair assessment depends on current evidence, feedback, and agreed targets that can be traced later.',
        'keywords': ['performance_assessment', 'appraisal', 'records'],
    },
    'csh_ap_155': {
        'question': 'Which records-management practice best supports an official case file?',
        'options': [
            'Maintain accurate files and update status at each control point.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'An official case file stays reviewable when it is kept accurate and updated at each control point.',
        'keywords': ['case_file', 'records_management', 'status_updates'],
    },
    'csh_ap_168': {
        'question': 'What is the most fundamental duty of an officer chairing a meeting?',
        'options': [
            'Understand the objective of the gathering.',
            'Guarantee that everyone is paid for attending.',
            'Be the most senior officer in the room.',
            'Take the minutes personally.',
        ],
        'correct': 0,
        'explanation': 'A chair must understand the meeting objective in order to guide the discussion properly.',
        'keywords': ['meeting_chair', 'objective', 'leadership'],
    },
    'csh_ap_176': {
        'question': 'Should copies of a Head of Department\'s own letters normally be circulated to subordinates?',
        'options': [
            'Yes, they should always be circulated.',
            'Only to the most junior officers.',
            'No, they are not normally circulated to subordinates.',
            'Only through the confidential registry.',
        ],
        'correct': 2,
        'explanation': 'Own letters from the Head of Department are not normally circulated to subordinates.',
        'keywords': ['official_letters', 'circulation', 'subordinates'],
    },
    'csh_ap_204': {
        'question': 'What is the correct rule for handling confidential files?',
        'options': [
            'Email them to all staff.',
            'Treat them like public circulars.',
            'Display them on open notice boards.',
            'Keep them under restricted access and secure storage.',
        ],
        'correct': 3,
        'explanation': 'Confidential files must be kept under restricted access and secure storage.',
        'keywords': ['confidential_files', 'security', 'storage'],
    },
    'csh_ap_205': {
        'question': 'What is the purpose of a file copy of an official circular?',
        'options': [
            'Keep the circular in the file where it belongs.',
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
            'Keep the file current, indexed, and updated at each control point.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'A reviewable file is current, indexed, and updated at each control point.',
        'keywords': ['records_management', 'reviewable_file', 'status_updates'],
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
    print(f'Applied round 123 updates to {changed} questions in {TARGET}')


if __name__ == '__main__':
    main()
