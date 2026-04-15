#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'general_current_affairs.json'
SUB = 'ca_national_governance'
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


BAD_DOC = [
    'Personal preference in procedure use.',
    'Bypassed review checkpoints.',
    'Convenience ahead of legal requirements.',
]
BAD_ACC = [
    'Unrecorded decisions under pressure.',
    'Convenience ahead of review duty.',
    'Inconsistent criteria across similar cases.',
]
BAD_RISK = [
    'Unreported exceptions in routine work.',
    'Convenience ahead of risk review.',
    'Personal preference in risk handling.',
]
BAD_CTRL = [
    'Convenience ahead of control requirements.',
    'Repeated non-compliance after feedback.',
    'Personal preference in control use.',
]
BAD_WORKFLOW = [
    'Skipped workflow checks under pressure.',
    'Personal preference in workflow steps.',
    'Repeated non-compliance after feedback.',
]
BAD_FILE = [
    'Personal preference in filing practice.',
    'Bypassed review checkpoints.',
    'Convenience ahead of documentation standards.',
]
BAD_COMM = [
    'Unverified claims repeated as fact.',
    'Convenience ahead of source verification.',
    'Informal rumor treated as an official update.',
]
BAD_CONTROL = [
    'Bypassed review checkpoints where timelines are tight.',
    'Convenience ahead of approved process requirements.',
    'Inconsistent criteria across similar cases in the same period.',
]

# Generated shell and refill items
add(
    'ca_national_governance_gen_003',
    'Which practice best supports risk management in national governance and policy work?',
    0,
    'Early identification of control gaps and prompt escalation of material exceptions.',
    BAD_RISK,
    'Risk management is stronger when control gaps are identified early, escalated promptly, and tracked for follow-up.',
    ['ca_national_governance', 'risk_management', 'control_gaps', 'escalation'],
)
add(
    'ca_national_governance_gen_007',
    'Which practice best supports public communication literacy in national governance work?',
    0,
    'Distinguishing verified official updates from misinformation.',
    BAD_COMM,
    'Public communication literacy depends on separating verified official updates from rumor or misinformation before action is taken.',
    ['ca_national_governance', 'public_communication_literacy', 'verified_updates', 'misinformation'],
)
add(
    'ca_national_governance_gen_009',
    'Which practice best supports documented procedure in national governance work?',
    0,
    'Complete records kept under the approved procedure.',
    BAD_DOC,
    'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
    ['ca_national_governance', 'documented_procedure', 'approved_process', 'complete_records'],
)
add(
    'ca_national_governance_gen_011',
    'Which action best demonstrates public accountability in national governance work?',
    0,
    'Traceable decisions with recorded reasons.',
    BAD_ACC,
    'Public accountability depends on decisions that can be traced to recorded reasons and supporting evidence.',
    ['ca_national_governance', 'public_accountability', 'traceable_decisions', 'recorded_reasons'],
)
add(
    'ca_national_governance_gen_013',
    'Which practice best supports risk control in national governance work?',
    0,
    'Documented mitigation for identified governance risks.',
    BAD_CTRL,
    'Risk control is stronger when identified governance risks are matched with documented mitigation and follow-up action.',
    ['ca_national_governance', 'risk_control', 'documented_mitigation', 'follow_up'],
)
add(
    'ca_national_governance_gen_015',
    'Which routine best sustains operational discipline in national governance work?',
    0,
    'Approved workflow checks before a matter is closed.',
    BAD_WORKFLOW,
    'Operational discipline depends on completing approved workflow checks before a matter is closed or advanced.',
    ['ca_national_governance', 'operational_discipline', 'workflow_checks', 'case_closure'],
)
add(
    'ca_national_governance_gen_017',
    'Which practice best supports record management in national governance work?',
    0,
    'Current files with status updates at each control point.',
    BAD_FILE,
    'Record management depends on keeping files current and updating status at each control point so the matter remains reviewable.',
    ['ca_national_governance', 'record_management', 'current_files', 'status_updates'],
)
add(
    'ca_national_governance_gen_023',
    'Which practice best supports credible national governance updates?',
    0,
    'Verified official information before public circulation.',
    BAD_COMM,
    'Governance updates are most credible when they are based on verified official information before being circulated or relied on.',
    ['ca_national_governance', 'governance_updates', 'verified_information', 'official_sources'],
)
add(
    'ca_national_governance_gen_025',
    'Which practice best sustains public communication literacy in national governance work?',
    0,
    'Checking credibility before sharing policy or governance updates.',
    BAD_COMM,
    'Public communication literacy is sustained when officers check the credibility of sources before sharing policy or governance updates.',
    ['ca_national_governance', 'public_communication_literacy', 'source_credibility', 'governance_updates'],
)
add(
    'ca_national_governance_gen_026',
    'When a national governance unit faces competing priorities, which action best preserves compliance and service quality?',
    2,
    'Use credible official sources and confirm facts before conclusions.',
    [
        'Apply discretionary shortcuts to accelerate closure.',
        'Prioritize convenience over approved process requirements.',
        'Bypass review checkpoints where timelines are tight.',
    ],
    'Compliance and service quality are protected when officers rely on credible official sources and confirm facts before reaching conclusions under pressure.',
    ['ca_national_governance', 'service_quality', 'credible_sources', 'fact_confirmation'],
)
add(
    'ca_national_governance_gen_028',
    'When a supervisor reviews gaps in national governance work, which action best strengthens control and consistency?',
    0,
    'Use credible official sources and confirm facts before conclusions.',
    BAD_CONTROL,
    'Control and consistency improve when officers rely on credible official sources and confirm facts before reaching conclusions.',
    ['ca_national_governance', 'control_and_consistency', 'credible_sources', 'fact_confirmation'],
)

