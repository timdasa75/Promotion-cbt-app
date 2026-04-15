import json
from pathlib import Path

psr_path = Path('data/psr_rules.json')
comp_path = Path('data/core_competencies.json')
civil_path = Path('data/civil_service_ethics.json')
fin_path = Path('data/financial_regulations.json')

psr = json.loads(psr_path.read_text(encoding='utf-8'))
comp = json.loads(comp_path.read_text(encoding='utf-8'))
civil = json.loads(civil_path.read_text(encoding='utf-8'))
fin = json.loads(fin_path.read_text(encoding='utf-8'))

move_specs = {
    'psr_admin_063': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_176',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': "Should copies of a Head of Department's own letters normally be circulated to subordinates?",
        'options': ['Yes, they should always be circulated.', 'Only to the most junior officers.', 'No, they are not normally circulated to subordinates.', 'Only through the confidential registry.'],
        'correct': 2,
        'explanation': "It is not customary for copies of a Head of Department's own letters to be circulated to subordinates.",
        'keywords': ['head_of_department', 'official_letters', 'circulation', 'administrative_procedure'],
        'tags': ['head_of_department', 'official_letters', 'circulation', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'circ_leave_welfare_allowances_gen_085': {
        'target': 'financial', 'target_subcategory': 'fin_audits_sanctions', 'new_id': 'fin_aud_077',
        'chapter': 'Audits, Sanctions & Compliance', 'sourceDocument': 'Financial Regulations (FR)', 'sourceSection': 'Audits, Sanctions & Compliance',
        'question': 'What register must the Head of the Internal Audit Unit maintain?',
        'options': ['A progress register.', 'A procurement register.', 'A payroll register.', 'A staff leave register.'],
        'correct': 0,
        'explanation': 'Financial Regulation 1705 requires the Head of the Internal Audit Unit to maintain a progress register showing the status of work done by audit staff.',
        'keywords': ['internal_audit_unit', 'progress_register', 'financial_regulation_1705', 'audit_control'],
        'tags': ['internal_audit_unit', 'progress_register', 'financial_regulations', 'fin_audits_sanctions']
    },
    'circ_leave_welfare_allowances_gen_086': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_177',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'What should a civil servant do when transferred to a new office?',
        'options': ['Take all files to the new office personally.', 'Leave immediately without any handover.', 'Ask the new supervisor to collect the files.', 'Prepare and submit a formal handing-over note.'],
        'correct': 3,
        'explanation': 'An officer transferred to a new office should prepare a formal handing-over note so that responsibilities, records, and pending work are properly transferred.',
        'keywords': ['transfer', 'handing_over_note', 'official_transfer', 'administrative_procedure'],
        'tags': ['transfer', 'handing_over_note', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'circ_leave_welfare_allowances_gen_087': {
        'target': 'civil', 'target_subcategory': 'csh_administrative_procedures', 'new_id': 'csh_ap_178',
        'chapter': 'Administrative Procedures', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Administrative Procedures',
        'question': 'How should classified documents that are no longer needed be destroyed?',
        'options': ['Tear them up and throw them into a waste bin.', 'Leave them on a desk for others to inspect.', 'Put them in the open registry.', 'Shred them or burn them.'],
        'correct': 3,
        'explanation': 'Unwanted classified records should be physically destroyed, usually by shredding or burning, so that protected information is not exposed.',
        'keywords': ['classified_documents', 'records_destruction', 'shredding', 'administrative_procedure'],
        'tags': ['classified_documents', 'records_destruction', 'civil_service_admin', 'csh_administrative_procedures']
    },
    'psr_med_058': {
        'target': 'financial', 'target_subcategory': 'fin_general', 'new_id': 'fin_gen_078',
        'chapter': 'General Financial Management', 'sourceDocument': 'Financial Regulations (FR)', 'sourceSection': 'General Financial Management',
        'question': 'What details must be entered in the Deposit Register for each transaction?',
        'options': ['The reason for the deposit and the expected withdrawal date.', 'The date of the transaction and the signature of the officer only.', 'The name of the depositor and particulars of each deposit and withdrawal.', 'Only the amount of the deposit.'],
        'correct': 2,
        'explanation': 'Financial Regulation 1304 requires the Deposit Register to contain the name of the depositor together with particulars of all deposits and withdrawals.',
        'keywords': ['deposit_register', 'depositor', 'withdrawals', 'financial_regulation_1304'],
        'tags': ['deposit_register', 'depositor', 'withdrawals', 'financial_regulations', 'fin_general']
    },
    'competency_num_081': {
        'target': 'civil', 'target_subcategory': 'csh_duties_responsibilities', 'new_id': 'csh_duty_077',
        'chapter': 'Duties & Responsibilities', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Duties & Responsibilities',
        'question': 'Who is the administrative head of a ministry?',
        'options': ['The Director of Finance.', 'The Head of the Civil Service of the Federation.', 'The Permanent Secretary.', 'The President.'],
        'correct': 2,
        'explanation': 'The Minister is the political head of a ministry, while the Permanent Secretary serves as the administrative head.',
        'keywords': ['ministry', 'administrative_head', 'permanent_secretary', 'duties_responsibilities'],
        'tags': ['ministry', 'administrative_head', 'permanent_secretary', 'civil_service_admin', 'csh_duties_responsibilities']
    },
    'competency_verbal_062': {
        'target': 'financial', 'target_subcategory': 'fin_general', 'new_id': 'fin_gen_079',
        'chapter': 'General Financial Management', 'sourceDocument': 'Financial Regulations (FR)', 'sourceSection': 'General Financial Management',
        'question': 'How must a directive from a Political Head to an Accounting Officer be given when it has financial implications?',
        'options': ['It must be given in writing.', 'It may be given verbally.', 'It is required only for minor financial matters.', 'It must first be approved by the National Assembly.'],
        'correct': 0,
        'explanation': 'Financial Regulation 117(i) requires any directive from a Political Head to an Accounting Officer with financial implications to be given in writing.',
        'keywords': ['political_head', 'accounting_officer', 'financial_implications', 'financial_regulation_117i'],
        'tags': ['political_head', 'accounting_officer', 'financial_implications', 'financial_regulations', 'fin_general']
    },
    'competency_verbal_064': {
        'target': 'financial', 'target_subcategory': 'fin_general', 'new_id': 'fin_gen_080',
        'chapter': 'General Financial Management', 'sourceDocument': 'Financial Regulations (FR)', 'sourceSection': 'General Financial Management',
        'question': 'What must support a lodgement made by an officer who is neither a Revenue Collector nor a Sub-Accounting Officer?',
        'options': ['A handwritten note.', 'A paying-in form (Treasury Form 15).', 'An entry in a private cash book.', 'A verbal report.'],
        'correct': 1,
        'explanation': 'Financial Regulation 218 requires such a lodgement to be supported by a paying-in form, Treasury Form 15.',
        'keywords': ['lodgement', 'treasury_form_15', 'paying_in_form', 'financial_regulation_218'],
        'tags': ['lodgement', 'treasury_form_15', 'paying_in_form', 'financial_regulations', 'fin_general']
    },
    'competency_verbal_071': {
        'target': 'financial', 'target_subcategory': 'fin_general', 'new_id': 'fin_gen_081',
        'chapter': 'General Financial Management', 'sourceDocument': 'Financial Regulations (FR)', 'sourceSection': 'General Financial Management',
        'question': 'What must be done with a cancelled receipt or licence, including the original?',
        'options': ['It must be retained in the receipt or licence book.', 'It should be given to the payer.', 'It should be destroyed immediately.', 'It should be sent to the Accountant-General.'],
        'correct': 0,
        'explanation': 'Financial Regulation 1216 provides that cancelled receipts or licences, including the original, must be retained in the receipt or licence book.',
        'keywords': ['cancelled_receipt', 'licence_book', 'retention', 'financial_regulation_1216'],
        'tags': ['cancelled_receipt', 'licence_book', 'retention', 'financial_regulations', 'fin_general']
    },
    'competency_verbal_073': {
        'target': 'financial', 'target_subcategory': 'fin_audits_sanctions', 'new_id': 'fin_aud_078',
        'chapter': 'Audits, Sanctions & Compliance', 'sourceDocument': 'Financial Regulations (FR)', 'sourceSection': 'Audits, Sanctions & Compliance',
        'question': 'What type of report must the Board of Survey prepare and submit?',
        'options': ['An electronic report only.', 'A one-page summary report.', 'A report in triplicate signed by all members.', 'A verbal report to the Accounting Officer.'],
        'correct': 2,
        'explanation': 'Financial Regulation 1807 requires the Board of Survey to prepare a report in triplicate and have it signed by all members.',
        'keywords': ['board_of_survey', 'report_in_triplicate', 'signed_report', 'financial_regulation_1807'],
        'tags': ['board_of_survey', 'report_in_triplicate', 'financial_regulations', 'fin_audits_sanctions']
    },
    'competency_verbal_075': {
        'target': 'civil', 'target_subcategory': 'csh_duties_responsibilities', 'new_id': 'csh_duty_078',
        'chapter': 'Duties & Responsibilities', 'sourceDocument': 'Civil Service Handbook', 'sourceSection': 'Duties & Responsibilities',
        'question': 'Who is the chief adviser to the Minister and also the ministry\'s Accounting Officer?',
        'options': ['The Chairman of the extra-ministerial department.', 'The Permanent Secretary.', 'The Minister of State.', 'The Head of the Civil Service of the Federation.'],
        'correct': 1,
        'explanation': 'The Permanent Secretary serves as the chief adviser to the Minister and is also the ministry\'s Accounting Officer.',
        'keywords': ['permanent_secretary', 'accounting_officer', 'ministerial_adviser', 'duties_responsibilities'],
        'tags': ['permanent_secretary', 'accounting_officer', 'ministerial_adviser', 'civil_service_admin', 'csh_duties_responsibilities']
    },
    'competency_verbal_080': {
        'target': 'financial', 'target_subcategory': 'fin_general', 'new_id': 'fin_gen_082',
        'chapter': 'General Financial Management', 'sourceDocument': 'Financial Regulations (FR)', 'sourceSection': 'General Financial Management',
        'question': 'What must an officer receiving public money issue for every sum paid to the government?',
        'options': ['A verbal confirmation.', 'An official receipt.', 'A bank deposit slip.', 'A signed declaration.'],
        'correct': 1,
        'explanation': 'Financial Regulation 202 requires an officer receiving public money to issue an official receipt for every sum paid to the government.',
        'keywords': ['public_money', 'official_receipt', 'financial_regulation_202', 'revenue_collection'],
        'tags': ['public_money', 'official_receipt', 'financial_regulations', 'fin_general']
    },
    'competency_verbal_085': {
        'target': 'financial', 'target_subcategory': 'fin_general', 'new_id': 'fin_gen_083',
        'chapter': 'General Financial Management', 'sourceDocument': 'Financial Regulations (FR)', 'sourceSection': 'General Financial Management',
        'question': 'What must be stamped on every cheque leaf?',
        'options': ['The amount in words.', 'The date of issue.', 'The correct account number.', 'The payee\'s name.'],
        'correct': 2,
        'explanation': 'Financial Regulation 703(i) requires every cheque leaf to be crossed and stamped with the correct account number.',
        'keywords': ['cheque_leaf', 'account_number', 'financial_regulation_703i', 'banking_control'],
        'tags': ['cheque_leaf', 'account_number', 'financial_regulations', 'fin_general']
    }
}

SOURCE_MAP = {
    **{qid: psr for qid in ['psr_admin_063','circ_leave_welfare_allowances_gen_085','circ_leave_welfare_allowances_gen_086','circ_leave_welfare_allowances_gen_087','psr_med_058']},
    **{qid: comp for qid in ['competency_num_081','competency_verbal_062','competency_verbal_064','competency_verbal_071','competency_verbal_073','competency_verbal_075','competency_verbal_080','competency_verbal_085']},
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
        names = {
            'csh_administrative_procedures': 'Administrative Procedures',
            'csh_duties_responsibilities': 'Duties & Responsibilities',
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
        }
        q['sourceSubcategoryName'] = names[spec['target_subcategory']]
        add_to_target(fin, spec['target_subcategory'], q)

psr_path.write_text(json.dumps(psr, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
comp_path.write_text(json.dumps(comp, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
civil_path.write_text(json.dumps(civil, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
fin_path.write_text(json.dumps(fin, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

print('Moved 13 questions in move round 24.')
for old_id, spec in move_specs.items():
    print(f"{old_id} -> {spec['new_id']}")
