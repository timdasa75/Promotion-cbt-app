import json
from pathlib import Path

path = Path('data/civil_service_ethics.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'csh_sdg_057': {
        'question': 'What is a key role of a supervisor in a registry?',
        'options': [
            'To prevent any staff member from leaving the office.',
            'To do all the work personally.',
            'To enforce discipline with justice and fairness at all times.',
            'To allow staff to do as they please.'
        ],
        'explanation': 'A key role of a registry supervisor is to enforce discipline with justice and fairness at all times. The item therefore tests the supervisory standard expected in managing registry staff and workflow.',
        'keywords': ['registry_supervisor', 'discipline', 'justice_and_fairness', 'registry_workflow']
    },
    'csh_sdg_058': {
        'question': 'Which conduct is treated as a very serious offense for a civil servant?',
        'options': [
            'Arriving late to a meeting.',
            'Taking a day off.',
            'Unauthorized disclosure of information acquired in the course of duty.',
            'Talking to a colleague.'
        ],
        'explanation': 'Unauthorized disclosure of information acquired in the course of duty is treated as a very serious offense for a civil servant. The question therefore tests recognition of a grave breach of official trust and confidentiality.',
        'keywords': ['serious_offense', 'unauthorized_disclosure', 'official_confidentiality', 'civil_service_discipline']
    },
    'csh_sdg_059': {
        'question': 'What kind of conduct is considered a very serious offense in the Civil Service?',
        'options': [
            'Taking a day off.',
            'Unauthorized disclosure of information acquired in the course of duty.',
            'Talking to a colleague.',
            'Arriving late to a meeting.'
        ],
        'explanation': 'Unauthorized disclosure of information acquired in the course of duty is considered a very serious offense in the Civil Service. The item therefore tests the seriousness attached to breaching official confidentiality.',
        'keywords': ['civil_service_offense', 'official_information', 'confidentiality_breach', 'disciplinary_gravity']
    },
    'csh_sdg_065': {
        'question': 'Appeals against promotion decisions under the PSR must be considered with reference to guidelines issued by which body?',
        'explanation': 'Appeals against promotion decisions must be considered with reference to the guidelines issued by the Federal Civil Service Commission. The item therefore tests the authority whose guidance governs that review process.',
        'keywords': ['promotion_appeals', 'federal_civil_service_commission', 'psr_guidelines', 'promotion_review']
    },
    'csh_sdg_066': {
        'question': 'Which PSR rule prohibits seeking the influence of prominent persons to gain appointment, transfer, promotion, or posting?',
        'explanation': 'Rule 100427 prohibits seeking the influence of prominent persons in order to gain appointment, transfer, promotion, or posting. The item therefore tests recognition of the specific rule reference for that prohibition.',
        'keywords': ['psr_100427', 'improper_influence', 'appointment_and_posting', 'public_service_ethics']
    },
    'csh_sdg_067': {
        'question': 'Which chapter of the Civil Service Handbook emphasizes service delivery as the core of civil service responsibilities?',
        'explanation': 'Chapter 4 of the Civil Service Handbook emphasizes service delivery as the core of civil service responsibilities. The question therefore tests the handbook chapter associated with that service standard.',
        'keywords': ['civil_service_handbook', 'chapter_4', 'service_delivery', 'public_service_responsibilities']
    },
    'csh_sdg_070': {
        'question': 'Which action best demonstrates sound risk management in service delivery and grievance handling?',
        'explanation': 'Sound risk management in service delivery and grievance handling requires identifying control gaps early and escalating material exceptions promptly. That approach helps prevent small failures from becoming larger service or grievance problems.',
        'keywords': ['service_delivery', 'grievance_handling', 'risk_management', 'control_gaps']
    },
    'csh_sdg_072': {
        'question': 'Which practice should an accountable officer prioritize to sustain compliance in service delivery and grievance work?',
        'explanation': 'An accountable officer sustains compliance by using lawful criteria and documenting each decision step transparently. That makes the process easier to review and helps show that service or grievance decisions were reached properly.',
        'keywords': ['service_delivery_compliance', 'grievance_compliance', 'lawful_criteria', 'transparent_decisions']
    },
    'csh_sdg_073': {
        'question': 'Under Rule 020606, an officer may seek redress over posting instructions if the decision is believed to violate what?',
        'explanation': 'Rule 020606 allows an officer to seek redress over posting instructions if the officer believes the decision violates the provisions of extant rules. The item therefore tests the standard against which a posting grievance may be raised.',
        'keywords': ['rule_020606', 'posting_grievance', 'extant_rules', 'redress']
    },
    'csh_sdg_074': {
        'question': 'What does the Civil Service Handbook require document-keeping to guarantee?',
        'explanation': 'The Civil Service Handbook treats document-keeping as a means of guaranteeing accountability, transparency, and continuity in civil service operations. The item therefore tests the main institutional purpose of proper records management.',
        'keywords': ['document_keeping', 'accountability', 'transparency', 'continuity']
    },
    'csh_sdg_075': {
        'question': 'Which behavior is regarded as a very serious offense for a civil servant?',
        'options': [
            'Taking a day off.',
            'Arriving late to a meeting.',
            'Talking to a colleague.',
            'Unauthorized disclosure of information acquired in the course of duty.'
        ],
        'explanation': 'Unauthorized disclosure of information acquired in the course of duty is regarded as a very serious offense for a civil servant. The item therefore tests a serious breach of official trust from a service-delivery and grievance perspective.',
        'keywords': ['serious_offense', 'unauthorized_disclosure', 'official_trust', 'service_discipline']
    },
    'eth_anti_corruption_gen_077': {
        'question': 'Which Nigerian agency is mandated to promote ethical values in the public service?',
        'explanation': 'The Code of Conduct Bureau is the Nigerian agency mandated to promote ethical values in the public service. The item therefore tests recognition of the institution specifically associated with public-service ethical standards.',
        'keywords': ['code_of_conduct_bureau', 'ethical_values', 'public_service_ethics', 'nigerian_agencies']
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
print(f'Applied {changed} weak-framing rewrites in civil-service-admin round 55.')
