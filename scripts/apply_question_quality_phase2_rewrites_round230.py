from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'data' / 'general_current_affairs.json'

TARGET_IDS = {
    'IRA_149','IRA_150','IRA_151','IRA_152','IRA_155','IRA_156','IRA_157','IRA_158','IRA_159','IRA_160','IRA_162','IRA_163','IRA_164','IRA_165','IRA_166','IRA_167','IRA_168','IRA_169','IRA_170','IRA_171','IRA_172','IRA_173','IRA_174','IRA_175',
    'PSIR_057','PSIR_074','PSIR_101','PSIR_103','PSIR_104','PSIR_106','PSIR_107','PSIR_108','PSIR_109','PSIR_110','PSIR_111','PSIR_112','PSIR_113','PSIR_114','PSIR_115','PSIR_116','PSIR_117','PSIR_118','PSIR_120','PSIR_121','PSIR_122','PSIR_123','PSIR_124','PSIR_125',
}

QUESTION_UPDATES = {
    'IRA_149': 'What role does the Accountant-General perform in relation to accounting instructions issued by the Accounting Officer under FR 1603(h)?',
    'IRA_150': 'What should detailed accounting instructions issued by the Accounting Officer embrace?',
    'IRA_152': 'What is the role of a Treasury Circular in financial management?',
    'IRA_157': 'What is a Store Receipt Voucher used for?',
    'IRA_158': 'What is the aim of staffing in management?',
    'IRA_159': 'In which city was the Charter for the Public Service in Africa adopted?',
    'IRA_163': 'Under Financial Regulation 1603(b), to whom must the Accounting Officer issue accounting instructions?',
    'IRA_164': 'What is the main objective of Rule 021002?',
    'IRA_165': 'Who is responsible for ensuring that provisions for VAT and WHT are made and remitted?',
    'IRA_167': 'Under FR 1603(h), what role does the Accountant-General perform in relation to accounting instructions issued by the Accounting Officer?',
    'IRA_168': 'What should detailed accounting instructions issued by the Accounting Officer include?',
    'IRA_169': 'What role does the Accountant-General of the Federation perform during a Public Accounts Committee hearing?',
    'IRA_170': 'What is the purpose of an audit query issued by the Auditor-General for the Federation?',
    'IRA_171': 'What role does a Treasury Circular play in financial management?',
    'IRA_172': 'How can an officer access National Housing Fund contributions?',
    'PSIR_057': 'How often should the Public Service Rules be reviewed to reflect changing realities and global best practices?',
    'PSIR_074': 'Who approves the deployment of staff in the Nigerian Civil Service?',
    'PSIR_106': 'To whom does a Permanent Secretary, acting as Accounting Officer, submit responses to audit queries?',
    'PSIR_107': 'What is the risk when a document is destroyed under older document-management methods?',
    'PSIR_108': 'What is the danger when a document is destroyed under older document-management methods?',
    'PSIR_109': 'What is the maximum period for which an officer may be seconded to another government or recognized international organization?',
    'PSIR_110': 'In how many copies is a Certificate of Service rendered?',
    'PSIR_111': 'The examinations for police and paramilitary services are designed primarily to test an officer\'s knowledge of what?',
    'PSIR_112': 'What must an Accounting Officer ensure about revenue collected?',
    'PSIR_115': 'Which unit had its operations institutionalized by the Public Procurement Act 2007?',
    'PSIR_117': 'What is the role of a Permanent Secretary in relation to a parastatal?',
    'PSIR_120': 'Why are papers routed back through official channels after a decision is reached?',
    'PSIR_121': 'What does Gazette mean in the Public Service Rules?',
    'PSIR_122': 'How many days does a public officer have to reply to formal queries or enquiries from the Accountant-General or Auditor-General?',
    'PSIR_124': 'What is the principal duty of every officer controlling a vote?',
}

