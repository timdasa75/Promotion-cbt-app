from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'data' / 'civil_service_ethics.json'

ETH_CONFLICT_IDS = {
    'eth_conflict_interest_gen_072', 'eth_conflict_interest_gen_073', 'eth_conflict_interest_gen_074',
    'eth_conflict_interest_gen_075', 'eth_conflict_interest_gen_076', 'eth_conflict_interest_gen_077',
    'eth_conflict_interest_gen_078', 'eth_conflict_interest_gen_079', 'eth_conflict_interest_gen_080',
    'eth_conflict_interest_gen_081', 'eth_conflict_interest_gen_082', 'eth_conflict_interest_gen_083',
    'eth_conflict_interest_gen_084', 'eth_conflict_interest_gen_086', 'eth_conflict_interest_gen_087',
    'eth_conflict_interest_gen_089', 'eth_conflict_interest_gen_090', 'eth_conflict_interest_gen_091',
    'eth_conflict_interest_gen_092', 'eth_conflict_interest_gen_093', 'eth_conflict_interest_gen_094',
    'eth_conflict_interest_gen_095', 'eth_conflict_interest_gen_096',
}

ETH_MISCONDUCT_IDS = {
    'eth_misconduct_gen_070', 'eth_misconduct_gen_071', 'eth_misconduct_gen_072', 'eth_misconduct_gen_073',
    'eth_misconduct_gen_074', 'eth_misconduct_gen_075', 'eth_misconduct_gen_076', 'eth_misconduct_gen_077',
    'eth_misconduct_gen_078', 'eth_misconduct_gen_079', 'eth_misconduct_gen_080', 'eth_misconduct_gen_083',
    'eth_misconduct_gen_084', 'eth_misconduct_gen_085', 'eth_misconduct_gen_086', 'eth_misconduct_gen_087',
    'eth_misconduct_gen_088', 'eth_misconduct_gen_089', 'eth_misconduct_gen_090', 'eth_misconduct_gen_091',
    'eth_misconduct_gen_092', 'eth_misconduct_gen_093',
}

QUESTION_UPDATES = {
    'eth_conflict_interest_gen_073': 'Which practice best supports compliance assurance in conflict-of-interest work?',
    'eth_conflict_interest_gen_080': 'Which practice best sustains documented procedure in conflict-of-interest work?',
    'eth_conflict_interest_gen_082': 'Which practice best upholds service integrity in conflict-of-interest work within approved timelines?',
    'eth_misconduct_gen_076': 'Which practice best supports compliance assurance in misconduct and discipline work?',
    'eth_misconduct_gen_079': 'Which practice should an officer prioritize to sustain service integrity in misconduct and discipline work?',
    'eth_misconduct_gen_086': 'Which practice best supports anti-corruption safeguards in misconduct and discipline work?',
    'eth_misconduct_gen_092': 'Which approach best preserves service integrity in misconduct and discipline work?',
}

KEYWORD_UPDATES = {
    'eth_conflict_interest_gen_073': ['conflict_of_interest', 'compliance_assurance', 'consistent_rule_application', 'exception_escalation'],
    'eth_conflict_interest_gen_080': ['conflict_of_interest', 'documented_procedure', 'complete_records', 'policy_compliance'],
    'eth_conflict_interest_gen_082': ['conflict_of_interest', 'service_integrity', 'disclosure', 'approved_timelines'],
    'eth_misconduct_gen_076': ['misconduct', 'discipline', 'compliance_assurance', 'consistent_rule_application'],
    'eth_misconduct_gen_079': ['misconduct', 'discipline', 'service_integrity', 'impartiality'],
    'eth_misconduct_gen_086': ['misconduct', 'discipline', 'anti_corruption_safeguards', 'proper_reporting_channels'],
    'eth_misconduct_gen_092': ['misconduct', 'discipline', 'service_integrity', 'impartial_reporting'],
}

OPTION_UPDATES = {
    'eth_conflict_interest_gen_082': [
        'Treat exceptions as routine without documented justification.',
        'Avoid conflicts of interest, disclose relevant constraints, and act within approved timelines.',
        'Close cases without validating facts or keeping proper records.',
        'Rely on informal instructions without documentary evidence.',
    ],
    'eth_misconduct_gen_079': [
        'Apply impartial standards and disclose any conflicting interest that could affect the case.',
        'Rely on informal instructions without documentary evidence.',
        'Delay decisions until issues escalate into avoidable crises.',
        'Close cases without validating facts or keeping proper records.',
    ],
    'eth_misconduct_gen_092': [
        'Close cases without validating facts or keeping proper records.',
        'Disclose conflicts, act impartially, and follow approved reporting channels.',
        'Treat exceptions as routine without documented justification.',
        'Rely on informal instructions without documentary evidence.',
    ],
}

