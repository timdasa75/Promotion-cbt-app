# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data' / 'public_procurement.json'
TARGET = ROOT / 'data' / 'civil_service_ethics.json'

MOVE_MAP = {
    'proc_objectives_institutions_gen_017': {
        'source_subcategory': 'proc_objectives_institutions',
        'new_id': 'csh_ap_217',
        'question': 'Which record-management practice best keeps an objectives-and-institutions file reviewable?',
        'options': [
            'Maintain accurate files and update status at each control point.',
            'Apply rules inconsistently.',
            'Bypass review controls.',
            'Prioritize convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Record management is stronger when the file stays current and each control point is reflected in the record.',
        'keywords': ['civil_service_admin', 'csh_administrative_procedures', 'record_management', 'status_updates'],
        'legacy': ['proc_objectives_institutions_gen_017'],
    },
    'ppa_ethic_071': {
        'source_subcategory': 'proc_transparency_ethics',
        'new_id': 'csh_ap_218',
        'question': 'What information should the Duplicate Note-Book System record when a file is sent out?',
        'options': [
            'The file number, date, and destination.',
            'Only the meeting minutes.',
            'Only personal notes.',
            'A duplicate copy of the whole file.',
        ],
        'correct': 0,
        'explanation': 'The Duplicate Note-Book System records the file number, date, and destination when a file is transmitted.',
        'keywords': ['civil_service_admin', 'csh_administrative_procedures', 'duplicate_note_book', 'file_transmission'],
        'legacy': ['ppa_ethic_071'],
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
    return {
        'id': payload['new_id'],
        'question': payload['question'],
        'options': payload['options'],
        'correct': payload['correct'],
        'explanation': payload['explanation'],
        'difficulty': src.get('difficulty', 'easy'),
        'chapter': 'Administrative Procedures - Expansion Set',
        'keywords': payload['keywords'],
        'source': 'moved_from_procurement',
        'sourceDocument': 'Federal Civil Service Handbook and Circulars',
        'sourceSection': 'Administrative Procedures',
        'year': src.get('year', 2009),
        'lastReviewed': date.today().isoformat(),
        'glBands': src.get('glBands', ['GL15_16', 'GL16_17']),
        'marks': src.get('marks', 1),
        'questionType': src.get('questionType', 'single_best_answer'),
        'reviewStatus': 'approved',
        'tags': ['civil_service_admin', 'administrative_procedures', *[t for t in payload['keywords'] if t not in ['civil_service_admin', 'csh_administrative_procedures']]],
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
        src = remove_item(src_sub['questions'], qid)
        moved_items.append(build_target_item(src, payload))

    target_sub = find_subcategory(target_data, 'csh_administrative_procedures')
    target_sub['questions'].extend(moved_items)

    SOURCE.write_text(json.dumps(source_data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    TARGET.write_text(json.dumps(target_data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Moved {len(moved_items)} questions from {SOURCE} to {TARGET}')


if __name__ == '__main__':
    main()
