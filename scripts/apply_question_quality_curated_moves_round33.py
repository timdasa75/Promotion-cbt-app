#!/usr/bin/env python3
import json
from pathlib import Path

lead_path = Path('data/leadership_negotiation.json')
ict_path = Path('data/ict_digital.json')

lead = json.loads(lead_path.read_text(encoding='utf-8'))
ict = json.loads(ict_path.read_text(encoding='utf-8'))

move_id = 'leadership_smp_048'
new_id = 'ict_eg_101'
removed = None

for sub in lead.get('subcategories', []):
    if sub.get('id') != 'lead_strategic_management':
        continue
    kept = []
    for q in sub.get('questions', []):
        if q.get('id') == move_id:
            removed = dict(q)
            continue
        kept.append(q)
    sub['questions'] = kept
    break

if removed is None:
    raise RuntimeError(f'Question not found: {move_id}')

removed['id'] = new_id
removed['chapter'] = 'E-Governance Policy'
removed['sourceDocument'] = 'National ICT and Digital Governance Framework'
removed['sourceSection'] = 'E-Governance & Digital Services'
removed['sourceTopicId'] = 'ict_management'
removed['sourceSubcategoryId'] = 'ict_e_governance'
removed['sourceSubcategoryName'] = 'E-Governance & Digital Services'
removed['tags'] = ['e_governance', 'digital_services', 'public_sector_platforms', 'ict_e_governance', 'e_government_master_plan', 'cloud_deployment', 'data_sharing']
removed['legacyQuestionIds'] = list(dict.fromkeys((removed.get('legacyQuestionIds') or []) + [move_id]))

for sub in ict.get('subcategories', []):
    if sub.get('id') == 'ict_e_governance':
        sub.setdefault('questions', []).append(removed)
        break
else:
    raise RuntimeError('Target subcategory ict_e_governance not found')

lead_path.write_text(json.dumps(lead, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
ict_path.write_text(json.dumps(ict, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'Applied move round 33: {move_id} -> {new_id}')
