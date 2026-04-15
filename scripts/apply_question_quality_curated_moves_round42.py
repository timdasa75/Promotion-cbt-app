# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data' / 'public_procurement.json'
TARGET = ROOT / 'data' / 'civil_service_ethics.json'

MOVE_MAP = {
    'ppa_bid_054': {
        'source_subcategory': 'proc_bidding_evaluation',
        'new_id': 'csh_ap_219',
        'question': 'How should a payee\'s mark be handled when the payee is illiterate?',
        'options': [
            'It must be witnessed by a literate official other than the paying officer.',
            'It should be ignored if the officer is busy.',
            'It can be witnessed by the paying officer alone.',
            'It does not need to be recorded.',
        ],
        'correct': 0,
        'explanation': 'An illiterate payee\'s mark must be witnessed by a literate official other than the paying officer.',
        'keywords': ['civil_service_admin', 'csh_administrative_procedures', 'witness', 'payee_mark'],
        'legacy': ['ppa_bid_054'],
    },
    'ppa_bid_055': {
        'source_subcategory': 'proc_bidding_evaluation',
        'new_id': 'csh_ap_220',
        'question': 'How often should the contents of strong-rooms or safes be checked?',
        'options': [
            'Monthly, by the officer in charge of the keys.',
            'Only when a discrepancy is suspected.',
            'Once a year.',
            'Only at handover.',
        ],
        'correct': 0,
        'explanation': 'The rule requires a monthly check by the officer in charge of the keys, with the register initialed and dated.',
        'keywords': ['civil_service_admin', 'csh_administrative_procedures', 'strong_room', 'monthly_check'],
        'legacy': ['ppa_bid_055'],
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
