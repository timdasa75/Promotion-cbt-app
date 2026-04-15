from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'data' / 'general_current_affairs.json'

EXPLANATION_UPDATES = {
    'ca_general_gen_002': 'Compliance in general current-affairs work is strongest when officers use lawful criteria and document each decision step, because traceable decisions are easier to review, defend, and apply consistently.',
    'ca_general_gen_004': 'Institutional awareness is shown by interpreting current developments through verified public sources, because public-service judgment should rest on reliable information rather than rumor or informal instruction.',
    'ca_general_gen_006': 'Regional and global awareness is demonstrated by relating international events to national administrative priorities, because sound current-affairs analysis connects external developments to public-sector decisions at home.',
    'ca_general_gen_008': 'Civic relevance is strongest when officers connect current affairs to public-sector responsibilities, because the point of general-affairs knowledge in service is to inform public duty, not just recall headlines.',
    'ca_general_gen_010': 'Compliance assurance depends on applying approved rules consistently and escalating exceptions, because that keeps decisions lawful, reviewable, and resistant to ad hoc shortcuts.',
    'ca_general_gen_012': 'Service integrity is preserved when officers avoid conflicts of interest and disclose relevant constraints, because integrity in public work depends on impartial judgment and transparent handling of competing interests.',
    'ca_general_gen_014': 'Decision transparency is best shown by using clear criteria and communicating decisions promptly, because openness about the basis of action helps others understand, review, and trust the outcome.',
    'ca_general_gen_016': 'Citizen-focused service balances legality, fairness, timeliness, and service quality, because public-facing decisions should protect both due process and the needs of the people affected.',
    'ca_general_gen_018': 'Performance standards are strongest when officers set measurable targets, monitor progress, and correct deviations, because improvement depends on evidence, feedback, and timely corrective action.',
    'ca_general_gen_020': 'General current-affairs compliance is sustained by using lawful criteria and documenting each decision step transparently, because compliance requires both the right standard and a record showing how it was applied.',
    'ca_general_gen_021': 'Risk management in general current-affairs work means identifying control gaps early and escalating material exceptions promptly, because unresolved risks grow when they are ignored or normalized.',
    'ca_general_gen_022': 'Institutional awareness is preserved when officers interpret current developments through verified public sources, because reliable situational awareness depends on confirmed information rather than guesswork.',
    'ca_general_gen_024': 'Regional and global awareness is reflected in relating international events to national administrative priorities, because wider developments matter most when their implications for domestic governance are understood.',
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
        if qid in EXPLANATION_UPDATES:
            q['explanation'] = EXPLANATION_UPDATES[qid]
            updated.append(qid)
    PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Updated {len(updated)} questions in {PATH.name}')
    for qid in updated:
        print(qid)


if __name__ == '__main__':
    main()
