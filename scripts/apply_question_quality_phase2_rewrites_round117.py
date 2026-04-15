#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'public_procurement.json'
SUBS = {'proc_implementation_sanctions'}
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


add(
    'ppa_ims_003',
    'What happens if a contractor fails to provide the required Performance Bond under Section 29 after contract award?',
    1,
    'The contract may be terminated.',
    [
        'The contract variation must be approved by FEC.',
        'Mobilization fee is released immediately.',
        'The project is transferred to another MDA.',
    ],
    'Failure to submit the required Performance Bond exposes the government to risk and can lead to termination of the contract.',
    ['performance_bond', 'section_29', 'contract_termination', 'public_procurement'],
)
add(
    'ppa_ims_040',
    'If an officer is charged with a criminal offense, whom must the PSR require them to promptly report it to?',
    1,
    'His Permanent Secretary or Head of Extra-Ministerial Office.',
    [
        'The President under established controls.',
        'The National Assembly in the evaluation process.',
        'The Central Bank of Nigeria under due-process safeguards.',
    ],
    'The PSR requires an officer who is charged with a criminal offense to report promptly to the Permanent Secretary or Head of Extra-Ministerial Office.',
    ['criminal_charge_reporting', 'permanent_secretary', 'psr', 'rule_100410'],
)
add(
    'ppa_ims_051',
    'What is the objective of the Principle of Impartiality as it relates to members of the public?',
    0,
    'To ensure that everyone is treated equally and fairly, regardless of background.',
    [
        'To prioritize government officials over ordinary citizens.',
        'To allow civil servants to treat citizens differently based on political views.',
        'To allow civil servants to use discretion to make exceptions.',
    ],
    'The principle of impartiality requires civil servants to treat everyone who comes to them in the course of duty equally and fairly.',
    ['impartiality', 'equal_treatment', 'public_service', 'fairness'],
)
add(
    'ppa_ims_052',
    'What does the limitation on the amount of funds brought forward by a Development Fund Supplementary Warrant mean?',
    2,
    'It must be less than 50% of the project cost.',
    [
        'It is unlimited.',
        'It can exceed the estimated total cost of the project.',
        'It must not exceed the estimated total cost of the project as shown in the Annual or Supplementary Estimates.',
    ],
    'The amount brought forward by a Development Fund Supplementary Warrant must not exceed the estimated total cost of the project shown in the relevant estimates.',
    ['development_fund_supplementary_warrant', 'project_cost', 'annual_estimates', 'funds_brought_forward'],
)
add(
    'ppa_ims_053',
    'May idle funds in the accounts of missions abroad be invested in short-term deposits?',
    2,
    'Only if the amount is substantial.',
    [
        'No, never.',
        'Yes, at the discretion of the Head of Mission.',
        'Yes, but only with the prior approval of the Accountant-General.',
    ],
    'Idle funds in mission accounts abroad may be invested in short-term deposits, but only with the prior approval of the Accountant-General.',
    ['missions_abroad', 'idle_funds', 'short_term_deposits', 'accountant_general'],
)
add(
    'ppa_ims_060',
    'What action most directly strengthens risk management when a supervisor reviews compliance gaps in Implementation, Monitoring & Sanctions?',
    1,
    'Identify control gaps early and escalate material exceptions promptly.',
    [
        'Bypass review and approval controls to save time.',
        'Ignore feedback and continue non-compliant procedures.',
        'Prioritize convenience over policy and legal requirements.',
    ],
    'Risk management improves when control gaps are identified early, escalated promptly, and tracked for follow-up while records remain available for audit and oversight.',
    ['implementation_monitoring_sanctions', 'risk_management', 'control_gaps', 'escalation'],
)
add(
    'ppa_ims_064',
    'Which practice best supports document management during procurement implementation and monitoring?',
    2,
    'Bypass review and approval controls to save time.',
    [
        'Apply rules inconsistently based on personal preference.',
        'Keep accurate files and update status at each control point.',
        'Prioritize convenience over policy and legal requirements.',
    ],
    'Procurement implementation is easier to monitor and audit when records stay accurate and file status is updated at each control point.',
    ['document_management', 'procurement_implementation', 'accurate_files', 'control_points'],
)
add(
    'ppa_ims_072',
    'Which bid-evaluation practice best aligns with sound public procurement procedure?',
    3,
    'Ignore feedback and continue non-compliant procedures.',
    [
        'Apply rules inconsistently based on personal preference.',
        'Bypass review and approval controls to save time.',
        'Apply published criteria consistently to all responsive bids.',
    ],
    'Sound bid evaluation depends on applying the published criteria consistently to every responsive bid rather than introducing arbitrary or undocumented judgment.',
    ['bid_evaluation', 'published_criteria', 'responsive_bids', 'procurement_procedure'],
)
add(
    'ppa_ims_074',
    'When should implementation, monitoring, and sanctions be handled to keep governance standards proper?',
    1,
    'Apply approved implementation, monitoring, and sanctions procedures and keep complete records.',
    [
        'Bypass review and approval controls to save time.',
        'Prioritize convenience over policy and legal requirements.',
        'Ignore feedback and continue non-compliant procedures.',
    ],
    'Implementation, monitoring, and sanctions stay defensible when officers follow the approved procedure and keep complete records of the action taken.',
    ['implementation_monitoring_sanctions', 'governance', 'approved_procedure', 'complete_records'],
)

