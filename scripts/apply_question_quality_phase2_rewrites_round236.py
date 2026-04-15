from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'data' / 'leadership_negotiation.json'

UPDATES = {
    'neg_dispute_law_gen_046': {
        'question': 'Which approach best sustains compliance assurance in dispute resolution and labour law work?',
        'explanation': 'Applying approved rules consistently and escalating exceptions sustains compliance assurance because the case remains lawful, reviewable, and properly documented.',
        'keywords': ['compliance_assurance', 'approved_rules', 'exception_escalation', 'labour_law'],
        'tags': ['leadership_management', 'neg_dispute_law', 'compliance_assurance', 'approved_rules', 'exception_escalation', 'labour_law'],
    },
    'neg_dispute_law_gen_077': {
        'question': 'When a labour-law case departs from normal procedure, which approach best handles the exception while preserving accountability?',
        'explanation': 'Applying approved rules consistently and escalating exceptions is the accountable response when a case departs from normal procedure, because it keeps the exception reviewable and properly controlled.',
        'keywords': ['exception_handling', 'accountability', 'approved_rules', 'labour_law'],
        'tags': ['leadership_management', 'neg_dispute_law', 'exception_handling', 'accountability', 'approved_rules', 'labour_law'],
    },
}


def iter_questions(node: dict):
    for sub in node.get('subcategories', []):
        for question in sub.get('questions', []):
            if isinstance(question, dict):
                yield question


def main() -> None:
    data = json.loads(PATH.read_text(encoding='utf-8'))
    seen = set()
    for question in iter_questions(data):
        qid = str(question.get('id') or '').strip()
        if qid not in UPDATES:
            continue
        patch = UPDATES[qid]
        question['question'] = patch['question']
        question['explanation'] = patch['explanation']
        question['keywords'] = patch['keywords']
        question['tags'] = patch['tags']
        seen.add(qid)
    missing = sorted(set(UPDATES) - seen)
    if missing:
        raise SystemExit(f'Missing ids: {missing}')
    PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print('Updated neg_dispute_law_gen_046 and neg_dispute_law_gen_077')


if __name__ == '__main__':
    main()
