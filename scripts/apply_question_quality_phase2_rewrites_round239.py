from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / 'data' / 'policy_analysis.json'
ASSESSMENT_PATH = ROOT / 'docs' / 'question_quality_assessment.json'

FILLER_PREFIX_PATTERNS = [
    re.compile(r'^According to established rules, select the option that best answers:\s*', re.I),
    re.compile(r'^According to established rules, which option correctly addresses:\s*', re.I),
    re.compile(r'^According to established rules, which option best describes\s*', re.I),
    re.compile(r'^In the public service context, choose the best answer for:\s*', re.I),
    re.compile(r'^In the public service context, which option correctly addresses:\s*', re.I),
    re.compile(r'^Within government administration, select the option that best answers:\s*', re.I),
    re.compile(r'^Within government administration, choose the best answer for:\s*', re.I),
    re.compile(r'^Within government administration, which option most strongly aligns with good public-service practice on\s*', re.I),
    re.compile(r'^Within government administration,\s*', re.I),
    re.compile(r'^Choose the best answer for:\s*', re.I),
]

TEMPLATE_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r'^Which practice should a responsible officer prioritize to sustain (?P<goal>.+?) in (?P<area>.+?)\??$', re.I), 'Which practice best sustains {goal} in {area}?'),
    (re.compile(r'^Which practice should an officer in charge prioritize to sustain (?P<goal>.+?) in (?P<area>.+?)\??$', re.I), 'Which practice best sustains {goal} in {area}?'),
    (re.compile(r'^Which practice should an accountable officer prioritize to sustain (?P<goal>.+?) in (?P<area>.+?)\??$', re.I), 'Which practice best sustains {goal} in {area}?'),
    (re.compile(r'^Which option most strongly aligns with good public-service practice on (?P<goal>.+?) within (?P<area>.+?)\??$', re.I), 'Which option best reflects good public-service practice on {goal} in {area}?'),
    (re.compile(r'^Which approach best supports accountable implementation when (?P<context>.+?) in (?P<area>.+?)\??$', re.I), 'Which approach best supports accountable implementation when {context} in {area}?'),
    (re.compile(r'^During routine (?P<area>.+?) operations, which approach best ensures (?P<goal>.+?)\s*\'?\s*in line with public-sector accountability expectations\??$', re.I), 'Which approach best ensures {goal} during routine {area} operations?'),
    (re.compile(r'^When applying rules in (?P<area>.+?), which option aligns best with (?P<goal>.+?)\s*\'?\s*while maintaining fairness and legal compliance\??$', re.I), 'Which option best aligns with {goal} in {area} while maintaining fairness and legal compliance?'),
    (re.compile(r'^To improve accountability in (?P<area>.+?), which practice best supports (?P<goal>.+?)\s*\'?\s*in line with public-sector accountability expectations\??$', re.I), 'Which practice best supports {goal} in {area}?'),
    (re.compile(r'^A ministry unit is updating its workflow for (?P<area>.+?)\. Which choice most effectively promotes (?P<goal>.+?)\s*\'?\s*while preserving records for audit and oversight\??$', re.I), 'Which choice best promotes {goal} while preserving records for audit and oversight in {area}?'),
    (re.compile(r'^Which of the following is the strongest control action for (?P<goal>.+?) in (?P<area>.+?)\s*\'?\s*in line with public-sector accountability expectations\??$', re.I), 'Which action best supports {goal} in {area}?'),
]

QUESTION_OVERRIDES = {
    'pol_analysis_methods_gen_076': 'A minute should summarize the facts of the case as well as what?',
    'pol_analysis_methods_gen_079': 'According to the Civil Service Handbook, what catalytic role should the Civil Service discharge?',
    'pol_analysis_methods_gen_098': 'Which practice best sustains compliance assurance in policy analysis methods?',
}

PHRASE_TAGS = {
    'minute': 'minute_writing',
    'facts of the case': 'case_summary',
    'parastatal': 'parastatal_accountability',
    'chief executive': 'chief_executive_accountability',
    'catalytic role': 'catalytic_role',
    'civil service handbook': 'civil_service_handbook',
    'governance': 'governance',
    'evidence quality': 'evidence_quality',
    'traceability': 'traceability',
    'fairness': 'fairness',
    'accountable implementation': 'accountable_implementation',
    'risk management': 'risk_management',
    'service integrity': 'service_integrity',
    'impact evaluation': 'impact_evaluation',
    'planning workflow': 'planning_workflow',
    'policy formulation': 'policy_formulation',
    'compliance assurance': 'compliance_assurance',
    'log management': 'log_management',
    'performance standards': 'performance_standards',
    'implementation planning': 'implementation_planning',
    'decision-making': 'decision_transparency',
    'transparent decision-making': 'decision_transparency',
    'public sector planning': 'public_sector_planning',
    'policy implementation and evaluation': 'policy_implementation_evaluation',
    'policy implementation & evaluation': 'policy_implementation_evaluation',
    'policy formulation and cycle': 'policy_formulation_cycle',
    'policy formulation & cycle': 'policy_formulation_cycle',
    'policy analysis methods': 'policy_analysis_methods',
}

