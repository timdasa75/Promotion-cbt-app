#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'public_procurement.json'
SUBS = {'proc_transparency_ethics'}
UPDATES = {}


def opts(i, good, bad):
    out = list(bad)
    out.insert(i, good)
    return out


def add(qid, q, i, good, bad, exp, kw):
    UPDATES[qid] = {
        'question': q,
        'options': opts(i, good, bad),
        'explanation': exp,
        'keywords': kw,
    }


def add_many(specs, good, bad, exp, kw):
    for qid, i, q in specs:
        add(qid, q, i, good, bad, exp, kw)


BAD_GOV = [
    'Convenience ahead of approved process requirements.',
    'Skipped review steps without written basis.',
    'Personal preference in compliance handling.',
]
BAD_RISK = [
    'Control gaps left unreported in routine processing.',
    'Exceptions treated as normal without escalation.',
    'Personal preference ahead of risk review.',
]
BAD_VOTE = [
    'Commitments raised without checking the vote book.',
    'Informal instructions treated as budget authority.',
    'Required commitment records skipped before action.',
]
BAD_AUDIT = [
    'Supporting documents left incomplete for review.',
    'Documentation delayed until after implementation.',
    'Convenience ahead of audit-trail requirements.',
]
BAD_DOC = [
    'Action taken without complete file records.',
    'Procedure skipped because the matter looked routine.',
    'Unrecorded review steps under pressure.',
]
BAD_ACC = [
    'Undocumented decisions left to discretion.',
    'Convenience ahead of review accountability.',
    'Unverifiable reasons for control action.',
]
BAD_CTRL = [
    'Untracked exceptions after a control failure.',
    'Convenience ahead of control requirements.',
    'Repeated non-compliance after feedback.',
]
BAD_WORKFLOW = [
    'Workflow checks skipped to save time.',
    'Closure before verification of outputs.',
    'Personal preference in routine case handling.',
]
BAD_FILE = [
    'Incomplete file updates after key actions.',
    'Loose documents without status tracking.',
    'Convenience ahead of records control.',
]
BAD_AUTH = [
    'Action before checking the governing legal power.',
    'Undocumented reliance on informal instructions.',
    'Different standards for similar finance decisions.',
]
BAD_VIRE = [
    'Funds moved without proper authorization.',
    'Personal preference in reallocation decisions.',
    'Transfers made outside the approved vote structure.',
]
BAD_BID = [
    'Arbitrary judgment instead of published criteria.',
    'Convenience ahead of procurement procedure.',
    'Unverified preference for one bid over others.',
]
BAD_ETH = [
    'Collusion, favoritism, or conflict of interest.',
    'Personal preference in procurement choices.',
    'Ignoring the duty of impartial treatment.',
]
BAD_PROC = [
    'Unrecorded shortcuts in monitoring and sanctions.',
    'Convenience ahead of documentation standards.',
    'Personal preference in enforcement steps.',
]
BAD_MEETING = [
    'Personal preference in meeting administration.',
    'Bypassing the written record for convenience.',
    'Treating minutes as informal reminders only.',
]


add('ppa_ethic_010', 'Why is the Accounting Officer (Permanent Secretary) ultimately responsible for compliance, financial integrity, and accountability in procurement?', 1,
    'Because the officer is designated as the Chief Accounting Officer for the MDA.',
    ['They chair the Ministerial Tenders Board (MTB).', 'They issue the final Payment Voucher.', 'They set the federal procurement thresholds.'],
    'The Permanent Secretary or equivalent is the Chief Accounting Officer and therefore carries ultimate responsibility for expenditure control and compliance.',
    ['accounting_officer', 'permanent_secretary', 'chief_accounting_officer', 'financial_integrity'])
add('ppa_ethic_022', 'How do Standard Bidding Documents (SBDs) support transparency?', 2,
    'By ensuring uniformity and clarity of requirements for all potential bidders.',
    ['They guarantee the cheapest price.', 'They allow only local contractors to bid.', 'They make negotiation mandatory for all bids.'],
    'Standard Bidding Documents promote transparency by giving all bidders the same clear requirements and evaluation basis.',
    ['standard_bidding_documents', 'uniformity', 'transparency'])
