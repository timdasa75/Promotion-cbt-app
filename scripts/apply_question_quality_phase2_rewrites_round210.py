from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'general_current_affairs.json': {
        'IRA_141': {
            'options': [
                'Automatic acceptance of late representations.',
                'Invocation of the appropriate sanction.',
                'Automatic transfer to another MDA.',
                'Promotion after the deadline.',
            ],
            'explanation': 'If the officer fails to submit representations within the allowed time, the appropriate sanction may be invoked on the basis of the unanswered allegation.',
        },
        'IRA_155': {
            'options': [
                'Immediate report to the Accountant-General and Auditor-General.',
                'No action because the book is old.',
                'Notice to the Head of Department only.',
                'Replacement without reporting the loss.',
            ],
            'explanation': 'A missing receipt or licence book must be reported immediately to the Accountant-General and the Auditor-General because it affects accountability for official revenue instruments.',
        },
        'IRA_160': {
            'options': [
                'Placement on probation only.',
                'Exit from the Foreign Service or return to the Home Service.',
                'Denial of entry to Nigeria for the spouse.',
                'Automatic demotion of the officer.',
            ],
            'explanation': 'Where such a marriage is judged not to be in the interest of the Service, the officer must leave the Foreign Service or return to the Home Service.',
        },
        'NEKP_161': {
            'options': [
                'Exclusive application to the masculine gender.',
                'Exclusive application to the feminine gender.',
                'Equal application to both genders.',
                'Application determined by the Head of the MDA.',
            ],
            'explanation': 'The Public Service Rules apply equally to men and women even where older drafting uses gendered terms such as Officer and Staff.',
        },
        'NEKP_165': {
            'options': [
                'Invocation of the appropriate sanction.',
                'Automatic acceptance of late representations.',
                'Transfer to another MDA.',
                'Promotion after the deadline.',
            ],
            'explanation': 'If the officer does not respond within the allowed time, the appropriate sanction may be invoked on the basis of the unanswered allegation.',
        },
        'NGPD_034': {
            'options': [
                'Automatic promotion once otherwise eligible.',
                'Immediate eligibility in the same exercise after the action ends.',
                'Exclusion from consideration while under disciplinary action.',
                'Automatic deferral to the next cycle.',
            ],
            'explanation': 'Officers under disciplinary action are excluded from consideration in the promotion exercise until that disciplinary matter is resolved.',
        },
        'NGPD_045': {
            'options': [
                'Equal application to both genders.',
                'Exclusive application to the feminine gender.',
                'Exclusive application to the masculine gender.',
                'Application determined by the Head of the MDA.',
            ],
            'explanation': 'Although the Rules often use masculine expressions such as Officer and Staff, their provisions apply equally to both genders.',
        },
        'NGPD_052': {
            'options': [
                'Automatic loss of self-accounting status.',
                'Disciplinary action and surcharge.',
                'Verbal warning only.',
                'No consequence because the unit is self-accounting.',
            ],
            'explanation': 'Failure by an Accounting Officer in a self-accounting unit to comply with the Financial Regulations may lead to disciplinary action and surcharge.',
        },
        'PSIR_078': {
            'options': [
                'Recall on weekends only.',
                'Return before the authorized leave expires when official need arises.',
                'Recall only if the officer is abroad.',
                'Recall only for officers on GL 07 and above.',
            ],
            'explanation': 'An officer on leave may be recalled when official need requires return before the authorized leave period expires.',
        },
        'PSIR_096': {
            'options': [
                'Invocation of the appropriate sanction.',
                'Automatic acceptance of late representations.',
                'Promotion despite the default.',
                'Automatic transfer to another MDA.',
            ],
            'explanation': 'Failure to submit representations within the time allowed may lead to the invocation of the appropriate sanction.',
        },
        'PSIR_101': {
            'options': [
                'Automatic award of a special bonus.',
                'Performance review and recommendation for confirmation by the Permanent Secretary.',
                'Automatic confirmation after passing the examination.',
                'Immediate promotion after passing the examination.',
            ],
            'explanation': 'Passing the examination alone does not complete confirmation; performance must still be reviewed and confirmation recommended by the proper authority.',
        },
        'PSIR_103': {
            'options': [
                'Prevention of pilferage and extravagance only.',
                'Assessment of economy, efficiency, and effectiveness in government projects.',
                'Certification that accounts are faithfully kept only.',
                'Confirmation that expenditure matched appropriation only.',
            ],
            'explanation': 'A Value-for-Money audit examines whether government projects achieve economy, efficiency, and effectiveness, not merely whether figures were recorded correctly.',
        },
        'PSIR_105': {
            'options': [
                'Immediate redeployment.',
                'Protection from posting out of their MDAs merely because of union office.',
                'Automatic promotion.',
                'Offer of a new contract.',
            ],
            'explanation': 'Labour-union executives should not be posted out of their MDAs simply because they held union office, which protects the integrity of representation.',
        },
        'PSIR_125': {
            'options': [
                'Lapse when the funds are fully spent.',
                'Lapse at the end of the related financial year.',
                'Lapse at the end of the calendar year.',
                'Lapse after three months.',
            ],
            'explanation': 'Authority for recurrent expenditure conveyed by warrant lapses at the end of the financial year for which the warrant was issued.',
        },
        'ca_general_065': {
            'options': [
                'Immediate report of the defects to the Accountant-General and Auditor-General.',
                'Use of the books without correction.',
                'Note of the defects for future reference only.',
                'Direct return of the books to the printer.',
            ],
            'explanation': 'Defects in receipt or licence books must be reported immediately to the Accountant-General and the Auditor-General because those books are controlled official instruments.',
        },
        'ca_general_gen_001': {
            'options': [
                'Approved procedure with complete records.',
                'Inconsistent rule application.',
                'Bypassed review controls.',
                'Convenience ahead of compliance.',
            ],
            'explanation': 'Good governance in general affairs depends on approved procedure, complete records, and decisions that can be checked afterward.',
        },
        'ca_general_gen_003': {
            'options': [
                'Early identification of control gaps with prompt escalation of material exceptions.',
                'Bypassed review controls.',
                'Ignored feedback after review.',
                'Convenience ahead of compliance.',
            ],
            'explanation': 'Risk management starts with identifying control gaps early and escalating material exceptions before they grow into larger failures.',
        },
        'ca_general_gen_009': {
            'options': [
                'Documented procedure with complete records.',
                'Inconsistent rule application.',
                'Bypassed review controls.',
                'Convenience ahead of compliance.',
            ],
            'explanation': 'Proper documented procedure means following the required steps and keeping complete records that support later review.',
        },
        'ca_general_gen_011': {
            'options': [
                'Traceable decisions with evidence-based justification.',
                'Bypassed review controls.',
                'Convenience ahead of compliance.',
                'Ignored feedback after review.',
            ],
            'explanation': 'Public accountability is demonstrated when decisions are traceable and supported by reasons and evidence that others can review later.',
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
