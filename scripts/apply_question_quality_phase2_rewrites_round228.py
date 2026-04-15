from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'data' / 'general_current_affairs.json'

QUESTION_UPDATES = {
    'ca_general_gen_002': 'Which practice best supports compliance in general public-affairs work?',
    'ca_general_gen_004': 'Which practice best reflects sound institutional awareness in general public-affairs work?',
    'ca_general_gen_006': 'Which action best shows strong regional and global awareness in general public-affairs work?',
    'ca_general_gen_008': 'Which action best demonstrates civic relevance in general public-affairs work?',
    'ca_general_gen_010': 'Which practice best sustains compliance assurance in general public-affairs work?',
    'ca_general_gen_012': 'Which practice best preserves service integrity in general public-affairs work?',
    'ca_general_gen_014': 'Which action best demonstrates decision transparency in general public-affairs work?',
    'ca_general_gen_016': 'Which action best reflects citizen-focused service in general public-affairs work?',
    'ca_general_gen_018': 'Which practice best supports sound performance standards in general public-affairs work?',
    'ca_general_gen_020': 'Which practice best sustains compliance in general public-affairs work?',
    'ca_general_gen_021': 'Which action best demonstrates risk management in general public-affairs work?',
    'ca_general_gen_022': 'Which practice best preserves institutional awareness in general public-affairs work?',
    'ca_general_gen_024': 'Which action best reflects regional and global awareness in general public-affairs work?',
}


def find_ca_general_items(data: dict) -> list[dict]:
    sub = next(s for s in data['subcategories'] if s['id'] == 'ca_general')
    items = []
    for block in sub.get('questions', []):
        if isinstance(block, dict) and 'id' in block:
            items.append(block)
        elif isinstance(block, dict):
            for value in block.values():
                if isinstance(value, list):
                    for q in value:
                        if isinstance(q, dict) and q.get('id'):
                            items.append(q)
    return items


def main() -> None:
    data = json.loads(PATH.read_text(encoding='utf-8'))
    updated = []
    for q in find_ca_general_items(data):
        qid = q['id']
        if qid in QUESTION_UPDATES:
            q['question'] = QUESTION_UPDATES[qid]
            updated.append(qid)
    PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Updated {len(updated)} questions in {PATH.name}')
    for qid in updated:
        print(qid)


if __name__ == '__main__':
    main()
