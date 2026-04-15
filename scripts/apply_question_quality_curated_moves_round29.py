#!/usr/bin/env python3
"""Move round 29: relocate office-procedure spillovers exposed after round 95/96."""

import json
from pathlib import Path

civil_path = Path('data/civil_service_ethics.json')
lead_path = Path('data/leadership_negotiation.json')
policy_path = Path('data/policy_analysis.json')

civil = json.loads(civil_path.read_text(encoding='utf-8'))
lead = json.loads(lead_path.read_text(encoding='utf-8'))
policy = json.loads(policy_path.read_text(encoding='utf-8'))

move_specs = {
    'neg_principles_outcomes_gen_017': {
        'source': 'leadership',
        'new_id': 'csh_ap_195',
        'question': 'Which record-management routine best supports official case follow-up?',
        'chapter': 'Administrative Procedures',
        'sourceDocument': 'Civil Service Handbook',
        'sourceSection': 'Administrative Procedures',
        'sourceTopicId': 'civil_service_admin',
        'sourceTopicName': 'Civil Service Administration, Ethics & Integrity',
        'sourceSubcategoryId': 'csh_administrative_procedures',
        'sourceSubcategoryName': 'Administrative Procedures',
        'keywords': ['case_follow_up', 'record_management', 'status_updates', 'administrative_procedure'],
        'tags': ['case_follow_up', 'record_management', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'Official case follow-up is supported by keeping files current and updating their status at each control point so the administrative trail remains traceable and reviewable.',
    },
    'pol_analysis_methods_gen_024': {
        'source': 'policy',
        'new_id': 'csh_ap_196',
        'question': 'Which record-management routine best supports official policy files?',
        'chapter': 'Administrative Procedures',
        'sourceDocument': 'Civil Service Handbook',
        'sourceSection': 'Administrative Procedures',
        'sourceTopicId': 'civil_service_admin',
        'sourceTopicName': 'Civil Service Administration, Ethics & Integrity',
        'sourceSubcategoryId': 'csh_administrative_procedures',
        'sourceSubcategoryName': 'Administrative Procedures',
        'keywords': ['policy_files', 'record_management', 'status_updates', 'administrative_procedure'],
        'tags': ['policy_files', 'record_management', 'civil_service_admin', 'csh_administrative_procedures'],
        'explanation': 'Official policy files remain reviewable when they are kept current and their status is updated at each control point instead of being allowed to drift informally.',
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

removed = {}
for old_id, spec in move_specs.items():
    source_data = lead if spec['source'] == 'leadership' else policy
    removed[old_id] = remove_question(source_data, old_id)

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
    q['tags'] = spec['tags']
    q['explanation'] = spec['explanation']
    q['legacyQuestionIds'] = list(dict.fromkeys((q.get('legacyQuestionIds') or []) + [old_id]))
    add_to_target(civil, 'csh_administrative_procedures', q)

civil_path.write_text(json.dumps(civil, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
lead_path.write_text(json.dumps(lead, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
policy_path.write_text(json.dumps(policy, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Applied move round 29.')
for old_id, spec in move_specs.items():
    print(f"{old_id} -> {spec['new_id']}")
