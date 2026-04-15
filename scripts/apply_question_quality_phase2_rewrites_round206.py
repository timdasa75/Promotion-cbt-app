from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'leadership_negotiation.json': {
        'leadership_mpf_063': {
            'question': 'A confirmed officer applies for three years of study leave with pay. What is the longest period that may lawfully be approved?',
            'explanation': 'The request cannot exceed two years, because that is the maximum period of study leave with pay that may be granted to a confirmed officer under the rule.',
        },
        'neg_dispute_law_gen_014': {
            'question': 'Which practice makes dispute-resolution and labour-law decisions easiest for affected parties to understand and review?',
            'explanation': 'Decisions are easiest to understand and review when officers use clear criteria and communicate the decision promptly, rather than relying on vague or undocumented handling.',
        },
    },
    ROOT / 'data' / 'policy_analysis.json': {
        'policy_constitution_061': {
            'question': 'An organization carries out a routine internal check of its financial and administrative records. What is that process called?',
            'explanation': 'That process is internal audit, which involves the routine checking and verification of records and controls within the organization itself.',
        },
    },
}


def update_file(path: Path, rewrites: dict[str, dict[str, object]]) -> list[str]:
    data = json.loads(path.read_text(encoding='utf-8'))
    updated: list[str] = []

    def walk(node):
        if isinstance(node, dict):
            qid = node.get('id')
            if qid in rewrites:
                node.update(rewrites[qid])
                updated.append(qid)
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)

    walk(data)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    return updated


def main() -> None:
    total = 0
    for path, rewrites in FILES.items():
        updated = update_file(path, rewrites)
        print(f'Updated {len(updated)} questions in {path.name}')
        for qid in updated:
            print(qid)
        total += len(updated)
    print(f'Total updated: {total}')


if __name__ == '__main__':
    main()
