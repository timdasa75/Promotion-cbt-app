import json
from pathlib import Path

path = Path('data/ict_digital.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'ict_eg_090': {
        'question': 'Which classification is the lowest security level for an official document?',
        'options': ['TOP SECRET.', 'RESTRICTED.', 'CONFIDENTIAL.', 'SECRET.'],
        'explanation': 'The classification levels for official documents descend from TOP SECRET to SECRET, CONFIDENTIAL, and then RESTRICTED. The item therefore tests recognition of RESTRICTED as the lowest security classification among the listed options.',
        'keywords': ['document_classification', 'restricted', 'official_documents', 'security_levels']
    },
    'ict_eg_094': {
        'question': 'Which filing system is traditionally regarded as the main system used in government offices?',
        'options': ['The color-coded system.', 'The digital system.', 'The alphabetical system.', 'The Book File system.'],
        'explanation': 'In traditional government registry practice, the Book File system is treated as the main filing system. The item therefore tests recognition of the filing system commonly identified as the standard office arrangement.',
        'keywords': ['book_file_system', 'government_filing', 'registry_practice', 'office_records']
    },
    'ict_f_083': {
        'question': 'Which filing system is commonly identified as the main filing system in government offices?',
        'options': ['The Book File system.', 'The color-coded system.', 'The alphabetical system.', 'The digital system.'],
        'explanation': 'The Book File system is commonly identified as the main filing system in government offices. The question therefore tests recognition of that registry-practice term rather than alternative organizing methods.',
        'keywords': ['book_file_system', 'filing_system', 'government_offices', 'registry_practice']
    },
    'ict_f_093': {
        'question': 'Under Financial Regulation 604(a), what is prohibited when preparing payment vouchers?',
        'options': ['Using typewriters.', 'Using ball pens.', 'Writing in pencil.', 'Writing totals in figures.'],
        'explanation': 'Financial Regulation 604(a) states that vouchers must not be written in pencil. The item therefore tests recognition of the writing method expressly prohibited when preparing payment vouchers.',
        'keywords': ['fr_604_a', 'payment_vouchers', 'writing_in_pencil', 'voucher_preparation']
    },
    'ict_li_076': {
        'question': 'Before drafting an official communication, what should a schedule officer do first?',
        'options': ['Write the draft immediately.', 'Ask a junior officer to do it.', 'Look up the facts, figures, and data.', 'Call a meeting.'],
        'explanation': 'Before drafting an official communication, a schedule officer should first verify the relevant facts, figures, and data. The item therefore tests the preparatory step that helps ensure the communication is accurate from the start.',
        'keywords': ['official_communication', 'schedule_officer', 'fact_verification', 'drafting_preparation']
    },
    'ict_li_084': {
        'question': 'When preparing to write an official communication, what should be checked before drafting begins?',
        'options': ['Look up the facts, figures, and data.', 'Write the draft immediately.', 'Call a meeting.', 'Ask a junior officer to do it.'],
        'explanation': 'Facts, figures, and data should be checked before drafting begins so the communication rests on accurate information. The question therefore tests the verification step that comes before the actual writing of the communication.',
        'keywords': ['official_communication', 'drafting_checks', 'facts_figures_data', 'writing_preparation']
    },
    'ict_sec_029': {
        'question': 'What does PKI stand for in digital security?',
        'explanation': 'PKI stands for Public Key Infrastructure. It refers to the framework of roles, policies, procedures, and technologies used to create, manage, distribute, and revoke digital certificates and public keys.',
        'keywords': ['pki', 'public_key_infrastructure', 'digital_security', 'digital_certificates']
    },
    'ict_sec_091': {
        'question': "Nigeria's foreign policy is primarily a reflection of what?",
        'options': [
            'Her political, economic, social, and cultural circumstances.',
            'The foreign policies of allied nations.',
            'International economic trends.',
            'Global security concerns.'
        ],
        'explanation': "Nigeria's foreign policy is primarily a reflection of her political, economic, social, and cultural circumstances, together with the immediate and wider domestic realities influencing national priorities. The item therefore tests recognition of the domestic foundation of foreign policy.",
        'keywords': ['nigeria_foreign_policy', 'domestic_circumstances', 'public_affairs', 'national_priorities']
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
print(f'Applied {changed} ICT definition-alignment rewrites.')