STOPWORDS = {
    'a', 'an', 'and', 'approach', 'best', 'by', 'case', 'choice', 'choose', 'context', 'cycle', 'decision', 'during',
    'effective', 'ensures', 'evaluation', 'evidence', 'for', 'good', 'in', 'implementation', 'improves', 'is', 'its',
    'lawful', 'maintaining', 'methods', 'most', 'officer', 'operations', 'or', 'planning', 'policy', 'practice',
    'preserves', 'prioritize', 'public', 'quality', 'reviewed', 'routine', 'sector', 'service', 'should', 'sound',
    'step', 'supports', 'sustain', 'the', 'to', 'transparent', 'unit', 'updating', 'what', 'when', 'which', 'while',
    'within', 'work', 'workflow', 'according', 'established', 'rules', 'option', 'correctly', 'addresses', 'select',
    'answer', 'answers', 'government', 'administration', 'official', 'public-service', 'publicsector', 'responsible',
    'accountable', 'charge', 'desk', 'officer', 'ministry', 'workflows', 'matter', 'time-sensitive', 'gaps',
}

BAD_TAGS = {
    'according', 'established', 'option', 'correctly', 'select', 'best', 'answers', 'answer', 'official', 'practice',
    'within', 'government', 'administration', 'public', 'service', 'context', 'choose', 'role', 'quality_expansion',
    'policy_analysis'
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
    return text.strip(' .').lower()


def normalize_goal(text: str) -> str:
    text = text.replace('&', 'and')
    text = text.replace("'", '')
    text = re.sub(r'\s+', ' ', text)
    return text.strip(' .').lower()


def title_like_area(area: str) -> str:
    replacements = {
        'policy formulation and cycle': 'policy formulation and cycle work',
        'policy implementation and evaluation': 'policy implementation and evaluation',
        'public sector planning': 'public sector planning',
        'policy analysis methods': 'policy analysis methods',
    }
    return replacements.get(area, area)


def clean_question(question_id: str, text: str) -> str:
    if question_id in QUESTION_OVERRIDES:
        return QUESTION_OVERRIDES[question_id]
    cleaned = normalize_space(text)
    for pattern in FILLER_PREFIX_PATTERNS:
        cleaned = pattern.sub('', cleaned)
    for pattern, template in TEMPLATE_PATTERNS:
        match = pattern.match(cleaned)
        if match:
            goal = normalize_goal(match.group('goal')) if 'goal' in match.groupdict() else ''
            area = title_like_area(normalize_area(match.group('area')))
            context = normalize_goal(match.group('context')) if 'context' in match.groupdict() else ''
            cleaned = template.format(goal=goal, area=area, context=context)
            break
    cleaned = cleaned.replace('Policy Analysis Methods', 'policy analysis methods')
    cleaned = cleaned.replace('Public Sector Planning', 'public sector planning')
    cleaned = cleaned.replace('Policy Implementation & Evaluation', 'policy implementation and evaluation')
    cleaned = cleaned.replace('Policy Formulation & Cycle', 'policy formulation and cycle work')
    cleaned = cleaned.replace(' in charge officer ', ' officer ')
    cleaned = cleaned.replace('  ', ' ')
    cleaned = cleaned.replace("'", '')
    cleaned = normalize_space(cleaned)
    if cleaned and cleaned[0].islower():
        cleaned = cleaned[0].upper() + cleaned[1:]
    if cleaned and not cleaned.endswith('?'):
        cleaned += '?'
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
        if lowered.startswith('refill-') or lowered == 'generated_draft':
            continue
        if lowered in {'policy_analysis', source_sub.lower() if source_sub else ''}:
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

    keywords = concepts[:4] or ['policy_governance']
    tags = ['policy_analysis']
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
        if str(item.get('source_topic') or '').strip() == 'policy_analysis'
    }
    if not target_ids:
        raise SystemExit('No policy_analysis targets found in assessment report')

    data = load_json(DATA_PATH)
    updated = 0
    for subcategory in data.get('subcategories', []):
        for question in safe_get_questions(subcategory):
            question_id = str(question.get('id') or '').strip()
            if question_id not in target_ids:
                continue
            question['question'] = clean_question(question_id, str(question.get('question') or ''))
            keywords, tags = build_metadata(question)
            question['keywords'] = keywords
            question['tags'] = tags
            updated += 1

    DATA_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Updated {updated} policy_analysis questions in policy_analysis.json')


if __name__ == '__main__':
    main()
