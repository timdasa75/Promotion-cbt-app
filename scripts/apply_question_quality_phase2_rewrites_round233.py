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
    q = find_item(data, 'IRA_143')
    if q is None:
        raise SystemExit('IRA_143 not found')
    q['question'] = 'What must officers avoid doing with historical manuscripts or other documents of public interest discovered in the course of official duty?'
    q['options'] = [
        'Appropriating them for personal use.',
        'Reporting their existence to the Permanent Secretary or Head of Extra-Ministerial Office for preservation.',
        'Forwarding them for examination and preservation.',
        'Documenting their existence in line with official procedure.',
    ]
    q['correct'] = 0
    q['keywords'] = ['historical manuscripts', 'public-interest documents', 'personal appropriation', 'official preservation']
    q['tags'] = ['current_affairs', 'international_affairs', 'regional_affairs', 'ca_international_affairs', 'historical_manuscripts', 'personal_appropriation', 'official_preservation']
    q['topic'] = 'Official Records and Preservation'
    q['explanation'] = 'Officers must not appropriate historical manuscripts or documents of public interest for personal use; instead, their existence should be reported so that examination and preservation can follow.'
    PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print('Updated IRA_143 in general_current_affairs.json')


if __name__ == '__main__':
    main()