OPTION_UPDATES = {
    'IRA_149': ['To audit them retroactively.', 'To provide specific directives that apply the general provisions of the Financial Regulations.', 'To issue them independently.', 'To ignore them.'],
    'IRA_150': ['Only internal policies.', 'The general provisions of the Financial Regulations and specific directives from higher authorities.', 'Only the Accounting Officer\'s personal preferences.', 'Guidelines from external consultants.'],
    'IRA_152': ['To issue instructions on accounting procedures, financial regulations, and related rules.', 'To provide guidelines for international trade.', 'To set government salaries.', 'To approve new government projects.'],
    'IRA_157': ['To request a new item from a supplier.', 'To approve payment for a purchase.', 'To acknowledge the receipt of goods into a store.', 'To document the transfer of stores to another department.'],
    'IRA_158': ['To secure the viability of the organization through careful budgeting.', 'To put in place an efficient system of recruitment by hiring the right people and providing training.', 'To keep appropriate authorities informed through reporting and research.', 'To check progress against plans and modify them based on feedback.'],
    'IRA_159': ['Nairobi, Kenya.', 'Cairo, Egypt.', 'Windhoek, Namibia.', 'Lagos, Nigeria.'],
    'IRA_163': ['The Accountant-General.', 'Only senior staff.', 'All officers within the unit.', 'External auditors.'],
    'IRA_164': ['To provide a schedule for non-pensionable appointments.', 'To govern the retirement of an officer.', 'To provide access to National Housing Fund contributions.', 'To ensure officers receive retirement benefits promptly.'],
    'IRA_165': ['The Minister of Finance.', 'Accounting Officers.', 'The Head of Internal Audit.', 'The Accountant-General.'],
    'IRA_167': ['To provide specific directives that apply the general provisions of the Financial Regulations.', 'To ignore them.', 'To audit them retroactively.', 'To issue them independently.'],
    'IRA_168': ['The general provisions of the Financial Regulations and specific directives from higher authorities.', 'Only internal policies.', 'Guidelines from external consultants.', 'Only the Accounting Officer\'s personal preferences.'],
    'IRA_169': ['To provide clarification on accounting procedures and financial regulations.', 'To manage the committee\'s budget.', 'To represent all MDAs and answer for them.', 'To prepare the Auditor-General\'s report.'],
    'IRA_170': ['To highlight financial anomalies, unauthorized expenditure, or failures in proper accounting.', 'To recommend new appointments.', 'To question a government policy.', 'To approve new projects.'],
    'IRA_171': ['To provide guidelines for international trade.', 'To issue instructions on accounting procedures, financial regulations, and related rules.', 'To approve new government projects.', 'To set government salaries.'],
    'IRA_172': ['The officer must wait for a circular from the Head of the Civil Service of the Federation.', 'The officer must provide a stamped death certificate.', 'The officer must apply directly to the National Housing Fund.', 'The officer must leave the service and may access the contribution within one month of retirement.'],
    'PSIR_106': ['The Head of the Civil Service of the Federation.', 'The Auditor-General for the Federation.', 'The Minister of Finance.', 'The Director of Finance and Accounts.'],
    'PSIR_107': ['It can be easily recreated.', 'It will automatically reappear in a recycle bin.', 'It can be recalled with a simple command.', 'It cannot be recalled and must be recreated.'],
    'PSIR_108': ['It cannot be recalled and must be recreated.', 'It will automatically reappear in a recycle bin.', 'It can be easily recreated.', 'It can be recalled with a simple command.'],
    'PSIR_109': ['Four years with no extension.', 'One year in the first instance, with extensions up to two years.', 'Two years in the first instance, with extensions up to four years.', 'Three years with no extension.'],
    'PSIR_110': ['Two copies.', 'Three copies.', 'Four copies.', 'One copy.'],
    'PSIR_111': ['Civil Service Rules and Regulations.', 'General knowledge and current affairs.', 'The laws and regulations governing their respective services.', 'Advanced management techniques.'],
    'PSIR_112': ['Invested in short-term deposits.', 'Spent immediately on ministry needs.', 'Remitted promptly to the appropriate authorities and not spent.', 'Used to cover immediate operational expenses.'],
    'PSIR_115': ['The National Assembly Budget and Research Office.', 'The Federal Civil Service Commission.', 'The Office of the Head of the Civil Service of the Federation.', 'The Bureau for Monitoring and Price Intelligence Unit (BMPIU).'],
    'PSIR_117': ['To audit the financial accounts of the parastatal.', 'To serve as the Accounting Officer of the parastatal.', 'To ensure that the parastatal\'s policies align with government policy.', 'To manage the day-to-day operations of the parastatal.'],
    'PSIR_120': ['To create an opportunity for the papers to be delayed.', 'To give junior officers more time to review the documents.', 'To obtain a second opinion from junior staff.', 'To ensure that all intermediate officers are aware of the decisions reached by the higher authority.'],
    'PSIR_122': ['21 days.', '14 days.', '30 days.', '7 days.'],
    'PSIR_124': ['To prepare the annual budget.', 'To approve all payments.', 'To conduct internal audits.', 'To monitor the expenditure pattern of the ministry against the amounts provided in the Estimates.'],
}