TOPIC_UPDATES = {
    'eth_conflict_interest_gen_072': 'Conflict of Interest',
    'eth_conflict_interest_gen_073': 'Conflict of Interest',
    'eth_conflict_interest_gen_074': 'Conflict of Interest',
    'eth_conflict_interest_gen_075': 'Conflict of Interest',
    'eth_conflict_interest_gen_076': 'Conflict of Interest',
    'eth_conflict_interest_gen_077': 'Conflict of Interest',
    'eth_conflict_interest_gen_079': 'Conflict of Interest',
    'eth_conflict_interest_gen_080': 'Conflict of Interest',
    'eth_conflict_interest_gen_081': 'Conflict of Interest',
    'eth_conflict_interest_gen_082': 'Conflict of Interest',
    'eth_conflict_interest_gen_083': 'Conflict of Interest',
    'eth_conflict_interest_gen_084': 'Conflict of Interest',
    'eth_conflict_interest_gen_086': 'Conflict of Interest',
    'eth_conflict_interest_gen_087': 'Conflict of Interest',
    'eth_conflict_interest_gen_089': 'Conflict of Interest',
    'eth_conflict_interest_gen_091': 'Conflict of Interest',
    'eth_conflict_interest_gen_092': 'Conflict of Interest',
    'eth_conflict_interest_gen_093': 'Conflict of Interest',
    'eth_conflict_interest_gen_094': 'Conflict of Interest',
    'eth_conflict_interest_gen_095': 'Conflict of Interest',
    'eth_conflict_interest_gen_096': 'Conflict of Interest',
    'eth_conflict_interest_gen_078': 'PSR Misconduct',
    'eth_conflict_interest_gen_090': 'PSR Misconduct',
    'eth_misconduct_gen_070': 'PSR Misconduct',
    'eth_misconduct_gen_071': 'PSR Misconduct',
    'eth_misconduct_gen_072': 'PSR Misconduct',
    'eth_misconduct_gen_073': 'PSR Misconduct',
    'eth_misconduct_gen_074': 'PSR Misconduct',
    'eth_misconduct_gen_075': 'PSR Misconduct',
    'eth_misconduct_gen_076': 'PSR Misconduct',
    'eth_misconduct_gen_077': 'PSR & Ethics',
    'eth_misconduct_gen_078': 'PSR Misconduct',
    'eth_misconduct_gen_079': 'PSR Misconduct',
    'eth_misconduct_gen_080': 'PSR Misconduct',
    'eth_misconduct_gen_083': 'PSR Misconduct',
    'eth_misconduct_gen_084': 'PSR Misconduct',
    'eth_misconduct_gen_085': 'PSR Misconduct',
    'eth_misconduct_gen_086': 'PSR Misconduct',
    'eth_misconduct_gen_087': 'PSR Misconduct',
    'eth_misconduct_gen_088': 'PSR Misconduct',
    'eth_misconduct_gen_089': 'PSR Misconduct',
    'eth_misconduct_gen_090': 'PSR Misconduct',
    'eth_misconduct_gen_091': 'PSR Misconduct',
    'eth_misconduct_gen_092': 'PSR Misconduct',
    'eth_misconduct_gen_093': 'PSR Misconduct',
}


def slugify(value: str) -> str:
    value = value.strip().lower().replace('&', ' and ')
    value = re.sub(r'[^a-z0-9]+', '_', value)
    value = re.sub(r'_+', '_', value).strip('_')
    return value


def build_tags(keywords: list[str], subcategory: str) -> list[str]:
    tags: list[str] = ['ethics']
    for kw in keywords:
        slug = slugify(kw)
        if slug and slug not in tags:
            tags.append(slug)
        if len(tags) == 4:
            break
    if subcategory not in tags:
        tags.append(subcategory)
    return tags


def update_questions(data: dict) -> list[str]:
    updated: list[str] = []
    target_ids = ETH_CONFLICT_IDS | ETH_MISCONDUCT_IDS

    for sub in data['subcategories']:
        sub_id = sub['id']
        for q in sub.get('questions', []):
            qid = q['id']
            if qid not in target_ids:
                continue
            if qid in QUESTION_UPDATES:
                q['question'] = QUESTION_UPDATES[qid]
            if qid in KEYWORD_UPDATES:
                q['keywords'] = KEYWORD_UPDATES[qid]
            if qid in OPTION_UPDATES:
                q['options'] = OPTION_UPDATES[qid]
            q['tags'] = build_tags(q.get('keywords', []), sub_id)
            if qid in TOPIC_UPDATES:
                q['topic'] = TOPIC_UPDATES[qid]
            updated.append(qid)
    return updated


def main() -> None:
    data = json.loads(PATH.read_text(encoding='utf-8'))
    updated = update_questions(data)
    PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Updated {len(updated)} questions in {PATH.name}')
    for qid in updated:
        print(qid)


if __name__ == '__main__':
    main()
