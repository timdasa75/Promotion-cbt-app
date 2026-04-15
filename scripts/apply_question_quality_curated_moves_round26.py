import json
from pathlib import Path

proc_path = Path('data/public_procurement.json')
comp_path = Path('data/core_competencies.json')
foi_path = Path('data/constitutional_foi.json')
policy_path = Path('data/policy_analysis.json')
psr_path = Path('data/psr_rules.json')
civil_path = Path('data/civil_service_ethics.json')
ca_path = Path('data/general_current_affairs.json')

proc = json.loads(proc_path.read_text(encoding='utf-8'))
comp = json.loads(comp_path.read_text(encoding='utf-8'))
foi = json.loads(foi_path.read_text(encoding='utf-8'))
policy = json.loads(policy_path.read_text(encoding='utf-8'))
psr = json.loads(psr_path.read_text(encoding='utf-8'))
civil = json.loads(civil_path.read_text(encoding='utf-8'))
ca = json.loads(ca_path.read_text(encoding='utf-8'))

move_specs = {
    'ppa_elb_072': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_190',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'What does a confidential classification seek to protect?',
        'options': ['A permanent filing status.', 'Information that could be harmful if disclosed.', 'Automatic secrecy from every ministry.', 'Difficulty of access in every circumstance.'],
        'correct': 1,
        'explanation': 'A confidential classification is used to protect information that could be harmful if disclosed without authorization.',
        'keywords': ['confidential_classification', 'document_protection', 'harmful_disclosure', 'administrative_procedure'],
        'tags': ['confidential_classification', 'document_protection', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'competency_num_061': {
        'target': 'current', 'target_subcategory': 'ca_national_governance', 'new_id': 'NGPD_076',
        'chapter': 'National Governance & Policy Developments', 'sourceDocument': 'General Current Affairs', 'sourceSection': 'National Governance & Policy Developments',
        'question': 'What percentage of the current revenue-allocation formula goes to the Federal Government?',
        'options': ['26.72%', '100.00%', '52.68%', '20.60%'],
        'correct': 2,
        'explanation': 'Under the revenue-allocation formula referenced in the question bank, the Federal Government receives 52.68% of the allocation.',
        'keywords': ['revenue_allocation', 'federal_government', '52_68_percent', 'national_governance'],
        'tags': ['revenue_allocation', 'federal_government', 'general_current_affairs', 'ca_national_governance']
    },
    'competency_num_078': {
        'target': 'current', 'target_subcategory': 'ca_national_governance', 'new_id': 'NGPD_077',
        'chapter': 'National Governance & Policy Developments', 'sourceDocument': 'General Current Affairs', 'sourceSection': 'National Governance & Policy Developments',
        'question': 'What outcome were the President\'s budget directives intended to achieve?',
        'options': ['To reduce poverty, generate wealth, and create jobs.', 'To reduce social-welfare programmes.', 'To increase government debt.', 'To centralize all economic activity.'],
        'correct': 0,
        'explanation': 'The budget directives were framed around reducing poverty, generating wealth, and creating jobs through government policy and expenditure planning.',
        'keywords': ['budget_directives', 'poverty_reduction', 'job_creation', 'national_governance'],
        'tags': ['budget_directives', 'job_creation', 'general_current_affairs', 'ca_national_governance']
    },
    'FOI_OP_067': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_191',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'Which expression best describes style in official writing?',
        'options': ['The distinctive manner of writing.', 'The speed at which one writes.', 'The length of the writing.', 'The type of pen used for writing.'],
        'correct': 0,
        'explanation': 'In official writing, style refers to the distinctive manner in which ideas are expressed.',
        'keywords': ['style', 'official_writing', 'expression', 'administrative_procedure'],
        'tags': ['style', 'official_writing', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'pol_analysis_methods_gen_077': {
        'target': 'civil', 'target_subcategory': 'csh_duties_responsibilities', 'new_id': 'csh_duty_081',
        'chapter': 'Duties & Responsibilities', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Duties & Responsibilities',
        'question': 'What is the principal role of a parastatal in government administration?',
        'options': ['To manage all human-resource issues for a ministry.', 'To implement specific government policies and programmes assigned to it.', 'To act as the legislative body for a ministry.', 'To assist ministries in policy formulation only.'],
        'correct': 1,
        'explanation': 'A parastatal exists mainly to implement specific government policies and programmes assigned to it.',
        'keywords': ['parastatal', 'implementation', 'government_programmes', 'duties_responsibilities'],
        'tags': ['parastatal', 'implementation', 'civil_service_admin', 'csh_duties_responsibilities']
    },
    'pol_analysis_methods_gen_086': {
        'target': 'current', 'target_subcategory': 'ca_general', 'new_id': 'ca_general_076',
        'chapter': 'General Current Affairs', 'sourceDocument': 'General Current Affairs', 'sourceSection': 'General Current Affairs',
        'question': "Which Nigerian state is nicknamed the 'Home of Heroes'?",
        'options': ['Anambra.', 'Imo.', 'Enugu.', 'Abia.'],
        'correct': 3,
        'explanation': "Abia State is popularly known by the sobriquet 'Home of Heroes'.",
        'keywords': ['abia_state', 'home_of_heroes', 'state_sobriquet', 'general_current_affairs'],
        'tags': ['abia_state', 'state_sobriquet', 'general_current_affairs', 'ca_general']
    },
    'pol_analysis_methods_gen_097': {
        'target': 'current', 'target_subcategory': 'ca_general', 'new_id': 'ca_general_077',
        'chapter': 'General Current Affairs', 'sourceDocument': 'General Current Affairs', 'sourceSection': 'General Current Affairs',
        'question': "Which Nigerian state is nicknamed the 'Land of Hospitality'?",
        'options': ['Benue.', 'Kaduna.', 'Cross River.', 'Kogi.'],
        'correct': 0,
        'explanation': "Benue State is popularly known as the 'Land of Hospitality'.",
        'keywords': ['benue_state', 'land_of_hospitality', 'state_sobriquet', 'general_current_affairs'],
        'tags': ['benue_state', 'state_sobriquet', 'general_current_affairs', 'ca_general']
    },
    'ppa_objectives_067': {
        'target': 'civil', 'target_subcategory': 'csh_principles_ethics', 'new_id': 'csh_principle_084',
        'chapter': 'Civil Service Principles & Ethics', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Civil Service Principles & Ethics',
        'question': 'To whom is a civil servant expected to show loyalty in public service?',
        'options': ['The Head of the Civil Service.', 'The Permanent Secretary.', 'The Minister personally.', 'The government of the day.'],
        'correct': 3,
        'explanation': 'A civil servant is expected to show loyalty to the government of the day in the lawful discharge of official duties.',
        'keywords': ['civil_servant', 'loyalty', 'government_of_the_day', 'civil_service_principles'],
        'tags': ['loyalty', 'government_of_the_day', 'civil_service_admin', 'csh_principles_ethics']
    },
    'psr_admin_053': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_192',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'What is the function of an open registry?',
        'options': ['To keep all non-classified documents and correspondences.', 'To keep all personal files.', 'To keep records of secret meetings.', 'To keep all classified documents.'],
        'correct': 0,
        'explanation': 'An open registry is used for the keeping and processing of non-classified documents and correspondences.',
        'keywords': ['open_registry', 'non_classified_documents', 'correspondence', 'administrative_procedure'],
        'tags': ['open_registry', 'correspondence', 'civil_service_admin', 'csh_administrative_procedures']
    }
}

SOURCE_MAP = {
    'ppa_elb_072': proc,
    'competency_num_061': comp,
    'competency_num_078': comp,
    'FOI_OP_067': foi,
    'pol_analysis_methods_gen_077': policy,
    'pol_analysis_methods_gen_086': policy,
    'pol_analysis_methods_gen_097': policy,
    'ppa_objectives_067': proc,
    'psr_admin_053': psr,
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
for old_id, src in SOURCE_MAP.items():
    removed[old_id] = remove_question(src, old_id)

for old_id, spec in move_specs.items():
    q = dict(removed[old_id])
    q['id'] = spec['new_id']
    q['question'] = spec['question']
    q['options'] = spec['options']
    q['correct'] = spec['correct']
    q['explanation'] = spec['explanation']
    q['keywords'] = spec['keywords']
    q['chapter'] = spec['chapter']
    q['sourceDocument'] = spec['sourceDocument']
    q['sourceSection'] = spec['sourceSection']
    q['source'] = q.get('source', 'generated_draft')
    q['legacyQuestionIds'] = list(dict.fromkeys((q.get('legacyQuestionIds') or []) + [old_id]))
    q['tags'] = list(dict.fromkeys(spec['tags']))

    if spec['target'] == 'civil':
        q['sourceTopicId'] = 'civil_service_admin'
        q['sourceTopicName'] = 'Civil Service Administration, Ethics & Integrity'
        q['sourceSubcategoryId'] = spec['target_subcategory']
        names = {
            'csh_administrative_procedures': 'Administrative Procedures',
            'csh_duties_responsibilities': 'Duties & Responsibilities',
            'csh_principles_ethics': 'Civil Service Principles & Ethics',
        }
        q['sourceSubcategoryName'] = names[spec['target_subcategory']]
        add_to_target(civil, spec['target_subcategory'], q)
    elif spec['target'] == 'current':
        q['sourceTopicId'] = 'general_current_affairs'
        q['sourceTopicName'] = 'General Current Affairs'
        q['sourceSubcategoryId'] = spec['target_subcategory']
        names = {
            'ca_national_governance': 'National Governance & Policy Developments',
            'ca_general': 'General Current Affairs',
        }
        q['sourceSubcategoryName'] = names[spec['target_subcategory']]
        add_to_target(ca, spec['target_subcategory'], q)

proc_path.write_text(json.dumps(proc, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
comp_path.write_text(json.dumps(comp, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
foi_path.write_text(json.dumps(foi, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
policy_path.write_text(json.dumps(policy, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
psr_path.write_text(json.dumps(psr, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
civil_path.write_text(json.dumps(civil, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
ca_path.write_text(json.dumps(ca, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

print('Moved 9 questions in move round 26.')
for old_id, spec in move_specs.items():
    print(f"{old_id} -> {spec['new_id']}")
