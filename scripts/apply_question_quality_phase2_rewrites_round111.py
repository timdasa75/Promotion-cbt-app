#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'psr_rules.json'
SUB = 'psr_medical'
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
BAD_DISC = [
    'Rules applied selectively for convenience.',
    'Known controls bypassed to save time.',
    'Informal practice accepted instead of approved process.',
]
BAD_PROMO = [
    'Promotion decisions handled without the approved review process.',
    'Personal preference used instead of the governing rule.',
    'Convenience ahead of the applicable standard.',
]

# Generated shell
add(
    'psr_medical_gen_001',
    'Which practice best strengthens governance in medical and welfare administration?',
    0,
    'Approved procedures with complete case records.',
    BAD_DOC,
    'Governance in medical and welfare administration is strongest when officers follow the approved procedure and keep complete records for review and accountability.',
    ['psr_medical', 'governance', 'approved_procedure', 'complete_records'],
)
add(
    'psr_medical_gen_003',
    'Which practice best supports risk management in medical and welfare administration?',
    0,
    'Early escalation of material welfare-case exceptions.',
    BAD_RISK,
    'Risk management improves when material exceptions are identified early, escalated promptly, and tracked for follow-up.',
    ['psr_medical', 'risk_management', 'material_exceptions', 'escalation'],
)
add(
    'psr_medical_gen_007',
    'Which practice best supports promotion standards in medical and welfare administration?',
    0,
    'Promotion decisions handled through the approved standard.',
    BAD_PROMO,
    'Promotion standards are protected when decisions follow the approved rule and review path instead of informal preference.',
    ['psr_medical', 'promotion_standards', 'approved_review', 'rule_compliance'],
)
add(
    'psr_medical_gen_009',
    'Which practice best supports documented procedure in medical and welfare administration?',
    0,
    'Complete records kept under the approved procedure.',
    BAD_DOC,
    'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
    ['psr_medical', 'documented_procedure', 'approved_process', 'complete_records'],
)
add(
    'psr_medical_gen_011',
    'Which action best demonstrates public accountability in medical and welfare administration?',
    0,
    'Traceable decisions with recorded reasons.',
    BAD_ACC,
    'Public accountability depends on decisions that can be traced to recorded reasons and supporting evidence.',
    ['psr_medical', 'public_accountability', 'traceable_decisions', 'recorded_reasons'],
)
add(
    'psr_medical_gen_013',
    'Which practice best supports risk control in medical and welfare administration?',
    0,
    'Documented mitigation for identified welfare-case risks.',
    BAD_CTRL,
    'Risk control is stronger when identified risks are matched with documented mitigation and follow-up action.',
    ['psr_medical', 'risk_control', 'documented_mitigation', 'follow_up'],
)
add(
    'psr_medical_gen_015',
    'Which routine best sustains operational discipline in medical and welfare administration?',
    0,
    'Approved workflow checks before case closure.',
    BAD_WORKFLOW,
    'Operational discipline depends on completing approved workflow checks before a matter is closed or advanced.',
    ['psr_medical', 'operational_discipline', 'workflow_checks', 'case_closure'],
)
add(
    'psr_medical_gen_017',
    'Which practice best supports record management in medical and welfare administration?',
    0,
    'Current files with status updates at each control point.',
    BAD_FILE,
    'Record management depends on keeping files current and updating status at each control point so the matter remains reviewable.',
    ['psr_medical', 'record_management', 'current_files', 'status_updates'],
)
add(
    'psr_medical_gen_019',
    'Which routine best strengthens governance standards in medical and welfare administration?',
    0,
    'Approved governance procedures with complete records.',
    BAD_DOC,
    'Governance standards are strongest when officers follow the approved procedure consistently and keep the records needed for review and continuity.',
    ['psr_medical', 'governance_standards', 'approved_procedure', 'governance_records'],
)
add(
    'psr_medical_gen_023',
    'Which practice best supports disciplinary process in medical and welfare administration?',
    0,
    'Due process, fair hearing, and documented decisions.',
    BAD_DISC,
    'A proper disciplinary process depends on due process, fair hearing, and documented decisions rather than shortcuts or informal sanctions.',
    ['psr_medical', 'disciplinary_process', 'due_process', 'fair_hearing'],
)
add(
    'psr_medical_gen_025',
    'Which practice best supports promotion standards in medical and welfare cases?',
    0,
    'Promotion decisions applied through the approved standard.',
    BAD_PROMO,
    'Promotion standards are sustained when the governing rule is applied consistently rather than being replaced by informal judgment.',
    ['psr_medical', 'promotion_standards', 'approved_standard', 'consistent_application'],
)

