import json
from pathlib import Path

path = Path('data/psr_rules.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'psr_app_022': {
        'question': 'Which PSR rule defines posting as the initial assignment or reassignment of an officer to a job schedule?',
        'explanation': 'PSR 020601 defines posting as the initial assignment or reassignment of an officer to a position or job schedule. The item is therefore testing recognition of the specific rule reference.',
        'keywords': ['posting', 'psr_020601', 'rule_reference', 'assignment_reassignment']
    },
    'psr_disc_052': {
        'question': 'What consequence follows if a public officer is found to be a member of a secret society?',
        'options': [
            'Immediate suspension.',
            'Demotion.',
            'A written warning.',
            'Serious misconduct leading to dismissal.'
        ],
        'explanation': 'Rule 020212 states that contravention of Rule 020211 on membership of a secret society must be regarded as an act of serious misconduct, which may include dismissal from the service. The consequence being tested is therefore serious misconduct leading to dismissal.',
        'keywords': ['secret_society', 'psr_020212', 'serious_misconduct', 'dismissal']
    },
    'psr_allow_063': {
        'question': 'What is the maximum duration of an acting appointment under Rule 020705?',
        'options': [
            'One year.',
            'Six months.',
            'One month.',
            'Two years.'
        ],
        'explanation': 'Rule 020705 provides that an acting appointment must not exceed one year, although in exceptional circumstances it may be extended for another year. The maximum period stated in the rule is therefore one year in the first instance.',
        'keywords': ['acting_appointment', 'psr_020705', 'maximum_duration', 'one_year']
    },
    'psr_interp_009': {
        'question': 'Under PSR 180109, what does the Commission\'s power include?',
        'explanation': 'PSR 180109 provides that the Commission exercises powers over the appointment, promotion, and discipline of officers. The correct option therefore states those three core powers.',
        'keywords': ['commission_power', 'psr_180109', 'appointment_promotion_discipline', 'rule_reference']
    },
    'psr_interp_015': {
        'question': 'Under PSR 180115, what is a temporary appointment?',
        'explanation': 'PSR 180115 describes a temporary appointment as employment without pension rights until the officer is confirmed. The correct option states that defining feature.',
        'keywords': ['temporary_appointment', 'psr_180115', 'no_pension_rights', 'confirmation']
    },
    'psr_interp_022': {
        'question': 'Under PSR 180122, what is probation?',
        'explanation': 'PSR 180122 describes probation as a temporary period during which an officer is assessed before confirmation of appointment. The correct option matches that assessment period.',
        'keywords': ['probation', 'psr_180122', 'assessment_period', 'confirmation']
    },
    'psr_interp_026': {
        'question': 'Under PSR 180126, what is posting?',
        'explanation': 'PSR 180126 defines posting as the formal assignment of an officer to a new duty station or position within the Service. The correct option states that assignment meaning directly.',
        'keywords': ['posting', 'psr_180126', 'duty_station', 'formal_assignment']
    },
    'psr_interp_029': {
        'question': 'Under PSR 180129, what is an acting appointment?',
        'explanation': 'PSR 180129 defines an acting appointment as a temporary assignment to perform the duties of a higher office pending substantive appointment. The correct option captures that temporary higher-duty arrangement.',
        'keywords': ['acting_appointment', 'psr_180129', 'temporary_assignment', 'higher_office']
    },
    'psr_interp_030': {
        'question': 'Under PSR 180130, what is leave?',
        'explanation': 'PSR 180130 defines leave as a temporary absence from duty that has been officially approved for a stated period. The correct option therefore describes approved temporary absence.',
        'keywords': ['leave', 'psr_180130', 'approved_absence', 'temporary_absence']
    },
    'psr_interp_035': {
        'question': 'Under PSR 180135, what is termination?',
        'explanation': 'PSR 180135 defines termination as the disengagement of an officer for reasons other than discipline. The correct option reflects that administrative, non-disciplinary end of appointment.',
        'keywords': ['termination', 'psr_180135', 'disengagement', 'non_disciplinary']
    },
    'psr_docx_168': {
        'question': 'What is the ethical implication of using government property for personal use?',
        'explanation': 'Using government property for personal purposes amounts to a breach of the Code of Conduct because public assets are meant to be used only for official purposes. The question is therefore testing recognition of that ethical breach.',
        'keywords': ['government_property', 'personal_use', 'code_of_conduct', 'ethical_breach']
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
print(f'Applied {changed} PSR definition-alignment rewrites.')
