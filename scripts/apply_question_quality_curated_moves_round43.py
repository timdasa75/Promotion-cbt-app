# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_FILES = {
    'data/constitutional_foi.json': {
        'clg_constitutional_governance_gen_009': {
            'source_subcategory': 'clg_constitutional_governance',
            'new_id': 'csh_ap_221',
            'legacy': ['clg_constitutional_governance_gen_009'],
        },
        'clg_constitutional_governance_gen_011': {
            'source_subcategory': 'clg_constitutional_governance',
            'new_id': 'csh_ap_222',
            'legacy': ['clg_constitutional_governance_gen_011'],
        },
    },
    'data/general_current_affairs.json': {
        'ca_national_governance_gen_009': {
            'source_subcategory': 'ca_national_governance',
            'new_id': 'csh_ap_223',
            'legacy': ['ca_national_governance_gen_009'],
        },
        'ca_national_governance_gen_011': {
            'source_subcategory': 'ca_national_governance',
            'new_id': 'csh_ap_224',
            'legacy': ['ca_national_governance_gen_011'],
        },
    },
}
TARGET = ROOT / 'data' / 'civil_service_ethics.json'
TARGET_SUBCATEGORY = 'csh_administrative_procedures'


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


def build_target_item(src: dict, new_id: str, legacy: list[str]) -> dict:
    keywords = list(src.get('keywords', []))
    if 'civil_service_admin' not in keywords:
        keywords.insert(0, 'civil_service_admin')
    if 'csh_administrative_procedures' not in keywords:
        keywords.append('csh_administrative_procedures')
    tags = list(src.get('tags', []))
    for tag in ['civil_service_admin', 'csh_administrative_procedures']:
        if tag not in tags:
            tags.insert(0, tag)
    return {
        'id': new_id,
        'question': src['question'],
        'options': src['options'],
        'correct': src['correct'],
        'explanation': src['explanation'],
        'difficulty': src.get('difficulty', 'easy'),
        'chapter': 'Administrative Procedures - Expansion Set',
        'keywords': keywords,
        'source': 'moved_from_governance',
        'sourceDocument': src.get('sourceDocument', 'Federal Civil Service Handbook and Circulars'),
        'sourceSection': 'Administrative Procedures',
        'year': src.get('year', 2009),
        'lastReviewed': date.today().isoformat(),
        'glBands': src.get('glBands', ['GL15_16', 'GL16_17']),
        'marks': src.get('marks', 1),
        'questionType': src.get('questionType', 'single_best_answer'),
        'reviewStatus': 'approved',
        'tags': tags,
        'sourceTopicId': 'civil_service_admin',
        'sourceSubcategoryId': TARGET_SUBCATEGORY,
        'sourceSubcategoryName': 'Administrative Procedures',
        'legacyQuestionIds': legacy,
    }


def main() -> None:
    target_data = json.loads(TARGET.read_text(encoding='utf-8'))
    moved_items = []
    for rel_path, mapping in SOURCE_FILES.items():
        source_data = json.loads((ROOT / rel_path).read_text(encoding='utf-8'))
        for qid, payload in mapping.items():
            src_sub = find_subcategory(source_data, payload['source_subcategory'])
            src = remove_item(src_sub['questions'], qid)
            moved_items.append(build_target_item(src, payload['new_id'], payload['legacy']))
        (ROOT / rel_path).write_text(json.dumps(source_data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    target_sub = find_subcategory(target_data, TARGET_SUBCATEGORY)
    target_sub['questions'].extend(moved_items)
    TARGET.write_text(json.dumps(target_data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Moved {len(moved_items)} questions into {TARGET}')


if __name__ == '__main__':
    main()
