#!/usr/bin/env python3
"""Move round 32: relocate policy implementation office-procedure spillovers exposed after round 103."""

import json
from pathlib import Path

civil_path = Path('data/civil_service_ethics.json')
policy_path = Path('data/policy_analysis.json')

civil = json.loads(civil_path.read_text(encoding='utf-8'))
policy = json.loads(policy_path.read_text(encoding='utf-8'))

move_specs = {
    'policy_psr_033': {
        'new_id': 'csh_ap_204',
        'question': 'What is the correct rule for handling confidential files?',
        'keywords': ['administrative_procedure', 'confidential_files', 'restricted_access', 'secure_storage'],
        'tags': ['administrative_procedure', 'confidential_files', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'Confidential files must be handled through restricted access and secure storage because they contain sensitive official material.'
    },
    'policy_psr_044': {
        'new_id': 'csh_ap_205',
        'question': 'What is the purpose of a file copy of an official circular?',
        'keywords': ['administrative_procedure', 'file_copy', 'official_circular', 'subject_file'],
        'tags': ['administrative_procedure', 'file_copy', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'A file copy of an official circular is kept in the file relevant to the subject matter so the administrative record remains complete.'
    },
    'pol_implementation_evaluation_gen_029': {
        'new_id': 'csh_ap_206',
        'question': 'Which record-management routine best supports official implementation files?',
        'keywords': ['administrative_procedure', 'record_management', 'implementation_files', 'status_updates'],
        'tags': ['administrative_procedure', 'record_management', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'Official implementation files remain reviewable when they are kept current and their status is updated at each control point.'
    },
    'pol_implementation_evaluation_gen_046': {
        'new_id': 'csh_ap_207',
        'question': 'When an official implementation file requires documented procedure, what should be done first?',
        'keywords': ['administrative_procedure', 'documented_procedure', 'implementation_file', 'complete_records'],
        'tags': ['administrative_procedure', 'documented_procedure', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'An official implementation file should follow the approved procedure from the start, with the full record kept for later review and accountability.'
    },
}

def remove_question(data, qid):
    for sub in data.get('subcategories', []):
        if sub.get('id') != 'pol_implementation_evaluation':
            continue
        kept = []
        removed = None
        for q in sub.get('questions', []):
            if q.get('id') == qid:
                removed = dict(q)
                continue
            kept.append(q)
        if removed is not None:
            sub['questions'] = kept
            return removed
    raise RuntimeError(f'Question not found: {qid}')


def add_to_target(data, sub_id, question):
    for sub in data.get('subcategories', []):
        if sub.get('id') == sub_id:
            sub.setdefault('questions', []).append(question)
            return
    raise RuntimeError(f'Missing target subcategory: {sub_id}')

removed = {old_id: remove_question(policy, old_id) for old_id in move_specs}

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
    add_to_target(civil, 'csh_administrative_procedures', q)

civil_path.write_text(json.dumps(civil, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
policy_path.write_text(json.dumps(policy, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Applied move round 32.')
for old_id, spec in move_specs.items():
    print(f"{old_id} -> {spec['new_id']}")
