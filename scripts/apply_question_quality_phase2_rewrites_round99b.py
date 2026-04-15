#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'constitutional_foi.json'
UPDATES = {
    'clg_general_competency_gen_077': {
        'question': 'Which routine best keeps risk control reviewable in general competency work?',
        'explanation': 'Risk control remains reviewable when risks are identified early, appropriate controls are applied, and the mitigation used is documented clearly.',
        'keywords': ['general_competency', 'risk_control', 'reviewable_controls', 'documented_mitigation']
    },
    'clg_legal_compliance_gen_079': {
        'question': 'Which routine best keeps risk control reviewable in legal and statutory compliance work?',
        'explanation': 'Risk control in legal and statutory compliance work stays reviewable when the risk is identified early, the necessary controls are applied, and the mitigation is documented.',
        'keywords': ['legal_compliance', 'risk_control', 'reviewable_controls', 'documented_mitigation']
    }
}

payload = json.loads(TARGET.read_text(encoding='utf-8'))
updated = 0
for sub in payload.get('subcategories', []):
    for q in sub.get('questions', []):
        patch = UPDATES.get(q.get('id'))
        if patch:
            q.update(patch)
            updated += 1
TARGET.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'Applied round 99B rewrites to {updated} questions')
