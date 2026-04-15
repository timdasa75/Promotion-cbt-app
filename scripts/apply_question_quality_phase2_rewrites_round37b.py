#!/usr/bin/env python3
"""Apply duplicate cleanup tweaks after round 37."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / 'data' / 'topics.json'
DEFAULT_LOG_JSON = ROOT / 'docs' / 'question_quality_phase2_applied_rewrites_round37b.json'
DEFAULT_LOG_MD = ROOT / 'docs' / 'question_quality_phase2_applied_rewrites_round37b.md'

REWRITES = {
    'csh_disc_073': {
        'question': 'Which form of communication is an official letter used for in the Civil Service?',
        'explanation': 'An official letter is used for formal communication with other Ministries, parastatals, agencies, and the public. It is different from a memorandum, which is used for communication within the same department or ministry.',
        'keywords': ['official_letter_use', 'formal_correspondence', 'external_communication', 'civil_service_letters'],
        'tags': ['civil_service_admin', 'csh_discipline_conduct', 'official_letter_use', 'formal_correspondence', 'civil_service_letters'],
    },
    'csh_ap_102': {
        'question': 'What does a dispatch book record in registry practice?',
        'explanation': 'A dispatch book records outgoing official correspondence. It supports registry accountability by showing what was sent, when it was sent, and through which channel.',
        'keywords': ['dispatch_book_record', 'registry_practice', 'outgoing_correspondence', 'records_tracking'],
        'tags': ['civil_service_admin', 'csh_administrative_procedures', 'dispatch_book_record', 'registry_practice', 'records_tracking'],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def write_markdown(path: Path, payload):
    applied = payload.get('applied', [])
    lines = [
        '# Question Quality Phase 2 Applied Rewrites Round 37B',
        '',
        f"- Applied rewrites: **{len(applied)}**",
        '',
    ]
    for item in applied:
        lines.append(f"- `{item['question_id']}` [{item['source_file']}]")
        lines.append(f"  - Old: {item['old_question']}")
        lines.append(f"  - New: {item['new_question']}")
    path.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def find_topic_files(root: Path):
    topics = load_json(TOPICS_FILE)
    mapping = {}
    for topic in topics.get('topics', []):
        topic_file = root / str(topic.get('file') or '')
        mapping[str(topic.get('id') or '').strip()] = topic_file
    return mapping


def apply_rewrites(root: Path):
    topic_files = find_topic_files(root)
    docs = {topic: load_json(path) for topic, path in topic_files.items() if path.exists()}
    applied = []

    for question_id, patch in REWRITES.items():
        found = False
        for topic_id, doc in docs.items():
            for subcategory in doc.get('subcategories', []):
                for question in safe_get_questions(subcategory):
                    if question.get('id') != question_id:
                        continue
                    old_question = question.get('question', '')
                    question.update(patch)
                    question['lastReviewed'] = '2026-04-05'
                    applied.append({
                        'question_id': question_id,
                        'source_topic': topic_id,
                        'source_subcategory': subcategory.get('id'),
                        'source_file': str(topic_files[topic_id].relative_to(root)).replace('\\', '/'),
                        'old_question': old_question,
                        'new_question': question.get('question', ''),
                    })
                    found = True
                    break
                if found:
                    break
            if found:
                break
        if not found:
            raise SystemExit(f'Question {question_id} not found')

    for topic_id, doc in docs.items():
        save_json(topic_files[topic_id], doc)

    return applied


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--log-json', type=Path, default=DEFAULT_LOG_JSON)
    parser.add_argument('--log-md', type=Path, default=DEFAULT_LOG_MD)
    return parser.parse_args()


def main():
    args = parse_args()
    applied = apply_rewrites(ROOT)
    payload = {'round': '37b', 'applied': applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f'Applied {len(applied)} rewrites')


if __name__ == '__main__':
    main()
