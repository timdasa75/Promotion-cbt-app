import json
from pathlib import Path

core_path = Path('data/core_competencies.json')
const_path = Path('data/constitutional_foi.json')
civil_path = Path('data/civil_service_ethics.json')

core = json.loads(core_path.read_text(encoding='utf-8'))
const = json.loads(const_path.read_text(encoding='utf-8'))
civil = json.loads(civil_path.read_text(encoding='utf-8'))

move_specs = {
    'competency_verbal_074': {
        'new_id': 'csh_ap_153',
        'chapter': 'Administrative Procedures',
        'sourceDocument': 'Financial Regulations (FR)',
        'sourceSection': 'Administrative Procedures',
    },
    'clg_legal_compliance_gen_066': {
        'new_id': 'csh_ap_154',
        'chapter': 'Administrative Procedures',
        'sourceDocument': 'Civil Service Handbook',
        'sourceSection': 'Administrative Procedures',
    },
}

def remove_from_topic(data, wanted_ids):
    removed = {}
    for sub in data.get('subcategories', []):
        kept = []
        for question in sub.get('questions', []):
            qid = question.get('id')
            if qid in wanted_ids:
                removed[qid] = dict(question)
                continue
            kept.append(question)
        sub['questions'] = kept
    return removed

removed = {}
removed.update(remove_from_topic(core, {'competency_verbal_074'}))
removed.update(remove_from_topic(const, {'clg_legal_compliance_gen_066'}))
if set(removed) != set(move_specs):
    missing = sorted(set(move_specs) - set(removed))
    raise RuntimeError(f'Missing source questions: {missing}')

for sub in civil.get('subcategories', []):
    if sub.get('id') != 'csh_administrative_procedures':
        continue
    for old_id, spec in move_specs.items():
        q = dict(removed[old_id])
        q['id'] = spec['new_id']
        q['chapter'] = spec['chapter']
        q['source'] = q.get('source', 'generated_draft')
        q['sourceDocument'] = spec['sourceDocument']
        q['sourceSection'] = spec['sourceSection']
        q['tags'] = list(dict.fromkeys((q.get('tags') or q.get('keywords', [])) + ['civil_service_admin', 'csh_administrative_procedures']))
        q['sourceSubcategoryId'] = 'csh_administrative_procedures'
        q['sourceSubcategoryName'] = 'Administrative Procedures'
        q['sourceTopicId'] = 'civil_service_admin'
        q['sourceTopicName'] = 'Civil Service Administration, Ethics & Integrity'
        q['legacyQuestionIds'] = [old_id]
        sub.setdefault('questions', []).append(q)
    break
else:
    raise RuntimeError('csh_administrative_procedures not found')

core_path.write_text(json.dumps(core, indent=2) + '\n', encoding='utf-8')
const_path.write_text(json.dumps(const, indent=2) + '\n', encoding='utf-8')
civil_path.write_text(json.dumps(civil, indent=2) + '\n', encoding='utf-8')
print('Moved 2 final administrative-procedure questions to csh_administrative_procedures.')
