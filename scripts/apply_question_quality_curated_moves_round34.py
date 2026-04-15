#!/usr/bin/env python3
import json
from pathlib import Path

civil_path = Path('data/civil_service_ethics.json')
ca_path = Path('data/general_current_affairs.json')

civil = json.loads(civil_path.read_text(encoding='utf-8'))
ca = json.loads(ca_path.read_text(encoding='utf-8'))

move_specs = {
    'ca_international_affairs_gen_025': {
        'new_id': 'csh_ap_208',
        'question': 'Which record-management routine best keeps an official case file reviewable?',
        'keywords': ['administrative_procedure', 'record_management', 'official_case_file', 'status_updates'],
        'tags': ['administrative_procedure', 'record_management', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'An official case file remains reviewable when it is kept current and its status is updated at each control point.'
    },
    'ca_public_service_reforms_gen_018': {
        'new_id': 'csh_ap_209',
        'question': 'Which registry routine best supports file control during administrative reform work?',
        'keywords': ['administrative_procedure', 'registry_routine', 'file_control', 'status_updates'],
        'tags': ['administrative_procedure', 'registry_routine', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'Administrative reform files remain manageable when registry control keeps them current and records each status update at the right control point.'
    },
}

removed = {}
for sub in ca.get('subcategories', []):
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
ca_path.write_text(json.dumps(ca, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Applied move round 34.')
for old_id, spec in move_specs.items():
    print(f"{old_id} -> {spec['new_id']}")
