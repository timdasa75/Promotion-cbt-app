from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'psr_rules.json': {
        'CIRC_LWA_013': 'Allowance rates are taken from the Extant Circular because that is the official document that sets the payable figures.',
        'circ_appointments_tenure_discipline_gen_060': 'Accountable implementation requires approved procedures to be applied consistently and every material step to be documented so the work can be checked later.',
        'circ_appointments_tenure_discipline_gen_062': 'Keeping written records and justifications makes decisions traceable and fair when appointments, tenure, and discipline are handled.',
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
    ROOT / 'data' / 'civil_service_ethics.json': {
        'eth_anti_corruption_gen_069': 'Using approved procedures consistently and keeping auditable records promotes accountability in anti-corruption work.',
        'eth_anti_corruption_gen_074': 'Anti-corruption measures should be handled within a clear timeframe so performance can be monitored and delayed cases can be identified.',
        'eth_anti_corruption_gen_078': 'Risk management in anti-corruption work depends on documented controls, fairness, and legal compliance.',
        'eth_anti_corruption_gen_079': 'A grievance process needs a clear official channel so complaints can be reviewed and resolved properly.',
        'eth_anti_corruption_gen_085': 'Applying rules within approved timelines and governance standards keeps anti-corruption work lawful and predictable.',
        'eth_anti_corruption_gen_089': 'Compliance is sustained when an accountable officer follows approved procedures and maintains auditable evidence.',
        'eth_anti_corruption_gen_090': 'Administrative ethics in anti-corruption work requires lawful procedure, documentation, and fair handling of cases.',
        'eth_code_conduct_gen_060': 'Accountable implementation means applying approved procedures consistently and documenting each material step.',
        'eth_code_conduct_gen_062': 'Traceability and fairness improve when decisions are documented and checked against the rules.',
        'eth_code_conduct_gen_078': 'Proper administrative ethics in Code of Conduct work depends on lawful procedure, accountability, and transparent records.',
        'eth_conflict_interest_gen_080': 'Documented procedure is essential because conflict-of-interest cases must be handled through the proper record trail.',
        'eth_conflict_interest_gen_082': 'Service integrity in conflict-of-interest cases depends on timely, rule-based handling and documented decisions.',
        'eth_conflict_interest_gen_088': 'Decision transparency is improved when conflict-of-interest cases are handled through approved review procedures, not informal shortcuts.',
        'eth_general_gen_093': 'Meeting notices should be sent early enough for members to prepare, so the agenda is likely to be at least the required notice period.',
        'eth_general_gen_095': 'The secretary signs the handing-over note because that office records and certifies the transfer of responsibility.',
        'eth_general_gen_097': 'A schedule officer should have neat, legible writing because official schedules must be clear and easily understood.',
        'eth_misconduct_gen_079': 'Service integrity in misconduct handling depends on applying the rules consistently and documenting each disciplinary step.',
        'eth_misconduct_gen_081': 'Decision transparency in misconduct cases requires written justification and observance of review procedures.',
        'eth_misconduct_gen_082': 'The strongest control action combines fair review with clear consequences, because discipline must be lawful and consistent.',
        'eth_misconduct_gen_092': 'Effective misconduct management depends on lawful procedure, fairness, and proper documentation.',
        'ethics_050': 'Falsehood is deliberate misrepresentation of facts and is treated as misconduct.',
        'ethics_056': 'Divulging official secrets without authorization breaches confidentiality and is serious misconduct.',
        'ethics_034': 'Accountability is correct because it means officers are answerable for their actions and decisions.',
        'ethics_035': 'Impartiality is correct because it requires civil servants to avoid favoritism in hiring and promotions.',
        'ethics_039': 'Impartiality is correct because it requires civil servants to avoid discrimination in service delivery.',
        'ethics_060': 'Integrity is correct because it discourages corruption and promotes fairness in public service.',
        'ethics_064': 'Transparency is correct because openness in government contracting helps prevent abuse and concealment.',
        'ethics_070': 'Professionalism is correct because it requires fair, respectful, and competent treatment of colleagues and subordinates.',
        'ethics_076': 'Impartiality is correct because it prohibits favoritism and demands equal treatment in public service.',
        'ethics_077': 'Accountability is correct because public funds must be managed responsibly and answerably for the public good.',
        'ethics_079': 'Transparency is correct because decisions should be taken openly and with reasons that can be justified.',
        'ethics_109': 'Integrity is correct because honesty is required when safeguarding public resources and public trust.',
        'ethics_036': 'The ICPC is correct because it investigates corruption in public procurement and related contract abuse.',
        'ethics_055': 'The ICPC is correct because it investigates cases of bribery and gratification involving public officers.',
        'ethics_057': 'Accountability and transparency are correct because they underpin the Code of Conduct for Public Officers.',
        'ethics_063': 'The Code of Conduct Bureau is correct because it investigates breaches relating to asset declarations.',
        'ethics_069': 'Forgery is correct because falsifying official records for personal advantage is a form of record fraud.',
        'ethics_078': 'Insubordination is correct because deliberate refusal to obey lawful orders is a classic disciplinary offense.',
        'ethics_080': 'Abuse of office is correct because unauthorized use of official vehicles is a misuse of public authority and resources.',
    },
}


def update_file(path: Path, rewrites: dict[str, str]) -> list[str]:
    data = json.loads(path.read_text(encoding='utf-8'))
    updated: list[str] = []
    for subcategory in data['subcategories']:
        for question in subcategory.get('questions', []):
            qid = question.get('id')
            if qid in rewrites:
                question['explanation'] = rewrites[qid]
                updated.append(qid)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    return updated


def main() -> None:
    all_updated: list[str] = []
    for path, rewrites in FILES.items():
        updated = update_file(path, rewrites)
        print(f'Updated {len(updated)} questions in {path.name}')
        for qid in updated:
            print(qid)
        all_updated.extend(updated)
    print(f'Total updated: {len(all_updated)}')


if __name__ == '__main__':
    main()
