#!/usr/bin/env python3
"""Move round 31: relocate current-affairs office-procedure spillovers exposed after round 102."""

import json
from pathlib import Path

civil_path = Path('data/civil_service_ethics.json')
ca_path = Path('data/general_current_affairs.json')

civil = json.loads(civil_path.read_text(encoding='utf-8'))
current = json.loads(ca_path.read_text(encoding='utf-8'))

move_specs = {
    'ca_national_events_gen_017': {
        'new_id': 'csh_ap_202',
        'question': 'Which record-management routine best supports official event files?',
        'keywords': ['administrative_procedure', 'record_management', 'official_event_files', 'status_updates'],
        'tags': ['administrative_procedure', 'record_management', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'Official event files remain reviewable when they are kept current and their status is updated at each control point.'
    },
    'ca_national_events_gen_036': {
        'new_id': 'csh_ap_203',
        'question': 'When an official event file requires documented procedure, what should be done first?',
        'keywords': ['administrative_procedure', 'documented_procedure', 'official_event_file', 'complete_records'],
        'tags': ['administrative_procedure', 'documented_procedure', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'An official event file should follow the approved procedure from the start, with the full record kept for later review and accountability.'
    },
}

def remove_question(data, qid):
    for sub in data.get('subcategories', []):
        if sub.get('id') != 'ca_national_events':
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

removed = {old_id: remove_question(current, old_id) for old_id in move_specs}

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
ca_path.write_text(json.dumps(current, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Applied move round 31.')
for old_id, spec in move_specs.items():
    print(f"{old_id} -> {spec['new_id']}")
