from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / 'data' / 'leadership_negotiation.json'
ASSESSMENT_PATH = ROOT / 'docs' / 'question_quality_assessment.json'

FILLER_PREFIX_PATTERNS = [
    re.compile(r'^According to established rules, which option correctly addresses:\s*', re.I),
    re.compile(r'^According to established rules, select the option that best answers:\s*', re.I),
    re.compile(r'^According to established rules, which option best describes\s*', re.I),
    re.compile(r'^According to established rules, choose the best answer for:\s*', re.I),
    re.compile(r'^In the public service context, which option correctly addresses:\s*', re.I),
    re.compile(r'^In the public service context, choose the best answer for:\s*', re.I),
    re.compile(r'^In official practice, select the option that best answers:\s*', re.I),
    re.compile(r'^In official practice, which option best describes\s*', re.I),
    re.compile(r'^Within government administration, select the option that best answers:\s*', re.I),
    re.compile(r'^Within government administration, choose the best answer for:\s*', re.I),
    re.compile(r'^Within government administration,\s*', re.I),
]

TEMPLATE_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r'^For effective (?P<area>.+?), what is the most appropriate approach to secure (?P<goal>.+?)\?$', re.I), 'Which approach best secures {goal} in {area}?'),
    (re.compile(r'^When handling (?P<area>.+?), which choice reflects proper (?P<goal>.+?) standards\??$', re.I), 'Which choice best reflects {goal} in {area}?'),
    (re.compile(r'^Which practice should a responsible officer prioritize to sustain (?P<goal>.+?) in (?P<area>.+?)\?$', re.I), 'Which practice best sustains {goal} in {area}?'),
    (re.compile(r'^In the context of (?P<area>.+?), which action best demonstrates (?P<goal>.+?)\?$', re.I), 'Which action best demonstrates {goal} in {area}?'),
    (re.compile(r'^Which option most strongly aligns with good public-service practice on (?P<goal>.+?) within (?P<area>.+?)\?$', re.I), 'Which option best reflects good public-service practice on {goal} in {area}?'),
    (re.compile(r'^During routine (?P<area>.+?) operations, which approach most strongly supports (?P<goal>.+?)\?$', re.I), 'Which approach best supports {goal} during routine {area} operations?'),
]

PHRASE_TAGS = {
    'b.u.': 'bring_up_notation',
    'file note': 'file_note',
    'file management': 'file_management',
    'strategic alignment': 'strategic_alignment',
    'change management': 'change_management',
    'performance report': 'performance_report',
    'performance appraisal': 'performance_appraisal',
    'balanced scorecard': 'balanced_scorecard',
    'stakeholder negotiation': 'stakeholder_negotiation',
    'team leadership': 'team_leadership',
    'risk control': 'risk_control',
    'study leave': 'study_leave',
    'personal allowance': 'personal_allowance',
    'substantive basic emolument': 'substantive_basic_emolument',
    'special increments': 'special_increments',
    'smart goals': 'smart_goals',
    'transparent decision-making': 'decision_transparency',
    'decision-making': 'decision_transparency',
    'immediate supervisor': 'supervisory_review',
    'withheld increment': 'withheld_increment',
}

STOPWORDS = {
    'a', 'an', 'and', 'approach', 'best', 'by', 'for', 'from', 'good', 'how', 'in', 'is', 'its', 'lawfully',
    'management', 'most', 'of', 'on', 'option', 'or', 'performance', 'practice', 'proper', 'public', 'service',
    'should', 'sound', 'supports', 'that', 'the', 'to', 'under', 'what', 'when', 'which', 'why', 'with', 'work',
    'works', 'officer', 'officers', 'unit', 'role', 'chief', 'established', 'rules', 'correctly', 'addresses',
    'select', 'answer', 'answers', 'context', 'official', 'within', 'government', 'administration', 'routine',
    'effective', 'functions', 'leadership', 'negotiation', 'labour', 'law', 'during', 'sustain', 'reflects',
    'demonstrates', 'secure', 'secures', 'choice', 'action', 'accountable', 'implementation', 'responsible',
}

BAD_TAGS = {
    'according', 'established', 'option', 'correctly', 'select', 'best', 'answers', 'answer', 'official', 'practice',
    'within', 'government', 'administration', 'public', 'service', 'context', 'choose', 'role'
}

QUESTION_OVERRIDES = {
    'leadership_mpf_056': 'Which approach best secures strategic alignment in management and performance work?',
}


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


def normalize_area(text: str) -> str:
    text = text.replace('&', 'and')
    text = re.sub(r'\s+', ' ', text)
    text = text.strip(' .')
    if text.lower() == 'management functions and performance':
        return 'management and performance work'
    return text


def normalize_goal(text: str) -> str:
    text = text.replace('&', 'and')
    text = re.sub(r'\s+', ' ', text)
    return text.strip(' .')


def clean_question(question_id: str, text: str) -> str:
    if question_id in QUESTION_OVERRIDES:
        return QUESTION_OVERRIDES[question_id]
    cleaned = normalize_space(text)
    for pattern in FILLER_PREFIX_PATTERNS:
        cleaned = pattern.sub('', cleaned)
    for pattern, template in TEMPLATE_PATTERNS:
        match = pattern.match(cleaned)
        if match:
            area = normalize_area(match.group('area'))
            goal = normalize_goal(match.group('goal'))
            cleaned = template.format(area=area, goal=goal)
            break
    cleaned = cleaned.replace('Management Functions & Performance', 'management and performance work')
    cleaned = cleaned.replace('Management Functions and Performance', 'management and performance work')
    cleaned = cleaned.replace('Leadership Principles & Styles', 'leadership practice')
    cleaned = cleaned.replace('Strategic Management & Planning', 'strategic management and planning')
    cleaned = cleaned.replace('necessitate records', 'required records')
    cleaned = normalize_space(cleaned)
    if cleaned and cleaned[0].islower():
        cleaned = cleaned[0].upper() + cleaned[1:]
    return cleaned


def clean_option(text: str) -> str:
    cleaned = text.replace('necessitate records', 'required records')
    cleaned = cleaned.replace('necessitate', 'required')
    cleaned = normalize_space(cleaned)
    return cleaned


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
        if lowered in {'leadership_management', source_sub.lower() if source_sub else ''}:
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

    keywords = concepts[:4]
    if not keywords:
        keywords = ['leadership_practice']

    tags = ['leadership_management']
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
        if str(item.get('source_topic') or '').strip() == 'leadership_management'
    }
    if not target_ids:
        raise SystemExit('No leadership_management targets found in assessment report')

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
    print(f'Updated {updated} leadership_management questions in leadership_negotiation.json')


if __name__ == '__main__':
    main()
