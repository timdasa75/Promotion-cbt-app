#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'financial_regulations.json'
UPDATES = {
    'fin_aud_018': {
        'question': 'In government audit working papers, what do accruals mean?',
        'explanation': 'Accruals refer to expenses or revenues recognized when they are incurred, not when cash is exchanged, so the audit record reflects the proper accounting period.',
        'keywords': ['accruals', 'audit_working_papers', 'financial_reporting', 'recognition_basis'],
    }
}

data = json.loads(TARGET.read_text(encoding='utf-8'))
updated = 0
for sub in data.get('subcategories', []):
    if sub.get('id') != 'fin_audits_sanctions':
        continue
    for q in sub.get('questions', []):
        payload = UPDATES.get(q.get('id'))
        if payload:
            q.update(payload)
            updated += 1

TARGET.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'Applied round 116B updates to {updated} questions in {TARGET}')