KEYWORD_UPDATES = {
    'IRA_149': ['accountant-general', 'accounting instructions', 'financial regulations', 'fr 1603h'],
    'IRA_150': ['accounting instructions', 'accounting officer', 'financial regulations', 'higher authorities'],
    'IRA_151': ['retirement savings account', 'national pension commission', 'fr 1904a', 'employee pension'],
    'IRA_152': ['treasury circular', 'financial management', 'accounting procedures', 'financial regulations'],
    'IRA_155': ['receipt or licence book', 'missing book', 'official reporting', 'accountant-general'],
    'IRA_156': ['government driver', 'accident report', 'nearest police station', 'injury or death'],
    'IRA_157': ['store receipt voucher', 'goods received', 'store records', 'acknowledgement'],
    'IRA_158': ['staffing duty', 'management', 'recruitment', 'training'],
    'IRA_159': ['charter for the public service in africa', 'windhoek', 'conference adoption', 'african public service'],
    'IRA_160': ['foreign service officer', 'marriage to foreigner', 'home service', 'service interest'],
    'IRA_162': ['sub-accounting officer', 'unclaimed salaries', 'treasury', 'seven days'],
    'IRA_163': ['accounting officer', 'accounting instructions', 'fr 1603b', 'all officers'],
    'IRA_164': ['rule 021002', 'retirement benefits', 'officer retirement', 'public service rules'],
    'IRA_165': ['vat and wht', 'accounting officers', 'remittance', 'tax compliance'],
    'IRA_166': ['disbursement voucher', 'sub-accounting officer', 'three months', 'officer controlling expenditure'],
    'IRA_167': ['accountant-general', 'accounting instructions', 'financial regulations', 'fr 1603h'],
    'IRA_168': ['accounting instructions', 'accounting officer', 'financial regulations', 'higher authorities'],
    'IRA_169': ['public accounts committee', 'accountant-general of the federation', 'clarification', 'financial regulations'],
    'IRA_170': ['audit query', 'auditor-general for the federation', 'financial anomalies', 'unauthorized expenditure'],
    'IRA_171': ['treasury circular', 'financial management', 'accounting procedures', 'financial regulations'],
    'IRA_172': ['national housing fund', 'retirement access', 'officer contribution', 'one month after retirement'],
    'IRA_173': ['revenue collector', 'official receipt booklet', 'cash book', 'revenue collection'],
    'IRA_174': ['official receipt', 'sub-accounting officer', 'cash book', 'receipt handling'],
    'IRA_175': ['sub-accounting officer', 'public money', 'official receipt booklet', 'revenue collection'],
    'PSIR_057': ['public service rules review', 'five years', 'global best practices', 'psr'],
    'PSIR_074': ['deployment of staff', 'federal civil service commission', 'nigerian civil service', 'staff deployment'],
    'PSIR_101': ['confirmation examination', 'permanent secretary', 'recommendation', 'confirmation'],
    'PSIR_103': ['value-for-money audit', 'economy efficiency effectiveness', 'auditor-general', 'government projects'],
    'PSIR_104': ['foreign service officer', 'marriage to foreign national', 'prior permission', 'government approval'],
    'PSIR_106': ['permanent secretary', 'audit queries', 'auditor-general for the federation', 'accounting officer'],
    'PSIR_107': ['document destruction', 'older document management', 'recreation', 'records risk'],
    'PSIR_108': ['document destruction', 'older document management', 'recreation', 'records risk'],
    'PSIR_109': ['secondment', 'recognized international organization', 'maximum period', 'four years'],
    'PSIR_110': ['certificate of service', 'three copies', 'public service procedure', 'duplicates'],
    'PSIR_111': ['police examinations', 'paramilitary examinations', 'service laws and regulations', 'officer knowledge'],
    'PSIR_112': ['accounting officer', 'revenue collection', 'remittance', 'appropriate authorities'],
    'PSIR_113': ['provisional general warrant', 'six months', 'fund withdrawal', 'financial regulations'],
    'PSIR_114': ['provisional development fund general warrant', 'six months', 'development fund', 'financial regulations'],
    'PSIR_115': ['public procurement act 2007', 'bmpiu', 'bureau for monitoring and price intelligence unit', 'procurement reform'],
    'PSIR_116': ['permanent secretary', 'audit query response', '21 days', 'accounting officer'],
    'PSIR_117': ['permanent secretary', 'parastatal', 'government policy alignment', 'oversight'],
    'PSIR_118': ['1988 civil service reforms', 'accounting officers', 'permanent secretaries', 'civil service reform'],
    'PSIR_120': ['official channels', 'routing papers back', 'higher authority decisions', 'intermediate officers'],
    'PSIR_121': ['gazette', 'public service rules', 'official gazette', 'federal republic of nigeria'],
    'PSIR_122': ['formal queries', 'accountant-general', 'auditor-general', '21 days'],
    'PSIR_123': ['formal queries', 'accountant-general', 'auditor-general', '21 days'],
    'PSIR_124': ['officer controlling a vote', 'expenditure pattern', 'estimates', 'vote control'],
    'PSIR_125': ['recurrent expenditure warrant', 'financial year', 'warrant lapse', 'recurrent expenditure'],
}

