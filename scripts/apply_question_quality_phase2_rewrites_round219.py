from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'core_competencies.json': {
        'competency_verbal_055': {
            'explanation': 'The adjective "interested" is conventionally followed by the preposition "in," so the correct expression is "interested in music" rather than "on," "at," or "for."',
        },
    },
    ROOT / 'data' / 'general_current_affairs.json': {
        'IRA_123': {
            'explanation': 'Qatar hosted the FIFA World Cup in 2022, making 2022 the correct year among the options given.',
        },
        'IRA_138': {
            'explanation': 'The National Council on Establishments is traced in the source material to 1957, so that year is the correct answer rather than the later constitutional or civil-service milestones listed as distractors.',
        },
        'NEKP_155': {
            'explanation': 'In the source context used for this question, Rotimi Amaechi is the Minister of Transportation being referenced, so his name is the correct source-based answer within this item.',
        },
        'NEKP_159': {
            'explanation': 'Charles Babbage is the expected answer in the standard general-knowledge exam context because he is widely credited as the "father of the computer" for his early mechanical computing designs.',
        },
        'NEKP_162': {
            'explanation': 'Google was founded in 1998, specifically on 4 September 1998, so 1998 is the correct founding year among the choices provided.',
        },
        'NEKP_172': {
            'explanation': 'The rule requires that a decision on deferment, withholding of increment, or stoppage of salary be communicated to the officer concerned within two weeks, which is why the two-week option is correct.',
        },
        'NGPD_007': {
            'explanation': 'The Federal Public Service does not permit the employment of unpaid staff as a normal staffing practice, so prohibition is the correct policy position in this question.',
        },
        'NGPD_037': {
            'explanation': 'Serious Misconduct attracts dismissal as the ultimate penalty under the disciplinary framework, because it represents the gravest sanction short of merely lesser administrative measures like reprimand or withholding of increment.',
        },
        'ca_general_015': {
            'explanation': 'Maiduguri is the capital city of Borno State, so it is the correct state capital to select from the listed northern cities.',
        },
        'ca_general_020': {
            'explanation': 'Lokoja is the capital of Kogi State, which is why it is correct while Okene, Idah, and Kabba are important towns in the state but not the capital.',
        },
        'ca_general_030': {
            'explanation': 'Damaturu is the capital of Yobe State, so it is the correct answer rather than other well-known Yobe or neighbouring northeastern cities.',
        },
        'ca_general_042': {
            'explanation': 'Abakaliki is the capital of Ebonyi State, so it is the correct city to choose among the southeastern city options listed here.',
        },
        'ca_general_050': {
            'explanation': 'Minna is the capital of Niger State, which makes it the correct response instead of other notable Niger towns such as Bida, Kontagora, or Mokwa.',
        },
        'ca_international_affairs_gen_043': {
            'explanation': 'Accountable implementation in international and regional affairs depends on using credible official sources and confirming facts before conclusions are reached, because that keeps decisions traceable, defensible, and fair.',
        },
        'ca_international_affairs_gen_045': {
            'explanation': 'Traceability and fairness improve when officers rely on credible official sources and confirm facts before conclusions, because that creates a reviewable basis for the decision instead of an undocumented shortcut.',
        },
        'ca_national_governance_gen_027': {
            'explanation': 'Routine national-governance work is more accountable when officers rely on credible official sources and confirm facts before conclusions, since accountable implementation depends on verifiable information and a defensible decision trail.',
        },
        'ca_public_service_reforms_gen_028': {
            'explanation': 'In public-service and institutional reform work, accountable implementation is strongest when officers rely on credible official sources and confirm facts before conclusions, because reforms should rest on verifiable evidence rather than assumption or convenience.',
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
