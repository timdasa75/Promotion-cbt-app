from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

FILE_UPDATES = {
    ROOT / 'data' / 'psr_rules.json': {
        'psr_leave_055': {
            'question': "What consequence follows if a Foreign Service officer's marriage to a foreigner is judged not to be in the interest of the Service?",
            'options': [
                'Exit from the Foreign Service or return to the Home Service.',
                'Suspension without pay.',
                'Automatic demotion to a lower grade.',
                'Payment of a disciplinary fine.'
            ],
            'explanation': "If a Foreign Service officer's marriage to a foreigner is judged not to be in the interest of the Service, the officer must leave the Foreign Service or return to the Home Service.",
            'keywords': ['foreign_service', 'marriage_rule', 'service_interest', 'home_service'],
            'tags': ['psr', 'psr_leave', 'foreign_service', 'marriage_rule', 'service_interest', 'home_service'],
        },
        'psr_admin_055': {
            'question': 'What is the purpose of classifying a document as confidential?',
            'options': [
                'To protect information that could be harmful if disclosed.',
                'To make it a permanent document.',
                'To prevent every other ministry from ever seeing it.',
                'To make it difficult to access for no reason.'
            ],
            'correct': 0,
            'explanation': 'A confidential classification is meant to protect sensitive information from unauthorized disclosure, especially where disclosure could harm official work or public interest.',
            'keywords': ['confidential_document', 'information_protection', 'official_secrecy', 'unauthorized_disclosure'],
            'tags': ['psr', 'psr_general_admin', 'confidential_document', 'information_protection', 'official_secrecy', 'unauthorized_disclosure'],
        },
        'psr_admin_057': {
            'question': 'What handling rule follows when a document is classified as confidential?',
            'options': [
                'It may be circulated publicly for general awareness.',
                'It should be stored without any access controls.',
                'It must only be disclosed to authorized officers with a need to know.',
                'It should automatically become a permanent archive record.'
            ],
            'correct': 2,
            'explanation': 'Once a document is classified as confidential, access and disclosure must be limited to authorized officers who need the information for official duty.',
            'keywords': ['confidential_handling', 'authorized_access', 'need_to_know', 'document_control'],
            'tags': ['psr', 'psr_general_admin', 'confidential_handling', 'authorized_access', 'need_to_know', 'document_control'],
        },
        'circ_personnel_performance_gen_069': {
            'question': 'What may happen if a clerical grade officer fails the compulsory confirmation examination during probation?',
            'options': [
                'The officer will be retired immediately.',
                'The appointment may be terminated at the end of the probationary period.',
                'The officer will be confirmed automatically.',
                'The officer will be transferred to another cadre without assessment.'
            ],
            'correct': 1,
            'explanation': 'For clerical grade officers, failure to pass the compulsory confirmation examination during probation may lead to termination of the appointment at the end of the probationary period.',
            'keywords': ['confirmation_exam', 'probation', 'clerical_grade', 'appointment_termination'],
            'tags': ['psr', 'circ_personnel_performance', 'confirmation_exam', 'probation', 'clerical_grade', 'appointment_termination'],
        },
        'circ_personnel_performance_gen_071': {
            'question': 'What must a clerical grade officer secure by passing the compulsory confirmation examination?',
            'options': [
                'Confirmation of appointment.',
                'Annual leave entitlement.',
                'Posting to headquarters.',
                'Access to duty tour allowance.'
            ],
            'correct': 0,
            'explanation': 'Passing the compulsory confirmation examination is part of the probation requirement that leads to confirmation of appointment.',
            'keywords': ['confirmation_exam', 'confirmation_of_appointment', 'probation_requirement', 'clerical_grade'],
            'tags': ['psr', 'circ_personnel_performance', 'confirmation_exam', 'confirmation_of_appointment', 'probation_requirement', 'clerical_grade'],
        },
        'circ_personnel_performance_gen_084': {
            'options': [
                'Immediately investigate and report the circumstances.',
                'Disallow the disbursement immediately.',
                'Report to the Minister of Finance.',
                'Transfer the amount to a suspense account.'
            ],
            'explanation': 'Where a serious irregularity in a voucher is established or suspected, the officer controlling the vote must immediately investigate and report the circumstances.',
            'keywords': ['voucher_irregularity', 'vote_control', 'immediate_investigation', 'official_reporting'],
            'tags': ['psr', 'circ_personnel_performance', 'voucher_irregularity', 'vote_control', 'immediate_investigation', 'official_reporting'],
        },
        'psr_eth_057': {
            'question': 'What is the aim of a circular?',
            'options': [
                'To communicate an official announcement, directive, or information to staff.',
                'To provide a confidential report.',
                'To document a personal conversation.',
                'To issue a public press interview.'
            ],
            'correct': 0,
            'explanation': 'A circular is used to communicate an official announcement, directive, or information to staff in a ministry or throughout the service.',
            'keywords': ['circular', 'official_communication', 'directive', 'staff_information'],
            'tags': ['psr', 'psr_ethics', 'circular', 'official_communication', 'directive', 'staff_information'],
        },
        'psr_ret_066': {
            'question': 'What does Rule 021004 provide for officers who exit the Service?',
            'options': [
                'A timetable for processing pension gratuities.',
                'A formula for monthly pension deductions.',
                'Access to National Housing Fund contributions.',
                'Authority for ministries to retain unclaimed housing contributions.'
            ],
            'correct': 2,
            'explanation': 'Rule 021004 enables officers who exit the Service to access their National Housing Fund contributions after retirement or other exit from service.',
            'keywords': ['rule_021004', 'national_housing_fund', 'service_exit', 'nhf_access'],
            'tags': ['psr', 'psr_retirement', 'rule_021004', 'national_housing_fund', 'service_exit', 'nhf_access'],
        },
    },
    ROOT / 'data' / 'general_current_affairs.json': {
        'IRA_160': {
            'question': 'What alternative service route remains available if the marriage is not in the interest of the Service?',
            'options': [
                'The Home Service.',
                'The Foreign Service.',
                'The Audit Service.',
                'The Judicial Service.'
            ],
            'correct': 0,
            'explanation': 'If the marriage is judged not to be in the interest of the Service, the officer may be required to leave the Foreign Service and return to the Home Service.',
            'keywords': ['foreign_service', 'service_branch', 'marriage_rule', 'home_service'],
            'tags': ['general_current_affairs', 'ca_international_affairs', 'foreign_service', 'service_branch', 'marriage_rule', 'home_service'],
        },
    },
    ROOT / 'data' / 'financial_regulations.json': {
        'fin_aud_068': {
            'options': [
                'To formulate them without external input.',
                'To approve and guarantee compliance with accounting codes, internal audit guides, and stock verification manuals.',
                'To distribute them to the public.',
                'To approve them without monitoring compliance.'
            ],
            'explanation': 'The Accountant-General approves these codes and manuals and ensures compliance with them across ministries, extra-ministerial offices, and other arms of government.',
            'keywords': ['accountant_general', 'accounting_codes', 'internal_audit_guides', 'compliance_manuals'],
            'tags': ['financial_regulations', 'fin_audits_sanctions', 'accountant_general', 'accounting_codes', 'internal_audit_guides', 'compliance_manuals'],
        },
        'fin_aud_072': {
            'options': [
                'Ignore it.',
                'Call the attention of the appropriate officer in writing.',
                'Take disciplinary action personally against the officer.',
                'Report it immediately to the Accountant-General.'
            ],
            'explanation': 'When an Internal Auditor discovers an apparent abuse of the Financial Regulations, the auditor must call the attention of the appropriate officer in writing so corrective action can begin formally.',
            'keywords': ['internal_auditor', 'financial_regulations_abuse', 'written_notice', 'corrective_action'],
            'tags': ['financial_regulations', 'fin_audits_sanctions', 'internal_auditor', 'financial_regulations_abuse', 'written_notice', 'corrective_action'],
        },
    },
    ROOT / 'data' / 'civil_service_ethics.json': {
        'csh_principle_053': {
            'question': 'Who conducts and supervises the examinations prescribed for police and paramilitary services?',
            'options': [
                'The Permanent Secretary of the supervising ministry.',
                'The Federal Civil Service Commission.',
                'The respective Service Commissions.',
                'The Office of the Head of the Civil Service of the Federation.'
            ],
            'correct': 2,
            'explanation': 'Examinations for police and paramilitary services are prescribed and supervised by their respective Service Commissions, not by the Federal Civil Service Commission or a ministry permanent secretary.',
            'keywords': ['service_commissions', 'police_examinations', 'paramilitary_examinations', 'exam_supervision'],
            'tags': ['civil_service_admin', 'csh_principles_ethics', 'service_commissions', 'police_examinations', 'paramilitary_examinations', 'exam_supervision'],
        },
        'csh_principle_054': {
            'question': 'What is the principal accountability of the Executive arm of Government?',
            'options': [
                'Law making and confirmation of appointments.',
                'Adjudication of disputes.',
                'Monitoring revenue accruals only.',
                'Day-to-day management of government, including policy formulation and execution.'
            ],
            'correct': 3,
            'explanation': 'The Executive is accountable for the day-to-day management of government and for formulating, executing, and monitoring policies, programmes, and projects.',
            'keywords': ['executive_arm', 'government_management', 'policy_execution', 'accountability'],
            'tags': ['civil_service_admin', 'csh_principles_ethics', 'executive_arm', 'government_management', 'policy_execution', 'accountability'],
        },
        'csh_principle_055': {
            'question': 'Which branch of government is responsible for day-to-day management of government?',
            'options': [
                'The Executive arm.',
                'The Legislature.',
                'The Judiciary.',
                'Independent media organizations.'
            ],
            'correct': 0,
            'explanation': 'The Executive arm handles day-to-day policy implementation and public administration, while the Legislature makes laws and the Judiciary interprets them.',
            'keywords': ['executive_arm', 'policy_implementation', 'public_administration', 'government_branches'],
            'tags': ['civil_service_admin', 'csh_principles_ethics', 'executive_arm', 'policy_implementation', 'public_administration', 'government_branches'],
        },
        'csh_duty_061': {
            "question": "What is the Accountant-General's inspection duty intended to achieve?",
            'options': [
                'To guarantee compliance with rules, regulations, and policy decisions.',
                'To manage all federal government investments.',
                'To approve all government contracts.',
                'To issue warnings to defaulting officers.'
            ],
            'correct': 0,
            'explanation': 'Routine and in-depth inspection of books of accounts is meant to guarantee compliance with rules, regulations, and policy decisions across public offices.',
            'keywords': ['accountant_general', 'inspection_of_books', 'compliance_monitoring', 'policy_decisions'],
            'tags': ['civil_service_admin', 'csh_duties_responsibilities', 'accountant_general', 'inspection_of_books', 'compliance_monitoring', 'policy_decisions'],
        },
        'csh_duty_063': {
            "question": "What does the Board of Survey report show about its members' responsibility?",
            'options': [
                'Only the Chairman is accountable for the report accuracy.',
                'They are not accountable for the contents of the report.',
                'They are jointly accountable for the accuracy of the report.',
                'They are responsible only for the physical counting.'
            ],
            'correct': 2,
            'explanation': 'Members of the Board of Survey are jointly accountable for the accuracy of the report because all of them sign it and stand behind its contents.',
            'keywords': ['board_of_survey', 'joint_accountability', 'report_accuracy', 'official_signatures'],
            'tags': ['civil_service_admin', 'csh_duties_responsibilities', 'board_of_survey', 'joint_accountability', 'report_accuracy', 'official_signatures'],
        },
        'csh_pt_057': {
            'question': 'Which body prescribes the examinations for police and paramilitary services?',
            'options': [
                'The respective Service Commissions.',
                'The Federal Civil Service Commission.',
                'The Permanent Secretary of the supervising ministry.',
                'The Office of the Head of the Civil Service of the Federation.'
            ],
            'correct': 0,
            'explanation': 'The respective Service Commissions prescribe these examinations, which is why responsibility does not rest with a ministry permanent secretary or the Federal Civil Service Commission.',
            'keywords': ['service_commissions', 'exam_control', 'police_services', 'paramilitary_services'],
            'tags': ['civil_service_admin', 'csh_performance_training', 'service_commissions', 'exam_control', 'police_services', 'paramilitary_services'],
        },
        'csh_it_051': {
            "question": "What is the objective of the Accountant-General's routine and in-depth inspection of books of accounts?",
            'options': [
                'To guarantee compliance with rules, regulations, and policy decisions.',
                'To replace procurement units.',
                'To determine judicial penalties for accounting offences.',
                'To approve all contract awards personally.'
            ],
            'correct': 0,
            'explanation': 'The inspection is meant to guarantee compliance with rules, regulations, and policy decisions across public offices.',
            'keywords': ['accountant_general', 'inspection_of_books', 'compliance_monitoring', 'policy_decisions'],
            'tags': ['civil_service_admin', 'csh_innovation_technology', 'accountant_general', 'inspection_of_books', 'compliance_monitoring', 'policy_decisions'],
        },
        'csh_it_053': {
            'question': 'Why must the Head of Finance and Accounts ensure staff comply with the Financial Regulations and the Accounting Code?',
            'options': [
                'To maintain financial discipline and proper accounting practice in the ministry.',
                'To replace the role of the external auditor.',
                'To take over contract approval from the Tenders Board.',
                'To authorize all cash withdrawals personally.'
            ],
            'correct': 0,
            'explanation': 'Ensuring staff comply with the Financial Regulations and the Accounting Code helps the ministry maintain financial discipline, proper accounting practice, and reliable records.',
            'keywords': ['head_of_finance_and_accounts', 'financial_discipline', 'accounting_practice', 'ministry_records'],
            'tags': ['civil_service_admin', 'csh_innovation_technology', 'head_of_finance_and_accounts', 'financial_discipline', 'accounting_practice', 'ministry_records'],
        },
        'csh_it_058': {
            'question': 'What is the purpose of accounting codes, internal audit guides, and stock verification manuals?',
            'options': [
                'To standardize financial control practice and secure compliance across ministries.',
                'To advertise government procedures to the public.',
                'To remove the need for internal audit units.',
                'To allow each ministry to create conflicting accounting rules.'
            ],
            'correct': 0,
            'explanation': 'These codes and manuals are issued so accounting and control practice stays standardized and compliant across ministries and other government offices.',
            'keywords': ['accountant_general', 'financial_control', 'standardization', 'compliance_across_ministries'],
            'tags': ['civil_service_admin', 'csh_innovation_technology', 'accountant_general', 'financial_control', 'standardization', 'compliance_across_ministries'],
        },
        'csh_it_062': {
            'question': 'Why must an Internal Auditor raise an apparent abuse of the Financial Regulations in writing?',
            'options': [
                'To create a formal record for corrective action and accountability.',
                'To bypass the appropriate officer and punish staff directly.',
                'To transfer the case immediately to the Accountant-General without notice.',
                'To keep the matter informal until the annual audit.'
            ],
            'correct': 0,
            'explanation': 'Raising the matter in writing creates a formal record that supports corrective action, follow-up, and accountability.',
            'keywords': ['internal_auditor', 'written_record', 'corrective_action', 'accountability'],
            'tags': ['civil_service_admin', 'csh_innovation_technology', 'internal_auditor', 'written_record', 'corrective_action', 'accountability'],
        },
        'csh_it_070': {
            "question": "What does the Board of Survey report require from its members?",
            'options': [
                'Collective endorsement of the report accuracy.',
                'Signature by the Chairman only.',
                'No signature if the count is complete.',
                'Approval from the storekeeper alone.'
            ],
            'correct': 0,
            'explanation': 'The report requires all members to sign it, which shows their collective responsibility for its accuracy.',
            'keywords': ['board_of_survey', 'collective_endorsement', 'report_accuracy', 'signatures'],
            'tags': ['civil_service_admin', 'csh_innovation_technology', 'board_of_survey', 'collective_endorsement', 'report_accuracy', 'signatures'],
        },
        'eth_general_gen_077': {
            'question': 'What should letters always have?',
            'options': [
                'A heading briefly descriptive of the subject matter, a reference number, and a date.',
                'A personal salutation.',
                'A humorous opening.',
                'A list of all previous correspondence.'
            ],
            'correct': 0,
            'explanation': 'Letters should always have a heading briefly descriptive of the subject matter and must bear a reference number and date.',
            'keywords': ['official_letter', 'heading', 'reference_number', 'date'],
            'tags': ['civil_service_admin', 'eth_general', 'official_letter', 'heading', 'reference_number', 'date'],
        },
        'eth_general_gen_080': {
            'question': 'Why should letters always have a heading, reference number, and date?',
            'options': [
                'To identify the subject and provide proper record control.',
                'To make the letter longer and more formal-sounding.',
                'To replace the need for filing and cross-reference.',
                'To allow officers to omit the body of the letter.'
            ],
            'correct': 0,
            'explanation': 'An official letter should carry a heading, reference number, and date so its subject can be identified easily and the record can be controlled properly.',
            'keywords': ['official_letter', 'record_control', 'reference_number', 'subject_heading'],
            'tags': ['civil_service_admin', 'eth_general', 'official_letter', 'record_control', 'reference_number', 'subject_heading'],
        },
    },
}


def iter_questions(node: dict):
    if isinstance(node, dict):
        if isinstance(node.get('questions'), list):
            for question in node['questions']:
                if isinstance(question, dict):
                    yield question
        for sub in node.get('subcategories', []):
            yield from iter_questions(sub)


def main() -> None:
    updated = 0
    for path, patch_map in FILE_UPDATES.items():
        data = json.loads(path.read_text(encoding='utf-8'))
        seen: set[str] = set()
        for question in iter_questions(data):
            qid = str(question.get('id') or '').strip()
            if qid not in patch_map:
                continue
            for key, value in patch_map[qid].items():
                question[key] = value
            seen.add(qid)
            updated += 1
        missing = sorted(set(patch_map) - seen)
        if missing:
            raise SystemExit(f'{path.name}: missing ids {missing}')
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Updated {updated} duplicate and text-noise follow-up items')


if __name__ == '__main__':
    main()






