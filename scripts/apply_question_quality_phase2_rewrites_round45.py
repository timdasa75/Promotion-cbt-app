import json
from pathlib import Path

path = Path('data/leadership_negotiation.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'leadership_lsm_071': {
        'question': 'When drafting a minute, what should be stated briefly as one of the first points?',
        'options': [
            "The writer's personal opinions.",
            'Irrelevant details.',
            'The matter at issue.',
            'Future plans only.'
        ],
        'explanation': 'A minute should begin by stating the matter at issue briefly and clearly. That opening point helps the reader understand the purpose of the note before considering any recommendation or action.',
        'keywords': ['minute_writing', 'matter_at_issue', 'official_minutes', 'administrative_writing']
    },
    'leadership_lsm_072': {
        'question': 'What are file notes used for?',
        'options': [
            'To make a quick written record of something that has happened.',
            'To serve as meeting minutes.',
            'To replace formal reports in every case.',
            'To act as personal reminders only.'
        ],
        'explanation': 'File notes are used to make a quick written record of something that has happened on a file. They help preserve an immediate administrative record without replacing fuller reports where those are required.',
        'keywords': ['file_notes', 'records_management', 'written_record', 'file_administration']
    },
    'leadership_lsm_074': {
        'question': 'Which statement best describes file notes in office procedure?',
        'options': [
            'They are a quick written record of something that has happened.',
            'They are private reminders that should not go on file.',
            'They are full formal reports prepared for publication.',
            'They are the same as meeting minutes.'
        ],
        'explanation': 'File notes are brief written records placed on file to capture something that has happened or needs to be remembered. Their purpose is to preserve an administrative record, not to replace minutes or formal reports.',
        'keywords': ['file_notes', 'office_procedure', 'administrative_record', 'records_management']
    },
    'leadership_mpf_068': {
        'question': 'What is the chief significance of performance appraisal in the Civil Service Handbook?',
        'options': [
            'To reduce salaries.',
            'To increase workload without review.',
            'To punish staff only.',
            'To evaluate, improve, and reward staff performance.'
        ],
        'explanation': 'The Civil Service Handbook treats performance appraisal as a tool for evaluating work, improving performance, and informing reward or development decisions. It is therefore broader than punishment or workload control.',
        'keywords': ['performance_appraisal', 'civil_service_handbook', 'staff_evaluation', 'performance_improvement']
    },
    'leadership_mpf_070': {
        'question': 'In management, what do SMART goals stand for?',
        'explanation': 'SMART goals are goals that are Specific, Measurable, Achievable, Relevant, and Time-bound. The acronym is used to promote clarity, feasibility, and accountability in planning and performance management.',
        'keywords': ['smart_goals', 'management', 'planning', 'performance_targets']
    },
    'leadership_smp_060': {
        'question': 'After a letter is drafted and approved, what is the final step in the communication procedure?',
        'options': [
            'Have it signed and dispatched.',
            'Reroute it to all intermediate officers.',
            'File it immediately without sending it.',
            'Discard the draft.'
        ],
        'explanation': 'Once a letter has been drafted and approved, the final step is to have it signed and dispatched to the intended recipient. Approval alone does not complete the communication process until the letter is formally sent.',
        'keywords': ['official_letter', 'communication_procedure', 'dispatch', 'signed_letter']
    },
    'leadership_smp_070': {
        'question': 'What is the purpose of an official letter?',
        'options': [
            'To communicate with other Ministries and the public.',
            'To provide a confidential report only.',
            'To document a personal conversation.',
            'To communicate internally within one desk only.'
        ],
        'explanation': 'An official letter is used for formal communication with other Ministries, agencies, parastatals, and members of the public. Its purpose is broader than confidential reporting or informal internal notes.',
        'keywords': ['official_letter', 'formal_communication', 'ministries_and_public', 'office_correspondence']
    },
    'leadership_smp_066': {
        'question': 'What is a despatch book used for?',
        'options': [
            'To record all outgoing mail.',
            'To log all official meetings.',
            'To record all incoming mail.',
            'To document all financial transactions.'
        ],
        'explanation': 'A despatch book is used to record outgoing mail from a department or ministry. It supports accountability by showing what correspondence has been sent out and when it was dispatched.',
        'keywords': ['despatch_book', 'outgoing_mail', 'records_management', 'office_correspondence']
    },
    'leadership_smp_044': {
        'question': 'Which PSR rule sets out the mandatory training categories A, B, and C based on relevance to an MDA\'s mandate?',
        'explanation': 'Rule 070105 sets out the categories of training and explains how they are grouped by relevance to the mandate of the MDA. The item therefore tests identification of the correct PSR rule reference.',
        'keywords': ['training_categories', 'psr_070105', 'mda_mandate', 'staff_development']
    },
    'leadership_mpf_025': {
        'question': 'Staff development under Rule 070101 is intended to prepare officers for what?',
        'explanation': 'Rule 070101 presents staff development as a way of improving knowledge, skills, and effectiveness so that officers can meet career goals and prepare for changing duties and responsibilities. The correct option therefore focuses on readiness for changing responsibilities.',
        'keywords': ['staff_development', 'psr_070101', 'changing_duties', 'career_preparation']
    },
    'NLR_P_006': {
        'question': 'What is the process of reaching agreement on terms and conditions of employment between an employer and employee representatives called?',
        'explanation': 'The process of reaching agreement on terms and conditions of employment between an employer and employee representatives is called collective bargaining. The term refers specifically to formal negotiation over employment conditions.',
        'keywords': ['collective_bargaining', 'terms_and_conditions_of_employment', 'labour_relations', 'negotiation_process']
    },
    'NLR_P_007': {
        'question': 'What does industrial harmony mean in labour relations?',
        'explanation': 'Industrial harmony refers to peaceful and cooperative relations between employers and employees. The concept emphasizes stability, cooperation, and reduced conflict in the workplace.',
        'keywords': ['industrial_harmony', 'labour_relations', 'cooperation', 'workplace_peace']
    },
    'neg_principles_outcomes_gen_067': {
        'question': 'What key outcome is usually sought from successful industrial negotiations?',
        'explanation': 'A key outcome of successful industrial negotiations is industrial harmony. When negotiation succeeds, it helps preserve peaceful and cooperative relations between labour and management.',
        'keywords': ['industrial_negotiations', 'industrial_harmony', 'negotiation_outcome', 'labour_relations']
    },
    'neg_dispute_law_gen_067': {
        'question': 'Which ILO principle underpins fair labour practices?',
        'explanation': 'Freedom of association is one of the core ILO principles underpinning fair labour practices. It protects the right of workers and employers to organize and to be represented in labour relations.',
        'keywords': ['ilo_principle', 'freedom_of_association', 'fair_labour_practices', 'labour_rights']
    },
    'leadership_mpf_004': {
        'question': 'What does SMART mean in the context of management goals?',
        'explanation': 'In management, SMART means Specific, Measurable, Achievable, Relevant, and Time-bound. The acronym is used to define goals that are clear, realistic, and trackable.',
        'keywords': ['smart', 'management_goals', 'performance_management', 'goal_setting']
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
print(f'Applied {changed} leadership definition-alignment rewrites.')
