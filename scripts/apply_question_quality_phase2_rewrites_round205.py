from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'leadership_negotiation.json': {
        'neg_principles_outcomes_gen_068': {
            'question': 'Which organizational condition is most directly strengthened by effective labour relations?',
            'explanation': 'Effective labour relations most directly strengthen productivity and morale because they reduce friction and encourage cooperation between workers and management.',
        },
        'neg_structure_bodies_gen_083': {
            'question': 'Who normally heads the Government Side delegation at National Council negotiations?',
            'explanation': 'At National Council level, the Government Side is normally headed by the Head of the Civil Service of the Federation, who coordinates senior civil-service representation.',
        },
        'neg_dispute_law_gen_071': {
            'question': 'In routine dispute-resolution and labour-law work, which approach most clearly demonstrates accountable leadership?',
            'explanation': 'Accountable leadership is shown when clear expectations are set, outcomes are monitored, and deviations are corrected promptly rather than ignored.',
        },
    },
    ROOT / 'data' / 'policy_analysis.json': {
        'policy_psr_022': {
            'question': 'Who has the authority to appoint Permanent Secretaries in the Federal Civil Service?',
            'explanation': 'The President has the authority to appoint Permanent Secretaries within the constitutional and civil-service appointment framework.',
        },
        'pol_analysis_methods_gen_081': {
            'question': 'Which detail makes a file note formally traceable?',
            'explanation': 'A file note becomes traceable when it carries the writer\'s initials and date, showing both authorship and timing.',
        },
        'pol_analysis_methods_gen_092': {
            'question': 'Which aspect of a parastatal falls under the Chief Executive\'s operational accountability?',
            'explanation': 'Operational accountability rests with the Chief Executive for the day-to-day management and administration of the parastatal.',
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
