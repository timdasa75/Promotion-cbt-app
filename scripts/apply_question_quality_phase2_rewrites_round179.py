from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'psr_rules.json': {
        'CIRC_LWA_013': 'Allowance rates are taken from the Extant Circular because that is the official document that sets the payable figures.',
        'circ_appointments_tenure_discipline_gen_060': 'Accountable implementation requires approved procedures to be applied consistently and every material step to be documented so the work can be checked later.',
        'circ_appointments_tenure_discipline_gen_062': 'Keeping written records and justifications makes appointments, tenure, and discipline decisions traceable and fair.',
        'circ_appointments_tenure_discipline_gen_078': 'Accounting Officers must ensure pension structures exist in their ministries so retirement administration can be processed properly.',
        'circ_appointments_tenure_discipline_gen_080': 'An RSA is a contributory pension account used to accumulate retirement savings for an employee.',
        'circ_appointments_tenure_discipline_gen_082': 'Directors head departments below the Permanent Secretary and are directly accountable to that office.',
        'circ_leave_welfare_allowances_gen_020': 'Entitlement and supporting records should be confirmed before payment so allowances are not paid without authority.',
        'circ_leave_welfare_allowances_gen_061': 'Accountable implementation requires approved procedures to be applied consistently and every material step to be documented so the work can be checked later.',
        'circ_leave_welfare_allowances_gen_063': 'Traceability and fairness improve when allowance decisions are documented and checked against the rules.',
        'circ_personnel_performance_gen_061': 'Accountable implementation requires approved procedures to be applied consistently and every material step to be documented so the work can be checked later.',
        'circ_personnel_performance_gen_063': 'Traceability and fairness improve when personnel and performance decisions are documented and checked against the rules.',
        'circ_personnel_performance_gen_065': 'Lawful administrative standards depend on applying the approved rules and keeping a clear documentary trail even when the matter is urgent.',
        'circ_personnel_performance_gen_082': 'The Accountant-General is responsible for establishing and supervising Federal payment offices in each state capital under the Financial Regulations.',
        'psr_admin_058': 'Only officers with access to classified information are required to swear the Oath of Secrecy.',
        'psr_allow_060': 'Financial Regulation 1401 deals with personal advances, so that is the correct subject.',
        'psr_disc_067': 'The PSR expressly prohibits fines as a disciplinary penalty, even when misconduct is proved.',
        'psr_docx_009': 'Classified correspondence is graded Restricted, Confidential, Secret, or Top Secret to control access.',
        'psr_docx_054': 'Seniority is determined by the officer\'s entry date or assumption of duty, not by personal preference or rank alone.',
        'psr_docx_057': 'Gen 60 is the standard staff record form used to capture employee service details.',
        'psr_docx_058': 'Copies of Gen 60 are sent to the National Record Centre and the listed oversight offices so the records remain centralized.',
        'psr_docx_059': 'The form must be sent within one month of appointment so the record is created promptly.',
        'psr_docx_072': 'A confirmed officer advanced to a training grade is treated as if seconded thereto because the posting is temporary in nature.',
        'psr_docx_155': 'Section 11 of the Code of Conduct addresses receiving benefits, so that is the relevant provision.',
        'psr_docx_181': 'Dismissal is the ultimate penalty for serious misconduct and may lead to forfeiture of benefits under the PSR.',
        'psr_docx_203': 'Record-keeping is emphasized because it supports accountability and continuity across postings and administrations.',
        'psr_docx_214': 'A dispatch book is the registry ledger for outgoing official correspondence.',
        'psr_docx_216': 'Accountability in planning requires clear roles, performance reporting, and consequences for results.',
        'psr_docx_229': 'The mandatory length of service for retirement is 35 years.',
        'psr_docx_232': 'Dismissal is termination of appointment as a disciplinary measure for serious misconduct.',
        'psr_docx_234': 'An officer on interdiction earns half salary under the PSR.',
        'psr_docx_236': 'An officer on suspension earns no salary under the PSR.',
        'psr_docx_239': 'When an officer dies, the death should be reported immediately to the OHCSF.',
        'psr_docx_241': 'Those documents are forwarded to process benefits due to the legal beneficiaries of the deceased officer.',
        'psr_ret_037': 'PSR 080137 withholds gratuity from an officer dismissed for misconduct.',
        'psr_training_gen_027': 'Accountable implementation requires approved procedures to be applied consistently and every material step to be documented so the work can be checked later.',
    },
    ROOT / 'data' / 'general_current_affairs.json': {
        'PSIR_078': 'An officer may be recalled when official need requires return before the authorized leave expires.',
        'PSIR_081': 'Promotion arrears should be paid within the year in which the promotion is effected.',
        'PSIR_096': 'Failure to submit representations within the time allowed may lead to the invocation of the appropriate sanction.',
        'PSIR_101': 'Passing the examination does not by itself complete confirmation; the Permanent Secretary must review performance and recommend confirmation.',
        'PSIR_103': 'A Value-for-Money audit checks whether government projects achieve economy, efficiency, and effectiveness.',
        'PSIR_105': 'Union executives should not be posted out of their MDAs merely because they held union office.',
        'PSIR_125': 'Authority for recurrent expenditure conveyed by warrant lapses at the end of the financial year for which the warrant was issued.',
        'NGPD_007': 'The employment of unpaid staff in the Federal Public Service is prohibited.',
        'NGPD_032': 'Decisions on deferment, withholding of increment, or stoppage of salary must be communicated within two weeks.',
        'NGPD_037': 'Dismissal is the ultimate penalty for serious misconduct.',
        'NGPD_059': 'The Auditor-General for the Federation is the constitutional officer responsible for auditing and reporting on the public accounts of the federation.',
        'IRA_123': 'Qatar hosted the FIFA World Cup in 2022.',
        'IRA_129': 'The application notice is placed in three national newspapers and the Commission\'s website, so three newspapers is the correct count.',
        'IRA_138': 'The National Council on Establishment was established in 1957.',
        'IRA_165': 'Accounting Officers must make provision for and remit VAT and WHT, so they are the accountable officers for that compliance duty.',
        'NEKP_155': 'Rotimi Amaechi is the Minister identified in the source for transportation.',
        'NEKP_159': 'Charles Babbage is credited as the inventor of the computer in the classical exam context.',
        'NEKP_162': 'Google was founded on 4 September 1998.',
        'NEKP_172': 'The decision must be communicated to the officer concerned within two weeks.',
        'ca_general_015': 'Maiduguri is the capital of Borno State, so that city is the correct response.',
        'ca_general_020': 'Lokoja is the capital of Kogi State, so it is the correct answer.',
        'ca_general_030': 'Damaturu is the capital of Yobe State, which makes it the right answer.',
        'ca_general_042': 'Abakaliki is the capital of Ebonyi State, so it is the correct city to choose.',
        'ca_general_050': 'Minna is the capital of Niger State, so it is the correct state capital.',
        'ca_general_065': 'Defects in receipt or licence books must be reported immediately to the Accountant-General and the Auditor-General.',
        'ca_general_001': 'Good governance is shown by applying approved procedures consistently and documenting decisions so they can be reviewed later.',
        'ca_general_003': 'Risk management in general affairs depends on documented controls and careful checking before action is taken.',
        'ca_general_009': 'Proper documented procedure means the decision trail is written down clearly and can be audited later.',
        'ca_general_011': 'Public accountability is demonstrated when decisions are traceable, documented, and open to review.',
        'ca_general_013': 'Risk control is shown by following approved rules and keeping clear records of each step.',
        'ca_general_019': 'Proper governance standards are reflected by clear documentation, lawful procedure, and accountable decision-making.',
        'ca_general_023': 'Officials should keep up with national governance updates so they apply current rules and policy directions correctly.',
        'ca_general_025': 'Public communication literacy is sustained by clear, accurate, and professionally written official communication.',
    },
}


def update_file(path: Path, rewrites: dict[str, str]) -> list[str]:
    data = json.loads(path.read_text(encoding='utf-8'))
    updated: list[str] = []

    def walk(node):
        if isinstance(node, dict):
            qid = node.get('id')
            if qid in rewrites:
                node['explanation'] = rewrites[qid]
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
