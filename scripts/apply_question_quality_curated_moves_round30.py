#!/usr/bin/env python3
"""Move round 30: relocate constitutional office-procedure spillovers exposed after round 99."""

import json
from pathlib import Path

civil_path = Path('data/civil_service_ethics.json')
const_path = Path('data/constitutional_foi.json')

civil = json.loads(civil_path.read_text(encoding='utf-8'))
const = json.loads(const_path.read_text(encoding='utf-8'))

move_specs = {
    'clg_general_competency_gen_017': {
        'new_id': 'csh_ap_197',
        'question': 'Which record-management routine best supports official case files?',
        'keywords': ['administrative_procedure', 'record_management', 'official_case_files', 'status_updates'],
        'tags': ['administrative_procedure', 'record_management', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'Official case files remain reviewable when they are kept current and their status is updated at each control point.'
    },
    'clg_general_competency_gen_053': {
        'new_id': 'csh_ap_198',
        'question': 'When an administrative file requires documented procedure, what should be done first?',
        'keywords': ['administrative_procedure', 'documented_procedure', 'approved_process', 'complete_records'],
        'tags': ['administrative_procedure', 'documented_procedure', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'Administrative procedure starts with following the approved process and keeping the complete record needed for later review.'
    },
    'clg_general_competency_gen_080': {
        'new_id': 'csh_ap_199',
        'question': 'Which document-management routine best supports official reform files?',
        'keywords': ['administrative_procedure', 'document_management', 'official_reform_files', 'status_updates'],
        'tags': ['administrative_procedure', 'document_management', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'Official reform files remain usable when they are kept accurate and their status is updated at each control point.'
    },
    'clg_legal_compliance_gen_030': {
        'new_id': 'csh_ap_200',
        'question': 'Which record-management routine best supports official compliance case files?',
        'keywords': ['administrative_procedure', 'record_management', 'compliance_case_files', 'status_updates'],
        'tags': ['administrative_procedure', 'record_management', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'Official compliance case files remain reviewable when they are kept current and their status is updated at each control point.'
    },
    'clg_legal_compliance_gen_047': {
        'new_id': 'csh_ap_201',
        'question': 'When an official compliance file requires documented procedure, what should be done first?',
        'keywords': ['administrative_procedure', 'documented_procedure', 'compliance_file', 'complete_records'],
        'tags': ['administrative_procedure', 'documented_procedure', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'An official compliance file should follow the approved procedure from the start, with the full record kept for review and accountability.'
    },
}

def remove_question(data, qid):
    for sub in data.get('subcategories', []):
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

removed = {old_id: remove_question(const, old_id) for old_id in move_specs}

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
const_path.write_text(json.dumps(const, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Applied move round 30.')
for old_id, spec in move_specs.items():
    print(f"{old_id} -> {spec['new_id']}")
