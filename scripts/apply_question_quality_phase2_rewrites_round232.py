from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'data' / 'general_current_affairs.json'

TARGET_IDS = {
    'NGPD_019','NGPD_031','NGPD_051','NGPD_052','NGPD_053','NGPD_055','NGPD_056','NGPD_057','NGPD_058','NGPD_059','NGPD_060','NGPD_061','NGPD_062','NGPD_063','NGPD_065','NGPD_066','NGPD_067','NGPD_068','NGPD_069','NGPD_070','NGPD_071','NGPD_072','NGPD_074'
}

QUESTION_UPDATES = {
    'NGPD_019': 'What must officers do with historical manuscripts or other documents of public interest discovered in the course of official duty?',
    'NGPD_031': "When an officer's increment has been withheld, what may the FCSC grant later to mitigate the effect?",
    'NGPD_053': 'Who takes disciplinary action against a driver who causes an accident through negligence?',
    'NGPD_055': 'Under Financial Regulation 1603(b), to whom must the Accounting Officer issue accounting instructions?',
    'NGPD_056': 'What type of reporting must the Accounting Officer ensure is accurate for management and control purposes?',
    'NGPD_058': 'What is the main aim of Chapter 19 of the Financial Regulations?',
    'NGPD_059': 'Who is responsible under the Constitution for auditing and reporting on the public accounts of the Federation?',
    'NGPD_060': 'What does the term Sub-Accounting Officer mean?',
    'NGPD_061': 'What is a cash advance-holder?',
    'NGPD_063': 'What does the Annual General Warrant permit the Accountant-General to do?',
    'NGPD_068': 'Who must ensure that the required vote-book entries are made before payments are approved?',
    'NGPD_069': 'If an unauthorized payment arises from an incorrect certificate or entry on a voucher, who must be surcharged?',
    'NGPD_071': 'Who provides specimen signatures of officers empowered to sign payment vouchers to the internal checking section, internal audit unit, and Paying Officer?',
    'NGPD_072': 'What should be done if a discrepancy is found in schedules of payments and adjustments from the Accountant-General?',
    'NGPD_074': 'Who is required to acquaint themselves with the Financial Regulations, the Finance (Control and Management) Act, and the constitutional provisions on public finance?',
}

OPTION_UPDATES = {
    'NGPD_053': ['The Accounting Officer.', 'The Head of Internal Audit.', 'The Minister of Finance.', 'The Transport Officer.'],
    'NGPD_055': ['Only senior staff.', 'The Accountant-General.', 'External auditors.', 'All officers within the unit.'],
    'NGPD_056': ['Comprehensive financial reports, including budget-performance reporting.', 'Only external audit reports.', 'Quarterly reports only.', 'Informal verbal reports.'],
    'NGPD_058': ['To detail internal-audit procedures.', 'To define the roles of Accounting Officers.', 'To explain bank-account management.', 'To outline the pension scheme in the Federal Public Service.'],
    'NGPD_059': ['The Accountant-General for the Federation.', 'The Public Accounts Committee.', 'The Minister of Finance.', 'The Auditor-General for the Federation.'],
    'NGPD_060': ['An officer entrusted with the receipt, custody, and disbursement of public money and required to keep a cash book.', 'An officer who prepares financial reports for the Accountant-General.', 'The Head of Finance and Accounts.', 'An officer who audits the accounts of a ministry.'],
    'NGPD_061': ['An officer entrusted with disbursing public money for which vouchers cannot immediately be presented to a Sub-Accounting Officer, and who keeps a cash book.', 'An officer who approves all capital expenditure.', 'An officer who manages the ministry\'s main bank account.', 'An officer responsible for auditing revenue collections.'],
    'NGPD_063': ['To approve all government contracts.', 'Only to make payments for personal emoluments.', 'To transfer funds from the Contingencies Fund.', 'To issue funds for disbursement for personal emoluments and other services provided in the Annual Estimates.'],
    'NGPD_068': ['Officers empowered to incur expenditure.', 'The Head of Finance and Accounts.', 'The Sub-Accounting Officer.', 'Only the Accountant-General.'],
    'NGPD_069': ['The certifying officer or the Sub-Accounting Officer.', 'The Accounting Officer.', 'The Auditor-General.', 'Only the Sub-Accounting Officer.'],
    'NGPD_071': ['The Minister of Finance.', 'The Accountant-General.', 'The Accounting Officer.', 'The Head of Finance and Accounts.'],
    'NGPD_072': ['It should be corrected by the Accounting Officer.', 'It should be ignored if minor.', 'It should be brought immediately to the notice of the Accountant-General.', 'It should be reported only to the Auditor-General.'],
    'NGPD_074': ['Public Officers.', 'Only external auditors.', 'Only ministers.', 'Only the Accountant-General.'],
}

