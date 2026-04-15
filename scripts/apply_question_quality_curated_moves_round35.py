#!/usr/bin/env python3
import json
from pathlib import Path

civil_path = Path('data/civil_service_ethics.json')
const_path = Path('data/constitutional_foi.json')

civil = json.loads(civil_path.read_text(encoding='utf-8'))
const = json.loads(const_path.read_text(encoding='utf-8'))

move_specs = {
    'clg_constitutional_governance_gen_017': {
        'new_id': 'csh_ap_210',
        'question': 'Which record-management routine best keeps an official governance file reviewable?',
        'keywords': ['administrative_procedure', 'record_management', 'official_governance_file', 'status_updates'],
        'tags': ['administrative_procedure', 'record_management', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'An official governance file remains reviewable when it is kept current and its status is updated at each control point.'
    },
    'clg_constitutional_governance_gen_039': {
        'new_id': 'csh_ap_211',
        'question': 'When an official file requires documented procedure, what should be done first?',
        'keywords': ['administrative_procedure', 'documented_procedure', 'official_file', 'complete_records'],
        'tags': ['administrative_procedure', 'documented_procedure', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'An official file should follow the approved procedure from the start, with complete records kept for later review and accountability.'
    },
}

removed = {}
for sub in const.get('subcategories', []):
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
    q['chapter'] = 'Administrative Procedures'
    q['sourceDocument'] = 'Civil Service Handbook'
    q['sourceSection'] = 'Administrative Procedures'
    q['sourceTopicId'] = 'civil_service_admin'
    q['sourceTopicName'] = 'Civil Service Administration, Ethics & Integrity'
    q['sourceSubcategoryId'] = 'csh_administrative_procedures'
    q['sourceSubcategoryName'] = 'Administrative Procedures'
    q['keywords'] = spec['keywords']
    q['tags'] = spec['tags']
    q['explanation'] = spec['explanation']
    q['legacyQuestionIds'] = list(dict.fromkeys((q.get('legacyQuestionIds') or []) + [old_id]))
    for sub in civil.get('subcategories', []):
        if sub.get('id') == 'csh_administrative_procedures':
            sub.setdefault('questions', []).append(q)
            break
    else:
        raise RuntimeError('Missing csh_administrative_procedures target')

civil_path.write_text(json.dumps(civil, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
const_path.write_text(json.dumps(const, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Applied move round 35.')
for old_id, spec in move_specs.items():
    print(f"{old_id} -> {spec['new_id']}")
