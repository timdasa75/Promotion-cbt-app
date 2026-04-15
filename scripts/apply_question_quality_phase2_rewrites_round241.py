from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / 'data' / 'psr_rules.json'
ASSESSMENT_PATH = ROOT / 'docs' / 'question_quality_assessment.json'

FILLER_PREFIX_PATTERNS = [
    re.compile(r'^According to established rules, select the option that best answers:\s*', re.I),
    re.compile(r'^According to established rules, select the statement that correctly defines\s*', re.I),
    re.compile(r'^According to established rules, which option correctly addresses:\s*', re.I),
    re.compile(r'^According to established rules, which option aligns with the meaning of\s*', re.I),
    re.compile(r'^According to established rules, which body is in charge for\s*', re.I),
    re.compile(r'^According to established rules, which office is in charge for\s*', re.I),
    re.compile(r'^According to established rules,\s*', re.I),
    re.compile(r'^In the public service context, choose the best answer for:\s*', re.I),
    re.compile(r'^In the public service context, which option correctly addresses:\s*', re.I),
    re.compile(r'^In the public service context, which option aligns with the meaning of\s*', re.I),
    re.compile(r'^In the public service context,\s*', re.I),
    re.compile(r'^In official practice, choose the best answer for:\s*', re.I),
    re.compile(r'^In official practice, select the option that best answers:\s*', re.I),
    re.compile(r'^In official practice, which option best describes\s*', re.I),
    re.compile(r'^In official practice, which option aligns with the meaning of\s*', re.I),
    re.compile(r'^In official practice,\s*', re.I),
    re.compile(r'^Within government administration, choose the best answer for:\s*', re.I),
    re.compile(r'^Within government administration, select the option that best answers:\s*', re.I),
    re.compile(r'^Within government administration, select the statement that correctly defines\s*', re.I),
    re.compile(r'^Within government administration, which option correctly addresses:\s*', re.I),
    re.compile(r'^Within government administration, which option aligns with the meaning of\s*', re.I),
    re.compile(r'^Within government administration, which role is accountable for\s*', re.I),
    re.compile(r'^Within government administration, which office is accountable for\s*', re.I),
    re.compile(r'^Within government administration,\s*', re.I),
    re.compile(r'^Select the option that best answers:\s*', re.I),
    re.compile(r'^Choose the best answer for:\s*', re.I),
]

QUESTION_OVERRIDES = {
    'circ_appointments_tenure_discipline_gen_064': 'To whom is the Certificate of Service issued?',
    'circ_appointments_tenure_discipline_gen_065': 'Who must countersign the Certificate of Service for officers on GL 06 and below?',
    'circ_appointments_tenure_discipline_gen_070': 'Which office must submit a compliance report on posting instructions to the relevant pool office within three weeks?',
    'circ_appointments_tenure_discipline_gen_073': 'How quickly should cash transfers for AIEs issued in favour of state offices be processed under the electronic banking system?',
    'circ_appointments_tenure_discipline_gen_078': 'What must Accounting Officers establish in their ministries or extra-ministerial offices regarding pensions?',
    'circ_appointments_tenure_discipline_gen_079': 'How should the Subsidiary Account Pension Unit relate to the main subsidiary accounts section of a ministry?',
    'circ_appointments_tenure_discipline_gen_082': 'Below the Permanent Secretary, who heads the Departments and is directly accountable to the Permanent Secretary?',
    'circ_appointments_tenure_discipline_gen_085': 'Which body recommends confirmation for officers holding senior posts?',
    'psr_leave_051': 'What procedure applies when an officer wishes to resign from the service?',
    'psr_med_051': 'What is the entitlement of an officer on transfer on promotion?',
    'circ_leave_welfare_allowances_gen_074': 'What do the Schemes of Service indicate when they are issued and revised?',
}

PHRASE_TAGS = {
    'acting appointment': 'acting_appointment',
    'certificate of service': 'certificate_of_service',
    'pension': 'pension_administration',
    'posting instructions': 'posting_compliance',
    'probation': 'probation',
    'confirmation': 'confirmation_in_service',
    'public service rules': 'public_service_rules',
    'psr': 'public_service_rules',
    'leave': 'leave_administration',
    'resign': 'resignation',
    'study leave': 'study_leave',
    'medical': 'medical_welfare',
    'transfer on promotion': 'transfer_on_promotion',
    'hazard allowance': 'hazard_allowance',
    'maternity leave': 'maternity_leave',
    'paternity leave': 'paternity_leave',
    'certificate': 'official_certificate',
    'subsidiary account pension unit': 'subsidiary_account_pension_unit',
    'foreign service academy': 'foreign_service_academy',
    'schemes of service': 'schemes_of_service',
    'compro': 'confirmation_exam',
    'cash transfer': 'cash_transfer',
    'dishonoured cheque': 'dishonoured_cheque',
    'deposit': 'government_deposit',
    'public accounts committee': 'public_accounts_committee',
    'rule': 'psr_rule_reference',
}

