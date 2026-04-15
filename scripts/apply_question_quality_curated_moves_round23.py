import json
from pathlib import Path

proc_path = Path('data/public_procurement.json')
ict_path = Path('data/ict_digital.json')
civil_path = Path('data/civil_service_ethics.json')
fin_path = Path('data/financial_regulations.json')
psr_path = Path('data/psr_rules.json')

proc = json.loads(proc_path.read_text(encoding='utf-8'))
ict = json.loads(ict_path.read_text(encoding='utf-8'))
civil = json.loads(civil_path.read_text(encoding='utf-8'))
fin = json.loads(fin_path.read_text(encoding='utf-8'))
psr = json.loads(psr_path.read_text(encoding='utf-8'))

move_specs = {
    'ppa_elb_052': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_167',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'What is the purpose of classifying a document as confidential?',
        'options': ['To make it a permanent document.', 'To make it difficult to access in every circumstance.', 'To hide it from other ministries automatically.', 'To protect information that could be harmful if disclosed.'],
        'correct': 3,
        'explanation': 'A confidential classification is used to protect information that could cause harm if it is disclosed without authorization.',
        'keywords': ['confidential_classification', 'document_security', 'official_records', 'administrative_procedure'],
        'tags': ['confidential_classification', 'document_security', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'ppa_ethic_065': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_168',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'What is the most fundamental demand on an officer chairing a meeting?',
        'options': ['To guarantee that everyone is paid for attending.', 'To be the most senior officer in the room.', 'To take notes and prepare the minutes personally.', 'To understand the objective of the gathering.'],
        'correct': 3,
        'explanation': 'A chairman can only guide a meeting properly when the purpose of the gathering is clearly understood from the start.',
        'keywords': ['chairman', 'meeting_objective', 'meeting_procedure', 'administrative_procedure'],
        'tags': ['chairman', 'meeting_procedure', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'ppa_bid_066': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_169',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'What is the purpose of a register of minutes?',
        'options': ['To list all minutes recorded in a ministry.', 'To document all financial transactions.', 'To document all official meetings only.', 'To list all staff in a ministry.'],
        'correct': 0,
        'explanation': 'A register of minutes is maintained as a record of the minutes written in a ministry or office.',
        'keywords': ['register_of_minutes', 'minutes', 'recordkeeping', 'administrative_procedure'],
        'tags': ['register_of_minutes', 'recordkeeping', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'ppa_ethic_054': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_170',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'What is the purpose of an official gazette?',
        'options': ['To publish official government notices and announcements.', 'To publish a list of all civil servants.', 'To publish minutes of official meetings.', 'To publish the personal assets of public officers.'],
        'correct': 0,
        'explanation': 'An official gazette is a government publication used for official notices, announcements, and other formal public communications.',
        'keywords': ['official_gazette', 'government_notices', 'public_announcements', 'administrative_procedure'],
        'tags': ['official_gazette', 'government_notices', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'ppa_ethic_058': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_171',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'What is the chairman\'s role regarding the minutes of a meeting?',
        'options': ['To keep the minutes secret from participants.', 'To direct the secretariat on the time for producing and circulating the minutes.', 'To ignore the minutes entirely.', 'To write the minutes personally in every case.'],
        'correct': 1,
        'explanation': 'The chairman should guide the secretariat on when the minutes should be produced and circulated so that the meeting record is timely and useful.',
        'keywords': ['chairman', 'minutes', 'secretariat', 'administrative_procedure'],
        'tags': ['chairman', 'minutes', 'secretariat', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'ppa_ims_054': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_172',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'In official writing, what does the term style mean?',
        'options': ['The length of the writing.', 'The type of pen used for writing.', 'The distinctive manner of writing.', 'The speed at which one writes.'],
        'correct': 2,
        'explanation': 'In official writing, style refers to the distinctive manner in which the writing is expressed.',
        'keywords': ['style', 'official_writing', 'communication', 'administrative_procedure'],
        'tags': ['style', 'official_writing', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'ppa_ims_055': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_173',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'What does fairing mean in official writing?',
        'options': ['To file a document.', 'To send a document to another department.', 'To correct errors in a draft.', 'To prepare a clean final version of a document.'],
        'correct': 3,
        'explanation': 'Fairing is the process of preparing a clean and final version of a document after the draft has been corrected and approved.',
        'keywords': ['fairing', 'official_writing', 'final_draft', 'administrative_procedure'],
        'tags': ['fairing', 'official_writing', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'ppa_ims_057': {
        'target': 'psr', 'target_subcategory': 'psr_discipline', 'new_id': 'psr_disc_062',
        'chapter': 'Discipline & Misconduct', 'sourceDocument': 'Public Service Rules (PSR)', 'sourceSection': 'Discipline & Misconduct',
        'question': 'Which body is the final authority on disciplinary appeals under the Public Service Rules?',
        'options': ['The Code of Conduct Bureau.', 'The Civil Service Commission.', 'The Head of the Civil Service of the Federation.', 'The President.'],
        'correct': 1,
        'explanation': 'The Civil Service Commission is the final authority on disciplinary appeals under the Public Service Rules.',
        'keywords': ['disciplinary_appeals', 'civil_service_commission', 'psr', 'discipline'],
        'tags': ['disciplinary_appeals', 'civil_service_commission', 'psr', 'psr_discipline']
    },
    'ppa_ims_058': {
        'target': 'psr', 'target_subcategory': 'psr_discipline', 'new_id': 'psr_disc_063',
        'chapter': 'Discipline & Misconduct', 'sourceDocument': 'Public Service Rules (PSR)', 'sourceSection': 'Discipline & Misconduct',
        'question': 'Within what maximum period should appeals against disciplinary decisions be concluded under the Public Service Rules?',
        'options': ['12 months.', '6 months.', '1 month.', '3 months.'],
        'correct': 1,
        'explanation': 'Appeals against disciplinary decisions under the Public Service Rules should be concluded within a maximum period of six months.',
        'keywords': ['disciplinary_appeals', 'six_months', 'psr', 'discipline'],
        'tags': ['disciplinary_appeals', 'six_months', 'psr', 'psr_discipline']
    },
    'ppa_ims_067': {
        'target': 'psr', 'target_subcategory': 'psr_discipline', 'new_id': 'psr_disc_064',
        'chapter': 'Discipline & Misconduct', 'sourceDocument': 'Public Service Rules (PSR)', 'sourceSection': 'Discipline & Misconduct',
        'question': 'Under the Public Service Rules, what disciplinary category covers falsification of official records or documents?',
        'options': ['Serious Misconduct.', 'Minor Misconduct.', 'Administrative misunderstanding.', 'General inefficiency.'],
        'correct': 0,
        'explanation': 'Falsification of official records or documents is treated as Serious Misconduct under the Public Service Rules.',
        'keywords': ['falsification', 'official_records', 'serious_misconduct', 'psr'],
        'tags': ['falsification', 'serious_misconduct', 'psr', 'psr_discipline']
    },
    'ppa_ims_068': {
        'target': 'psr', 'target_subcategory': 'psr_discipline', 'new_id': 'psr_disc_065',
        'chapter': 'Discipline & Misconduct', 'sourceDocument': 'Public Service Rules (PSR)', 'sourceSection': 'Discipline & Misconduct',
        'question': 'What pay status applies to an officer on interdiction under the Public Service Rules?',
        'options': ['Half salary.', 'Full salary and all allowances.', 'Only basic salary.', 'No salary.'],
        'correct': 0,
        'explanation': 'An officer placed on interdiction receives half salary pending the outcome of the investigation.',
        'keywords': ['interdiction', 'half_salary', 'psr', 'discipline'],
        'tags': ['interdiction', 'half_salary', 'psr', 'psr_discipline']
    },
    'ppa_ims_069': {
        'target': 'financial', 'target_subcategory': 'fin_budgeting', 'new_id': 'fin_bgt_078',
        'chapter': 'Budgeting & Financial Planning', 'sourceDocument': 'Financial Regulations (FR)', 'sourceSection': 'Budgeting & Financial Planning',
        'question': 'What is the limit on funds brought forward by a Development Fund Supplementary Warrant?',
        'options': ['It may exceed the estimated total cost of the project.', 'It is unlimited.', 'It must be less than 50% of the project cost.', 'It must not exceed the estimated total cost shown in the annual or supplementary estimates.'],
        'correct': 3,
        'explanation': 'Funds brought forward by a Development Fund Supplementary Warrant must not exceed the estimated total cost of the project as shown in the annual or supplementary estimates.',
        'keywords': ['development_fund', 'supplementary_warrant', 'project_cost', 'financial_control'],
        'tags': ['development_fund', 'supplementary_warrant', 'financial_regulations', 'fin_budgeting']
    },
    'ppa_ims_070': {
        'target': 'psr', 'target_subcategory': 'psr_discipline', 'new_id': 'psr_disc_066',
        'chapter': 'Discipline & Misconduct', 'sourceDocument': 'Public Service Rules (PSR)', 'sourceSection': 'Discipline & Misconduct',
        'question': 'What pay status applies to an officer placed on suspension pending investigation for gross misconduct?',
        'options': ['No salary.', 'Full salary plus allowances.', 'Half salary.', 'Full salary.'],
        'correct': 0,
        'explanation': 'An officer on suspension pending investigation for gross misconduct does not receive salary during the suspension period.',
        'keywords': ['suspension', 'gross_misconduct', 'no_salary', 'psr'],
        'tags': ['suspension', 'gross_misconduct', 'psr', 'psr_discipline']
    },
    'ppa_ims_071': {
        'target': 'financial', 'target_subcategory': 'fin_audits_sanctions', 'new_id': 'fin_aud_076',
        'chapter': 'Audits, Sanctions & Compliance', 'sourceDocument': 'Financial Regulations (FR)', 'sourceSection': 'Audits, Sanctions & Compliance',
        'question': 'If a loss of government funds or property is discovered, which offices must be notified promptly for investigation?',
        'options': ['The Police, the Auditor-General, and the Accountant-General.', 'ICPC, EFCC, and the Central Bank.', 'The Permanent Secretary, Legal Department, and Budget Office.', 'The Minister, OHCSF, and FCSC.'],
        'correct': 0,
        'explanation': 'When a loss of government funds or property is discovered, the Police, the Auditor-General, and the Accountant-General should be notified promptly for investigation and accountability.',
        'keywords': ['loss_of_funds', 'government_property', 'auditor_general', 'accountability'],
        'tags': ['loss_of_funds', 'auditor_general', 'accountant_general', 'financial_regulations', 'fin_audits_sanctions']
    },
    'ppa_objectives_054': {
        'target': 'civil', 'target_subcategory': 'csh_principles_ethics', 'new_id': 'csh_principle_079',
        'chapter': 'Civil Service Principles & Ethics', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Civil Service Principles & Ethics',
        'question': 'To whom should a civil servant owe loyalty in the discharge of official duties?',
        'options': ['The government of the day.', 'The Minister personally.', 'The Permanent Secretary personally.', 'The Head of the Civil Service personally.'],
        'correct': 0,
        'explanation': 'A civil servant owes loyalty to the government of the day in the lawful discharge of official duties.',
        'keywords': ['civil_servant', 'loyalty', 'government_of_the_day', 'civil_service_principles'],
        'tags': ['loyalty', 'government_of_the_day', 'civil_service_admin', 'csh_principles_ethics']
    },
    'ppa_objectives_072': {
        'target': 'civil', 'target_subcategory': 'csh_duties_responsibilities', 'new_id': 'csh_duty_076',
        'chapter': 'Duties & Responsibilities', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Duties & Responsibilities',
        'question': 'Who heads departments below the Permanent Secretary and is directly accountable to the Permanent Secretary?',
        'options': ['Assistant Directors.', 'Deputy Directors.', 'Chiefs.', 'Directors.'],
        'correct': 3,
        'explanation': 'Directors head departments below the Permanent Secretary and are directly accountable to the Permanent Secretary.',
        'keywords': ['directors', 'permanent_secretary', 'departments', 'duties_responsibilities'],
        'tags': ['directors', 'permanent_secretary', 'civil_service_admin', 'csh_duties_responsibilities']
    },
    'ict_f_091': {
        'target': 'financial', 'target_subcategory': 'fin_general', 'new_id': 'fin_gen_077',
        'chapter': 'General Financial Management', 'sourceDocument': 'Financial Regulations (FR)', 'sourceSection': 'General Financial Management',
        'question': 'How should official receipts from a Revenue Collector\'s cash book be numbered?',
        'options': ['In any convenient order.', 'In a random order to prevent fraud.', 'By date of issue only.', 'In strict serial number order.'],
        'correct': 3,
        'explanation': 'Financial Regulation 209(i) requires official receipts from a Revenue Collector\'s cash book to be entered without delay in strict serial number order.',
        'keywords': ['revenue_collector', 'cash_book', 'official_receipts', 'serial_number_order'],
        'tags': ['revenue_collector', 'cash_book', 'official_receipts', 'financial_regulations', 'fin_general']
    },
    'ict_f_076': {
        'target': 'civil', 'target_subcategory': 'csh_principles_ethics', 'new_id': 'csh_principle_080',
        'chapter': 'Civil Service Principles & Ethics', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Civil Service Principles & Ethics',
        'question': 'What relationship should exist between the Board of a parastatal and its Chief Executive?',
        'options': ['Mutual respect and collaboration.', 'A relationship where the Board dictates every action of the Chief Executive.', 'Subordination of the Board to the Chief Executive.', 'A relationship of equals without accountability.'],
        'correct': 0,
        'explanation': 'The Board and the Chief Executive should work in a cordial relationship based on mutual respect and collaboration.',
        'keywords': ['parastatal_board', 'chief_executive', 'mutual_respect', 'collaboration'],
        'tags': ['parastatal_board', 'chief_executive', 'civil_service_admin', 'csh_principles_ethics']
    },
    'ict_f_092': {
        'target': 'financial', 'target_subcategory': 'fin_budgeting', 'new_id': 'fin_bgt_079',
        'chapter': 'Budgeting & Financial Planning', 'sourceDocument': 'Financial Regulations (FR)', 'sourceSection': 'Budgeting & Financial Planning',
        'question': 'How should expenditure be classified under the Financial Regulations?',
        'options': ['By the date of disbursement.', 'At the discretion of the Accounting Officer.', 'Strictly in accordance with the Estimates.', 'According to the amount spent.'],
        'correct': 2,
        'explanation': 'Financial Regulation 417 requires expenditure to be classified strictly in accordance with the Estimates.',
        'keywords': ['expenditure_classification', 'estimates', 'financial_regulation_417', 'budget_control'],
        'tags': ['expenditure_classification', 'estimates', 'financial_regulations', 'fin_budgeting']
    },
    'ict_f_099': {
        'target': 'proc', 'target_subcategory': 'proc_bidding_evaluation', 'new_id': 'ppa_bid_077',
        'chapter': 'Bidding, Evaluation & Award', 'sourceDocument': 'Public Procurement Act', 'sourceSection': 'Bidding, Evaluation & Award',
        'question': 'Under the Public Procurement Act, what bidding method should normally be used for public procurement?',
        'options': ['Open competitive bidding.', 'Selective bidding.', 'Direct procurement.', 'Restricted bidding.'],
        'correct': 0,
        'explanation': 'The Public Procurement Act provides that public procurement should normally be conducted through open competitive bidding.',
        'keywords': ['public_procurement_act', 'open_competitive_bidding', 'bidding_method', 'procurement'],
        'tags': ['public_procurement_act', 'open_competitive_bidding', 'procurement_act', 'proc_bidding_evaluation']
    },
    'ict_li_094': {
        'target': 'civil', 'target_subcategory': 'csh_principles_ethics', 'new_id': 'csh_principle_081',
        'chapter': 'Civil Service Principles & Ethics', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Civil Service Principles & Ethics',
        'question': 'What principle should guide the relationship between a ministry and its parastatal?',
        'options': ['Total autonomy without ministry oversight.', 'A master-servant relationship controlled by the ministry.', 'Constant conflict and competition.', 'Mutual respect, understanding, and consultation.'],
        'correct': 3,
        'explanation': 'The relationship between a ministry and its parastatal should be based on mutual respect, understanding, and consultation rather than domination or conflict.',
        'keywords': ['ministry', 'parastatal', 'mutual_respect', 'consultation'],
        'tags': ['ministry', 'parastatal', 'civil_service_admin', 'csh_principles_ethics']
    },
    'ict_li_095': {
        'target': 'civil', 'target_subcategory': 'csh_principles_ethics', 'new_id': 'csh_principle_082',
        'chapter': 'Civil Service Principles & Ethics', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Civil Service Principles & Ethics',
        'question': 'Who should intervene when there is a conflict between a parastatal\'s Chief Executive and its Board?',
        'options': ['The Board should dissolve management immediately.', 'The supervising Minister should intervene to resolve the conflict.', 'The conflict should be ignored.', 'The Chief Executive should resign immediately.'],
        'correct': 1,
        'explanation': 'Where conflict arises between a parastatal\'s Chief Executive and its Board, the supervising Minister should be brought in to resolve the matter.',
        'keywords': ['parastatal', 'chief_executive', 'board_conflict', 'supervising_minister'],
        'tags': ['parastatal', 'board_conflict', 'supervising_minister', 'civil_service_admin', 'csh_principles_ethics']
    },
    'ict_li_096': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_174',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'How should a chairman conduct a meeting?',
        'options': ['By allowing the most talkative members to dominate.', 'By allowing the most senior members to control the discussion.', 'In a fair, orderly, and effective manner using the adopted agenda.', 'In a dictatorial manner that imposes the chairman\'s will.'],
        'correct': 2,
        'explanation': 'A chairman should conduct a meeting in a fair, orderly, and effective manner, using the adopted agenda as the guide.',
        'keywords': ['chairman', 'meeting_conduct', 'agenda', 'administrative_procedure'],
        'tags': ['chairman', 'meeting_conduct', 'agenda', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'ict_li_097': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_175',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'What should a good brief aim to do?',
        'options': ['Be concise and constructive and recommend a solution to an outstanding problem.', 'Create more problems.', 'Be lengthy and vague.', 'Confuse the reader.'],
        'correct': 0,
        'explanation': 'A good brief should be concise, constructive, and directed toward recommending a solution to the problem under consideration.',
        'keywords': ['brief', 'concise_writing', 'problem_solving', 'administrative_procedure'],
        'tags': ['brief', 'concise_writing', 'civil_service_admin', 'csh_administrative_procedures']
    }
}

SOURCE_MAP = {
    **{qid: proc for qid in ['ppa_elb_052','ppa_ethic_065','ppa_bid_066','ppa_ethic_054','ppa_ethic_058','ppa_ims_054','ppa_ims_055','ppa_ims_057','ppa_ims_058','ppa_ims_067','ppa_ims_068','ppa_ims_069','ppa_ims_070','ppa_ims_071','ppa_objectives_054','ppa_objectives_072']},
    **{qid: ict for qid in ['ict_f_091','ict_f_076','ict_f_092','ict_f_099','ict_li_094','ict_li_095','ict_li_096','ict_li_097']},
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
        civil_names = {
            'csh_administrative_procedures': 'Administrative Procedures',
            'csh_principles_ethics': 'Civil Service Principles & Ethics',
            'csh_duties_responsibilities': 'Duties & Responsibilities',
        }
        q['sourceSubcategoryName'] = civil_names[spec['target_subcategory']]
        add_to_target(civil, spec['target_subcategory'], q)
    elif spec['target'] == 'financial':
        q['sourceTopicId'] = 'financial_regulations'
        q['sourceTopicName'] = 'Financial Management'
        q['sourceSubcategoryId'] = spec['target_subcategory']
        fin_names = {
            'fin_general': 'General Financial Management',
            'fin_budgeting': 'Budgeting & Financial Planning',
            'fin_audits_sanctions': 'Audits, Sanctions & Compliance',
        }
        q['sourceSubcategoryName'] = fin_names[spec['target_subcategory']]
        add_to_target(fin, spec['target_subcategory'], q)
    elif spec['target'] == 'psr':
        q['sourceTopicId'] = 'psr'
        q['sourceTopicName'] = 'Public Service Rules (PSR)'
        q['sourceSubcategoryId'] = spec['target_subcategory']
        q['sourceSubcategoryName'] = 'Discipline & Misconduct'
        add_to_target(psr, spec['target_subcategory'], q)
    elif spec['target'] == 'proc':
        q['sourceTopicId'] = 'procurement_act'
        q['sourceTopicName'] = 'Public Procurement Act'
        q['sourceSubcategoryId'] = spec['target_subcategory']
        q['sourceSubcategoryName'] = 'Bidding, Evaluation & Award'
        add_to_target(proc, spec['target_subcategory'], q)
    else:
        raise RuntimeError(f"Unknown target type: {spec['target']}")

proc_path.write_text(json.dumps(proc, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
ict_path.write_text(json.dumps(ict, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
civil_path.write_text(json.dumps(civil, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
fin_path.write_text(json.dumps(fin, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
psr_path.write_text(json.dumps(psr, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

print('Moved 24 questions in move round 23.')
for old_id, spec in move_specs.items():
    print(f"{old_id} -> {spec['new_id']}")
