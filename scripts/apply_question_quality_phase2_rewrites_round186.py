from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'civil_service_ethics.json': {
        'ethics_050': {
            'explanation': 'Falsehood is deliberate misrepresentation of facts, so it is treated as misconduct because it undermines honesty, trust, and proper official records.'
        },
    },
    ROOT / 'data' / 'core_competencies.json': {
        'competency_num_020': {
            'explanation': 'Multiply 200 by 750 to get 150,000, so $200 at ₦750 to $1 is ₦150,000.'
        },
        'competency_num_030': {
            'explanation': 'Five percent means 5 per 100, so 5% of ₦2,000,000 is ₦100,000.'
        },
        'competency_num_044': {
            'explanation': 'The mode is the value that appears most often, and 15 occurs more than any other number in the list.'
        },
        'competency_verbal_007': {
            'explanation': 'Accommodate is the accepted spelling, so the other spellings are incorrect variants of the same word.'
        },
        'competency_verbal_011': {
            'explanation': 'Insist on is the fixed verb-preposition combination used in standard English, so on is the correct choice.'
        },
        'competency_verbal_020': {
            'explanation': 'Good at is the standard collocation, so mathematics correctly follows the preposition at in this sentence.'
        },
        'competency_verbal_028': {
            'explanation': 'Chair is the odd one out because apple, mango, and banana are fruits, while chair is a piece of furniture.'
        },
        'competency_verbal_030': {
            'explanation': 'Account fits because it means a report or description of an incident, which matches the sentence meaning.'
        },
        'competency_verbal_031': {
            'explanation': 'Pessimistic is the antonym of optimistic because it means expecting the worst rather than expecting a good result.'
        },
        'competency_verbal_041': {
            'explanation': 'Simple is the opposite of complex because it means not complicated, so it gives the best antonym here.'
        },
        'competency_verbal_042': {
            'explanation': 'Begin is the direct synonym of commence, so it best matches the meaning of the original word.'
        },
        'competency_verbal_043': {
            'explanation': 'Definitely is the accepted spelling of the word, so the other variants are misspellings.'
        },
        'competency_verbal_051': {
            'explanation': 'Short is the synonym of brief because both words mean lasting a little time or using few words.'
        },
        'competency_verbal_055': {
            'explanation': 'Interested in is the fixed collocation for hobbies and activities, so in is the correct preposition.'
        },
        'competency_verbal_057': {
            'explanation': 'Slow is the opposite of rapid because rapid means fast, so slow gives the best antonym.'
        },
        'competency_verbal_059': {
            'explanation': 'Directive fits because it is a formal instruction, which matches a strong official order on discipline.'
        },
    },
    ROOT / 'data' / 'constitutional_foi.json': {
        'FOI_AO_001': {
            'explanation': 'The Freedom of Information Act was signed into law in 2011, so 2011 is the correct enactment year.'
        },
        'FOI_AO_032': {
            'explanation': 'Section 2(7) requires annual compliance reports, so failure to submit the report breaches that provision.'
        },
        'FOI_AO_048': {
            'explanation': 'Section 5 requires public institutions to train officials, so that section matches the question on staff training.'
        },
        'FOI_AO_050': {
            'explanation': 'The FOI Act promotes transparency and accountability in governance, so facilitating accountability is the correct completion.'
        },
        'FOI_AO_054': {
            'explanation': 'Financial Regulation 1220 requires the amount of the fixed fee to be printed on the receipt or licence, so that is the correct information.'
        },
        'FOI_AO_057': {
            'explanation': 'Classifying documents is meant to sensitize officers about the level of care required, not simply to hide information.'
        },
        'FOI_EX_010': {
            'explanation': 'Section 17 exempts geological and mineral exploration records from disclosure, so that section is the correct exemption.'
        },
        'FOI_EX_018': {
            'explanation': 'Section 12 protects information that could prejudice international relations, so it is the relevant exemption here.'
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
