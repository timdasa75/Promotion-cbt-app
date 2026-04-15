# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    (
        ROOT / 'data' / 'civil_service_ethics.json',
        {
            'csh_duty_051': {
                'question': 'Who has the ultimate duty for control of votes to the Federal Executive Council?',
                'explanation': 'Accounting Officers carry the ultimate duty for vote control and must account to the Federal Executive Council for the use of public funds.',
            },
            'csh_duty_067': {
                'question': 'Which two arms of the Federal Government share accountability for the Federal Budget?',
                'explanation': 'The Federal Budget is shared between the Executive and the Legislature, which together provide budget accountability in the federal system.',
            },
            'csh_duty_074': {
                'question': 'What should guide the workflow for creating a new file?',
                'explanation': 'New files should be created based on the existing File Index so the numbering system stays consistent and logically ordered.',
            },
            'csh_duty_080': {
                'question': 'What personnel role does the Board of a parastatal perform?',
                'explanation': 'A parastatal board approves the appointment and promotion of staff, so it plays a key personnel oversight role rather than day-to-day administration.',
            },
            'csh_it_002': {
                'explanation': 'IPPIS stands for Integrated Personnel and Payroll Information System, which is the correct expansion of the acronym in public administration.',
            },
            'csh_it_004': {
                'explanation': 'GIFMIS stands for Government Integrated Financial Management Information System, the platform used for integrated financial control and reporting.',
            },
            'csh_it_008': {
                'explanation': 'CBT promotion exams are intended to standardize evaluation and support fair assessment across cadres by using the same digital testing process.',
            },
            'csh_it_009': {
                'explanation': 'HRMIS stands for Human Resource Management Information System, which is the correct expansion of the acronym in ministry administration.',
            },
            'csh_it_015': {
                'explanation': 'NITDA regulates ICT policy and standards in Nigeria, so its role is to guide and standardize digital development rather than manage finance or procurement.',
            },
            'csh_it_020': {
                'explanation': 'The audit trail records each financial transaction so administrators can confirm integrity, trace actions, and review system accountability in GIFMIS.',
            },
            'csh_it_026': {
                'explanation': 'HRMIS manages digital staff records, leave, postings, and promotions, which makes it the core personnel-management tool in a ministry.',
            },
            'csh_it_029': {
                'explanation': 'A firewall filters network traffic and blocks unauthorized access, which is why it is the correct control for a ministry network.',
            },
            'csh_it_030': {
                'explanation': 'Digital dashboards let management quickly visualize key performance indicators and data trends so decisions can be made faster from one screen.',
            },
            'csh_it_033': {
                'explanation': 'SQL is the standard language for managing and querying relational databases, which is why it is used in systems like HRMIS and GIFMIS.',
            },
            'csh_it_037': {
                'explanation': 'A router directs data packets between different networks, which is its core routing function in ICT infrastructure.',
            },
            'csh_it_041': {
                'explanation': 'Document scanning and archiving is the process used to convert paper records into digital archives for storage and retrieval.',
            },
            'csh_it_044': {
                'explanation': 'The National e-Government Masterplan promotes secure cloud infrastructure so MDAs can access scalable and reliable computing resources.',
            },
            'csh_it_050': {
                'explanation': 'Cyber hygiene training helps civil servants recognize threats such as phishing and malware, which is why awareness is its main objective.',
            },
        },
    ),
]


def update(node: object, updates: dict[str, dict]) -> int:
    if isinstance(node, list):
        return sum(update(item, updates) for item in node)
    if isinstance(node, dict):
        qid = node.get('id')
        if qid in updates:
            payload = updates[qid]
            for key, value in payload.items():
                node[key] = value
            return 1
        return sum(update(value, updates) for value in node.values())
    return 0


def main() -> None:
    total_changed = 0
    for target, updates in TARGETS:
        data = json.loads(target.read_text(encoding='utf-8'))
        changed = update(data, updates)
        if changed != len(updates):
            raise SystemExit(f'{target.name}: expected {len(updates)} updates, applied {changed}')
        target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        total_changed += changed
        print(f'Applied round 149 updates to {changed} questions in {target}')
    print(f'Applied round 149 updates to {total_changed} questions across {len(TARGETS)} files')


if __name__ == '__main__':
    main()
