import json
from pathlib import Path

path = Path('data/psr_rules.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'psr_app_022': {
        'question': 'Which PSR rule sets out posting as the initial assignment or reassignment of an officer to a job schedule?',
        'explanation': 'PSR 020601 sets out posting as the initial assignment or reassignment of an officer to a position or job schedule. The item therefore tests identification of the correct rule reference.',
        'keywords': ['posting', 'psr_020601', 'rule_reference', 'job_schedule']
    },
    'psr_leave_003': {
        'question': 'What period counts as the leave year in the Federal Public Service?',
        'explanation': 'PSR 120102 states that the leave year begins on 1 January and ends on 31 December. The correct option therefore covers the January-to-December period.',
        'keywords': ['leave_year', 'psr_120102', 'january_to_december', 'annual_cycle']
    },
    'psr_leave_057': {
        'question': 'What is the minimum age for eligibility for appointment into the Federal Public Service?',
        'options': [
            'Not less than 16 years.',
            'Not less than 18 years.',
            'Not less than 25 years.',
            'Not less than 21 years.'
        ],
        'explanation': 'Rule 020206(a) provides that an applicant must be not less than 18 years and not more than 50 years of age to be eligible for appointment. The minimum age being tested is therefore 18 years.',
        'keywords': ['minimum_age', 'psr_020206', 'eligibility_for_appointment', 'federal_public_service']
    },
    'psr_med_063': {
        'question': 'What is the maximum total duration of a contract appointment under Rule 020406(vi)?',
        'options': [
            'Five years.',
            'Two years.',
            'Four years.',
            'One year.'
        ],
        'explanation': 'Rule 020406(vi) states that a contract appointment may be for one or two years and may be renewed, but it must not exceed four years in total. The maximum total duration is therefore four years.',
        'keywords': ['contract_appointment', 'psr_020406', 'maximum_duration', 'four_years']
    },
    'psr_med_070': {
        'question': 'How many years must an officer on GL 06 and below spend on a post before being considered for promotion?',
        'options': [
            'Two years.',
            'Three years.',
            'Four years.',
            'One year.'
        ],
        'explanation': 'Rule 020802(c) states that an officer on GL 06 and below must spend a minimum of two years on a post before being considered for promotion. The period being tested is therefore two years.',
        'keywords': ['promotion_eligibility', 'gl_06_and_below', 'psr_020802', 'two_years']
    },
    'psr_train_066': {
        'question': 'What is the pass mark for each subject in the compulsory confirmation or promotion examination for junior officers?',
        'options': [
            '75%.',
            '60%.',
            '40%.',
            '50%.'
        ],
        'explanation': 'The compulsory confirmation or promotion examination for junior officers requires a pass mark of 50 percent in each subject. The item therefore tests recognition of that pass mark.',
        'keywords': ['junior_officers_exam', 'pass_mark', 'confirmation_promotion_exam', 'fifty_percent']
    },
    'psr_interp_040': {
        'question': 'Under PSR 180140, what is an establishment circular?',
        'explanation': 'PSR 180140 describes an establishment circular as an official directive issued by the Office of the Head of Civil Service of the Federation. The correct option states that official-directive meaning.',
        'keywords': ['establishment_circular', 'psr_180140', 'official_directive', 'head_of_service']
    },
    'circ_personnel_performance_gen_077': {
        'question': 'How many sittings is an officer allowed for the compulsory confirmation examination?',
        'options': [
            'Three sittings.',
            'Four sittings.',
            'Five sittings.',
            'Two sittings.'
        ],
        'explanation': 'The rule for the compulsory confirmation examination allows an officer a maximum of three sittings. The item therefore tests the permitted number of attempts, not the definition of the examination itself.',
        'keywords': ['confirmation_examination', 'maximum_sittings', 'three_attempts', 'personnel_performance']
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