add('ppa_ethic_038', 'What does a responsive bid confirm in the procurement process?', 1,
    'That the bid meets the technical, financial, and administrative requirements.',
    ['That it offers the cheapest price.', 'That it has the longest warranty period.', 'That it was submitted by a large contractor.'],
    'A responsive bid is one that meets all the stated requirements and therefore remains eligible for evaluation.',
    ['responsive_bid', 'eligibility', 'technical_financial_administrative'])
add('ppa_ethic_059', 'From what point in time does the servicing of a meeting incorporate the required activities?', 2,
    'From the time an officer is designated as the Secretary to the time the meeting rises and follow-up actions are completed.',
    ['From the moment the meeting is announced.', 'From the moment the chairman enters the room.', 'From the moment the minutes are circulated.'],
    'Meeting servicing begins when the secretary is designated and continues until the meeting closes and the necessary follow-up work is done.',
    ['meeting_servicing', 'secretary', 'follow_up_actions'])
add('ppa_ethic_061', 'Why should minutes be written and circulated soon after a meeting?', 0,
    'To keep the decisions fresh in the minds of the members.',
    ['To prevent the members from forgetting what was discussed.', 'To make the meeting look more important.', 'To show that the secretary is a fast writer.'],
    'Minutes are circulated promptly so that the decisions and action points remain fresh and accurate while the discussion is still recent.',
    ['minutes', 'circulation', 'fresh_decisions'])
add('ppa_ethic_063', 'What is the objective of the Action Points section in meeting minutes?', 2,
    'To list the people responsible for action, the action itself, and the completion timeframe.',
    ['To list the topics that were not discussed.', 'To list the names of the people who spoke the most.', 'To list the names of the members who attended.'],
    'Action points record who is responsible, what must be done, and when completion is expected.',
    ['minutes', 'action_points', 'responsibility', 'timeframe'])
add('ppa_ethic_066', 'What is the aim of the Action Points section in the minutes of a meeting?', 0,
    'To list the people accountable for action, the action to be taken, and the timeframe for completion.',
    ['To list the topics that were not discussed.', 'To list the names of the members who attended.', 'To list the names of the people who spoke the most.'],
    'The action-points section captures responsibility, the required action, and the deadline for completion.',
    ['minutes', 'action_points', 'accountability'])
add('ppa_ethic_068', 'When is it advisable to type short drafts or minutes?', 2,
    'When the handwriting is not sufficiently legible.',
    ['Always, regardless of legibility.', 'Only when the writer is a senior officer.', 'Never.'],
    'Typing is advisable when handwriting is not sufficiently legible so that the record can be read and processed properly.',
    ['drafts', 'minutes', 'legibility'])
add('ppa_ethic_069', 'What should be done if handwriting on minutes or drafts covering more than half of an A4 page is not easily readable?', 0,
    'They should be typewritten.',
    ['They should still be handwritten regardless of legibility.', 'They should be returned without processing.', 'They should be discarded.'],
    'Where handwriting is not easily readable, the minutes or draft should be typewritten so the record remains clear and usable.',
    ['minutes', 'drafts', 'typewritten_documents', 'readability'])
add('ppa_ethic_071', 'What does the Duplicate Note-Book System record when an officer sends out a file?', 2,
    'The file number, date, and destination.',
    ['Only the meeting minutes.', 'Only personal notes.', 'A duplicate copy of the whole file.'],
    'The duplicate note-book system records the file number, date, and destination whenever a file is transmitted.',
    ['duplicate_note_book', 'file_transmission', 'records'])
add('ppa_ethic_073', 'How is the style of address for submitting minutes through official channels arranged?', 3,
    "By placing the most senior officer's title first, then the others in descending order of status, prefixed by \"through\".",
    ["By placing the most senior officer's title last.", "By using no titles at all.", "By placing the most junior officer first."],
    'Official submission of minutes uses the senior officer first and then the others in descending status, prefixed by the word through.',
    ['official_writing', 'style_of_address', 'minutes'])