# Factual tail
add(
    'NGPD_008',
    'When an officer is promoted to a grade level that does not overlap the old grade level, where is the officer placed?',
    1,
    'At the minimum point of the new salary grade level.',
    [
        'At the next point above the former emolument.',
        'With the next increment deferred for one year.',
        'On a competitive examination list.',
    ],
    'Where the new grade level does not overlap the former one, the officer is placed at the minimum point of the new salary grade level.',
    ['promotion', 'grade_level', 'salary_point', 'minimum_point'],
)
add(
    'NGPD_009',
    'Can a deferred or withheld increment be restored retrospectively because service improves later?',
    2,
    'No, it cannot be restored retrospectively.',
    [
        'Yes, if approved by the Federal Civil Service Commission.',
        'Yes, immediately after service improves.',
        'Only for officers on GL 15 and above.',
    ],
    'A deferred or withheld increment is not restored with retrospective effect merely because service improves during a later period.',
    ['increment', 'deferred_increment', 'retrospective_effect', 'service_improvement'],
)
add(
    'NGPD_021',
    'What is the rule on copying or abstracting official documents without special permission?',
    1,
    'It is prohibited and may attract disciplinary action if prior approval was not obtained.',
    [
        'A formal reprimand is the standard first result in every case.',
        'Only a minor caution applies where material is not classified.',
        'Administrative redeployment is the routine consequence.',
    ],
    'Copying or abstracting official documents without following official routine or obtaining special permission is prohibited and may attract disciplinary action.',
    ['official_documents', 'copying', 'special_permission', 'disciplinary_action'],
)
add(
    'NGPD_034',
    'How does disciplinary action affect an officer\'s eligibility in a promotion exercise?',
    2,
    'Officers under disciplinary action are excluded from consideration.',
    [
        'They are promoted automatically if otherwise eligible.',
        'They become eligible after the disciplinary action ends in the same exercise.',
        'Their selection is only deferred to the next cycle automatically.',
    ],
    'Officers who fall within the field of selection are considered except those who are under disciplinary action.',
    ['promotion_eligibility', 'disciplinary_action', 'field_of_selection', 'exclusion'],
)
add(
    'NGPD_045',
    'What do the Public Service Rules provide about the gender of terms like Officer and Staff?',
    0,
    'The Rules apply equally to both genders.',
    [
        'The terms are exclusively feminine.',
        'The terms are exclusively masculine.',
        'Application depends on the Head of the MDA.',
    ],
    'Although the Rules often use masculine terms such as Officer and Staff, their provisions apply equally to both genders.',
    ['psr', 'gender_application', 'officer', 'staff'],
)
add(
    'NGPD_052',
    'What may happen if an Accounting Officer in a self-accounting unit fails to comply with the Financial Regulations?',
    1,
    'Disciplinary action and surcharge may follow.',
    [
        'The unit loses self-accounting status automatically.',
        'Only a verbal warning may be given.',
        'Nothing follows because the unit is self-accounting.',
    ],
    'Failure by an Accounting Officer in a self-accounting unit to comply with the Financial Regulations may attract disciplinary action and surcharge.',
    ['accounting_officer', 'self_accounting_unit', 'financial_regulations', 'surcharge'],
)


def main():
    data = json.loads(TARGET.read_text(encoding='utf-8'))
    updated = 0
    found = set()
    for sub in data.get('subcategories', []):
        if sub.get('id') != SUB:
            continue
        for q in sub.get('questions', []):
            patch = UPDATES.get(q.get('id'))
            if not patch:
                continue
            q.update(patch)
            updated += 1
            found.add(q.get('id'))
        break
    else:
        raise RuntimeError(f'Missing subcategory: {SUB}')

    missing = sorted(set(UPDATES) - found)
    if missing:
        raise RuntimeError(f'Missing questions: {missing}')

    TARGET.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Applied round 114 rewrites to {updated} questions')


if __name__ == '__main__':
    main()
