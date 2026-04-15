import json
from pathlib import Path

path = Path('data/policy_analysis.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'policy_constitution_033': {
        'question': 'What role does the Civil Service play in government?',
        'explanation': 'The Civil Service is the permanent administrative machinery that implements the policies of the government in office. Its role is therefore administrative implementation, not political lawmaking or judicial review.',
        'keywords': ['civil_service_role', 'policy_implementation', 'public_administration', 'government']
    },
    'policy_constitution_038': {
        'question': 'What does due process require in public procurement?',
        'explanation': 'Due process in procurement requires compliance with procurement laws and established procedures so that the process remains fair, transparent, and value-driven. The correct option captures that legal and procedural discipline.',
        'keywords': ['due_process', 'public_procurement', 'procurement_law', 'transparency']
    },
    'policy_constitution_046': {
        'question': 'In a financial context, to remit money means to:',
        'explanation': 'To remit money means to send or pay money to another person or body. In financial usage, the verb refers to transferring funds as payment.',
        'keywords': ['remit', 'financial_term', 'transfer_funds', 'payment']
    },
    'policy_constitution_070': {
        'question': 'Which of the following is identified as a key ingredient of good governance in the introduction to Chapter 13?',
        'options': [
            'Communication to the various stakeholders as the occasion demands.',
            'Financial stability alone.',
            'Political power.',
            'A large bureaucracy.'
        ],
        'explanation': 'The introduction to Chapter 13 identifies communication with stakeholders, as circumstances require, as a key ingredient of good governance. The question therefore tests recognition of that governance principle.',
        'keywords': ['good_governance', 'stakeholder_communication', 'chapter_13', 'governance_principles']
    },
    'policy_constitution_076': {
        'question': 'What is the name of the registry where non-classified documents are kept?',
        'options': [
            'Central Registry.',
            'Open Registry.',
            'Classified Registry.',
            'Secret Registry.'
        ],
        'explanation': 'The Open Registry is where non-classified documents and correspondence are kept and processed. Secret or confidential registries are used for classified records instead.',
        'keywords': ['open_registry', 'non_classified_documents', 'records_management', 'civil_service_registry']
    },
    'policy_psr_001': {
        'question': 'What does the abbreviation PSR stand for?',
        'options': [
            'Public Service Rules.',
            'Public Sector Regulations.',
            'Public Service Regulations.',
            'Public Sector Rules.'
        ],
        'explanation': 'PSR stands for Public Service Rules. The abbreviation refers to the rules governing the employment relationship between public servants and government.',
        'keywords': ['psr', 'public_service_rules', 'abbreviation', 'public_service']
    },
    'policy_psr_007': {
        'question': 'In the Public Service Rules, what does emolument refer to?',
        'options': [
            'Basic salary only.',
            'Basic salary plus allowances.',
            'The entire compensation package.',
            'Pension benefits only.'
        ],
        'explanation': 'PSR 010105 defines emolument as basic salary plus authorized allowances. The correct option therefore includes salary together with approved allowances.',
        'keywords': ['emolument', 'psr_010105', 'salary_and_allowances', 'public_service_terms']
    },
    'policy_psr_008': {
        'question': 'In the Public Service Rules, what does grade level refer to?',
        'options': [
            'An officer\'s place in the hierarchy.',
            'Position in the salary structure.',
            'A measure of responsibility only.',
            'Years already spent in service.'
        ],
        'explanation': 'PSR 010105 defines grade level as an officer\'s position in the salary structure. It is not simply years of service or responsibility in the abstract.',
        'keywords': ['grade_level', 'psr_010105', 'salary_structure', 'public_service_terms']
    },
    'policy_psr_009': {
        'question': 'In the Public Service Rules, what does confirmation mean?',
        'options': [
            'Initial appointment into service.',
            'Successful completion of probation.',
            'Promotion to a higher grade.',
            'Transfer to another department.'
        ],
        'explanation': 'PSR 010105 defines confirmation as the successful completion of the probationary period. The correct option therefore links confirmation to probation, not promotion or transfer.',
        'keywords': ['confirmation', 'psr_010105', 'probation', 'public_service_terms']
    },
    'policy_psr_010': {
        'question': 'In the Public Service Rules, what does secondment mean?',
        'options': [
            'Temporary transfer to another organization.',
            'Permanent transfer.',
            'Promotion to a higher post.',
            'Reduction in rank.'
        ],
        'explanation': 'PSR 010105 defines secondment as a temporary transfer to another organization. The arrangement is temporary rather than permanent.',
        'keywords': ['secondment', 'psr_010105', 'temporary_transfer', 'public_service_terms']
    },
    'policy_psr_011': {
        'question': 'In the Public Service Rules, what is an acting appointment?',
        'options': [
            'Temporary performance of the duties of a higher post.',
            'Permanent appointment to a post.',
            'Appointment during probation only.',
            'A contract appointment.'
        ],
        'explanation': 'PSR 010105 describes an acting appointment as the temporary performance of the duties of a higher post. The correct option therefore reflects temporary higher-duty performance.',
        'keywords': ['acting_appointment', 'psr_010105', 'higher_duties', 'temporary_assignment']
    },
    'policy_psr_012': {
        'question': 'In the Public Service Rules, what is pensionable emolument?',
        'options': [
            'Salary used for pension calculation.',
            'The total salary package.',
            'Allowances only.',
            'Basic salary only.'
        ],
        'explanation': 'PSR 010105 defines pensionable emolument as the salary figure used for pension calculation. The question is therefore testing the pension-calculation basis, not total pay.',
        'keywords': ['pensionable_emolument', 'psr_010105', 'pension_calculation', 'public_service_terms']
    },
    'policy_psr_013': {
        'question': 'In the Public Service Rules, what does disciplinary control mean?',
        'options': [
            'Authority to discipline officers.',
            'Authority to promote officers.',
            'Authority to transfer officers.',
            'Authority to train officers.'
        ],
        'explanation': 'PSR 010105 defines disciplinary control as the authority to discipline officers. The item therefore tests the specific control power over discipline.',
        'keywords': ['disciplinary_control', 'psr_010105', 'authority_to_discipline', 'public_service_terms']
    },
    'policy_psr_014': {
        'question': 'In the Public Service Rules, what is an annual increment?',
        'options': [
            'A yearly salary increase.',
            'A promotion-related salary adjustment.',
            'An increase in allowances only.',
            'A bonus payment.'
        ],
        'explanation': 'PSR 010105 defines annual increment as a yearly salary increase within a grade level. It is not the same as a promotion increase or a bonus.',
        'keywords': ['annual_increment', 'psr_010105', 'yearly_salary_increase', 'grade_level']
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
print(f'Applied {changed} policy-analysis definition-alignment rewrites.')