# Factual tail
add(
    'psr_med_026',
    'Under PSR 130110, what may a Medical Board recommend when unfitness persists?',
    1,
    'Extension of leave without pay or retirement on medical grounds.',
    [
        'Disciplinary suspension for misconduct.',
        'Automatic salary increase after review.',
        'Routine transfer to another department.',
    ],
    'PSR 130110 allows a Medical Board to recommend extension of leave without pay or retirement on medical grounds where unfitness persists.',
    ['psr_130110', 'medical_board', 'leave_without_pay', 'medical_retirement'],
)
add(
    'psr_med_040',
    'Under PSR 130111, when is an injury compensable?',
    0,
    'When it is sustained during official duty or as its direct consequence.',
    [
        'Whenever it occurs at home.',
        'Whenever the officer is off duty.',
        'Whenever negligence contributed to the injury.',
    ],
    'PSR 130111 treats an injury as compensable only when it is sustained during official duty or as a direct consequence of that duty.',
    ['psr_130111', 'injury_on_duty', 'compensable_injury', 'official_duty'],
)
add(
    'psr_med_049',
    'Under PSR 130104, when should treatment abroad be considered?',
    1,
    'Only when adequate treatment facilities are unavailable in Nigeria.',
    [
        'Whenever the officer prefers foreign treatment.',
        'Whenever the officer can afford foreign hospitals.',
        'Whenever a superior officer requests it.',
    ],
    'PSR 130104 limits treatment abroad to cases where adequate treatment is unavailable in Nigeria and the case is properly certified.',
    ['psr_130104', 'treatment_abroad', 'medical_board', 'adequate_facilities'],
)
add(
    'psr_med_053',
    'What may happen when a non-pensionable officer causes pecuniary damage through negligence or failure to obey an order?',
    0,
    'A salary deduction may be made to recover the damage.',
    [
        'The officer must be terminated immediately.',
        'The full amount must be paid upfront in every case.',
        'No liability arises from the damage.',
    ],
    'Where a non-pensionable officer causes pecuniary damage through negligence or failure to comply with an order, recovery may be made through salary deduction.',
    ['non_pensionable_officer', 'pecuniary_damage', 'salary_deduction', 'liability'],
)
add(
    'psr_med_054',
    'What is the main objective of compulsory examinations for police and paramilitary officers?',
    0,
    'To ensure officers are conversant with their service rules, regulations, and laws.',
    [
        'To test physical fitness only.',
        'To assess academic prowess alone.',
        'To identify promotion candidates only.',
    ],
    'The compulsory examinations are intended to ensure that officers are conversant with the rules, regulations, and laws governing their service.',
    ['compulsory_examinations', 'police_paramilitary', 'service_rules', 'confirmation_exam'],
)
add(
    'psr_med_057',
    'Can receipt and licence books be transferred between Sub-Accounting Officers?',
    0,
    'Yes, with the consent of the Accounting Officer or in special emergencies with reporting.',
    [
        'No, never.',
        'Only when the books are unused.',
        'Yes, at any time without approval.',
    ],
    'Receipt and licence books may be transferred with the consent of the Accounting Officer, or in special emergency cases provided the circumstances are reported.',
    ['receipt_books', 'licence_books', 'sub_accounting_officers', 'accounting_officer_consent'],
)
add(
    'psr_med_066',
    'During secondment, what happens to an officer\'s substantive post and promotion prospects?',
    0,
    'The substantive post is held and promotion prospects are maintained.',
    [
        'The officer is permanently transferred to the receiving organization.',
        'The substantive post is frozen and promotion is suspended.',
        'The substantive post and promotion prospects are forfeited.',
    ],
    'During secondment, the officer\'s substantive post continues to be held and the officer remains entitled to increment and promotion under the governing rule.',
    ['secondment', 'substantive_post', 'promotion_prospects', 'special_duty'],
)
add(
    'psr_med_075',
    'How is the promotion of a contract officer handled?',
    2,
    'The officer is considered for an enhanced appointment during contract renegotiation.',
    [
        'A contract officer is never eligible for advancement.',
        'Advancement depends only on long years of service.',
        'A different routine promotion list is used for contract officers.',
    ],
    'A contract officer is not promoted in the ordinary sense; instead, the officer may be considered for an enhanced appointment when the contract is renegotiated.',
    ['contract_officer', 'enhanced_appointment', 'contract_renegotiation', 'promotion_handling'],
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
    print(f'Applied round 111 rewrites to {updated} questions')


if __name__ == '__main__':
    main()
