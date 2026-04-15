import json
from pathlib import Path

lead_path = Path('data/leadership_negotiation.json')
civil_path = Path('data/civil_service_ethics.json')
psr_path = Path('data/psr_rules.json')

lead = json.loads(lead_path.read_text(encoding='utf-8'))
civil = json.loads(civil_path.read_text(encoding='utf-8'))
psr = json.loads(psr_path.read_text(encoding='utf-8'))

move_to_csh = {
    'leadership_lsm_071': 'csh_ap_145',
    'leadership_lsm_072': 'csh_ap_146',
    'leadership_lsm_074': 'csh_ap_147',
    'leadership_smp_060': 'csh_ap_148',
    'leadership_smp_066': 'csh_ap_149',
    'leadership_smp_070': 'csh_ap_150',
}
move_to_psr = {
    'leadership_mpf_025': 'psr_train_074',
}

removed = {}
for sub in lead.get('subcategories', []):
    new_questions = []
    for question in sub.get('questions', []):
        qid = question.get('id')
        if qid in move_to_csh or qid in move_to_psr:
            removed[qid] = dict(question)
            continue
        new_questions.append(question)
    sub['questions'] = new_questions

expected = set(move_to_csh) | set(move_to_psr)
if set(removed) != expected:
    missing = sorted(expected - set(removed))
    raise RuntimeError(f'Missing source questions: {missing}')

for sub in civil.get('subcategories', []):
    if sub.get('id') != 'csh_administrative_procedures':
        continue
    for old_id, new_id in move_to_csh.items():
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

for sub in psr.get('subcategories', []):
    if sub.get('id') != 'psr_training':
        continue
    for old_id, new_id in move_to_psr.items():
        q = dict(removed[old_id])
        q['id'] = new_id
        q['chapter'] = 'Training'
        q['source'] = q.get('source', 'generated_draft')
        q['sourceDocument'] = 'Public Service Rules'
        q['sourceSection'] = 'Training'
        q['tags'] = q.get('keywords', []) + ['psr', 'psr_training']
        q['sourceSubcategoryId'] = 'psr_training'
        q['sourceSubcategoryName'] = 'Training'
        q['sourceTopicId'] = 'psr'
        q['sourceTopicName'] = 'Public Service Rules (PSR)'
        q['legacyQuestionIds'] = [old_id]
        sub.setdefault('questions', []).append(q)
    break
else:
    raise RuntimeError('psr_training not found')

lead_path.write_text(json.dumps(lead, indent=2) + '\n', encoding='utf-8')
civil_path.write_text(json.dumps(civil, indent=2) + '\n', encoding='utf-8')
psr_path.write_text(json.dumps(psr, indent=2) + '\n', encoding='utf-8')
print('Moved 7 questions: 6 to csh_administrative_procedures and 1 to psr_training.')