add_many([
    ('proc_transparency_ethics_gen_001', 0, 'Which practice best supports governance in transparency, ethics, and accountability work?'),
    ('proc_transparency_ethics_gen_019', 0, 'Which action best demonstrates governance discipline in transparency, ethics, and accountability work?'),
],
'Apply approved transparency, ethics, and accountability procedures and maintain complete records.', BAD_GOV,
'Governance in transparency, ethics, and accountability is strongest when officers follow the approved procedure and keep the full record needed for review.',
['procurement_act', 'proc_transparency_ethics', 'governance', 'approved_procedure'])
add_many([
    ('proc_transparency_ethics_gen_003', 0, 'Which practice best supports risk management in transparency, ethics, and accountability work?'),
    ('proc_transparency_ethics_gen_021', 0, 'Which action best supports risk management in transparency, ethics, and accountability work?'),
],
'Early escalation of material exceptions.', BAD_RISK,
'Risk management is stronger when material exceptions are identified early, escalated promptly, and tracked before they become legal or service failures.',
['procurement_act', 'proc_transparency_ethics', 'risk_management', 'material_exceptions'])
add_many([
    ('proc_transparency_ethics_gen_007', 0, 'Which practice best supports procurement ethics in transparency, ethics, and accountability work?'),
    ('proc_transparency_ethics_gen_025', 0, 'Which practice best supports procurement ethics in transparency, ethics, and accountability governance?'),
],
'Prevent collusion, favoritism, and conflict of interest.', BAD_ETH,
'Procurement ethics are strengthened when collusion, favoritism, and conflict of interest are actively prevented and not tolerated in the process.',
['procurement_act', 'proc_transparency_ethics', 'procurement_ethics', 'integrity'])
add('proc_transparency_ethics_gen_009', 'Which practice best supports documented procedure in transparency, ethics, and accountability work?', 0,
    'Follow documented procedure and keep complete records.', BAD_DOC,
    'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
    ['procurement_act', 'proc_transparency_ethics', 'documented_procedure', 'complete_records'])
add('proc_transparency_ethics_gen_011', 'Which action best demonstrates public accountability in transparency, ethics, and accountability work?', 0,
    'Provide traceable decisions and evidence-based justification.', BAD_ACC,
    'Public accountability depends on decisions that can be traced to recorded reasons and supporting evidence.',
    ['procurement_act', 'proc_transparency_ethics', 'public_accountability', 'traceable_decisions'])
add('proc_transparency_ethics_gen_013', 'Which practice best supports risk control in transparency, ethics, and accountability work?', 0,
    'Identify risk early, apply controls, and document mitigation.', BAD_CTRL,
    'Risk control is stronger when identified risks are matched with documented mitigation and follow-up action.',
    ['procurement_act', 'proc_transparency_ethics', 'risk_control', 'documented_mitigation'])
add('proc_transparency_ethics_gen_015', 'Which practice best sustains operational discipline in transparency, ethics, and accountability work?', 0,
    'Follow approved workflows and verify outputs before closure.', BAD_WORKFLOW,
    'Operational discipline depends on completing approved workflow checks before a matter is closed or advanced.',
    ['procurement_act', 'proc_transparency_ethics', 'operational_discipline', 'workflow_checks'])
add('proc_transparency_ethics_gen_017', 'Which practice best supports record management in transparency, ethics, and accountability work?', 0,
    'Maintain accurate files and update status at each control point.', BAD_FILE,
    'Record management is stronger when files stay current and each control point is reflected in a status update that later reviewers can verify.',
    ['procurement_act', 'proc_transparency_ethics', 'record_management', 'status_updates'])
add('proc_transparency_ethics_gen_023', 'Which practice best supports bid evaluation in transparency, ethics, and accountability work?', 0,
    'Apply published criteria consistently to all responsive bids.', BAD_BID,
    'Sound bid evaluation depends on applying the published criteria consistently to every responsive bid rather than introducing arbitrary judgment.',
    ['procurement_act', 'proc_transparency_ethics', 'bid_evaluation', 'published_criteria'])


data = json.loads(TARGET.read_text(encoding='utf-8'))
updated = 0
for sub in data.get('subcategories', []):
    if sub.get('id') not in SUBS:
        continue
    for question in sub.get('questions', []):
        payload = UPDATES.get(question.get('id'))
        if payload:
            question.update(payload)
            updated += 1

TARGET.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'Applied round 119 updates to {updated} questions in {TARGET}')