STOPWORDS = {
    'a', 'an', 'and', 'applies', 'answer', 'answers', 'best', 'body', 'case', 'choose', 'correctly', 'defines', 'for',
    'from', 'government', 'how', 'in', 'is', 'its', 'meaning', 'normally', 'of', 'office', 'officer', 'officers', 'on',
    'option', 'or', 'period', 'practice', 'provisions', 'public', 'role', 'rules', 'select', 'service', 'should', 'statement',
    'that', 'the', 'their', 'these', 'this', 'to', 'under', 'what', 'when', 'which', 'who', 'within', 'according', 'established',
    'official', 'context', 'administration', 'aligns', 'describes', 'accountable', 'issued', 'revised', 'must', 'duty', 'form',
    'minimum', 'maximum', 'period', 'time', 'days', 'day', 'weeks', 'months', 'year', 'years', 'gen', 'offices', 'ministry',
    'ministries', 'extra', 'ministerial', 'below', 'above', 'newly', 'new', 'other', 'following', 'regarding', 'following'
}

BAD_TAGS = {
    'according', 'established', 'option', 'correctly', 'select', 'best', 'answers', 'answer', 'official', 'practice',
    'within', 'government', 'administration', 'public', 'service', 'context', 'choose', 'role', 'statement', 'describes',
    'aligns', 'psr', 'generated_draft', 'quality_expansion'
}

TRAILING_GARBAGE = [
    re.compile(r'\s*[0-9]+\?$'),
    re.compile(r'\s*[0-9]+$'),
    re.compile(r'\s*?$'),
    re.compile(r'\s*\.$'),
    re.compile(r"\s*'$"),
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
    cleaned = cleaned.replace('necessitate to', 'must')
    cleaned = cleaned.replace('necessitate', 'required')
    cleaned = cleaned.replace('is in charge for', 'is responsible for')
    cleaned = cleaned.replace('is accountable for', 'is responsible for')
    cleaned = cleaned.replace('responsibility for is', '')
    cleaned = cleaned.replace('responsibility for receives', 'who receives')
    cleaned = cleaned.replace('belongs to which role?', '?')
    cleaned = cleaned.replace('aligns with the meaning of the tenure for an intern or a volunteer in the public service', 'is the tenure for an intern or volunteer in the public service')
    cleaned = cleaned.replace('aligns with the meaning of the timing for an officer on a non-pensionable appointment to express their desire for further employment', 'must an officer on a non-pensionable appointment express a desire for further employment')
    cleaned = cleaned.replace('select the option that best answers:', '')
    cleaned = cleaned.replace('select the statement that correctly defines', '')
    cleaned = cleaned.replace('which option correctly addresses:', '')
    cleaned = cleaned.replace('what does the Code of Ethics aim to achieve in the Civil Service', 'What does the Code of Ethics aim to achieve in the Civil Service')
    cleaned = cleaned.replace('A newly recruited officer who has spent six months and above must be allowed to sit for compulsory examinations for confirmation in the service. Which rule specifies this', 'Which rule requires a newly recruited officer who has spent six months and above in service to sit for compulsory confirmation examinations')
    cleaned = cleaned.replace('An officer\'s probationary appointment is terminated or extended based on the recommendation of which authority', 'Which authority recommends whether a probationary appointment should be terminated or extended')
    cleaned = clean_trailing_garbage(cleaned)
    cleaned = normalize_space(cleaned)
    if cleaned and cleaned[0].islower():
        cleaned = cleaned[0].upper() + cleaned[1:]
    if cleaned and not cleaned.endswith('?'):
        cleaned += '?'
    return cleaned


def clean_option(text: str) -> str:
    cleaned = normalize_space(text)
    cleaned = cleaned.replace('necessitate', 'required')
    cleaned = cleaned.replace(' in charge for ', ' responsible for ')
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
        if lowered in {'psr', source_sub.lower() if source_sub else ''}:
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

    keywords = concepts[:4] or ['public_service_rules']
    tags = ['psr']
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
        if str(item.get('source_topic') or '').strip() == 'psr'
    }
    if not target_ids:
        raise SystemExit('No psr targets found in assessment report')

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
    print(f'Updated {updated} psr questions in psr_rules.json')


if __name__ == '__main__':
    main()
