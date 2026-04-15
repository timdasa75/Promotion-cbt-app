# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data' / 'general_current_affairs.json'
TARGET = ROOT / 'data' / 'civil_service_ethics.json'
MOVE_MAP = {
    'ca_general_gen_017': {
        'source_subcategory': 'ca_general',
        'new_id': 'csh_ap_227',
        'legacy': ['ca_general_gen_017'],
    },
}


def find_subcategory(container: dict, subcategory_id: str) -> dict:
    for sub in container['subcategories']:
        if sub.get('id') == subcategory_id:
            return sub
    raise KeyError(subcategory_id)


def remove_item(items: list[dict], qid: str) -> dict:
    for index, item in enumerate(items):
        if item.get('id') == qid:
            return items.pop(index)
    raise KeyError(qid)


def build_target_item(src: dict, payload: dict) -> dict:
    keywords = list(src.get('keywords', []))
    if 'civil_service_admin' not in keywords:
        keywords.insert(0, 'civil_service_admin')
    if 'csh_administrative_procedures' not in keywords:
        keywords.append('csh_administrative_procedures')
    if 'records_management' not in keywords:
        keywords.append('records_management')
    tags = list(src.get('tags', []))
    for tag in ['civil_service_admin', 'csh_administrative_procedures']:
        if tag not in tags:
            tags.insert(0, tag)
    return {
        'id': payload['new_id'],
        'question': 'What is the best approach to secure log management in an office registry?',
        'options': [
            'Keep accurate files and update status at each control point.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
            'Apply rules inconsistently.',
        ],
        'correct': 0,
        'explanation': 'Log management is stronger when files are accurate and updated at each control point.',
        'difficulty': src.get('difficulty', 'easy'),
        'chapter': 'Administrative Procedures - Expansion Set',
        'keywords': keywords,
        'source': 'moved_from_general_current_affairs',
        'sourceDocument': src.get('sourceDocument', 'Government Current Affairs Compendium'),
        'sourceSection': 'Administrative Procedures',
        'year': src.get('year', 2026),
        'lastReviewed': date.today().isoformat(),
        'glBands': src.get('glBands', ['GL14_15', 'GL15_16', 'GL16_17']),
        'marks': src.get('marks', 1),
        'questionType': src.get('questionType', 'single_best_answer'),
        'reviewStatus': 'approved',
        'tags': tags,
        'sourceTopicId': 'civil_service_admin',
        'sourceSubcategoryId': 'csh_administrative_procedures',
        'sourceSubcategoryName': 'Administrative Procedures',
        'legacyQuestionIds': payload['legacy'],
    }


def main() -> None:
    source_data = json.loads(SOURCE.read_text(encoding='utf-8'))
    target_data = json.loads(TARGET.read_text(encoding='utf-8'))
    moved_items = []
    for qid, payload in MOVE_MAP.items():
        src_sub = find_subcategory(source_data, payload['source_subcategory'])
        src = remove_item(src_sub['questions'][0]['ca_general'], qid)
        moved_items.append(build_target_item(src, payload))
    target_sub = find_subcategory(target_data, 'csh_administrative_procedures')
    target_sub['questions'].extend(moved_items)
    SOURCE.write_text(json.dumps(source_data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    TARGET.write_text(json.dumps(target_data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Moved {len(moved_items)} questions from {SOURCE} to {TARGET}')


if __name__ == '__main__':
    main()
