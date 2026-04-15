#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'psr_rules.json'
SUB = 'psr_ethics'
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
BAD_DISC = [
    'Rules applied selectively for convenience.',
    'Known controls bypassed to save time.',
    'Informal practice accepted instead of approved process.',
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
BAD_PROMO = [
    'Promotion decisions handled without the approved review process.',
    'Personal preference used instead of the governing rule.',
    'Convenience ahead of the applicable standard.',
]
BAD_RISK = [
    'Unreported exceptions in routine work.',
    'Convenience ahead of risk review.',
    'Personal preference in risk handling.',
]

# Generated shell
add(
    'psr_ethics_gen_001',
    'Which practice best strengthens governance in conduct and ethics administration?',
    0,
    'Approved procedures with complete case records.',
    BAD_DOC,
    'Governance in conduct and ethics administration is strongest when officers follow approved procedures and keep complete records for review and accountability.',
    ['psr_ethics', 'governance', 'approved_procedure', 'complete_records'],
)
add(
    'psr_ethics_gen_003',
    'Which practice best supports risk management in conduct and ethics administration?',
    0,
    'Early escalation of material ethics-control exceptions.',
    BAD_RISK,
    'Risk management improves when material ethics-control exceptions are identified early, escalated promptly, and tracked for follow-up.',
    ['psr_ethics', 'risk_management', 'ethics_control_exceptions', 'escalation'],
)
add(
    'psr_ethics_gen_007',
    'Which practice best supports promotion standards in conduct and ethics administration?',
    0,
    'Promotion decisions handled through the approved standard.',
    BAD_PROMO,
    'Promotion standards are protected when decisions follow the approved rule and review path instead of informal preference.',
    ['psr_ethics', 'promotion_standards', 'approved_review', 'rule_compliance'],
)
add(
    'psr_ethics_gen_009',
    'Which practice best supports documented procedure in conduct and ethics administration?',
    0,
    'Complete records kept under the approved procedure.',
    BAD_DOC,
    'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
    ['psr_ethics', 'documented_procedure', 'approved_process', 'complete_records'],
)
add(
    'psr_ethics_gen_011',
    'Which action best demonstrates public accountability in conduct and ethics administration?',
    0,
    'Traceable decisions with recorded reasons.',
    BAD_ACC,
    'Public accountability depends on decisions that can be traced to recorded reasons and supporting evidence.',
    ['psr_ethics', 'public_accountability', 'traceable_decisions', 'recorded_reasons'],
)
add(
    'psr_ethics_gen_013',
    'Which practice best supports risk control in conduct and ethics administration?',
    0,
    'Documented mitigation for identified ethics risks.',
    BAD_CTRL,
    'Risk control is stronger when identified ethics risks are matched with documented mitigation and follow-up action.',
    ['psr_ethics', 'risk_control', 'documented_mitigation', 'follow_up'],
)
add(
    'psr_ethics_gen_015',
    'Which routine best sustains operational discipline in conduct and ethics administration?',
    0,
    'Approved workflow checks before case closure.',
    BAD_WORKFLOW,
    'Operational discipline depends on completing approved workflow checks before a matter is closed or advanced.',
    ['psr_ethics', 'operational_discipline', 'workflow_checks', 'case_closure'],
)
add(
    'psr_ethics_gen_017',
    'Which practice best supports record management in conduct and ethics administration?',
    0,
    'Current files with status updates at each control point.',
    BAD_FILE,
    'Record management depends on keeping files current and updating status at each control point so the matter remains reviewable.',
    ['psr_ethics', 'record_management', 'current_files', 'status_updates'],
)
add(
    'psr_ethics_gen_019',
    'Which routine best strengthens governance standards in conduct and ethics administration?',
    0,
    'Approved governance procedures with complete records.',
    BAD_DOC,
    'Governance standards are strongest when officers follow the approved procedure consistently and keep the records needed for review and continuity.',
    ['psr_ethics', 'governance_standards', 'approved_procedure', 'governance_records'],
)
add(
    'psr_ethics_gen_023',
    'Which practice best supports disciplinary process in conduct and ethics administration?',
    0,
    'Due process, fair hearing, and documented decisions.',
    BAD_DISC,
    'A proper disciplinary process depends on due process, fair hearing, and documented decisions rather than shortcuts or informal sanctions.',
    ['psr_ethics', 'disciplinary_process', 'due_process', 'fair_hearing'],
)
add(
    'psr_ethics_gen_025',
    'Which practice best supports promotion standards in conduct and ethics cases?',
    0,
    'Promotion decisions applied through the approved standard.',
    BAD_PROMO,
    'Promotion standards are sustained when the governing rule is applied consistently rather than being replaced by informal judgment.',
    ['psr_ethics', 'promotion_standards', 'approved_standard', 'consistent_application'],
)

# Factual tail
add(
    'psr_eth_017',
    'Under Appendix I, from whom must a public officer not accept gifts?',
    0,
    'Persons who have official dealings with the officer.',
    [
        'Personal friends in private life only.',
        'Officers working in the same ministry.',
        'Retired officers as a class.',
    ],
    'Appendix I prohibits a public officer from accepting gifts or benefits from persons or bodies that have official dealings with the officer.',
    ['appendix_i', 'gifts', 'official_dealings', 'conflict_of_interest'],
)
add(
    'psr_eth_023',
    'What does PSR 040203 prohibit an officer from disclosing without authorization?',
    1,
    'Information obtained in the course of official duty.',
    [
        'All public statements by officials.',
        'General government information released lawfully.',
        'Annual reports issued through approved channels.',
    ],
    'PSR 040203 prohibits the unauthorized disclosure of information obtained in the course of official duty, including after retirement.',
    ['psr_040203', 'unauthorized_disclosure', 'official_information', 'confidentiality'],
)
add(
    'psr_eth_029',
    'When may a public officer maintain or operate a foreign bank account under Appendix I?',
    1,
    'When the officer is on official posting abroad.',
    [
        'When approved personally by the President.',
        'When the officer is retired.',
        'When the officer has dual citizenship.',
    ],
    'Appendix I allows a public officer to maintain a foreign bank account only while the officer is on official posting abroad.',
    ['appendix_i', 'foreign_bank_account', 'official_posting_abroad', 'financial_conduct'],
)
add(
    'psr_eth_041',
    'Under PSR 040107, what must an officer not engage in?',
    2,
    'Any activity likely to conflict with official duties.',
    [
        'Religious activity as such.',
        'Tardiness as a separate attendance issue.',
        'Volunteering under lawful approval in itself.',
    ],
    'PSR 040107 restricts officers from engaging in any outside activity that is likely to conflict with their official duties or responsibilities.',
    ['psr_040107', 'conflict_of_duties', 'outside_activity', 'official_responsibility'],
)
add(
    'psr_eth_047',
    'What does PSR 040211 provide as the consequence of breaching the Code of Conduct?',
    1,
    'Disciplinary measures as provided in the Public Service Rules.',
    [
        'Counselling only in every case.',
        'Transfer or redeployment as the automatic response.',
        'A reprimand without any formal record.',
    ],
    'PSR 040211 provides that breach of the Code of Conduct attracts disciplinary measures under the Public Service Rules, which may extend to serious sanctions depending on the case.',
    ['psr_040211', 'code_of_conduct', 'disciplinary_measures', 'breach'],
)
add(
    'psr_eth_052',
    'What is the objective of the Oath of Secrecy?',
    2,
    'Protection of government secrets and classified information.',
    [
        'Securing loyalty to a political party.',
        'Hiding personal assets from the public.',
        'Preventing all contact with the media.',
    ],
    'The Oath of Secrecy is intended to protect government secrets and classified information handled by officers in the course of duty.',
    ['oath_of_secrecy', 'classified_information', 'government_secrets', 'official_confidentiality'],
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
    print(f'Applied round 113 rewrites to {updated} questions')


if __name__ == '__main__':
    main()
