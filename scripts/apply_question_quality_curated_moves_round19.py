import json
from pathlib import Path

proc_path = Path('data/public_procurement.json')
civil_path = Path('data/civil_service_ethics.json')
proc = json.loads(proc_path.read_text(encoding='utf-8'))
civil = json.loads(civil_path.read_text(encoding='utf-8'))
move_map = {
    'ppa_ethic_070': 'csh_ap_151',
    'ppa_ethic_072': 'csh_ap_152',
}
removed = {}
for sub in proc.get('subcategories', []):
    new_questions = []
    for question in sub.get('questions', []):
        qid = question.get('id')
        if qid in move_map:
            removed[qid] = dict(question)
            continue
        new_questions.append(question)
    sub['questions'] = new_questions
if set(removed) != set(move_map):
    missing = sorted(set(move_map) - set(removed))
    raise RuntimeError(f'Missing source questions: {missing}')
for sub in civil.get('subcategories', []):
    if sub.get('id') != 'csh_administrative_procedures':
        continue
    for old_id, new_id in move_map.items():
        q = dict(removed[old_id])
        q['id'] = new_id
        q['chapter'] = 'Administrative Procedures'
        q['source'] = q.get('source', 'generated_draft')
        q['sourceDocument'] = 'Civil Service Handbook'
        q['sourceSection'] = 'Administrative Procedures'
        q['tags'] = q.get('keywords', []) + ['civil_service_admin', 'csh_administrative_procedures']
        q['sourceSubcategoryId'] = 'csh_administrative_procedures'
        q['sourceSubcategoryName'] = 'Administrative Procedures'
        q['sourceTopicId'] = 'civil_service_admin'
        q['sourceTopicName'] = 'Civil Service Administration, Ethics & Integrity'
        q['legacyQuestionIds'] = [old_id]
        sub.setdefault('questions', []).append(q)
    break
else:
    raise RuntimeError('csh_administrative_procedures not found')
proc_path.write_text(json.dumps(proc, indent=2) + '\n', encoding='utf-8')
civil_path.write_text(json.dumps(civil, indent=2) + '\n', encoding='utf-8')
print('Moved 2 procurement file-note questions to csh_administrative_procedures.')
