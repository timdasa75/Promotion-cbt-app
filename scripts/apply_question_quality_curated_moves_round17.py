import json
from pathlib import Path

policy_path = Path('data/policy_analysis.json')
civil_path = Path('data/civil_service_ethics.json')
policy = json.loads(policy_path.read_text(encoding='utf-8'))
civil = json.loads(civil_path.read_text(encoding='utf-8'))

source_question = None
for sub in policy.get('subcategories', []):
    if sub.get('id') != 'pol_formulation_cycle':
        continue
    new_questions = []
    for question in sub.get('questions', []):
        if question.get('id') == 'policy_constitution_076':
            source_question = question
            continue
        new_questions.append(question)
    sub['questions'] = new_questions
    break

if source_question is None:
    raise RuntimeError('policy_constitution_076 not found')

moved = dict(source_question)
moved['id'] = 'csh_ap_144'
moved['chapter'] = 'Administrative Procedures'
moved['source'] = moved.get('source', 'generated_draft')
moved['sourceDocument'] = 'Civil Service Handbook'
moved['sourceSection'] = 'Administrative Procedures'
moved['tags'] = [
    'open_registry',
    'records_management',
    'civil_service_admin',
    'csh_administrative_procedures'
]
moved['sourceSubcategoryId'] = 'csh_administrative_procedures'
moved['sourceSubcategoryName'] = 'Administrative Procedures'
moved['sourceTopicId'] = 'civil_service_admin'
moved['sourceTopicName'] = 'Civil Service Administration, Ethics & Integrity'
moved['legacyQuestionIds'] = ['policy_constitution_076']

inserted = False
for sub in civil.get('subcategories', []):
    if sub.get('id') == 'csh_administrative_procedures':
        sub.setdefault('questions', []).append(moved)
        inserted = True
        break

if not inserted:
    raise RuntimeError('csh_administrative_procedures not found')

policy_path.write_text(json.dumps(policy, indent=2) + '\n', encoding='utf-8')
civil_path.write_text(json.dumps(civil, indent=2) + '\n', encoding='utf-8')
print('Moved policy_constitution_076 to csh_ap_144.')
