from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / 'data' / 'financial_regulations.json'
ASSESSMENT_PATH = ROOT / 'docs' / 'question_quality_assessment.json'

FILLER_PREFIX_PATTERNS = [
    re.compile(r'^According to established rules, select the option that best answers:\s*', re.I),
    re.compile(r'^According to established rules, which option correctly addresses:\s*', re.I),
    re.compile(r'^According to established rules, which option best describes\s*', re.I),
    re.compile(r'^According to established rules, choose the best answer for:\s*', re.I),
    re.compile(r'^In the public service context, select the option that best answers:\s*', re.I),
    re.compile(r'^In the public service context, which option correctly addresses:\s*', re.I),
    re.compile(r'^In the public service context, choose the best answer for:\s*', re.I),
    re.compile(r'^In official practice, select the option that best answers:\s*', re.I),
    re.compile(r'^In official practice, which option correctly addresses:\s*', re.I),
    re.compile(r'^In official practice, which option best describes\s*', re.I),
    re.compile(r'^In official practice, select the statement that correctly defines\s*', re.I),
    re.compile(r'^Within government administration, select the option that best answers:\s*', re.I),
    re.compile(r'^Within government administration, choose the best answer for:\s*', re.I),
    re.compile(r'^Within government administration, select the statement that correctly defines\s*', re.I),
    re.compile(r'^Within government administration, which option best describes\s*', re.I),
    re.compile(r'^Within government administration, which option aligns with the meaning of\s*', re.I),
    re.compile(r'^Within government administration, which option correctly addresses:\s*', re.I),
    re.compile(r'^Within government administration,\s*', re.I),
]

QUESTION_OVERRIDES = {
    'fin_aud_052': 'Who receives the three copies of the Board of Survey report?',
    'fin_aud_055': 'What must Accounting Officers do when a new revenue-collecting office is established?',
    'fin_aud_056': 'What may follow if an investigation reveals a loss of public funds?',
    'fin_aud_057': 'What documents must federal ministries and other arms of government use for daily financial transactions?',
    'fin_aud_060': 'Who is responsible for ensuring that all stores are physically secure?',
    'fin_aud_061': 'What is the purpose of an audit query issued by the Auditor-General for the Federation?',
    'fin_aud_062': 'What is the Political Head accountable for in relation to a ministry, agency, or parastatal?',
    'fin_aud_063': 'Who checks Revenue Collectors\' cash books and cash balances at irregular intervals?',
    'fin_aud_066': 'What is the purpose of the Revenue Collector\'s paying-in Form (Treasury Form 15)?',
    'fin_aud_068': 'Which duty of the Accountant-General relates to accounting codes and manuals?',
    'fin_aud_072': 'What must an Internal Auditor do after discovering an apparent abuse of the Financial Regulations?',
    'fin_aud_073': 'Why are audit stamps issued to Internal Audit staff?',
    'fin_aud_074': 'Why must the Subsidiary Account Pension Unit function independently?',
    'fin_bgt_053': 'What is the main role of the Public Accounts Committees of the National Assembly?',
    'fin_bgt_054': 'When may the Accountant-General issue funds for capital projects under a Development Fund General Warrant?',
    'fin_bgt_056': 'Who issues a Development Fund Virement Warrant?',
    'fin_bgt_057': 'What conveys authority to incur expenditure from public funds other than the Consolidated Revenue Fund and Development Fund?',
    'fin_bgt_058': 'Besides payment vouchers, what other vouchers must the Internal Auditor audit and certify?',
    'fin_bgt_059': 'Who is described as an Officer Controlling Expenditure?',
    'fin_bgt_060': 'Who may exclude an item of expenditure from the Annual General Warrant when special control is desired?',
    'fin_bgt_061': 'To whom may control of a subhead or specified amount be delegated under the definition of an Officer Controlling Expenditure?',
    'fin_bgt_066': 'What is the purpose of a Supplementary (Statutory) Expenditure Warrant?',
    'fin_bgt_067': 'From which fund is capital expenditure paid?',
    'fin_bgt_069': 'Which classification code applies to both the Treasury Receipt Voucher and the disbursement voucher for pension deductions?',
    'fin_bgt_073': 'Who is accountable for expenditure incurred without proper authority under Financial Regulation 301?',
    'fin_bgt_074': 'At what point is a Provisional General Warrant issued?',
    'fin_gen_008': 'Which instrument permits payments from the Consolidated Revenue Fund?',
    'fin_gen_046': 'Which platform primarily controls the total amount budgeted for staff salaries and personnel emoluments?',
    'fin_gen_052': 'Which major public funds does the Accountant-General maintain and operate?',
    'fin_gen_053': 'From which fund is recurrent expenditure primarily paid?',
    'fin_gen_055': 'Which office is responsible for ensuring the full collection of government revenue and bringing it promptly to account?',
    'fin_gen_056': 'Which of the following is not a form of warrant used by the Minister of Finance for recurrent expenditure?',
    'fin_gen_057': 'Which office has access to the records of all bank accounts held by ministries, extra-ministerial offices, and other arms of government?',
    'fin_gen_058': 'Which office issues officially approved Treasury-numbered forms for use in all federal ministries?',
    'fin_gen_059': 'Who issues Treasury Circulars and Accounting Manuals to guide Accounting Officers and other employees?',
    'fin_gen_062': 'Which officer has free access to books of account, files, safes, security documents, and related records in federal ministries?',
    'fin_gen_063': 'To whom should an Accounting Officer report the loss of a payment voucher when no loss or fraud has occurred?',
    'fin_gen_065': 'Which office may issue imprests?',
    'fin_gen_066': 'To whom should applications for imprests be made?',
    'fin_gen_070': 'Which officer is assigned responsibility for all financial business of the Government of the Federation by the President?',
    'fin_gen_073': 'How does the Accountant-General provide financial guidelines to federal ministries and other arms of government?',
    'fin_gen_075': 'Which officer is personally accountable for the financial duties of a ministry and for inaccuracies in accounts rendered under that officer\'s authority?',
    'fin_pro_053': 'To which aspects of government business does due procedure apply?',
    'fin_pro_054': 'Who is responsible for causing surprise inspections of the accounts of officers with financial responsibilities?',
    'fin_pro_055': 'Who has overall responsibility for supervising the disbursement of funds and monitoring revenue?',
    'fin_pro_056': 'What is one main objective of the due-process policy?',
    'fin_pro_058': 'Who is personally liable if an Accounting Officer fails to comply with the Public Procurement Act?',
    'fin_pro_059': 'What is the principal role of the Financial Regulations issued by the Minister of Finance?',
    'fin_pro_060': 'To whom should the approved Accounting Code, Internal Audit Guide, and Treasury Circulars be circulated within a ministry or self-accounting unit?',
    'fin_pro_061': 'What type of audit ensures that tendering, contract, and store-keeping procedures are being observed to prevent waste and pilferage?',
    'fin_pro_062': 'What should be done with any balance of salary or other money due to an officer dismissed for misappropriation of government funds?',
    'fin_pro_063': 'What is one key responsibility of the Accounting Officer in a self-accounting unit under Financial Regulation 1603(a)?',
    'fin_pro_065': 'Which document sets out the responsibilities of an Accounting Officer in a self-accounting unit?',
    'fin_pro_070': 'What is one duty of the Head of Finance and Accounts of a ministry?',
}