add_many([
    ('proc_implementation_sanctions_gen_001', 0, 'Which practice best supports governance in implementation, monitoring, and sanctions work?'),
    ('proc_implementation_sanctions_gen_022', 0, 'Which practice best supports governance standards in implementation, monitoring, and sanctions work?'),
],
'Apply approved implementation, monitoring, and sanctions procedures and maintain complete records.', BAD_GOV,
'Governance in implementation, monitoring, and sanctions is strongest when officers follow the approved procedure and keep the full record needed for review.',
['procurement_act', 'proc_implementation_sanctions', 'governance', 'approved_procedure'])
add_many([
    ('proc_implementation_sanctions_gen_003', 0, 'Which practice best supports risk management in implementation, monitoring, and sanctions work?'),
    ('proc_implementation_sanctions_gen_031', 2, 'What action most directly strengthens implementation, monitoring, and sanctions risk management when a supervisor reviews compliance gaps?'),
],
'Early escalation of material exceptions.', BAD_RISK,
'Risk management is stronger when material exceptions are identified early, escalated promptly, and tracked before they become legal or service failures.',
['procurement_act', 'proc_implementation_sanctions', 'risk_management', 'material_exceptions'])
add_many([
    ('proc_implementation_sanctions_gen_010', 0, 'Which practice best supports procurement ethics in implementation, monitoring, and sanctions work?'),
    ('proc_implementation_sanctions_gen_028', 0, 'Which practice best supports procurement ethics in implementation, monitoring, and sanctions governance?'),
],
'Prevent collusion, favoritism, and conflict of interest.', BAD_ETH,
'Procurement ethics are strengthened when collusion, favoritism, and conflict of interest are actively prevented and not tolerated in the process.',
['procurement_act', 'proc_implementation_sanctions', 'procurement_ethics', 'integrity'])
add('proc_implementation_sanctions_gen_012', 'Which practice best supports documented procedure in implementation, monitoring, and sanctions work?', 0,
    'Follow documented procedure and keep complete records.', BAD_DOC,
    'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
    ['procurement_act', 'proc_implementation_sanctions', 'documented_procedure', 'complete_records'])
add('proc_implementation_sanctions_gen_014', 'Which action best demonstrates public accountability in implementation, monitoring, and sanctions work?', 0,
    'Provide traceable decisions and evidence-based justification.', BAD_ACC,
    'Public accountability depends on decisions that can be traced to recorded reasons and supporting evidence.',
    ['procurement_act', 'proc_implementation_sanctions', 'public_accountability', 'traceable_decisions'])
add('proc_implementation_sanctions_gen_016', 'Which practice best supports risk control in implementation, monitoring, and sanctions work?', 0,
    'Identify risk early, apply controls, and document mitigation.', BAD_CTRL,
    'Risk control is stronger when identified risks are matched with documented mitigation and follow-up action.',
    ['procurement_act', 'proc_implementation_sanctions', 'risk_control', 'documented_mitigation'])
add('proc_implementation_sanctions_gen_018', 'Which practice best sustains operational discipline in implementation, monitoring, and sanctions work?', 0,
    'Follow approved workflows and verify outputs before closure.', BAD_WORKFLOW,
    'Operational discipline depends on completing approved workflow checks before a matter is closed or advanced.',
    ['procurement_act', 'proc_implementation_sanctions', 'operational_discipline', 'workflow_checks'])
add('proc_implementation_sanctions_gen_020', 'Which practice best supports record management in implementation, monitoring, and sanctions work?', 0,
    'Maintain accurate files and update status at each control point.', BAD_FILE,
    'Record management is stronger when files stay current and each control point is reflected in a status update that later reviewers can verify.',
    ['procurement_act', 'proc_implementation_sanctions', 'record_management', 'status_updates'])
add('proc_implementation_sanctions_gen_026', 'Which practice best supports bid evaluation in implementation, monitoring, and sanctions work?', 0,
    'Apply published criteria consistently to all responsive bids.', BAD_BID,
    'Sound bid evaluation depends on applying the published criteria consistently to every responsive bid rather than introducing arbitrary judgment.',
    ['procurement_act', 'proc_implementation_sanctions', 'bid_evaluation', 'published_criteria'])


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
print(f'Applied round 117 updates to {updated} questions in {TARGET}')
