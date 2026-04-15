from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'data' / 'general_current_affairs.json'


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
    q = find_item(data, 'PSIR_120')
    if q is None:
        raise SystemExit('PSIR_120 not found')
    q['options'] = [
        'To create an opportunity for delay in paper movement.',
        'To give junior officers more time to review the documents.',
        'To obtain a second opinion from junior staff.',
        'To acquaint all intermediate officers with the decision reached by the higher authority.',
    ]
    q['explanation'] = 'Papers routed upward through official channels are returned through the same chain so that every intermediate officer becomes aware of the decision reached by the higher authority.'
    PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print('Updated PSIR_120 in general_current_affairs.json')


if __name__ == '__main__':
    main()
