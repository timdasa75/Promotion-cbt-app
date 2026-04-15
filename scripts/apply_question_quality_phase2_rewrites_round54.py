import json
from pathlib import Path

path = Path('data/civil_service_ethics.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'csh_principle_058': {
        'question': 'When an imprest is retired at another station, what must the issuing Sub-Accounting Officer verify?',
        'options': [
            'The receipt voucher particulars.',
            'A notice to the Minister of Finance.',
            'The issue of a new imprest.',
            'A separate audit report.'
        ],
        'explanation': 'When an imprest is retired at another station, the issuing Sub-Accounting Officer must verify the receipt voucher particulars. Financial Regulation 1011(ii) makes that verification duty explicit so the retirement can be properly reconciled.',
        'keywords': ['imprest_retirement', 'sub_accounting_officer', 'receipt_voucher', 'fr_1011_ii']
    },
    'csh_duty_052': {
        'question': 'Can an officer with delegated expenditure control sub-delegate that accountability without approval?',
        'options': ['No.', 'Yes, freely.', 'Yes, with the approval of the Accounting Officer.', 'Only for minor expenses.'],
        'explanation': 'No. Financial Regulation 404 provides that an officer must not sub-delegate expenditure-control accountability, wholly or partly, without the knowledge and approval of the officer controlling the vote. The question therefore tests the limit on delegated financial authority.',
        'keywords': ['delegated_expenditure_control', 'sub_delegation', 'fr_404', 'financial_accountability']
    },
    'csh_duty_053': {
        'question': 'What type of control should exist for the collection of all revenues under the Accounting Officer?',
        'options': ['External control.', 'Informal control.', 'Centralized control.', 'Internal control.'],
        'explanation': 'Financial Regulation 1603(g) emphasizes the need for an adequate system of internal control over the collection of all revenues under the Accounting Officer. The item therefore tests the control structure expected in revenue administration.',
        'keywords': ['internal_control', 'revenue_collection', 'accounting_officer', 'fr_1603_g']
    },
    'csh_duty_065': {
        'question': 'Which of these is an exclusive responsibility of the Federal Government?',
        'options': ['Roads.', 'Education.', 'Health.', 'Foreign Affairs.'],
        'explanation': 'Foreign Affairs is an exclusive responsibility of the Federal Government. The item therefore tests recognition of a matter reserved to the Federal tier rather than a shared or concurrent public-service function.',
        'keywords': ['federal_government', 'exclusive_responsibility', 'foreign_affairs', 'government_functions']
    },
    'csh_duty_075': {
        'question': 'What is the purpose of a memorandum in the Civil Service?',
        'options': [
            'To provide a confidential report only.',
            'To document a personal conversation.',
            'To communicate with the public.',
            'To communicate internally within the same department or Ministry.'
        ],
        'explanation': 'A memorandum is used for internal communication within the same department or Ministry. The item therefore tests recognition of the correspondence form used for internal official communication rather than public-facing or personal exchange.',
        'keywords': ['memorandum', 'internal_communication', 'civil_service_correspondence', 'departmental_communication']
    },
    'csh_disc_064': {
        'question': 'What is the consequence of failing to take reasonable care of documents entrusted to a civil servant?',
        'options': ['It is a normal part of the job.', 'It is an offense.', 'It is a minor infraction only.', 'It is an excusable mistake.'],
        'explanation': 'Failing to take reasonable care of documents entrusted to a civil servant is an offense. The rule protects official records from loss, misuse, or unauthorized exposure by making careless handling a disciplinary matter.',
        'keywords': ['document_care', 'civil_service_offense', 'official_records', 'disciplinary_consequence']
    },
    'csh_disc_066': {
        'question': 'What are civil servants advised not to leave on their desks at the end of the day?',
        'options': ['Their lunch box.', 'Their personal belongings.', 'Official files and documents.', 'Their phone.'],
        'explanation': 'Civil servants are advised not to leave official files and documents on their desks at the end of the day. That precaution helps prevent loss, misplacement, or unauthorized access to official records.',
        'keywords': ['official_files', 'desk_security', 'document_safety', 'end_of_day_practice']
    },
    'csh_disc_070': {
        'question': 'Which of the following is treated as a very serious offense for a civil servant?',
        'options': ['Taking a day off.', 'Arriving late to a meeting.', 'Unauthorized disclosure of information acquired in the course of duty.', 'Talking to a colleague.'],
        'explanation': 'Unauthorized disclosure of information acquired in the course of duty is treated as a very serious offense for a civil servant. The question therefore tests recognition of a grave breach of official trust and confidentiality.',
        'keywords': ['unauthorized_disclosure', 'serious_offense', 'official_confidentiality', 'discipline']
    },
    'csh_disc_072': {
        'question': 'Which conduct is considered a very serious offense for a civil servant?',
        'options': ['Talking to a colleague.', 'Taking a day off.', 'Unauthorized disclosure of information acquired in the course of duty.', 'Arriving late to a meeting.'],
        'explanation': 'Unauthorized disclosure of information acquired in the course of duty is considered a very serious offense. The item therefore tests the seriousness attached to breaching official confidentiality in the public service.',
        'keywords': ['serious_offense', 'official_information', 'confidentiality_breach', 'civil_service_discipline']
    },
    'csh_pt_054': {
        'question': 'How should intermediate officers treat papers routed through them for information only?',
        'options': ['They should delay them unnecessarily.', 'They should file them immediately.', 'They should take a copy for themselves.', 'They should not delay them unnecessarily.'],
        'explanation': 'Intermediate officers should not delay unnecessarily papers routed through them for information only. The purpose is to keep official work moving while ensuring that information copies do not obstruct action on the file.',
        'keywords': ['intermediate_officers', 'papers_for_information_only', 'workflow_speed', 'official_files']
    },
    'csh_it_052': {
        'question': 'Which of the following is one duty of the Accountant-General in relation to revenue?',
        'options': ['To carry out revenue monitoring and accounting.', 'To approve all revenue expenditures.', 'To set revenue targets for ministries.', 'To collect all Federal Government revenue personally.'],
        'explanation': 'One duty of the Accountant-General is to carry out revenue monitoring and accounting. Financial Regulation 107(m) states that responsibility expressly, so the item tests recognition of that revenue-management duty.',
        'keywords': ['accountant_general', 'revenue_monitoring', 'revenue_accounting', 'fr_107_m']
    },
    'csh_sdg_055': {
        'question': 'What is a key role of the supervisor in a registry?',
        'options': ['To enforce discipline with justice and fairness at all times.', 'To prevent any staff member from leaving the office.', 'To allow staff to do as they please.', 'To do all the work personally.'],
        'explanation': 'A key role of the supervisor in a registry is to enforce discipline with justice and fairness at all times. The item therefore tests the supervisory standard expected in managing registry staff and workflow.',
        'keywords': ['registry_supervisor', 'discipline', 'justice_and_fairness', 'registry_management']
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
print(f'Applied {changed} weak-framing rewrites in civil-service-admin round 54.')