TOPIC_UPDATES = {
    'IRA_149': 'Financial Regulations', 'IRA_150': 'Financial Regulations', 'IRA_151': 'Financial Regulations', 'IRA_152': 'Financial Regulations', 'IRA_155': 'Financial Regulations', 'IRA_156': 'Financial Regulations', 'IRA_157': 'Financial Regulations', 'IRA_160': 'Public Service Rules', 'IRA_162': 'Financial Regulations', 'IRA_163': 'Financial Regulations', 'IRA_165': 'Financial Regulations', 'IRA_166': 'Financial Regulations', 'IRA_167': 'Financial Regulations', 'IRA_168': 'Financial Regulations', 'IRA_169': 'Financial Regulations', 'IRA_170': 'Financial Regulations', 'IRA_171': 'Financial Regulations', 'IRA_173': 'Financial Regulations', 'IRA_174': 'Financial Regulations', 'IRA_175': 'Financial Regulations',
    'PSIR_057': 'Public Service Rules', 'PSIR_074': 'Public Service Rules', 'PSIR_101': 'Public Service Rules', 'PSIR_103': 'Public Accountability', 'PSIR_104': 'Public Service Rules', 'PSIR_106': 'Financial Regulations', 'PSIR_109': 'Public Service Rules', 'PSIR_110': 'Public Service Rules', 'PSIR_111': 'Public Service Rules', 'PSIR_112': 'Financial Regulations', 'PSIR_113': 'Financial Regulations', 'PSIR_114': 'Financial Regulations', 'PSIR_115': 'Public Procurement Reform', 'PSIR_116': 'Financial Regulations', 'PSIR_117': 'Public Service Rules', 'PSIR_118': 'Civil Service Reform', 'PSIR_120': 'Official Procedure', 'PSIR_121': 'Public Service Rules', 'PSIR_122': 'Financial Regulations', 'PSIR_123': 'Financial Regulations', 'PSIR_124': 'Financial Regulations', 'PSIR_125': 'Financial Regulations',
}


def slugify(value: str) -> str:
    value = value.strip().lower().replace('&', ' and ')
    value = re.sub(r'[^a-z0-9]+', '_', value)
    value = re.sub(r'_+', '_', value).strip('_')
    return value


def build_tags(sub_id: str, keywords: list[str]) -> list[str]:
    if sub_id == 'ca_international_affairs':
        tags = ['current_affairs', 'international_affairs', 'regional_affairs', 'ca_international_affairs']
    else:
        tags = ['current_affairs', 'public_service_reforms', 'institutional_reforms', 'ca_public_service_reforms']
    for kw in keywords[:3]:
        slug = slugify(kw)
        if slug and slug not in tags:
            tags.append(slug)
    return tags


def find_items(data: dict) -> list[tuple[str, dict]]:
    found = []
    for sub in data['subcategories']:
        if sub['id'] not in {'ca_international_affairs', 'ca_public_service_reforms'}:
            continue
        for block in sub.get('questions', []):
            if isinstance(block, dict) and 'id' in block:
                found.append((sub['id'], block))
            elif isinstance(block, dict):
                for value in block.values():
                    if isinstance(value, list):
                        for q in value:
                            if isinstance(q, dict) and q.get('id'):
                                found.append((sub['id'], q))
    return found


def main() -> None:
    data = json.loads(PATH.read_text(encoding='utf-8'))
    updated = []
    for sub_id, q in find_items(data):
        qid = q['id']
        if qid not in TARGET_IDS:
            continue
        if qid in QUESTION_UPDATES:
            q['question'] = QUESTION_UPDATES[qid]
        if qid in OPTION_UPDATES:
            q['options'] = OPTION_UPDATES[qid]
        if qid in KEYWORD_UPDATES:
            q['keywords'] = KEYWORD_UPDATES[qid]
        q['tags'] = build_tags(sub_id, q.get('keywords', []))
        if qid in TOPIC_UPDATES:
            q['topic'] = TOPIC_UPDATES[qid]
        updated.append(qid)
    PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Updated {len(updated)} questions in {PATH.name}')
    for qid in updated:
        print(qid)


if __name__ == '__main__':
    main()
