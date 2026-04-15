from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'constitutional_foi.json': {
        'foi_access_obligations_gen_023': {
            'question': 'Which practice best supports legal compliance in FOI access work?',
            'options': [
                'It checks legal authority and documents the basis.',
                'It delays documentation until after action.',
                'It uses inconsistent criteria across similar cases.',
                'It bypasses review controls to save time.',
            ],
            'correct': 0,
            'explanation': 'FOI access decisions are sound when the legal basis is checked and the reason for access or refusal is recorded.',
        },
        'clg_general_competency_gen_042': {
            'question': 'Which practice best supports legal compliance in general competency, ethics, and reform work?',
            'options': [
                'It checks legal authority and documents the basis.',
                'It delays documentation until after action.',
                'It uses inconsistent criteria across similar cases.',
                'It bypasses review controls to save time.',
            ],
            'correct': 0,
            'explanation': 'Legal compliance is stronger when officers check authority first and then document the basis before acting.',
        },
        'clg_general_competency_gen_057': {
            'question': 'Which practice best supports risk control under general competency accountability arrangements?',
            'options': [
                'It applies controls and documents the mitigation.',
                'It prioritises convenience over control requirements.',
                'It continues non-compliance after feedback.',
                'It bases control use on personal preference.',
            ],
            'correct': 0,
            'explanation': 'Risk control is strongest when controls are actually applied and the mitigation is documented.',
        },
        'clg_general_competency_gen_067': {
            'question': 'When reviewing a sensitive constitutional issue, what should be done first?',
            'options': [
                'It delays documentation until after action.',
                'It checks legal authority and documents the basis.',
                'It uses inconsistent criteria across similar cases.',
                'It bypasses review controls to save time.',
            ],
            'correct': 1,
            'explanation': 'A sensitive constitutional issue should first be checked against the governing legal authority before further action is taken.',
        },
        'clg_general_competency_gen_077': {
            'question': 'Which routine best keeps risk control reviewable in general competency work?',
            'options': [
                'It applies controls and documents the mitigation.',
                'It prioritises convenience over control requirements.',
                'It continues non-compliance after feedback.',
                'It bases control use on personal preference.',
            ],
            'correct': 0,
            'explanation': 'Controls are reviewable when mitigation is documented and the same control standard is applied consistently.',
        },
        'clg_general_competency_gen_085': {
            'question': 'Which practice best improves accountability through stronger risk control in general competency work?',
            'options': [
                'It applies controls and documents the mitigation.',
                'It prioritises convenience over control requirements.',
                'It continues non-compliance after feedback.',
                'It bases control use on personal preference.',
            ],
            'correct': 0,
            'explanation': 'Accountability improves when officers can show the controls used, the mitigation taken, and the reason for the decision.',
        },
        'clg_lc_058': {
            'question': 'What happens when an officer on training abroad receives salary from an overseas employer during the training period?',
            'options': [
                'It forfeits Nigerian emoluments without OHCSF approval.',
                'It continues full Nigerian emoluments.',
                'It refunds the training cost.',
                'It grants automatic promotion.',
            ],
            'correct': 0,
            'explanation': 'Receiving salary from an overseas employer during the training period affects entitlement to Nigerian emoluments unless the required approval has been obtained.',
        },
        'clg_legal_compliance_gen_013': {
            'question': 'Which practice best supports risk control in legal and statutory compliance work?',
            'options': [
                'It applies controls and documents the mitigation.',
                'It prioritises convenience over control requirements.',
                'It continues non-compliance after feedback.',
                'It bases control use on personal preference.',
            ],
            'correct': 0,
            'explanation': 'Risk control is strongest when the officer applies controls, records the mitigation, and keeps the process reviewable.',
        },
        'clg_legal_compliance_gen_036': {
            'question': 'Which practice best supports legal compliance in statutory and constitutional work?',
            'options': [
                'It checks legal authority and documents the basis.',
                'It delays documentation until after action.',
                'It uses inconsistent criteria across similar cases.',
                'It bypasses review controls to save time.',
            ],
            'correct': 0,
            'explanation': 'Compliance depends on checking authority first and documenting the basis before acting.',
        },
        'clg_legal_compliance_gen_051': {
            'question': 'Which practice best supports risk control under legal-compliance accountability arrangements?',
            'options': [
                'It applies controls and documents the mitigation.',
                'It prioritises convenience over control requirements.',
                'It continues non-compliance after feedback.',
                'It bases control use on personal preference.',
            ],
            'correct': 0,
            'explanation': 'Accountability is stronger when controls are applied consistently and the mitigation is documented for review.',
        },
        'clg_legal_compliance_gen_059': {
            'question': 'What does the principle of anonymity mean for ministerial decisions in the civil service?',
            'options': [
                'Officials do not sign official documents.',
                'Officials do not identify themselves in office.',
                'Officials do not take personal responsibility for ministerial decisions.',
                'Ministers are never named in public documents.',
            ],
            'correct': 2,
            'explanation': 'Anonymity means civil servants implement and advise on ministerial decisions without taking personal political responsibility for those decisions.',
        },
        'clg_legal_compliance_gen_060': {
            'question': 'Which statement best reflects anonymity in official advice and implementation?',
            'options': [
                'Officials do not identify themselves in correspondence.',
                'Officials advise and implement while the Minister bears political responsibility.',
                'Officials do not sign official documents.',
                'Ministers are omitted from public responsibility.',
            ],
            'correct': 1,
            'explanation': 'Officials advise and implement, but the Minister bears political responsibility for the decision, which is the core of the anonymity principle.',
        },
        'clg_legal_compliance_gen_067': {
            'question': 'Which practice most strongly aligns with sound legal compliance in sensitive statutory work?',
            'options': [
                'It delays documentation until after action.',
                'It uses inconsistent criteria across similar cases.',
                'It checks legal authority and documents the basis.',
                'It bypasses review controls to save time.',
            ],
            'correct': 2,
            'explanation': 'Sensitive statutory work should begin with a legal-authority check and a clear record of the basis for the action.',
        },
        'clg_legal_compliance_gen_079': {
            'question': 'Which routine best keeps risk control reviewable in legal and statutory compliance work?',
            'options': [
                'It prioritises convenience over control requirements.',
                'It applies controls and documents the mitigation.',
                'It continues non-compliance after feedback.',
                'It bases control use on personal preference.',
            ],
            'correct': 1,
            'explanation': 'Risk control stays reviewable when controls are applied and the mitigation is documented in a way that can be checked later.',
        },
    },
    ROOT / 'data' / 'financial_regulations.json': {
        'fin_aud_018': {
            'question': 'In government audit working papers, what do accruals mean?',
            'options': [
                'Cash is received before the related service is delivered.',
                'Revenue or expense is recognized when it is incurred.',
                'Budget reserves are kept aside by the Ministry of Finance.',
                'Sanctions are imposed for delayed tax remittance.',
            ],
            'correct': 1,
            'explanation': 'Accruals recognize revenue or expense when it is earned or incurred, not when cash is received or paid.',
        },
        'fin_aud_058': {
            'question': 'Who is an Accounting Officer under the Financial Regulations?',
            'options': [
                'The Permanent Secretary or equivalent head carries full resource responsibility.',
                'The internal-audit officer alone is the Accounting Officer.',
                'The officer who signs disbursement vouchers is the Accounting Officer.',
                'Any officer who handles public money is the Accounting Officer.',
            ],
            'correct': 0,
            'explanation': 'The Accounting Officer is the permanent secretary or equivalent head responsible for human, material, and financial resources.',
        },
        'fin_audits_sanctions_gen_004': {
            'question': 'Which practice best supports vote-book control in audits, sanctions, and compliance work?',
            'options': [
                'Budget availability is checked before commitments are raised.',
                'Commitments are raised without vote-book checks.',
                'Informal instructions are treated as budget authority.',
                'Required commitment records are skipped before action.',
            ],
            'correct': 0,
            'explanation': 'Vote-book control is maintained when budget availability is checked before any commitment is raised.',
        },
        'fin_audits_sanctions_gen_022': {
            'question': 'Which routine best sustains vote-book control in audit and sanction work?',
            'options': [
                'Budget availability is checked before commitments are raised.',
                'Commitments are raised without vote-book checks.',
                'Informal instructions are treated as budget authority.',
                'Required commitment records are skipped before action.',
            ],
            'correct': 0,
            'explanation': 'Vote-book control stays reliable when commitments are raised only after budget availability has been confirmed.',
        },
    },
    ROOT / 'data' / 'civil_service_ethics.json': {
        'eth_general_gen_037': {
            'question': 'Which governance practice most strengthens ethical standards across a public institution?',
            'options': [
                'Reporting channels are clear, reviews are periodic, and follow-up is documented.',
                'Ethics controls are unsupervised.',
                'Minor breaches are unrecorded.',
                'Awareness notices are issued without oversight.',
            ],
            'correct': 0,
            'explanation': 'Ethical standards are strongest when reporting channels are clear, reviews are periodic, and breaches receive documented follow-up.',
        },
        'ethics_089': {
            'question': 'Which duty belongs to the Accountant-General regarding accounting systems and controls?',
            'options': [
                'The Accountant-General maintains adequate accounting systems and controls.',
                'The Accountant-General formulates national economic policy.',
                'The Accountant-General personally audits every account.',
                'The Accountant-General personally executes all payments.',
            ],
            'correct': 0,
            'explanation': 'The Accountant-General must ensure that adequate accounting systems and controls operate across government institutions.',
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
