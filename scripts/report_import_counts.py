#!/usr/bin/env python3
import json
import subprocess
from pathlib import Path

ROOT = Path('.')
TOPICS_PATH = ROOT / 'data' / 'topics.json'
OUT_MD = ROOT / 'docs' / 'import_question_counts.md'


def load_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def load_git_json(rel_path: str):
    try:
        data = subprocess.check_output(['git', 'show', f'HEAD:{rel_path}'], stderr=subprocess.DEVNULL)
    except Exception:
        return None
    return json.loads(data.decode('utf-8'))


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


def build_counts(payload):
    counts = {}
    for sub in collect_subcategories(payload):
        sub_id = str(sub.get('id') or '')
        sub_name = str(sub.get('name') or sub_id)
        counts[sub_id] = {'name': sub_name, 'count': len(iterate_questions(sub))}
    return counts


def main():
    cur_topics = load_json(TOPICS_PATH)
    rows = []
    for topic in [t for t in cur_topics.get('topics', []) if isinstance(t, dict)]:
        topic_name = str(topic.get('name') or topic.get('id') or '')
        rel_file = str(topic.get('file') or '')
        if not rel_file:
            continue
        cur_payload = load_json(ROOT / rel_file)
        base_payload = load_git_json(rel_file)
        cur_counts = build_counts(cur_payload)
        base_counts = build_counts(base_payload) if base_payload else {}
        for sub in topic.get('subcategories', []):
            if not isinstance(sub, dict):
                continue
            sub_id = str(sub.get('id') or '')
            sub_name = str(sub.get('name') or sub_id)
            cur_count = cur_counts.get(sub_id, {'count': 0})['count']
            base_count = base_counts.get(sub_id, {'count': 0})['count']
            rows.append((topic_name, sub_name, base_count, cur_count, cur_count - base_count))

    rows.sort(key=lambda r: (r[0].lower(), r[1].lower()))
    lines = [
        '| Topic | Subtopic | Original | New | Delta |',
        '|---|---|---:|---:|---:|',
    ]
    for t, s, o, n, d in rows:
        lines.append(f'| {t} | {s} | {o} | {n} | {d:+d} |')
    md = '\n'.join(lines) + '\n'
    OUT_MD.write_text(md, encoding='utf-8')
    print(md)


if __name__ == '__main__':
    main()
