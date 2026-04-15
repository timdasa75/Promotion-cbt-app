from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'data' / 'general_current_affairs.json'

UPDATES = {
    'NEKP_151': {
        'question': 'Who was named as Head of the Civil Service of the Federation in the 2021 PSR Preamble?',
        'keywords': ['head of the civil service of the federation', 'folasade yemi-esan', '2021 psr preamble', 'public service rules'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'head_of_civil_service_of_the_federation', 'folasade_yemi_esan', 'public_service_rules'],
        'topic': 'Public Service Rules',
    },
    'NEKP_166': {
        'question': 'What additional allocation may be granted when an officer on duty visit abroad incurs delegation or entertainment expenses?',
        'options': [
            'A fixed 100-dollar bonus.',
            'Only reimbursement of actual expenses.',
            'No additional allowance.',
            'A special allocation approved for that purpose.',
        ],
        'keywords': ['estacode allowance', 'duty visit abroad', 'delegation expense', 'special allocation'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'estacode_allowance', 'duty_visit_abroad', 'special_allocation'],
        'topic': 'Public Service Rules',
    },
    'NEKP_171': {
        'question': "When an officer's increment has been withheld, what may the FCSC grant later to mitigate the effect?",
        'keywords': ['withheld increment', 'special increments', 'fcsc', 'mitigation'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'withheld_increment', 'special_increments', 'fcsc'],
        'topic': 'Public Service Rules',
    },
    'ca_national_events_gen_057': {
        'keywords': ['recruitment', 'public service rules', 'filling vacancies', 'new entrants'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'recruitment', 'public_service_rules', 'filling_vacancies'],
        'topic': 'Public Service Rules',
    },
    'ca_national_events_gen_058': {
        'question': 'What are financial authorities under the Financial Regulations?',
        'keywords': ['financial authorities', 'financial regulations', 'government transactions', 'public officers'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'financial_authorities', 'financial_regulations', 'government_transactions'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_059': {
        'question': 'Which of the following is not one of the government financial transactions covered by financial authorities?',
        'keywords': ['financial authorities', 'government financial transactions', 'financial regulations', 'excluded transaction'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'financial_authorities', 'government_financial_transactions', 'financial_regulations'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_060': {
        'keywords': ['amounts collectable', 'heads of department', 'divisions', 'revenue notification'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'amounts_collectable', 'heads_of_department', 'revenue_notification'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_061': {
        'question': 'Who approves withdrawal of money from the Development Fund through a Provisional Development Fund General Warrant?',
        'options': [
            'The Accountant-General.',
            'The National Assembly.',
            'The Minister of Finance.',
            'The President.',
        ],
        'keywords': ['development fund', 'provisional development fund general warrant', 'withdrawal approval', 'president'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'development_fund', 'general_warrant', 'president'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_062': {
        'question': 'Who is personally responsible for the due performance of the financial duties of a ministry and for inaccuracies in the accounts rendered under that authority?',
        'options': [
            'Only the Accountant-General.',
            'Only the Auditor-General.',
            'Only the Head of Finance and Accounts.',
            'The Accounting Officer.',
        ],
        'keywords': ['accounting officer', 'financial duties of ministry', 'inaccuracies in accounts', 'personal responsibility'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'accounting_officer', 'financial_duties', 'personal_responsibility'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_063': {
        'question': 'What is the consequence for an officer who makes, allows, or directs a disbursement without proper authority?',
        'options': [
            'The officer will receive a warning.',
            'The expenditure will be absorbed by the Contingencies Fund.',
            'The officer will be personally liable for the amount involved.',
            'The officer''s subordinates will be held accountable.',
        ],
        'keywords': ['unauthorized disbursement', 'personal liability', 'public funds', 'financial regulations'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'unauthorized_disbursement', 'personal_liability', 'financial_regulations'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_064': {
        'keywords': ['unauthorized expenditure', 'officers controlling votes', 'sole liability', 'vote control'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'unauthorized_expenditure', 'officers_controlling_votes', 'vote_control'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_065': {
        'keywords': ['claims from private parties', 'neglect of duty', 'resulting prejudice', 'officer liability'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'claims_from_private_parties', 'neglect_of_duty', 'officer_liability'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_066': {
        'question': 'What happens when an officer controlling a vote incurs expenditure without proper authority?',
        'options': [
            'The expenditure will be absorbed by the ministry.',
            'The Accountant-General will rectify the error.',
            'The Minister of Finance will issue a new warrant.',
            'The officer will be held pecuniarily liable for the action.',
        ],
        'keywords': ['officer controlling a vote', 'expenditure without authority', 'pecuniary liability', 'financial regulations'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'officer_controlling_vote', 'pecuniary_liability', 'financial_regulations'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_067': {
        'question': 'Why were accounting procedures standardized across federal ministries and self-accounting units?',
        'options': [
            'Because accounting staff move frequently between offices.',
            'To increase revenue collection.',
            'To simplify budget preparation.',
            'To reduce the need for audits.',
        ],
        'keywords': ['standardized accounting procedures', 'federal ministries', 'self-accounting units', 'staff movement'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'standardized_accounting_procedures', 'federal_ministries', 'self_accounting_units'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_068': {
        'question': 'What does the Finance (Control and Management) Act Cap 144, Laws of the Federation 1990 regulate?',
        'keywords': ['finance control and management act', 'government financial matters', 'cap 144', 'laws of the federation'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'finance_control_and_management_act', 'government_financial_matters', 'cap_144'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_069': {
        'question': 'What is the role of the Head of Finance and Accounts in relation to compliance with the Financial Regulations?',
        'options': [
            'To issue new Financial Regulations.',
            'To approve all variations in accounting procedures.',
            'To audit all financial transactions.',
            'To secure compliance by all staff under the officer''s control and supervision.',
        ],
        'keywords': ['head of finance and accounts', 'compliance', 'financial regulations', 'staff supervision'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'head_of_finance_and_accounts', 'financial_regulations_compliance', 'staff_supervision'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_070': {
        'keywords': ['disbursement vouchers', 'original copies', 'certifying officer', 'payee signature'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'disbursement_vouchers', 'original_copies', 'payee_signature'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_072': {
        'question': 'What should be presented to the Sub-Accounting Officer for inspection when payments are made to legal representatives?',
        'keywords': ['sub-accounting officer', 'legal representatives', 'powers of attorney', 'letters of administration'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'sub_accounting_officer', 'legal_representatives', 'powers_of_attorney'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_073': {
        'keywords': ['cheque order form', 'minimum rank', 'accountant ii', 'higher executive officer accounts'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'cheque_order_form', 'accountant_ii', 'higher_executive_officer_accounts'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_074': {
        'question': 'Where should all Capital Accounts be maintained?',
        'options': [
            'At the discretion of the Accounting Officer.',
            'At the Central Bank of Nigeria or any other bank designated by the government.',
            'In a foreign bank for international transactions.',
            'In any commercial bank.',
        ],
        'keywords': ['capital accounts', 'central bank of nigeria', 'designated banks', 'government accounts'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'capital_accounts', 'central_bank_of_nigeria', 'designated_banks'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_075': {
        'question': 'Who is responsible for furnishing certified specimen signatures of officers approved to sign cheques drawn on official accounts?',
        'options': [
            'All Accounting Officers.',
            'The bank manager.',
            'The Head of Finance and Accounts.',
            'The Accountant-General.',
        ],
        'keywords': ['specimen signatures', 'cheque signatories', 'official accounts', 'accounting officers'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'specimen_signatures', 'cheque_signatories', 'accounting_officers'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_076': {
        'keywords': ['bank signatory changes', 'authority to notify bank', 'non-delegation', 'official accounts'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'bank_signatory_changes', 'non_delegation', 'official_accounts'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_077': {
        'keywords': ['government bank account', 'overdrawn account', 'bank charges', 'accountable officer'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'government_bank_account', 'overdrawn_account', 'bank_charges'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_078': {
        'keywords': ['public money', 'private bank account', 'fraudulent intention', 'financial misconduct'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'public_money', 'private_bank_account', 'fraudulent_intention'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_079': {
        'question': 'How often must officers permitted to keep bank accounts compare entries in bank statements with their cash books?',
        'keywords': ['bank statements', 'cash books', 'weekly comparison', 'month-end comparison'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'bank_statements', 'cash_books', 'reconciliation_frequency'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_080': {
        'question': 'Who should sign every request for official cheque books?',
        'options': [
            'The Accountant-General.',
            'The Accounting Officer.',
            'One of the empowered signatories to the account, countersigned by the Head of Accounts.',
            'The Minister of Finance.',
        ],
        'keywords': ['official cheque books', 'empowered signatory', 'head of accounts', 'cheque book request'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'official_cheque_books', 'empowered_signatory', 'head_of_accounts'],
        'topic': 'Financial Regulations',
    },
    'ca_national_events_gen_081': {
        'keywords': ['cheques received', 'sub-accounting officer', 'endorsement prohibition', 'third party'],
        'tags': ['current_affairs', 'national_events', 'ca_national_events', 'cheques_received', 'endorsement_prohibition', 'third_party'],
        'topic': 'Financial Regulations',
    },
}


def find_items(data: dict) -> list[dict]:
    sub = next(s for s in data['subcategories'] if s['id'] == 'ca_national_events')
    items = []
    for block in sub.get('questions', []):
        if isinstance(block, dict) and 'id' in block:
            items.append(block)
        elif isinstance(block, dict):
            for value in block.values():
                if isinstance(value, list):
                    for q in value:
                        if isinstance(q, dict) and q.get('id'):
                            items.append(q)
    return items


def main() -> None:
    data = json.loads(PATH.read_text(encoding='utf-8'))
    updated = []
    for q in find_items(data):
        qid = q['id']
        if qid in UPDATES:
            q.update(UPDATES[qid])
            updated.append(qid)
    PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Updated {len(updated)} questions in {PATH.name}')
    for qid in updated:
        print(qid)


if __name__ == '__main__':
    main()



