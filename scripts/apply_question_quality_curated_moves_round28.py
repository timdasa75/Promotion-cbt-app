import json
from pathlib import Path

civil_path = Path('data/civil_service_ethics.json')
policy_path = Path('data/policy_analysis.json')

civil = json.loads(civil_path.read_text(encoding='utf-8'))
policy = json.loads(policy_path.read_text(encoding='utf-8'))

move_specs = {
    'pol_public_sector_planning_gen_017': {
        'new_id': 'csh_ap_193',
        'question': 'Which records routine best supports planning files in official administration?',
        'chapter': 'Administrative Procedures',
        'sourceDocument': 'Civil Service Handbook',
        'sourceSection': 'Administrative Procedures',
        'sourceTopicId': 'civil_service_admin',
        'sourceTopicName': 'Civil Service Administration, Ethics & Integrity',
        'sourceSubcategoryId': 'csh_administrative_procedures',
        'sourceSubcategoryName': 'Administrative Procedures',
        'keywords': ['planning_files', 'record_management', 'status_updates', 'administrative_procedure'],
        'tags': ['planning_files', 'record_management', 'civil_service_admin', 'csh_administrative_procedures'],
    },
    'pol_public_sector_planning_gen_035': {
        'new_id': 'csh_ap_194',
        'question': 'Which routine best sustains planning-file records in official administration?',
        'chapter': 'Administrative Procedures',
        'sourceDocument': 'Civil Service Handbook',
        'sourceSection': 'Administrative Procedures',
        'sourceTopicId': 'civil_service_admin',
        'sourceTopicName': 'Civil Service Administration, Ethics & Integrity',
        'sourceSubcategoryId': 'csh_administrative_procedures',
        'sourceSubcategoryName': 'Administrative Procedures',
        'keywords': ['planning_file_records', 'record_management', 'control_points', 'administrative_procedure'],
        'tags': ['planning_file_records', 'record_management', 'civil_service_admin', 'csh_administrative_procedures'],
    },
}


def remove_question(data, qid):
    for sub in data.get('subcategories', []):
        qs = sub.get('questions', [])
        kept = []
        removed = None
        for q in qs:
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

removed = {qid: remove_question(policy, qid) for qid in move_specs}
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
    q['legacyQuestionIds'] = list(dict.fromkeys((q.get('legacyQuestionIds') or []) + [old_id]))
    add_to_target(civil, 'csh_administrative_procedures', q)

for sub in policy.get('subcategories', []):
    if sub.get('id') == 'pol_public_sector_planning':
        for q in sub.get('questions', []):
            if q.get('id') == 'pol_public_sector_planning_gen_055':
                q['question'] = 'When a supervisor reviews planning gaps, which action most directly strengthens accountable policy justification?'
                q['explanation'] = 'Accountable policy justification is strengthened when the supervisor can point to traceable decisions supported by recorded evidence and reasons.'
                q['keywords'] = ['public_sector_planning', 'accountable_policy_justification', 'traceable_decisions', 'recorded_reasons']
                break
        break

civil_path.write_text(json.dumps(civil, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
policy_path.write_text(json.dumps(policy, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Applied move round 28 and planning duplicate cleanup.')
for old_id, spec in move_specs.items():
    print(f"{old_id} -> {spec['new_id']}")
