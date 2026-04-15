#!/usr/bin/env python3
import json
from pathlib import Path

ict_path = Path('data/ict_digital.json')
psr_path = Path('data/psr_rules.json')

ict = json.loads(ict_path.read_text(encoding='utf-8'))
psr = json.loads(psr_path.read_text(encoding='utf-8'))

move_specs = {
    'ict_li_040': {
        'new_id': 'CIRC_PPC_018',
        'question': 'Why did the Public Service Rules incorporate provisions for virtual meetings?',
        'chapter': 'Circulars: Personnel, Performance & Reforms',
        'sourceDocument': 'Public Service Rules (PSR 2021)',
        'sourceSection': 'Circulars: Personnel, Performance & Reforms',
        'sourceTopicId': 'psr',
        'sourceTopicName': 'Public Service Rules (PSR) & Circulars',
        'sourceSubcategoryId': 'circ_personnel_performance',
        'sourceSubcategoryName': 'Circulars: Personnel, Performance & Reforms',
        'keywords': ['virtual_meetings', 'public_service_rules', 'remote_work_continuity', 'emergency_operations'],
        'explanation': 'The Public Service Rules incorporated virtual-meeting provisions to support continuity of official work during emergencies and remote operating conditions.'
    }
}

removed = {}
for sub in ict.get('subcategories', []):
    kept = []
    for q in sub.get('questions', []):
        qid = q.get('id')
        if qid in move_specs:
            removed[qid] = dict(q)
            continue
        kept.append(q)
    sub['questions'] = kept

if set(removed) != set(move_specs):
    missing = sorted(set(move_specs) - set(removed))
    raise RuntimeError(f'Missing questions: {missing}')

for old_id, spec in move_specs.items():
    q = dict(removed[old_id])
    q['id'] = spec['new_id']
    q['question'] = spec['question']
    q['chapter'] = spec['chapter']
    q['sourceDocument'] = spec['sourceDocument']
    q['sourceSection'] = spec['sourceSection']
    q['sourceTopicId'] = spec['sourceTopicId']
    q['sourceTopicName'] = spec['sourceTopicName']
    q['sourceSubcategoryId'] = spec['sourceSubcategoryId']
    q['sourceSubcategoryName'] = spec['sourceSubcategoryName']
    q['keywords'] = spec['keywords']
    q['explanation'] = spec['explanation']
    q['year'] = 2021
    q['legacyQuestionIds'] = list(dict.fromkeys((q.get('legacyQuestionIds') or []) + [old_id]))
    for sub in psr.get('subcategories', []):
        if sub.get('id') == 'circ_personnel_performance':
            sub.setdefault('questions', []).append(q)
            break
    else:
        raise RuntimeError('Missing circ_personnel_performance target')

ict_path.write_text(json.dumps(ict, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
psr_path.write_text(json.dumps(psr, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Applied move round 37.')
for old_id, spec in move_specs.items():
    print(f"{old_id} -> {spec['new_id']}")