PHRASE_TAGS = {
    'internal auditor': 'internal_auditor',
    'audit query': 'audit_query',
    'board of survey': 'board_of_survey',
    'revenue collecting office': 'revenue_collection',
    'revenue collector': 'revenue_collector',
    'strong-room': 'strong_room_security',
    'subsidiary account pension unit': 'subsidiary_account_pension_unit',
    'political head': 'political_head',
    'accountant-general': 'accountant_general',
    'virement warrant': 'virement_warrant',
    'general warrant': 'general_warrant',
    'contingency fund': 'contingency_fund',
    'development fund': 'development_fund',
    'capital expenditure': 'capital_expenditure',
    'recurrent expenditure': 'recurrent_expenditure',
    'public accounts committees': 'public_accounts_committee',
    'officer controlling expenditure': 'officer_controlling_expenditure',
    'treasury receipt books': 'treasury_receipt_books',
    'treasury circulars': 'treasury_circulars',
    'accounting manuals': 'accounting_manuals',
    'imprests': 'imprests',
    'due procedure': 'due_procedure',
    'public procurement act': 'public_procurement_act',
    'financial control audit': 'financial_control_audit',
    'head of finance and accounts': 'head_of_finance_and_accounts',
}

STOPWORDS = {
    'a', 'an', 'and', 'answers', 'best', 'by', 'does', 'following', 'for', 'from', 'fund', 'funds', 'government',
    'how', 'if', 'in', 'is', 'it', 'may', 'must', 'not', 'of', 'office', 'officer', 'officers', 'on', 'one', 'or',
    'other', 'practice', 'public', 'question', 'regarding', 'role', 'should', 'the', 'their', 'this', 'to', 'under',
    'what', 'when', 'which', 'who', 'why', 'with', 'within', 'would', 'type', 'time', 'frame', 'major', 'main',
    'chief', 'option', 'select', 'correctly', 'addresses', 'established', 'rules', 'official', 'context', 'choose',
    'belongs', 'describe', 'describes', 'defined', 'defines', 'meaning', 'aligns', 'administration'
}

BAD_TAGS = {
    'according', 'established', 'option', 'correctly', 'select', 'best', 'answers', 'answer', 'official', 'practice',
    'within', 'government', 'administration', 'public', 'service', 'context', 'choose', 'role', 'time', 'frame',
    'does', 'which', 'what', 'who', 'why', 'how'
}

TRAILING_GARBAGE = [
    re.compile(r'\s*[0-9]+\?$'),
    re.compile(r'\s*[0-9]+$'),
    re.compile(r'\s*?$'),
    re.compile(r'\s*a\.$', re.I),
]


