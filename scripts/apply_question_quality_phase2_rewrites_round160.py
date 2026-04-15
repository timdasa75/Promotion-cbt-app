# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'psr_rules.json'

UPDATES = {
    'psr_docx_080': 'A satisfactory testimonial from the last employer or last school is the standard character reference requested from applicants.',
    'psr_docx_095': 'The Oath of Secrecy does not override the Freedom of Information Act; the two instruments operate within their own legal limits.',
    'psr_docx_139': 'Public officers are expected to show loyalty and commitment to the public service, because service to the state is the core duty of office.',
    'psr_docx_142': 'A gift received in the course of official duties must be declared to the appropriate authority so that the officer remains accountable and impartial.',
    'psr_docx_147': 'The Code of Conduct Bureau monitors compliance with the Code of Conduct and helps ensure that public officers obey its provisions.',
    'psr_docx_151': 'Chapter II of the 1999 Constitution contains the Fundamental Objectives and Directive Principles of State Policy, including the ethical ideals tested here.',
    'psr_docx_159': 'The Oath of Allegiance signifies commitment to the Constitution and the nation, not to a party or private interest.',
    'psr_docx_160': 'The Code of Conduct is designed to prevent officers from enriching themselves at the expense of the state and the public.',
    'psr_docx_162': 'The Code of Conduct promotes good governance and public confidence by setting standards of ethical conduct for public officers.',
    'psr_docx_163': 'The Public Service Institute of Nigeria provides guidance and training on ethical conduct for public officers.',
    'psr_docx_192': 'The Code of Conduct Bureau is the constitutional body responsible for enforcing asset declaration rules.',
    'psr_docx_195': 'The Fifth Schedule to the Constitution contains the Code of Conduct provisions, including the prohibition on using official information for personal gain.',
    'psr_docx_206': 'Regular disclosure of assets and liabilities is a Code of Conduct requirement that supports transparency and accountability.',
    'psr_docx_213': 'Accountability and impartiality are core principles of public service ethics because they keep official conduct fair and answerable.',
    'psr_docx_218': 'The Code of Conduct Bureau is the constitutional body that collects and verifies asset declarations from public officers.',
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
    print(f'Applied round 160 updates to {changed} questions in {TARGET}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
