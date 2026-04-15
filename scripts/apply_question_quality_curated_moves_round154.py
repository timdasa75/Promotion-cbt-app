# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ICT_PATH = ROOT / 'data' / 'ict_digital.json'
PROC_PATH = ROOT / 'data' / 'public_procurement.json'

MOVE_ITEMS = {
    'ict_f_082',
    'ict_f_087',
}

ICT_UPDATES = {
    'ict_eg_060': {
        'explanation': 'NITDA is the Nigerian agency that oversees ICT policy and development, so it is the correct expansion-related answer here.',
    },
    'ict_sec_071': {
        'explanation': 'A firewall is primarily used to prevent unauthorized access to or from a private network.',
    },
}

PROC_ITEMS = [
    {
        'id': 'ppa_objectives_076',
        'question': 'Which database does the Bureau of Public Procurement maintain to support transparency in public procurement?',
        'options': [
            'National database of contractors and service providers.',
            'National database of government employees.',
            'National database of foreign contractors.',
            'National database of standard workflow prices.',
        ],
        'correct': 0,
        'explanation': 'Section 10 of the Public Procurement Act empowers the BPP to maintain and update a national database of contractors and service providers to support transparency and planning.',
        'difficulty': 'medium',
        'topic': 'Public Procurement Act',
        'keywords': ['bpp', 'database', 'contractors', 'service providers'],
        'sourceDocument': 'Public Procurement Act, 2007',
        'sourceSection': 'Objectives & Institutions',
        'year': 2007,
        'lastReviewed': '2026-04-08',
        'glBands': ['GL14_15', 'GL15_16', 'GL16_17'],
        'marks': 1,
        'questionType': 'single_best_answer',
        'reviewStatus': 'approved',
        'tags': ['procurement_act', 'objectives', 'institutions'],
        'sourceTopicId': 'procurement_act',
        'sourceSubcategoryId': 'proc_objectives_institutions',
        'sourceSubcategoryName': 'Objectives & Institutions',
    },
    {
        'id': 'ppa_objectives_077',
        'question': 'What is the main purpose of the BPP\'s national database of contractors and service providers?',
        'options': [
            'To support procurement planning and oversight.',
            'To issue salary payments to civil servants.',
            'To register all government employees.',
            'To manage election logistics.',
        ],
        'correct': 0,
        'explanation': 'The database helps the BPP and MDAs track suppliers and improve procurement oversight, transparency, and planning.',
        'difficulty': 'medium',
        'topic': 'Public Procurement Act',
        'keywords': ['bpp', 'database', 'oversight', 'planning'],
        'sourceDocument': 'Public Procurement Act, 2007',
        'sourceSection': 'Objectives & Institutions',
        'year': 2007,
        'lastReviewed': '2026-04-08',
        'glBands': ['GL14_15', 'GL15_16', 'GL16_17'],
        'marks': 1,
        'questionType': 'single_best_answer',
        'reviewStatus': 'approved',
        'tags': ['procurement_act', 'objectives', 'institutions'],
        'sourceTopicId': 'procurement_act',
        'sourceSubcategoryId': 'proc_objectives_institutions',
        'sourceSubcategoryName': 'Objectives & Institutions',
    },
]


def load(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def save(path: Path, data: object):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def iter_questions(data: dict):
    for sub in data.get('subcategories', []):
        if sub.get('id') == 'ict_fundamentals':
            questions = sub.get('questions', [])
            if questions:
                return sub, questions
    raise SystemExit('ict_fundamentals subcategory not found')


def iter_proc_sub(data: dict):
    for sub in data.get('subcategories', []):
        if sub.get('id') == 'proc_objectives_institutions':
            questions = sub.get('questions', [])
            if questions:
                return sub, questions
    raise SystemExit('proc_objectives_institutions subcategory not found')


def update_items(node: object, updates: dict[str, dict]) -> int:
    if isinstance(node, list):
        return sum(update_items(item, updates) for item in node)
    if isinstance(node, dict):
        qid = node.get('id')
        if qid in updates:
            for key, value in updates[qid].items():
                node[key] = value
            return 1
        return sum(update_items(value, updates) for value in node.values())
    return 0


def main() -> int:
    ict = load(ICT_PATH)
    ict_sub, ict_questions = iter_questions(ict)

    removed = []
    kept = []
    for q in ict_questions:
        if q.get('id') in MOVE_ITEMS:
            removed.append(q)
        else:
            kept.append(q)
    if len(removed) != len(MOVE_ITEMS):
        missing = sorted(MOVE_ITEMS - {q.get('id') for q in removed})
        raise SystemExit(f'missing ICT move items: {missing}')
    ict_sub['questions'] = kept

    ict_changed = update_items(ict, ICT_UPDATES)
    if ict_changed != len(ICT_UPDATES):
        raise SystemExit(f'ICT: expected {len(ICT_UPDATES)} updates, applied {ict_changed}')
    save(ICT_PATH, ict)

    proc = load(PROC_PATH)
    proc_sub, proc_questions = iter_proc_sub(proc)
    existing_ids = {q.get('id') for q in proc_questions}
    for item in PROC_ITEMS:
        if item['id'] in existing_ids:
            raise SystemExit(f"duplicate procurement id: {item['id']}")
        proc_questions.append(item)
    proc_sub['questions'] = proc_questions
    save(PROC_PATH, proc)

    print(f'Moved {len(removed)} ICT questions into procurement and updated {ict_changed} ICT explanations')
    print(f'Added {len(PROC_ITEMS)} procurement questions')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