def load_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def safe_get_questions(subcategory: dict):
    for question in subcategory.get('questions', []):
        if isinstance(question, dict):
            yield question


def normalize_space(text: str) -> str:
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\s+([?.!,;:])', r'\1', text)
    return text.strip()


def clean_trailing_garbage(text: str) -> str:
    cleaned = text
    for pattern in TRAILING_GARBAGE:
        cleaned = pattern.sub('', cleaned)
    return cleaned.strip()


def clean_question(question_id: str, text: str) -> str:
    if question_id in QUESTION_OVERRIDES:
        return QUESTION_OVERRIDES[question_id]
    cleaned = normalize_space(text)
    for pattern in FILLER_PREFIX_PATTERNS:
        cleaned = pattern.sub('', cleaned)
    cleaned = cleaned.replace('necessitate', 'required')
    cleaned = cleaned.replace(' permit ', ' permit to ')
    cleaned = cleaned.replace(' secure that ', ' ensures that ')
    cleaned = cleaned.replace(' is in charge for ', ' is responsible for ')
    cleaned = cleaned.replace(' responsibility for is ', ' ')
    cleaned = cleaned.replace(' responsibility for receives ', ' who receives ')
    cleaned = cleaned.replace(' belongs to which role?', '?')
    cleaned = cleaned.replace('Which office permit payments from the Consolidated Revenue Fund (CRF)?', 'Which instrument permits payments from the Consolidated Revenue Fund?')
    cleaned = clean_trailing_garbage(cleaned)
    cleaned = normalize_space(cleaned)
    if cleaned and not cleaned.endswith('?'):
        cleaned = cleaned.rstrip('.') + '?'
    if cleaned and cleaned[0].islower():
        cleaned = cleaned[0].upper() + cleaned[1:]
    return cleaned


def clean_option(text: str) -> str:
    cleaned = normalize_space(text)
    cleaned = cleaned.replace('Nigeriaa', 'Nigeria')
    cleaned = cleaned.replace(' necessitate ', ' required ')
    cleaned = cleaned.replace('secure that', 'ensures that')
    cleaned = cleaned.replace('a 147', '')
    cleaned = cleaned.replace('3 170', '')
    cleaned = clean_trailing_garbage(cleaned)
    if cleaned and not re.search(r'[.?!]$', cleaned):
        cleaned += '.'
    return normalize_space(cleaned)


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '_', text)
    return text.strip('_')


def build_metadata(question: dict) -> tuple[list[str], list[str]]:
    question_text = str(question.get('question') or '')
    existing_keywords = [str(value).strip() for value in question.get('keywords', []) if str(value).strip()]
    existing_tags = [str(value).strip() for value in question.get('tags', []) if str(value).strip()]
    source_sub = str(question.get('sourceSubcategoryId') or '').strip()

    concept_pool: list[str] = []
    for value in existing_keywords + existing_tags:
        lowered = value.lower()
        if lowered in BAD_TAGS:
            continue
        if lowered.startswith('refill-') or lowered.startswith('generated_'):
            continue
        if lowered in {'financial_regulations', source_sub.lower() if source_sub else ''}:
            continue
        concept_pool.append(slugify(value))

    lower_question = question_text.lower()
    for phrase, tag in PHRASE_TAGS.items():
        if phrase in lower_question:
            concept_pool.append(tag)

    token_pool = re.findall(r'[A-Za-z][A-Za-z.-]+', question_text.lower())
    for token in token_pool:
        token = token.replace('.', '')
        if token in STOPWORDS or len(token) < 4:
            continue
        concept_pool.append(slugify(token))

    seen: set[str] = set()
    concepts: list[str] = []
    for token in concept_pool:
        if not token or token in seen or token in BAD_TAGS:
            continue
        seen.add(token)
        concepts.append(token)

    keywords = concepts[:4] or ['financial_controls']
    tags = ['financial_regulations']
    if source_sub:
        tags.append(source_sub)
    for token in concepts[:6]:
        if token not in tags:
            tags.append(token)
    return keywords, tags


def main() -> None:
    assessment = load_json(ASSESSMENT_PATH)
    target_ids = {
        str(item.get('question_id') or '').strip()
        for item in assessment.get('items', [])
        if str(item.get('source_topic') or '').strip() == 'financial_regulations'
    }
    if not target_ids:
        raise SystemExit('No financial_regulations targets found in assessment report')

    data = load_json(DATA_PATH)
    updated = 0
    for subcategory in data.get('subcategories', []):
        for question in safe_get_questions(subcategory):
            question_id = str(question.get('id') or '').strip()
            if question_id not in target_ids:
                continue
            question['question'] = clean_question(question_id, str(question.get('question') or ''))
            question['options'] = [clean_option(str(option)) for option in question.get('options', [])]
            keywords, tags = build_metadata(question)
            question['keywords'] = keywords
            question['tags'] = tags
            updated += 1

    DATA_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Updated {updated} financial_regulations questions in financial_regulations.json')


if __name__ == '__main__':
    main()
