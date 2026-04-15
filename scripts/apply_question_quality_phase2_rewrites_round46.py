import json
from pathlib import Path

path = Path('data/public_procurement.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'ppa_bid_011': {
        'question': 'What do procurement rules call a bid that fully complies with the technical, financial, and administrative requirements in the tender document?',
        'explanation': 'A responsive bid is one that complies fully with the technical, financial, and administrative requirements stated in the tender document. The item therefore tests recognition of the term used for a fully compliant bid.',
        'keywords': ['responsive_bid', 'tender_requirements', 'procurement_evaluation', 'compliance']
    },
    'ppa_bid_056': {
        'question': 'Under FR 1802, what is the minimum number of members required on a Board of Survey?',
        'options': ['One.', 'Two.', 'Four.', 'Three.'],
        'explanation': 'Financial Regulation 1802 states that a Board of Survey must consist of at least three members. The item therefore tests the minimum membership requirement.',
        'keywords': ['board_of_survey', 'fr_1802', 'minimum_members', 'survey_board']
    },
    'ppa_bid_057': {
        'question': 'What are Absent File cards and card slips used for?',
        'options': [
            'To maintain a record of all staff.',
            'To log official payments.',
            'To track staff attendance.',
            'To track the movement of files.'
        ],
        'explanation': 'Absent File cards and card slips are used to track the movement of files. They help show where a file has gone and who is currently responsible for it.',
        'keywords': ['absent_file_cards', 'card_slips', 'file_movement', 'records_tracking']
    },
    'ppa_bid_064': {
        'question': 'What is a despatch book used for?',
        'options': [
            'To record official meetings.',
            'To record outgoing mail.',
            'To log financial transactions.',
            'To record incoming mail.'
        ],
        'explanation': 'A despatch book is used to record outgoing mail from a department or ministry. It provides a traceable record of correspondence that has been sent out.',
        'keywords': ['despatch_book', 'outgoing_mail', 'records_management', 'office_correspondence']
    },
    'ppa_ethic_050': {
        'question': 'What term is used for a specific, objectively assessable, non-personality-based academic or factual idea?',
        'options': ['A skill.', 'A regulation.', 'A principle.', 'A concept.'],
        'explanation': 'A concept is a specific, objectively assessable idea or factual topic. The question therefore tests recognition of the general term for that kind of academic or factual unit.',
        'keywords': ['concept', 'factual_idea', 'academic_term', 'objective_assessment']
    },
    'ppa_ethic_070': {
        'question': 'What are file notes in office procedure?',
        'options': [
            'Formal reports.',
            'A quick written record of something that has happened.',
            'Personal reminders.',
            'Meeting minutes.'
        ],
        'explanation': 'File notes are brief written records made to capture something that has happened on a file. They help preserve an administrative trail without serving the same purpose as minutes or formal reports.',
        'keywords': ['file_notes', 'office_procedure', 'written_record', 'records_management']
    },
    'ppa_ethic_072': {
        'question': 'Which statement best describes file notes?',
        'options': [
            'They are meeting minutes.',
            'They are personal reminders only.',
            'They are quick written records of something that has happened.',
            'They are formal reports.'
        ],
        'explanation': 'File notes are quick written records of something that has happened and needs to be preserved on a file. Their purpose is administrative recordkeeping rather than minute-taking or formal reporting.',
        'keywords': ['file_notes', 'records_management', 'administrative_record', 'office_procedure']
    },
    'ppa_objectives_047': {
        'question': 'What are the three main classes of procurement under the Public Procurement Act?',
        'explanation': 'The Public Procurement Act classifies procurement under three main heads: Goods, Works, and Services. The correct option therefore names those three classes.',
        'keywords': ['procurement_classes', 'public_procurement_act', 'goods_works_services', 'classification']
    },
    'ppa_objectives_052': {
        'question': 'What is considered a critical success factor for government to achieve its objectives?',
        'options': [
            'A wealthy private sector.',
            'A strong military.',
            'A professional, competent, and result-oriented Civil Service.',
            'A large population.'
        ],
        'explanation': 'A professional, competent, and result-oriented Civil Service is a critical success factor for government to achieve its objectives. The item is therefore testing recognition of that governance requirement.',
        'keywords': ['critical_success_factor', 'civil_service', 'government_objectives', 'public_administration']
    },
    'ppa_objectives_059': {
        'question': 'What minimum amount on a receipt for goods supplied or services rendered attracts a N50 stamp duty?',
        'options': ['N1,000.00.', 'N5,000.00.', 'N500.00.', 'N50.00.'],
        'explanation': 'Financial Regulation 620(a)(i) states that a receipt for goods supplied or services rendered attracts a N50 stamp duty when the amount acknowledged is N1,000 or more. The threshold being tested is therefore N1,000.',
        'keywords': ['stamp_duty', 'financial_regulation_620', 'receipt_threshold', 'goods_and_services']
    },
    'ppa_objectives_061': {
        'question': 'Which of the following is identified as a core principle in the discharge of Civil Service functions?',
        'options': ['Subjectivity.', 'Secrecy.', 'Political partisanship.', 'Responsiveness.'],
        'explanation': 'Responsiveness is identified as one of the principles guiding the discharge of Civil Service functions, alongside accountability, courtesy, objectivity, impartiality, and public trust. The correct option therefore points to responsiveness, not secrecy or partisanship.',
        'keywords': ['civil_service_principles', 'responsiveness', 'public_service_values', 'governance']
    },
    'ppa_objectives_064': {
        'question': 'Do the stated eligibility rules specify a minimum number of years of service for appointment as Permanent Secretary?',
        'options': ['Yes, 17 years.', 'Yes, 20 years.', 'Yes, 15 years.', 'No specific minimum number of years is stated.'],
        'explanation': 'The cited eligibility rule outlines the conditions for appointment as Permanent Secretary but does not state a specific minimum number of years of service. The correct option therefore recognizes that no fixed number is expressly given.',
        'keywords': ['permanent_secretary', 'eligibility_rules', 'years_of_service', 'rule_interpretation']
    },
    'ppa_objectives_065': {
        'question': 'Which of the following is considered a critical success factor for government to achieve its objectives?',
        'options': [
            'A wealthy private sector.',
            'A professional, competent, and result-oriented Civil Service.',
            'A strong military.',
            'A large population.'
        ],
        'explanation': 'A professional, competent, and result-oriented Civil Service is regarded as a critical success factor for government to achieve its objectives. The item therefore tests recognition of that public-administration requirement.',
        'keywords': ['critical_success_factor', 'competent_civil_service', 'government_objectives', 'public_administration']
    }
}
changed = 0
for subcategory in data.get('subcategories', []):
    for question in subcategory.get('questions', []):
        update = updates.get(question.get('id'))
        if not update:
            continue
        question.update(update)
        changed += 1
expected = len(updates)
if changed != expected:
    raise RuntimeError(f'Expected {expected} updates, applied {changed}')
path.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
print(f'Applied {changed} procurement definition-alignment rewrites.')
