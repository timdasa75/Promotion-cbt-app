#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'financial_regulations.json'
SUBS = {'fin_audits_sanctions'}
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
    'Convenience ahead of approved audit procedure.',
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


add(
    'fin_aud_018',
    "What do accruals mean in government financial reporting?",
    1,
    'Expenses or revenues recognized when they are incurred, not when cash changes hands.',
    [
        'Cash received before the related service is delivered.',
        'Budget reserves kept aside by the Ministry of Finance.',
        'Sanctions imposed for delayed tax remittance.',
    ],
    'Accrual accounting recognizes revenue and expenditure when the obligation or entitlement arises, rather than waiting for the cash movement itself.',
    ['financial_reporting', 'accruals', 'recognition_basis', 'government_accounts'],
)
add(
    'fin_aud_053',
    'What should an Internal Auditor do after discovering that an officer is negligently disregarding Financial Regulations?',
    2,
    'Report the discovery to the Accounting Officer in a management letter.',
    [
        'Ignore the matter if the error appears minor.',
        "Report the matter only to the officer's immediate supervisor.",
        'Write directly to the Auditor-General without first reporting internally.',
    ],
    'Where negligence in observing the Financial Regulations is discovered, the Internal Auditor is expected to communicate the finding to the Accounting Officer through a management letter so corrective action can be taken.',
    ['internal_audit', 'management_letter', 'accounting_officer', 'financial_regulations'],
)
add(
    'fin_aud_058',
    'Who is an Accounting Officer under the Financial Regulations?',
    0,
    'The Permanent Secretary or equivalent head with full responsibility for human, material, and financial resources.',
    [
        'The officer in charge of internal audit only.',
        'Any officer who signs disbursement vouchers.',
        'Any officer who handles public money in the office.',
    ],
    'The Financial Regulations define the Accounting Officer as the Permanent Secretary or equivalent head who is in full control of the human, material, and financial resources of the organization.',
    ['accounting_officer', 'financial_regulations', 'permanent_secretary', 'resource_control'],
)

add_many([
    ('fin_audits_sanctions_gen_001', 0, 'Which practice best supports governance in audits, sanctions, and compliance work?'),
    ('fin_audits_sanctions_gen_019', 0, 'Which action best demonstrates governance discipline in audits, sanctions, and compliance work?'),
],
'Approved audit procedure with complete records.', BAD_GOV,
'Governance in audits, sanctions, and compliance is strongest when officers follow the approved procedure and keep the full record needed for review.',
['fin_audits_sanctions', 'governance', 'approved_procedure', 'complete_records'])
add('fin_audits_sanctions_gen_003', 'Which practice best supports risk management in audits, sanctions, and compliance work?', 0,
    'Early escalation of material exceptions.', BAD_RISK,
    'Risk management is stronger when material exceptions are identified early, escalated promptly, and tracked before they become control failures.',
    ['fin_audits_sanctions', 'risk_management', 'material_exceptions', 'escalation'])
add_many([
    ('fin_audits_sanctions_gen_004', 0, 'Which practice best supports vote-book control in audits, sanctions, and compliance work?'),
    ('fin_audits_sanctions_gen_022', 0, 'Which routine best sustains vote-book control in audits, sanctions, and compliance work?'),
],
'Budget availability confirmed before commitments are raised.', BAD_VOTE,
'Vote-book control is strongest when budget availability is checked before commitments are raised and the commitment is recorded properly.',
['fin_audits_sanctions', 'vote_book_control', 'budget_availability', 'commitment_control'])
add_many([
    ('fin_audits_sanctions_gen_007', 0, 'Which practice best supports audit readiness in audits, sanctions, and compliance work?'),
    ('fin_audits_sanctions_gen_025', 0, 'Which routine best sustains audit readiness in audits, sanctions, and compliance work?'),
],
'Complete supporting records for verification and audit.', BAD_AUDIT,
'Audit readiness depends on complete supporting records that can be reviewed, verified, and linked to each decision taken.',
['fin_audits_sanctions', 'audit_readiness', 'supporting_records', 'verification'])
add('fin_audits_sanctions_gen_009', 'Which practice best supports documented procedure in audits, sanctions, and compliance work?', 0,
    'Complete records under the approved procedure.', BAD_DOC,
    'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
    ['fin_audits_sanctions', 'documented_procedure', 'approved_process', 'complete_records'])
add('fin_audits_sanctions_gen_011', 'Which action best demonstrates public accountability in audits, sanctions, and compliance work?', 0,
    'Traceable decisions with recorded reasons.', BAD_ACC,
    'Public accountability depends on decisions that can be traced to recorded reasons and supporting evidence.',
    ['fin_audits_sanctions', 'public_accountability', 'traceable_decisions', 'recorded_reasons'])
add('fin_audits_sanctions_gen_013', 'Which practice best supports risk control in audits, sanctions, and compliance work?', 0,
    'Documented mitigation for identified risks.', BAD_CTRL,
    'Risk control is stronger when identified risks are matched with documented mitigation and follow-up action.',
    ['fin_audits_sanctions', 'risk_control', 'documented_mitigation', 'follow_up'])
add('fin_audits_sanctions_gen_015', 'Which practice best sustains operational discipline in audits, sanctions, and compliance work?', 0,
    'Approved workflow checks before closure.', BAD_WORKFLOW,
    'Operational discipline depends on completing approved workflow checks before a matter is closed or advanced.',
    ['fin_audits_sanctions', 'operational_discipline', 'workflow_checks', 'case_closure'])
add('fin_audits_sanctions_gen_017', 'Which practice best supports record management in audits, sanctions, and compliance work?', 0,
    'Current files with status updates at each control point.', BAD_FILE,
    'Record management is stronger when files stay current and each control point is reflected in a status update that later reviewers can verify.',
    ['fin_audits_sanctions', 'record_management', 'current_files', 'status_updates'])
add('fin_audits_sanctions_gen_023', 'Which practice best supports legal compliance in audits, sanctions, and compliance work?', 0,
    'Legal-authority checks with a documented decision basis.', BAD_AUTH,
    'Legal compliance is more defensible when officers confirm the governing legal authority before acting and record the basis for the decision clearly.',
    ['fin_audits_sanctions', 'legal_compliance', 'statutory_authority', 'decision_basis'])
add('fin_audits_sanctions_gen_023', 'Which practice best supports lawful virement control in audits, sanctions, and compliance work?', 0,
    'Proper authorization before funds are moved between heads.', BAD_VIRE,
    'Virement control remains lawful when funds are moved only with proper authorization and within the approved vote structure.',
    ['fin_audits_sanctions', 'virement', 'proper_authorization', 'vote_structure'])


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
print(f'Applied round 116 updates to {updated} questions in {TARGET}')

