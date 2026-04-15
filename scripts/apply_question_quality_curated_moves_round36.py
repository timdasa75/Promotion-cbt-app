#!/usr/bin/env python3
import json
from pathlib import Path

civil_path = Path('data/civil_service_ethics.json')
fin_path = Path('data/financial_regulations.json')

civil = json.loads(civil_path.read_text(encoding='utf-8'))
fin = json.loads(fin_path.read_text(encoding='utf-8'))

move_specs = {
    'fin_budgeting_gen_017': {
        'new_id': 'csh_ap_212',
        'question': 'In an official budgeting file, which record-management routine best keeps the matter reviewable?',
        'keywords': ['administrative_procedure', 'record_management', 'budgeting_file', 'status_updates'],
        'tags': ['administrative_procedure', 'record_management', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'A budgeting file remains reviewable when it is kept current and its status is updated at each control point rather than being left to informal filing habits.'
    },
    'fin_general_gen_017': {
        'new_id': 'csh_ap_213',
        'question': 'What filing practice best preserves traceability in a general finance file moving through official review?',
        'keywords': ['administrative_procedure', 'file_traceability', 'finance_file', 'control_points'],
        'tags': ['administrative_procedure', 'record_management', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'Traceability depends on keeping the file current and recording status changes at each control point so supervisors can see what has happened and what remains outstanding.'
    },
    'fin_procurement_gen_021': {
        'new_id': 'csh_ap_214',
        'question': 'When a procurement control file is being processed officially, which record-management step best supports accountability?',
        'keywords': ['administrative_procedure', 'procurement_file', 'record_management', 'accountability'],
        'tags': ['administrative_procedure', 'record_management', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'Official accountability is easiest to maintain when the procurement control file is kept current and its status is updated at each review point.'
    },
}

removed = {}
for sub in fin.get('subcategories', []):
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
fin_path.write_text(json.dumps(fin, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Applied move round 36.')
for old_id, spec in move_specs.items():
    print(f"{old_id} -> {spec['new_id']}")