KEYWORD_UPDATES = {
    'NGPD_019': ['historical manuscripts', 'public-interest documents', 'preservation', 'permanent secretary'],
    'NGPD_031': ['withheld increment', 'special increments', 'fcsc', 'mitigation'],
    'NGPD_051': ['personal emoluments', 'accountant-general', 'financial regulation 1517', 'approval'],
    'NGPD_052': ['accounting officer', 'self-accounting unit', 'financial regulations', 'disciplinary action'],
    'NGPD_053': ['driver negligence', 'disciplinary action', 'accounting officer', 'official transport'],
    'NGPD_055': ['accounting instructions', 'accounting officer', 'financial regulation 1603b', 'all officers'],
    'NGPD_056': ['financial reporting', 'management control', 'accounting officer', 'budget performance'],
    'NGPD_057': ['internal auditor', 'periodic audit reports', 'accounting officer', 'financial regulation 1706'],
    'NGPD_058': ['chapter 19', 'financial regulations', 'pension scheme', 'federal public service'],
    'NGPD_059': ['auditor-general for the federation', 'public accounts', 'constitution', 'audit report'],
    'NGPD_060': ['sub-accounting officer', 'public money', 'cash book', 'financial administration'],
    'NGPD_061': ['cash advance-holder', 'public money', 'cash book', 'sub-accounting officer'],
    'NGPD_062': ['self-accounting unit', 'accounting system', 'accounting officer', 'financial regulation 122'],
    'NGPD_063': ['annual general warrant', 'accountant-general', 'annual estimates', 'disbursement'],
    'NGPD_065': ['self-accounting unit', 'system of accounts', 'accounting officer', 'financial regulation 122'],
    'NGPD_066': ['authority to incur expenditure', 'a.i.e.', 'sign vouchers', 'officer controlling expenditure'],
    'NGPD_067': ['authority to incur expenditure', 'cash backing', 'accounting officer', 'vote control'],
    'NGPD_068': ['vote-book entries', 'payments approval', 'officers empowered to incur expenditure', 'public finance'],
    'NGPD_069': ['unauthorized payment', 'incorrect certificate', 'voucher entry', 'surcharge'],
    'NGPD_070': ['disbursement vouchers', 'minimum rank', 'senior executive officer accounts', 'accountant i'],
    'NGPD_071': ['specimen signatures', 'payment vouchers', 'accounting officer', 'internal checking'],
    'NGPD_072': ['schedules of payments', 'adjustments', 'accountant-general', 'discrepancy reporting'],
    'NGPD_074': ['financial regulations', 'finance control and management act', 'constitutional provisions', 'public finance'],
}

TOPIC_UPDATES = {
    'NGPD_019': 'Official Records and Preservation',
    'NGPD_031': 'Public Service Rules',
    'NGPD_051': 'Financial Regulations',
    'NGPD_052': 'Financial Regulations',
    'NGPD_053': 'Official Transport Discipline',
    'NGPD_055': 'Financial Regulations',
    'NGPD_056': 'Financial Regulations',
    'NGPD_057': 'Financial Regulations',
    'NGPD_058': 'Financial Regulations',
    'NGPD_059': 'Constitutional Accountability',
    'NGPD_060': 'Financial Regulations',
    'NGPD_061': 'Financial Regulations',
    'NGPD_062': 'Financial Regulations',
    'NGPD_063': 'Financial Regulations',
    'NGPD_065': 'Financial Regulations',
    'NGPD_066': 'Financial Regulations',
    'NGPD_067': 'Financial Regulations',
    'NGPD_068': 'Financial Regulations',
    'NGPD_069': 'Financial Regulations',
    'NGPD_070': 'Financial Regulations',
    'NGPD_071': 'Financial Regulations',
    'NGPD_072': 'Financial Regulations',
    'NGPD_074': 'Public Finance Governance',
}

BASE_TAGS = ['current_affairs', 'national_governance', 'policy_developments', 'ca_national_governance']


def slugify(value: str) -> str:
    value = value.strip().lower().replace('&', ' and ')
    value = re.sub(r'[^a-z0-9]+', '_', value)
    value = re.sub(r'_+', '_', value).strip('_')
    return value


def build_tags(keywords: list[str]) -> list[str]:
    tags = BASE_TAGS.copy()
    for kw in keywords[:3]:
        slug = slugify(kw)
        if slug and slug not in tags:
            tags.append(slug)
    return tags


def find_items(data: dict) -> list[dict]:
    sub = next(s for s in data['subcategories'] if s['id'] == 'ca_national_governance')
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
        if qid not in TARGET_IDS:
            continue
        if qid in QUESTION_UPDATES:
            q['question'] = QUESTION_UPDATES[qid]
        if qid in OPTION_UPDATES:
            q['options'] = OPTION_UPDATES[qid]
        if qid in KEYWORD_UPDATES:
            q['keywords'] = KEYWORD_UPDATES[qid]
        q['tags'] = build_tags(q.get('keywords', []))
        if qid in TOPIC_UPDATES:
            q['topic'] = TOPIC_UPDATES[qid]
        updated.append(qid)
    PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Updated {len(updated)} questions in {PATH.name}')
    for qid in updated:
        print(qid)


if __name__ == '__main__':
    main()
