#!/usr/bin/env python3
import json
from pathlib import Path

gca_path = Path('data/general_current_affairs.json')
civil_path = Path('data/civil_service_ethics.json')

gca = json.loads(gca_path.read_text(encoding='utf-8'))
civil = json.loads(civil_path.read_text(encoding='utf-8'))

move_specs = {
    'ca_national_governance_gen_017': {
        'new_id': 'csh_ap_215',
        'question': 'Which practice best supports record management in an official governance file?',
        'keywords': ['administrative_procedure', 'record_management', 'governance_file', 'status_updates'],
        'tags': ['administrative_procedure', 'record_management', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'Record management is strongest when an official governance file is kept current and its status is updated at each control point so the matter remains reviewable.'
    }
}

removed = {}
for sub in gca.get('subcategories', []):
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

gca_path.write_text(json.dumps(gca, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
civil_path.write_text(json.dumps(civil, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Applied move round 38.')
for old_id, spec in move_specs.items():
    print(f"{old_id} -> {spec['new_id']}")
