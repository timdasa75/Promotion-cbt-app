#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'civil_service_ethics.json'
UPDATES = {
    'csh_sdg_054': {
        'question': 'Which use of a government vehicle best qualifies as official duty?',
        'explanation': 'A government vehicle is in official use when it is used for activities directly connected to the statutory functions and responsibilities of the agency.',
        'keywords': ['government_vehicle_use', 'official_duty', 'statutory_functions', 'service_delivery_operations']
    }
}
payload = json.loads(TARGET.read_text(encoding='utf-8'))
updated = 0
for sub in payload.get('subcategories', []):
    if sub.get('id') != 'csh_service_delivery_grievance':
        continue
    for q in sub.get('questions', []):
        patch = UPDATES.get(q.get('id'))
        if patch:
            q.update(patch)
            updated += 1
TARGET.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'Applied round 101B rewrites to {updated} questions')
