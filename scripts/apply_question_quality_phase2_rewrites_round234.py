from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'data' / 'general_current_affairs.json'

QUESTION_UPDATES = {
    'NGPD_031': 'What effect of a withheld increment may later be offset by one or more special increments granted by the FCSC?',
    'NGPD_055': 'Under Financial Regulation 1603(b), which group must receive accounting instructions from the Accounting Officer?',
}

EXPLANATION_UPDATES = {
    'NGPD_031': 'The special increment power exists to offset the lasting effect of a previously withheld increment, which is why that consequence is the correct focus of the question.',
    'NGPD_055': 'Financial Regulation 1603(b) requires the Accounting Officer to issue accounting instructions to all officers within the unit, not just senior staff or outside bodies.',
}


def find_item(data: dict, target_id: str) -> dict | None:
    for sub in data.get('subcategories', []):
        for block in sub.get('questions', []):
            if isinstance(block, dict) and block.get('id') == target_id:
                return block
            if isinstance(block, dict):
                for value in block.values():
                    if isinstance(value, list):
                        for q in value:
                            if isinstance(q, dict) and q.get('id') == target_id:
                                return q
    return None


def main() -> None:
    data = json.loads(PATH.read_text(encoding='utf-8'))
    for qid in QUESTION_UPDATES:
        q = find_item(data, qid)
        if q is None:
            raise SystemExit(f'{qid} not found')
        q['question'] = QUESTION_UPDATES[qid]
        q['explanation'] = EXPLANATION_UPDATES[qid]
    PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print('Updated NGPD_031 and NGPD_055 in general_current_affairs.json')


if __name__ == '__main__':
    main()
