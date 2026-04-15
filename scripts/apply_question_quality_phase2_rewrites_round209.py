from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'psr_rules.json': {
        'psr_discipline_gen_001': {
            'options': [
                'Approved procedure with complete records.',
                'Inconsistent treatment of similar cases.',
                'Bypassed review and approval controls.',
                'Convenience ahead of compliance requirements.',
            ],
            'explanation': 'Sound governance in disciplinary administration depends on following approved procedure and keeping complete records that can be reviewed later.',
        },
        'psr_discipline_gen_003': {
            'options': [
                'Early identification of control gaps with prompt escalation of material exceptions.',
                'Bypassed review and approval controls.',
                'Ignored feedback after review.',
                'Convenience ahead of compliance requirements.',
            ],
            'explanation': 'Risk management improves when control gaps are identified early and material exceptions are escalated before they damage the disciplinary process.',
        },
        'psr_discipline_gen_007': {
            'options': [
                'Eligibility confirmation before recommending advancement.',
                'Inconsistent criteria for similar officers.',
                'Bypassed review controls.',
                'Convenience ahead of compliance requirements.',
            ],
            'explanation': 'Promotion standards are preserved when eligibility is checked before advancement is recommended, rather than being left to inconsistency or convenience.',
        },
        'psr_discipline_gen_009': {
            'options': [
                'Approved steps with complete records.',
                'Inconsistent treatment of similar cases.',
                'Bypassed review and approval controls.',
                'Convenience ahead of compliance requirements.',
            ],
            'explanation': 'Proper documented procedure means following the approved steps and keeping a complete record so the matter can be reviewed at any stage.',
        },
        'psr_discipline_gen_011': {
            'options': [
                'Opportunity for the officer to respond before decision.',
                'Bypassed review and approval controls.',
                'Convenience ahead of compliance requirements.',
                'Ignored feedback after review.',
            ],
            'explanation': 'Fairness in a disciplinary inquiry requires giving the officer an opportunity to respond before a decision is taken, which reflects fair hearing under the PSR.',
        },
        'psr_discipline_gen_015': {
            'options': [
                'Approved workflow with output verification before closure.',
                'Continued non-compliance after feedback.',
                'Inconsistent treatment of similar cases.',
                'Bypassed review and approval controls.',
            ],
            'explanation': 'Operational discipline is sustained when officers follow the approved workflow and verify outputs before closing the matter.',
        },
        'psr_discipline_gen_017': {
            'options': [
                'Accurate file maintenance with status updates at each control point.',
                'Inconsistent treatment of similar cases.',
                'Bypassed review and approval controls.',
                'Convenience ahead of compliance requirements.',
            ],
            'explanation': 'Record management in disciplinary matters depends on accurate file maintenance and status updates at each control point.',
        },
        'psr_discipline_gen_019': {
            'options': [
                'Approved procedure with complete records.',
                'Bypassed review and approval controls.',
                'Convenience ahead of compliance requirements.',
                'Continued non-compliance after feedback.',
            ],
            'explanation': 'Proper governance standards in disciplinary matters require approved procedure and complete records so accountability and fairness can be demonstrated later.',
        },
        'psr_discipline_gen_023': {
            'options': [
                'Fair hearing with documented decisions.',
                'Continued non-compliance after feedback.',
                'Inconsistent treatment of similar cases.',
                'Bypassed review and approval controls.',
            ],
            'explanation': 'Due process requires fair hearing and documented decisions so the outcome remains procedurally sound and reviewable.',
        },
        'psr_discipline_gen_025': {
            'options': [
                'Eligibility confirmation before recommending advancement.',
                'Inconsistent criteria for similar officers.',
                'Bypassed review and approval controls.',
                'Convenience ahead of compliance requirements.',
            ],
            'explanation': 'Promotion standards are sustained when eligibility is confirmed before advancement is recommended, keeping the process fair and rule-based.',
        },
        'psr_ret_007': {
            'options': [
                'Prohibition on resignation until disciplinary proceedings conclude.',
                'Immediate resignation from service.',
                'Withdrawal of a submitted resignation at will.',
                'Voluntary retirement during the proceedings.',
            ],
            'explanation': 'PSR 080107 does not allow an officer to resign while disciplinary proceedings are pending until the case has been concluded.',
        },
        'psr_ret_009': {
            'options': [
                'Termination on grounds of unfitness for service or redundancy.',
                'Death in service.',
                'Promotion to a higher grade.',
                'Change of government after an election.',
            ],
            'explanation': 'PSR 080109 allows termination where the officer is found unfit for service or where redundancy applies under the rules.',
        },
        'psr_ret_048': {
            'options': [
                'Contract or advisory service where needed skills remain required.',
                'Political campaign activity.',
                'Training of new entrants only.',
                'Voluntary community work only.',
            ],
            'explanation': 'PSR 080148 allows retirees to be called back on contract or in an advisory capacity where their experience is still required.',
        },
        'psr_ret_051': {
            'options': [
                'Exemption because the examination applies to pensionable probationary appointments.',
                'Requirement triggered by a wish to convert to pensionable appointment.',
                'Requirement triggered only if the contract provides for it.',
                'Requirement applying to all officers without exception.',
            ],
            'explanation': 'A contract officer on a non-pensionable appointment does not sit the compulsory confirmation examination because that examination applies to pensionable probationary appointments.',
        },
        'psr_ret_052': {
            'options': [
                'Exemption from the examination for a confirmed JSC or SSC member.',
                'Requirement to sit only one paper.',
                'Mandatory examination in every case.',
                'Absence of any clear rule on the matter.',
            ],
            'explanation': 'The rule exempts a probationary officer on pensionable appointment who is already a confirmed member of the JSC or SSC from the confirmation examination.',
        },
        'psr_ret_053': {
            'options': [
                'Officers on pensionable appointment who are on probation.',
                'Only officers on GL 07 and above.',
                'Only officers on GL 06 and below.',
                'All officers in the Public Service.',
            ],
            'explanation': 'Rule 030501 requires officers on pensionable appointment who are on probation to pass the compulsory confirmation examinations.',
        },
        'psr_ret_057': {
            'options': [
                'Date of assumption of duty.',
                'Date of the offer of appointment.',
                'Date the officer signs the contract.',
                'Date the contract is approved.',
            ],
            'explanation': 'Rule 021201 provides that the term of engagement for a non-pensionable appointment runs from the date the officer assumes duty.',
        },
        'psr_ret_064': {
            'options': [
                'Temporary appointment to a non-pensionable post.',
                'Temporary appointment with pension attached to the post.',
                'Temporary job of any kind.',
                'Permanent appointment with probation.',
            ],
            'explanation': 'Rule 020402 defines a contract appointment as a temporary appointment to a post for which provision is not made for the payment of a pension.',
        },
        'psr_docx_214': {
            'explanation': 'A dispatch book is the registry record used to track outgoing official correspondence, so it serves as the ledger for documents leaving the office.',
        },
        'psr_docx_229': {
            'explanation': 'The mandatory retirement length of service is 35 years, which operates alongside the retirement age rule as a separate service-length trigger.',
        },
        'psr_docx_232': {
            'explanation': 'Under the PSR, dismissal means termination of appointment imposed as a disciplinary punishment for serious misconduct, not a voluntary or temporary separation.',
        },
        'psr_docx_234': {
            'explanation': 'Interdiction places the officer on half salary while the disciplinary process is pending, which distinguishes it from full-duty service and from suspension.',
        },
        'psr_docx_236': {
            'explanation': 'Suspension carries no salary entitlement under the PSR, which is why it is treated more severely than interdiction.',
        },
        'psr_docx_239': {
            'question': 'What action should be taken immediately upon the death of an officer?',
            'options': [
                'Public announcement only.',
                'Immediate report to the OHCSF.',
                'Automatic state burial.',
                'Posthumous promotion.',
            ],
            'explanation': 'When an officer dies, the death should be reported immediately to the OHCSF so the necessary official and personnel processes can begin.',
        },
        'psr_ret_037': {
            'explanation': 'PSR 080137 withholds gratuity where an officer is dismissed for misconduct, unlike normal retirement or honorable exit from service.',
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
