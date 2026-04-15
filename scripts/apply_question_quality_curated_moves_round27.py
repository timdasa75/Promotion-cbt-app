import json
from pathlib import Path

civil_path = Path('data/civil_service_ethics.json')
lead_path = Path('data/leadership_negotiation.json')
policy_path = Path('data/policy_analysis.json')

civil = json.loads(civil_path.read_text(encoding='utf-8'))
lead = json.loads(lead_path.read_text(encoding='utf-8'))
policy = json.loads(policy_path.read_text(encoding='utf-8'))

move_specs = {
    'csh_ap_094': {
        'target': 'lead',
        'target_subcategory': 'neg_dispute_law',
        'new_id': 'neg_dispute_law_gen_091',
        'question': 'In a time-sensitive labour-dispute file, which step best preserves negotiation progress without breaching procedure?',
        'keywords': ['labour_dispute', 'negotiation_progress', 'documented_commitments', 'due_process'],
        'tags': ['labour_dispute', 'negotiation_progress', 'leadership_management', 'neg_dispute_law'],
        'chapter': 'Dispute Resolution & Labour Law',
        'sourceDocument': 'Negotiation & Labour Relations',
        'sourceSection': 'Dispute Resolution & Labour Law',
        'sourceTopicId': 'leadership_management',
        'sourceTopicName': 'Leadership, Management & Negotiation',
        'sourceSubcategoryName': 'Dispute Resolution & Labour Law',
    },
    'csh_ap_098': {
        'target': 'lead',
        'target_subcategory': 'neg_structure_bodies',
        'new_id': 'neg_structure_bodies_gen_089',
        'question': 'In a time-sensitive negotiating-structures file, which step best preserves negotiation progress without breaching procedure?',
        'keywords': ['negotiating_structures', 'negotiation_progress', 'documented_commitments', 'process_compliance'],
        'tags': ['negotiating_structures', 'negotiation_progress', 'leadership_management', 'neg_structure_bodies'],
        'chapter': 'Negotiating Structures & Bodies',
        'sourceDocument': 'Negotiation & Labour Relations',
        'sourceSection': 'Negotiating Structures & Bodies',
        'sourceTopicId': 'leadership_management',
        'sourceTopicName': 'Leadership, Management & Negotiation',
        'sourceSubcategoryName': 'Negotiating Structures & Bodies',
    },
    'csh_ap_100': {
        'target': 'policy',
        'target_subcategory': 'pol_public_sector_planning',
        'new_id': 'pol_public_sector_planning_gen_101',
        'question': 'In a time-sensitive planning file, which step best preserves implementation planning without breaching procedure?',
        'keywords': ['implementation_planning', 'planning_file', 'recorded_timelines', 'performance_metrics'],
        'tags': ['implementation_planning', 'planning_file', 'policy_analysis', 'pol_public_sector_planning'],
        'chapter': 'Public Sector Planning',
        'sourceDocument': 'Policy Analysis & Planning',
        'sourceSection': 'Public Sector Planning',
        'sourceTopicId': 'policy_analysis',
        'sourceTopicName': 'Policy Analysis & Planning',
        'sourceSubcategoryName': 'Public Sector Planning',
    },
}


def iterate_question_list(sub):
    qs = sub.get('questions', [])
    if qs and isinstance(qs[0], dict) and sub.get('id') and isinstance(qs[0].get(sub.get('id')), list):
        return qs[0][sub.get('id')], True
    return qs, False


def remove_question(data, qid):
    for sub in data.get('subcategories', []):
        qs, nested = iterate_question_list(sub)
        kept = []
        removed = None
        for q in qs:
            if q.get('id') == qid:
                removed = dict(q)
                continue
            kept.append(q)
        if removed is not None:
            if nested:
                sub['questions'][0][sub.get('id')] = kept
            else:
                sub['questions'] = kept
            return removed
    raise RuntimeError(f'Question not found: {qid}')


def add_to_target(data, sub_id, question):
    for sub in data.get('subcategories', []):
        if sub.get('id') != sub_id:
            continue
        qs = sub.get('questions', [])
        if qs and isinstance(qs[0], dict) and sub_id and isinstance(qs[0].get(sub_id), list):
            qs[0][sub_id].append(question)
        else:
            sub.setdefault('questions', []).append(question)
        return
    raise RuntimeError(f'Missing target subcategory: {sub_id}')


removed = {}
for old_id in move_specs:
    removed[old_id] = remove_question(civil, old_id)

for old_id, spec in move_specs.items():
    q = dict(removed[old_id])
    q['id'] = spec['new_id']
    q['question'] = spec['question']
    q['chapter'] = spec['chapter']
    q['sourceDocument'] = spec['sourceDocument']
    q['sourceSection'] = spec['sourceSection']
    q['sourceTopicId'] = spec['sourceTopicId']
    q['sourceTopicName'] = spec['sourceTopicName']
    q['sourceSubcategoryId'] = spec['target_subcategory']
    q['sourceSubcategoryName'] = spec['sourceSubcategoryName']
    q['keywords'] = spec['keywords']
    q['tags'] = spec['tags']
    q['legacyQuestionIds'] = list(dict.fromkeys((q.get('legacyQuestionIds') or []) + [old_id]))
    if spec['target'] == 'lead':
        add_to_target(lead, spec['target_subcategory'], q)
    else:
        add_to_target(policy, spec['target_subcategory'], q)

civil_path.write_text(json.dumps(civil, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
lead_path.write_text(json.dumps(lead, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
policy_path.write_text(json.dumps(policy, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

print('Moved 3 questions in move round 27.')
for old_id, spec in move_specs.items():
    print(f"{old_id} -> {spec['new_id']}")
