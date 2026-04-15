import json
from pathlib import Path

lead_path = Path('data/leadership_negotiation.json')
civil_path = Path('data/civil_service_ethics.json')
lead = json.loads(lead_path.read_text(encoding='utf-8'))
civil = json.loads(civil_path.read_text(encoding='utf-8'))

move_map = {
    'neg_principles_outcomes_gen_073': 'csh_ap_155',
}
removed = {}
for sub in lead.get('subcategories', []):
    kept = []
    for question in sub.get('questions', []):
        qid = question.get('id')
        if qid in move_map:
            removed[qid] = dict(question)
            continue
        kept.append(question)
    sub['questions'] = kept
if set(removed) != set(move_map):
    missing = sorted(set(move_map) - set(removed))
    raise RuntimeError(f'Missing source questions: {missing}')
for sub in civil.get('subcategories', []):
    if sub.get('id') != 'csh_administrative_procedures':
        continue
    for old_id, new_id in move_map.items():
        q = dict(removed[old_id])
        q['id'] = new_id
        q['question'] = 'Which records-management practice best supports an official case file?'
        q['explanation'] = 'An official case file is best supported when records are kept accurately and status is updated at each control point. That practice preserves continuity, auditability, and accountability in administrative procedure.'
        q['keywords'] = ['records_management', 'official_case_file', 'status_updates', 'administrative_procedure']
        q['chapter'] = 'Administrative Procedures'
        q['source'] = q.get('source', 'generated_draft')
        q['sourceDocument'] = 'Civil Service Handbook'
        q['sourceSection'] = 'Administrative Procedures'
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
lead_path.write_text(json.dumps(lead, indent=2) + '\n', encoding='utf-8')
civil_path.write_text(json.dumps(civil, indent=2) + '\n', encoding='utf-8')
print('Moved 1 leadership records-management question to csh_administrative_procedures as csh_ap_155.')
