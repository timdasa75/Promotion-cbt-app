#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path('.')


def collect_subcategories(payload):
    if isinstance(payload, dict):
        if isinstance(payload.get('subcategories'), list):
            return [s for s in payload['subcategories'] if isinstance(s, dict)]
        if isinstance(payload.get('domains'), list):
            out = []
            for domain in payload['domains']:
                if isinstance(domain, dict) and isinstance(domain.get('topics'), list):
                    out.extend([s for s in domain['topics'] if isinstance(s, dict)])
            return out
    if isinstance(payload, list):
        return [s for s in payload if isinstance(s, dict)]
    return []


def iterate_questions(subcategory):
    questions = subcategory.get('questions')
    if not isinstance(questions, list):
        return []
    sub_id = subcategory.get('id')
    if questions and isinstance(questions[0], dict) and sub_id and isinstance(questions[0].get(sub_id), list):
        return [q for q in questions[0][sub_id] if isinstance(q, dict)]
    return [q for q in questions if isinstance(q, dict)]


TOPICS = json.loads((ROOT / 'data' / 'topics.json').read_text(encoding='utf-8'))
rows = []
for topic in TOPICS.get('topics', []):
    rel = topic.get('file')
    if not rel:
        continue
    payload = json.loads((ROOT / rel).read_text(encoding='utf-8'))
    for sub in collect_subcategories(payload):
        sub_id = sub.get('id')
        sub_name = sub.get('name', sub_id)
        count = len(iterate_questions(sub))
        if count < 100:
            rows.append((topic.get('name', topic.get('id')), sub_name, count, 100 - count))

rows.sort(key=lambda r: (r[0].lower(), r[1].lower()))
for t, s, c, n in rows:
    print(f"{t} | {s} | {c} | need {n}")
print('total subtopics below 100:', len(rows))
