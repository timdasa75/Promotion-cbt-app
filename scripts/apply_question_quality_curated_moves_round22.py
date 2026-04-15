import json
from pathlib import Path

lead_path = Path('data/leadership_negotiation.json')
policy_path = Path('data/policy_analysis.json')
foi_path = Path('data/constitutional_foi.json')
civil_path = Path('data/civil_service_ethics.json')
fin_path = Path('data/financial_regulations.json')

lead = json.loads(lead_path.read_text(encoding='utf-8'))
policy = json.loads(policy_path.read_text(encoding='utf-8'))
foi = json.loads(foi_path.read_text(encoding='utf-8'))
civil = json.loads(civil_path.read_text(encoding='utf-8'))
fin = json.loads(fin_path.read_text(encoding='utf-8'))

move_specs = {
    'leadership_lsm_070': {
        'target': 'civil',
        'target_subcategory': 'csh_administrative_procedures',
        'new_id': 'csh_ap_156',
        'chapter': 'Administrative Procedures',
        'sourceDocument': 'Civil Service Handbook',
        'sourceSection': 'Administrative Procedures',
        'question': 'What should conclude the text of an official minute?',
        'options': [
            "The writer's signature or initials.",
            "The ministry's stamp.",
            'The file number.',
            'The date only.'
        ],
        'correct': 0,
        'explanation': 'An official minute should end with the signature or initials of the writer to authenticate the record and show responsibility for it.',
        'keywords': ['official_minute', 'signature', 'initials', 'administrative_procedure'],
        'tags': ['official_minutes', 'signature', 'records', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'leadership_smp_051': {
        'target': 'financial',
        'target_subcategory': 'fin_general',
        'new_id': 'fin_gen_076',
        'chapter': 'General Financial Management',
        'sourceDocument': 'Financial Regulations (FR)',
        'sourceSection': 'General Financial Management',
        'question': 'How often must every organization submit a return of its bank accounts to the Accountant-General?',
        'options': [
            'Annually.',
            'Monthly.',
            'Half-yearly.',
            'Quarterly.'
        ],
        'correct': 2,
        'explanation': 'Financial Regulation 701(v) requires every organization to submit a return of its bank accounts to the Accountant-General on a half-yearly basis.',
        'keywords': ['bank_accounts', 'accountant_general', 'half_yearly_return', 'financial_regulation_701v'],
        'tags': ['financial_regulations', 'fin_general', 'bank_accounts', 'accountant_general', 'returns']
    },
    'leadership_smp_055': {
        'target': 'civil',
        'target_subcategory': 'csh_administrative_procedures',
        'new_id': 'csh_ap_157',
        'chapter': 'Administrative Procedures',
        'sourceDocument': 'Civil Service Handbook',
        'sourceSection': 'Administrative Procedures',
        'question': 'How should communication addressed to an overseas government never be made?',
        'options': [
            'Directly.',
            'Through diplomatic channels.',
            'Through the Ministry of Foreign Affairs.',
            'Through an official dispatch process.'
        ],
        'correct': 0,
        'explanation': 'Communication addressed to an overseas government should not be made directly; it should pass through the proper diplomatic channel.',
        'keywords': ['overseas_government', 'diplomatic_channels', 'official_communication', 'administrative_procedure'],
        'tags': ['official_communication', 'diplomatic_channels', 'foreign_affairs', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'leadership_smp_065': {
        'target': 'civil',
        'target_subcategory': 'csh_administrative_procedures',
        'new_id': 'csh_ap_158',
        'chapter': 'Administrative Procedures',
        'sourceDocument': 'Civil Service Handbook',
        'sourceSection': 'Administrative Procedures',
        'question': 'What is the purpose of a file title?',
        'options': [
            'To reflect the subject matter contained in the file accurately.',
            'To make the file look attractive.',
            'To show who created the file.',
            'To show the date the file was opened.'
        ],
        'correct': 0,
        'explanation': 'A file title should accurately reflect the subject matter of the file so that the record can be identified and retrieved easily.',
        'keywords': ['file_title', 'subject_matter', 'records_management', 'administrative_procedure'],
        'tags': ['file_title', 'records_management', 'filing', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'leadership_smp_067': {
        'target': 'civil',
        'target_subcategory': 'csh_administrative_procedures',
        'new_id': 'csh_ap_159',
        'chapter': 'Administrative Procedures',
        'sourceDocument': 'Civil Service Handbook',
        'sourceSection': 'Administrative Procedures',
        'question': 'What is a receipt book used for in official correspondence?',
        'options': [
            'To document all incoming mail.',
            'To acknowledge the receipt of official mail.',
            'To log all outgoing mail.',
            'To record official meetings.'
        ],
        'correct': 1,
        'explanation': 'A receipt book is used to acknowledge the receipt of official mail so there is a formal record that the correspondence was received.',
        'keywords': ['receipt_book', 'official_mail', 'acknowledgement', 'administrative_procedure'],
        'tags': ['receipt_book', 'official_mail', 'correspondence', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'leadership_smp_069': {
        'target': 'civil',
        'target_subcategory': 'csh_administrative_procedures',
        'new_id': 'csh_ap_160',
        'chapter': 'Administrative Procedures',
        'sourceDocument': 'Civil Service Handbook',
        'sourceSection': 'Administrative Procedures',
        'question': 'What is a memorandum used for in official correspondence?',
        'options': [
            'To document a personal conversation.',
            'To provide a confidential report to the public.',
            'To communicate with foreign governments.',
            'To communicate internally within the same department or ministry.'
        ],
        'correct': 3,
        'explanation': 'A memorandum is used for internal communication among officers within the same department or ministry.',
        'keywords': ['memorandum', 'internal_communication', 'official_correspondence', 'administrative_procedure'],
        'tags': ['memorandum', 'internal_communication', 'correspondence', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'neg_principles_outcomes_gen_064': {
        'target': 'civil',
        'target_subcategory': 'csh_administrative_procedures',
        'new_id': 'csh_ap_161',
        'chapter': 'Administrative Procedures',
        'sourceDocument': 'Civil Service Handbook',
        'sourceSection': 'Administrative Procedures',
        'question': 'What should a chairman do when summarizing the conclusions of a meeting?',
        'options': [
            'Do it quickly without consultation.',
            'Summarize the conclusions to the agreement of the other members.',
            'Summarize only the points personally preferred.',
            'Prepare the summary alone and keep it from the secretariat.'
        ],
        'correct': 1,
        'explanation': 'The chairman should summarize the conclusions of the meeting in a way that reflects the agreement of the members and guides the secretariat in preparing accurate minutes.',
        'keywords': ['chairman', 'meeting_conclusions', 'minutes', 'administrative_procedure'],
        'tags': ['chairman', 'meeting_conclusions', 'minutes', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'policy_constitution_081': {
        'target': 'civil',
        'target_subcategory': 'csh_administrative_procedures',
        'new_id': 'csh_ap_162',
        'chapter': 'Administrative Procedures',
        'sourceDocument': 'Civil Service Handbook',
        'sourceSection': 'Administrative Procedures',
        'question': 'What should be attached to a meeting notice and agenda?',
        'options': [
            'The personal files of all members.',
            'The private phone numbers of members.',
            'The ministry\'s financial statements.',
            'The minutes of the last meeting and other relevant documents.'
        ],
        'correct': 3,
        'explanation': 'A meeting notice and agenda should be accompanied by the minutes of the last meeting and any other relevant documents needed for informed discussion.',
        'keywords': ['meeting_notice', 'agenda', 'minutes', 'administrative_procedure'],
        'tags': ['meeting_notice', 'agenda', 'minutes', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'policy_constitution_083': {
        'target': 'civil',
        'target_subcategory': 'csh_administrative_procedures',
        'new_id': 'csh_ap_163',
        'chapter': 'Administrative Procedures',
        'sourceDocument': 'Civil Service Handbook',
        'sourceSection': 'Administrative Procedures',
        'question': 'What should always appear on file notes?',
        'options': [
            'A full signature only.',
            'The writer\'s initials and date.',
            'A list of all attendees.',
            'A detailed analytical annex.'
        ],
        'correct': 1,
        'explanation': 'File notes should always be initialed and dated so that the author and timing of the note are clear for administrative follow-up.',
        'keywords': ['file_notes', 'initials', 'date', 'administrative_procedure'],
        'tags': ['file_notes', 'initials', 'records', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'policy_psr_048': {
        'target': 'civil',
        'target_subcategory': 'csh_administrative_procedures',
        'new_id': 'csh_ap_164',
        'chapter': 'Administrative Procedures',
        'sourceDocument': 'Civil Service Handbook',
        'sourceSection': 'Administrative Procedures',
        'question': 'What should be done with office files at the close of work each day?',
        'options': [
            'They should be locked up in a cabinet.',
            'They should be left on desks for the next day.',
            'They should be taken home by the officer in charge.',
            'They should be handed to a junior officer for safekeeping.'
        ],
        'correct': 0,
        'explanation': 'Office files should be locked in a cabinet at the close of work each day to protect official records and preserve proper custody.',
        'keywords': ['office_files', 'close_of_work', 'cabinet', 'administrative_procedure'],
        'tags': ['office_files', 'records_security', 'cabinet', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'policy_psr_050': {
        'target': 'civil',
        'target_subcategory': 'csh_administrative_procedures',
        'new_id': 'csh_ap_165',
        'chapter': 'Administrative Procedures',
        'sourceDocument': 'Civil Service Handbook',
        'sourceSection': 'Administrative Procedures',
        'question': 'What kind of writing style should a Schedule Officer have?',
        'options': [
            'A complex style.',
            'A poetic style.',
            'A good style.',
            'A highly informal style.'
        ],
        'correct': 2,
        'explanation': 'A Schedule Officer should have a good writing style so that official communication is clear, professional, and easy to act on.',
        'keywords': ['schedule_officer', 'writing_style', 'official_writing', 'administrative_procedure'],
        'tags': ['schedule_officer', 'writing_style', 'official_writing', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'FOI_AO_073': {
        'target': 'civil',
        'target_subcategory': 'csh_administrative_procedures',
        'new_id': 'csh_ap_166',
        'chapter': 'Administrative Procedures',
        'sourceDocument': 'Civil Service Handbook',
        'sourceSection': 'Administrative Procedures',
        'question': 'Why are official documents classified?',
        'options': [
            'To make officers aware of the degree of care required for each document.',
            'To make all documents difficult to access.',
            'To hide their contents from other ministries in every case.',
            'To prevent the public from ever seeing them.'
        ],
        'correct': 0,
        'explanation': 'Document classification exists to show the level of care and protection required for each record, not simply to obstruct access.',
        'keywords': ['document_classification', 'degree_of_care', 'records_protection', 'administrative_procedure'],
        'tags': ['document_classification', 'records_protection', 'official_documents', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'FOI_EX_054': {
        'target': 'civil',
        'target_subcategory': 'csh_principles_ethics',
        'new_id': 'csh_principle_078',
        'chapter': 'Civil Service Principles & Ethics',
        'sourceDocument': 'Civil Service Handbook',
        'sourceSection': 'Civil Service Principles & Ethics',
        'question': 'How should an officer justify his or her employment in the public service?',
        'options': [
            'By merely being punctual every day.',
            'By drawing a high salary.',
            'By attending official meetings regularly.',
            'By giving efficient service in return for earnings.'
        ],
        'correct': 3,
        'explanation': 'A public officer justifies his or her employment by giving efficient service in return for the earnings paid from public funds.',
        'keywords': ['efficient_service', 'public_service', 'employment', 'civil_service_principles'],
        'tags': ['efficient_service', 'public_service', 'civil_service_admin', 'csh_principles_ethics']
    }
}

SOURCE_MAP = {
    'leadership_lsm_070': lead,
    'leadership_smp_051': lead,
    'leadership_smp_055': lead,
    'leadership_smp_065': lead,
    'leadership_smp_067': lead,
    'leadership_smp_069': lead,
    'neg_principles_outcomes_gen_064': lead,
    'policy_constitution_081': policy,
    'policy_constitution_083': policy,
    'policy_psr_048': policy,
    'policy_psr_050': policy,
    'FOI_AO_073': foi,
    'FOI_EX_054': foi,
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
    if spec['target'] == 'civil':
        q['sourceTopicId'] = 'civil_service_admin'
        q['sourceTopicName'] = 'Civil Service Administration, Ethics & Integrity'
        q['sourceSubcategoryId'] = spec['target_subcategory']
        q['sourceSubcategoryName'] = 'Administrative Procedures' if spec['target_subcategory'] == 'csh_administrative_procedures' else 'Civil Service Principles & Ethics'
        q['tags'] = list(dict.fromkeys(spec['tags']))
        for sub in civil.get('subcategories', []):
            if sub.get('id') == spec['target_subcategory']:
                sub.setdefault('questions', []).append(q)
                break
        else:
            raise RuntimeError(f"Missing civil target subcategory: {spec['target_subcategory']}")
    else:
        q['sourceTopicId'] = 'financial_regulations'
        q['sourceSubcategoryId'] = spec['target_subcategory']
        q['sourceSubcategoryName'] = 'General Financial Management'
        q['tags'] = list(dict.fromkeys(spec['tags']))
        for sub in fin.get('subcategories', []):
            if sub.get('id') == spec['target_subcategory']:
                sub.setdefault('questions', []).append(q)
                break
        else:
            raise RuntimeError(f"Missing financial target subcategory: {spec['target_subcategory']}")

lead_path.write_text(json.dumps(lead, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
policy_path.write_text(json.dumps(policy, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
foi_path.write_text(json.dumps(foi, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
civil_path.write_text(json.dumps(civil, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
fin_path.write_text(json.dumps(fin, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

print('Moved 13 questions in move round 22.')
for old_id, spec in move_specs.items():
    print(f"{old_id} -> {spec['new_id']}")
