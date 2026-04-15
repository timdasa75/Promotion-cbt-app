from __future__ import annotations

import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data' / 'financial_regulations.json'
TARGET = ROOT / 'data' / 'civil_service_ethics.json'

MOVE_MAP = {
    'fin_aud_083': {
        'source_subcategory': 'fin_audits_sanctions',
        'new_id': 'csh_ap_228',
        'question': 'What does an audit trail help establish in record keeping?',
        'options': [
            'Traceability and accountability.',
            'Automatic approval of all payments.',
            'Budget expansion without controls.',
            'Removal of all record-keeping duties.',
        ],
        'correct': 0,
        'explanation': 'An audit trail helps establish traceability and accountability by showing what was done, when it was done, and by whom.',
        'keywords': ['civil_service_admin', 'csh_administrative_procedures', 'audit_trail', 'record_keeping'],
        'legacy': ['fin_aud_083'],
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
        'source': 'moved_from_financial_regulations',
        'sourceDocument': 'Federal Civil Service Handbook and Circulars',
        'sourceSection': 'Administrative Procedures',
        'year': src.get('year', 2009),
        'lastReviewed': date.today().isoformat(),
        'glBands': src.get('glBands', ['GL15_16', 'GL16_17']),
        'marks': src.get('marks', 1),
        'questionType': src.get('questionType', 'single_best_answer'),
        'reviewStatus': 'approved',
        'tags': ['civil_service_admin', 'csh_administrative_procedures', *[t for t in payload['keywords'] if t not in ['civil_service_admin', 'csh_administrative_procedures']]],
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
    target_sub['questions'].append(moved_items[0])

    SOURCE.write_text(json.dumps(source_data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    TARGET.write_text(json.dumps(target_data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Moved {len(moved_items)} question from {SOURCE} to {TARGET}')


if __name__ == '__main__':
    main()
