import json
from pathlib import Path

psr_path = Path('data/psr_rules.json')
proc_path = Path('data/public_procurement.json')
ict_path = Path('data/ict_digital.json')
foi_path = Path('data/constitutional_foi.json')
lead_path = Path('data/leadership_negotiation.json')
civil_path = Path('data/civil_service_ethics.json')
fin_path = Path('data/financial_regulations.json')

psr = json.loads(psr_path.read_text(encoding='utf-8'))
proc = json.loads(proc_path.read_text(encoding='utf-8'))
ict = json.loads(ict_path.read_text(encoding='utf-8'))
foi = json.loads(foi_path.read_text(encoding='utf-8'))
lead = json.loads(lead_path.read_text(encoding='utf-8'))
civil = json.loads(civil_path.read_text(encoding='utf-8'))
fin = json.loads(fin_path.read_text(encoding='utf-8'))

move_specs = {
    'psr_admin_052': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_179',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'Why is a document given a confidential classification?',
        'options': ['To make access difficult in every circumstance.', 'To turn it into a permanent log.', 'To protect information that could be harmful if disclosed.', 'To hide it from other ministries automatically.'],
        'correct': 2,
        'explanation': 'A confidential classification is used to protect information that could be harmful if disclosed without authorization.',
        'keywords': ['confidential_classification', 'document_security', 'harmful_disclosure', 'administrative_procedure'],
        'tags': ['confidential_classification', 'document_security', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'eth_general_gen_074': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_180',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'What is the purpose of a register of correspondences?',
        'options': ['To record official meetings.', 'To record financial transactions.', 'To list ministry staff.', 'To list correspondences received and sent out by a ministry.'],
        'correct': 3,
        'explanation': 'A register of correspondences is used to keep track of correspondence received and sent out by a ministry or office.',
        'keywords': ['register_of_correspondences', 'incoming_mail', 'outgoing_mail', 'administrative_procedure'],
        'tags': ['register_of_correspondences', 'mail_control', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'eth_general_gen_081': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_181',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'What is kept in an open registry?',
        'options': ['Personal files only.', 'Non-classified documents and correspondences.', 'All classified documents.', 'Records of secret meetings only.'],
        'correct': 1,
        'explanation': 'An open registry is used for keeping and processing non-classified documents and correspondences.',
        'keywords': ['open_registry', 'non_classified_documents', 'correspondence', 'administrative_procedure'],
        'tags': ['open_registry', 'correspondence', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'eth_general_gen_089': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_182',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'What should guide the creation of a new file?',
        'options': ['The opinion of the Head of Department.', 'The number of documents on hand.', 'The existing file index.', 'The preference of the officer.'],
        'correct': 2,
        'explanation': 'New files should be created with reference to the existing file index so that the numbering system remains consistent and logical.',
        'keywords': ['new_file', 'file_index', 'records_management', 'administrative_procedure'],
        'tags': ['new_file', 'file_index', 'records_management', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'eth_general_gen_096': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_183',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'How many working days before a meeting should the notice and agenda be sent to members?',
        'options': ['One day.', 'Seven days.', 'Five working days.', 'Two days.'],
        'correct': 2,
        'explanation': 'The notice of meeting and agenda should be sent to members at least five working days before the meeting.',
        'keywords': ['meeting_notice', 'agenda', 'five_working_days', 'administrative_procedure'],
        'tags': ['meeting_notice', 'agenda', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'FOI_EX_072': {
        'target': 'financial', 'target_subcategory': 'fin_audits_sanctions', 'new_id': 'fin_aud_079',
        'chapter': 'Audits, Sanctions & Compliance', 'sourceDocument': 'Financial Regulations (FR)', 'sourceSection': 'Audits, Sanctions & Compliance',
        'question': 'What must be sought and secured for cash in transit?',
        'options': ['A personal bodyguard.', 'A strongbox.', 'Police escort.', 'A receipt from the bank.'],
        'correct': 2,
        'explanation': 'Financial Regulation 1527(i) requires police escort to be sought and secured for cash in transit.',
        'keywords': ['cash_in_transit', 'police_escort', 'financial_regulation_1527i', 'security_control'],
        'tags': ['cash_in_transit', 'police_escort', 'financial_regulations', 'fin_audits_sanctions']
    },
    'FOI_OP_055': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_184',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'In official writing, what does style refer to?',
        'options': ['The distinctive manner of writing.', 'The length of the writing.', 'The speed at which one writes.', 'The type of pen used for writing.'],
        'correct': 0,
        'explanation': 'In official writing, style refers to the distinctive manner in which a person writes or expresses ideas.',
        'keywords': ['style', 'official_writing', 'expression', 'administrative_procedure'],
        'tags': ['style', 'official_writing', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'ict_sec_077': {
        'target': 'financial', 'target_subcategory': 'fin_general', 'new_id': 'fin_gen_084',
        'chapter': 'General Financial Management', 'sourceDocument': 'Financial Regulations (FR)', 'sourceSection': 'General Financial Management',
        'question': 'In what order must official receipts from a Revenue Collector\'s cash book be entered?',
        'options': ['In any convenient order.', 'In strict serial number order.', 'By date of issue only.', 'In a random order to prevent fraud.'],
        'correct': 1,
        'explanation': 'Financial Regulation 209(i) requires official receipts from a Revenue Collector\'s cash book to be entered without delay in strict serial number order.',
        'keywords': ['revenue_collector', 'cash_book', 'serial_number_order', 'financial_regulation_209i'],
        'tags': ['revenue_collector', 'cash_book', 'financial_regulations', 'fin_general']
    },
    'ict_f_088': {
        'target': 'civil', 'target_subcategory': 'csh_principles_ethics', 'new_id': 'csh_principle_083',
        'chapter': 'Civil Service Principles & Ethics', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Civil Service Principles & Ethics',
        'question': 'What should characterize the relationship between a parastatal\'s Board and its Chief Executive?',
        'options': ['A relationship of equals without accountability.', 'Subordination of the Board to the Chief Executive.', 'A relationship where the Board dictates every action.', 'Mutual respect and collaboration.'],
        'correct': 3,
        'explanation': 'The relationship between a parastatal\'s Board and Chief Executive should be cordial and based on mutual respect and collaboration.',
        'keywords': ['parastatal_board', 'chief_executive', 'mutual_respect', 'civil_service_principles'],
        'tags': ['parastatal_board', 'chief_executive', 'civil_service_admin', 'csh_principles_ethics']
    },
    'ict_li_098': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_185',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'How should file notes be authenticated?',
        'options': ['With a detailed analysis.', 'With a list of all attendees.', 'With the writer\'s initials and date.', 'With a full signature only.'],
        'correct': 2,
        'explanation': 'File notes should be initialed and dated so that the author and timing of the note are clear.',
        'keywords': ['file_notes', 'initials', 'date', 'administrative_procedure'],
        'tags': ['file_notes', 'initials', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'leadership_smp_071': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_186',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'What should a file title do?',
        'options': ['Accurately reflect the subject matter in the file.', 'Indicate the date the file was created.', 'Show who created the file.', 'Make the file look attractive.'],
        'correct': 0,
        'explanation': 'A file title should accurately reflect the subject matter contained in the file so the record can be identified quickly.',
        'keywords': ['file_title', 'subject_matter', 'records_management', 'administrative_procedure'],
        'tags': ['file_title', 'records_management', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'policy_psr_053': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_187',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'What form of communication is a memorandum?',
        'options': ['A confidential report to the public.', 'A personal conversation record.', 'Communication with other ministries and the public.', 'Internal communication within the same department or ministry.'],
        'correct': 3,
        'explanation': 'A memorandum is used for internal communication among officers within the same department or ministry.',
        'keywords': ['memorandum', 'internal_communication', 'official_correspondence', 'administrative_procedure'],
        'tags': ['memorandum', 'internal_communication', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'ppa_bid_065': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_188',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'What does a receipt book acknowledge in office procedure?',
        'options': ['The receipt of official mail.', 'Outgoing mail only.', 'Official meetings.', 'Incoming mail lists only.'],
        'correct': 0,
        'explanation': 'A receipt book is used to acknowledge that official mail has been received.',
        'keywords': ['receipt_book', 'official_mail', 'acknowledgement', 'administrative_procedure'],
        'tags': ['receipt_book', 'official_mail', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'ppa_ethic_056': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_189',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'What does an official gazette publish?',
        'options': ['The personal assets of public officers.', 'A list of all civil servants.', 'Official government notices and announcements.', 'Minutes of official meetings.'],
        'correct': 2,
        'explanation': 'An official gazette is a government publication used to publish official notices and announcements.',
        'keywords': ['official_gazette', 'government_notices', 'announcements', 'administrative_procedure'],
        'tags': ['official_gazette', 'government_notices', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'ppa_objectives_053': {
        'target': 'civil', 'target_subcategory': 'csh_duties_responsibilities', 'new_id': 'csh_duty_079',
        'chapter': 'Duties & Responsibilities', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Duties & Responsibilities',
        'question': 'What is the designation of the topmost career civil servant in a local government?',
        'options': ['Chairman.', 'Secretary.', 'Councilor.', 'Permanent Secretary.'],
        'correct': 1,
        'explanation': 'In a local government set-up, the topmost career civil servant is designated as the Secretary.',
        'keywords': ['local_government', 'secretary', 'career_civil_servant', 'duties_responsibilities'],
        'tags': ['local_government', 'secretary', 'civil_service_admin', 'csh_duties_responsibilities']
    },
    'circ_leave_welfare_allowances_gen_068': {
        'target': 'financial', 'target_subcategory': 'fin_budgeting', 'new_id': 'fin_bgt_080',
        'chapter': 'Budgeting & Financial Planning', 'sourceDocument': 'Financial Regulations (FR)', 'sourceSection': 'Budgeting & Financial Planning',
        'question': 'What financial responsibility is expected of the Board of a parastatal?',
        'options': ['Managing day-to-day expenses only.', 'Managing the parastatal\'s bank accounts directly.', 'Preparing the parastatal\'s budget for submission.', 'Approving only the honorarium of board members.'],
        'correct': 2,
        'explanation': 'The Board of a parastatal is expected to prepare the parastatal\'s budget for submission through the supervising ministry.',
        'keywords': ['parastatal_board', 'budget_preparation', 'submission', 'financial_management'],
        'tags': ['parastatal_board', 'budget_preparation', 'financial_regulations', 'fin_budgeting']
    },
    'circ_personnel_performance_gen_067': {
        'target': 'civil', 'target_subcategory': 'csh_duties_responsibilities', 'new_id': 'csh_duty_080',
        'chapter': 'Duties & Responsibilities', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Duties & Responsibilities',
        'question': 'What personnel role does the Board of a parastatal perform?',
        'options': ['It acts as the sole disciplinary body for all staff.', 'It manages the day-to-day recruitment of junior staff.', 'It manages payroll and salaries directly.', 'It approves the appointment and promotion of staff.'],
        'correct': 3,
        'explanation': 'The Board of a parastatal is responsible for approving the appointment and promotion of staff.',
        'keywords': ['parastatal_board', 'staff_appointment', 'staff_promotion', 'duties_responsibilities'],
        'tags': ['parastatal_board', 'staff_appointment', 'civil_service_admin', 'csh_duties_responsibilities']
    },
    'psr_med_059': {
        'target': 'civil', 'target_subcategory': 'csh_discipline_conduct', 'new_id': 'csh_disc_077',
        'chapter': 'Discipline & Conduct', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Discipline & Conduct',
        'question': 'What disciplinary role should a supervisor perform in a registry?',
        'options': ['Enforce discipline with justice and fairness at all times.', 'Allow staff to do as they please.', 'Prevent staff from ever leaving the office.', 'Do all the work personally.'],
        'correct': 0,
        'explanation': 'A registry supervisor should enforce discipline with justice and fairness so that office procedures are followed properly.',
        'keywords': ['registry_supervisor', 'discipline', 'justice', 'fairness'],
        'tags': ['registry_supervisor', 'discipline', 'civil_service_admin', 'csh_discipline_conduct']
    },
    'psr_med_060': {
        'target': 'civil', 'target_subcategory': 'csh_discipline_conduct', 'new_id': 'csh_disc_078',
        'chapter': 'Discipline & Conduct', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Discipline & Conduct',
        'question': 'How should a registry supervisor enforce discipline?',
        'options': ['By preventing staff from leaving the office.', 'By allowing staff to do as they please.', 'By doing all the work personally.', 'With justice and fairness at all times.'],
        'correct': 3,
        'explanation': 'Discipline in a registry should be enforced with justice and fairness so that staff are managed properly and procedures are respected.',
        'keywords': ['registry_supervisor', 'discipline', 'justice_and_fairness', 'conduct'],
        'tags': ['registry_supervisor', 'discipline', 'civil_service_admin', 'csh_discipline_conduct']
    }
}

SOURCE_MAP = {
    **{qid: psr for qid in ['psr_admin_052','circ_leave_welfare_allowances_gen_068','circ_personnel_performance_gen_067','psr_med_059','psr_med_060']},
    **{qid: proc for qid in ['ppa_bid_065','ppa_ethic_056','ppa_objectives_053']},
    **{qid: ict for qid in ['ict_sec_077','ict_f_088','ict_li_098']},
    **{qid: foi for qid in ['FOI_EX_072','FOI_OP_055']},
    **{qid: civil for qid in ['eth_general_gen_074','eth_general_gen_081','eth_general_gen_089','eth_general_gen_096']},
    **{qid: lead for qid in ['leadership_smp_071']},
    'policy_psr_053': json.loads(Path('data/policy_analysis.json').read_text(encoding='utf-8')),
}

policy = SOURCE_MAP['policy_psr_053']


def remove_question(data, qid):
    for sub in data.get('subcategories', []):
        qs = sub.get('questions', [])
        if qs and isinstance(qs[0], dict) and sub.get('id') and isinstance(qs[0].get(sub.get('id')), list):
            nested = []
            removed = None
            for q in qs[0][sub.get('id')]:
                if q.get('id') == qid:
                    removed = dict(q)
                    continue
                nested.append(q)
            if removed is not None:
                qs[0][sub.get('id')] = nested
                return removed
        else:
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
            'csh_discipline_conduct': 'Discipline & Conduct',
        }
        q['sourceSubcategoryName'] = names[spec['target_subcategory']]
        add_to_target(civil, spec['target_subcategory'], q)
    else:
        q['sourceTopicId'] = 'financial_regulations'
        q['sourceTopicName'] = 'Financial Management'
        q['sourceSubcategoryId'] = spec['target_subcategory']
        names = {
            'fin_general': 'General Financial Management',
            'fin_audits_sanctions': 'Audits, Sanctions & Compliance',
            'fin_budgeting': 'Budgeting & Financial Planning',
        }
        q['sourceSubcategoryName'] = names[spec['target_subcategory']]
        add_to_target(fin, spec['target_subcategory'], q)

psr_path.write_text(json.dumps(psr, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
proc_path.write_text(json.dumps(proc, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
ict_path.write_text(json.dumps(ict, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
foi_path.write_text(json.dumps(foi, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
lead_path.write_text(json.dumps(lead, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
policy_path = Path('data/policy_analysis.json')
policy_path.write_text(json.dumps(policy, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
civil_path.write_text(json.dumps(civil, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
fin_path.write_text(json.dumps(fin, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

print('Moved 18 questions in move round 25.')
for old_id, spec in move_specs.items():
    print(f"{old_id} -> {spec['new_id']}")
