#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FINANCE = ROOT / 'data' / 'financial_regulations.json'
CIVIL = ROOT / 'data' / 'civil_service_ethics.json'
MOVE_ID = 'fin_audits_sanctions_gen_017'
NEW_ID = 'csh_ap_216'

finance = json.loads(FINANCE.read_text(encoding='utf-8'))
civil = json.loads(CIVIL.read_text(encoding='utf-8'))

move_item = None
for sub in finance.get('subcategories', []):
    if sub.get('id') != 'fin_audits_sanctions':
        continue
    for idx, q in enumerate(sub.get('questions', [])):
        if q.get('id') == MOVE_ID:
            move_item = sub['questions'].pop(idx)
            break
    if move_item:
        break
if move_item is None:
    raise SystemExit(f'Move source {MOVE_ID} not found')

move_item['id'] = NEW_ID
move_item['question'] = 'Which record-management practice best supports an official audit file?'
move_item['options'] = [
    'Current files with status updates at each control point.',
    'Loose documents without status tracking.',
    'Convenience ahead of records control.',
    'Incomplete file updates after key actions.',
]
move_item['correct'] = 0
move_item['explanation'] = 'Record management is stronger when files stay current and each control point is reflected in a status update that later reviewers can verify.'
move_item['keywords'] = ['civil_service_admin', 'csh_administrative_procedures', 'record_management', 'status_updates']
move_item['source'] = 'moved_from_financial_regulations'
move_item['sourceTopicId'] = 'civil_service_admin'
move_item['sourceSubcategoryId'] = 'csh_administrative_procedures'
move_item['sourceSubcategoryName'] = 'Administrative Procedures'
move_item['tags'] = ['civil_service_admin', 'administrative_procedures', 'record_management', 'audit_file', 'status_updates']
move_item['legacyQuestionIds'] = [MOVE_ID]
move_item['sourceDocument'] = 'Civil Service Administrative Procedures and Records Control'
move_item['sourceSection'] = 'Administrative Procedures'
move_item['year'] = 2009
move_item['lastReviewed'] = '2026-04-07'
move_item['questionType'] = 'single_best_answer'
move_item['reviewStatus'] = 'approved'
move_item['glBands'] = ['GL15_16', 'GL16_17']
move_item['marks'] = 1
move_item['difficulty'] = 'easy'

added = False
for sub in civil.get('subcategories', []):
    if sub.get('id') == 'csh_administrative_procedures':
        sub['questions'].append(move_item)
        added = True
        break
if not added:
    raise SystemExit('Destination subcategory not found')

FINANCE.write_text(json.dumps(finance, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
CIVIL.write_text(json.dumps(civil, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'Moved {MOVE_ID} to {NEW_ID}')
