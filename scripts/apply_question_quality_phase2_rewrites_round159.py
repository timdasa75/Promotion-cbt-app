# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'civil_service_ethics.json'

UPDATES = {
    'csh_disc_001': 'Chapter 10 of the PSR covers discipline, so that is the correct chapter for the disciplinary process.',
    'csh_disc_005': 'Falsification of official records is treated as gross misconduct because it undermines trust, accountability, and the integrity of public records.',
    'csh_disc_050': 'The Federal Civil Service Commission is the disciplinary authority for Directors in the Federal Civil Service, so it is the correct answer.',
    'csh_disc_056': 'The topmost career civil servant in a local government set-up is the Secretary, which is why that option is correct.',
    'csh_disc_058': 'Accepting gifts from contractors or business people can compromise impartiality and damage the civil servant\'s integrity.',
    'ethics_011': 'Integrity requires honesty and fairness in all official dealings, so it is the correct ethical principle.',
    'ethics_021': 'Impartiality requires civil servants to provide services without discrimination and to treat citizens equally.',
    'ethics_028': 'Transparency means information is shared openly and not hidden from legitimate oversight or public scrutiny.',
    'ethics_030': 'Confidentiality prohibits civil servants from disclosing classified information or sensitive official records.',
    'ethics_032': 'Professionalism requires civil servants to act with competence, respect, and proper conduct in public service.',
    'ethics_034': 'Accountability ensures civil servants are answerable for their actions and decisions.',
    'ethics_035': 'Impartiality requires civil servants to avoid favoritism in hiring and promotions.',
    'ethics_037': 'Confidentiality prohibits leaking government secrets or other protected official information.',
    'ethics_039': 'Impartiality requires fair, equal, and non-discriminatory service delivery.',
    'ethics_054': 'Accountability requires civil servants to be answerable for the decisions and actions they take in office.',
    'ethics_060': 'Integrity discourages corruption and promotes honesty and fairness in service delivery.',
    'ethics_064': 'Transparency ensures openness in government contracting and procurement processes.',
    'ethics_066': 'Impartiality requires civil servants to avoid personal bias in decision-making.',
    'ethics_070': 'Professionalism requires fair and respectful treatment of colleagues and subordinates.',
}


def update(node: object, updates: dict[str, str]) -> int:
    if isinstance(node, list):
        return sum(update(item, updates) for item in node)
    if isinstance(node, dict):
        qid = node.get('id')
        if qid in updates:
            node['explanation'] = updates[qid]
            return 1
        return sum(update(value, updates) for value in node.values())
    return 0


def main() -> int:
    data = json.loads(TARGET.read_text(encoding='utf-8'))
    changed = update(data, UPDATES)
    if changed != len(UPDATES):
        raise SystemExit(f'expected {len(UPDATES)} updates, applied {changed}')
    TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Applied round 159 updates to {changed} questions in {TARGET}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
