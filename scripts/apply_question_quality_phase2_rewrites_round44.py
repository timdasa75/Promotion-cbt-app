import json
from pathlib import Path

path = Path('data/policy_analysis.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'policy_psr_016': {
        'question': 'In PSR usage, what period counts as the leave year?',
        'options': [
            'The calendar year.',
            'The financial year.',
            'The period from 1 January to 31 December.',
            'The year counted from an officer\'s date of appointment.'
        ],
        'explanation': 'PSR 010105 defines the leave year as the period from 1 January to 31 December. The correct option therefore states the full January-to-December period rather than a vague reference to a calendar year.',
        'keywords': ['leave_year', 'psr_010105', 'january_to_december', 'public_service_terms']
    },
    'policy_psr_017': {
        'question': 'In PSR usage, who is a public officer?',
        'options': [
            'An elected official only.',
            'An appointed official only.',
            'A person holding or acting in a public office.',
            'Any person employed by government in any capacity.'
        ],
        'explanation': 'PSR 010105 defines a public officer as a person holding or acting in a public office. The correct option therefore focuses on the office held or acted in, not merely election, appointment, or broad employment status.',
        'keywords': ['public_officer', 'psr_010105', 'public_office', 'public_service_terms']
    },
    'policy_psr_018': {
        'question': 'In PSR usage, what is an approved establishment?',
        'options': [
            'The list of posts approved for a ministry or department.',
            'The list of approved officers in a ministry.',
            'The list of approved salary scales.',
            'The list of approved allowances.'
        ],
        'explanation': 'PSR 010105 defines approved establishment as the list of posts approved for a ministry or department. The term refers to authorized positions, not a list of people, salaries, or allowances.',
        'keywords': ['approved_establishment', 'psr_010105', 'approved_posts', 'ministry_department']
    },
    'policy_psr_019': {
        'question': 'In PSR usage, what is notional promotion?',
        'options': [
            'An actual promotion with full change of duties.',
            'A promotion granted for salary purposes only.',
            'A promotion granted for status only.',
            'A promotion granted for allowance purposes only.'
        ],
        'explanation': 'PSR 010105 defines notional promotion as promotion granted for salary purposes without a corresponding change in duties. The correct option therefore captures the salary-purpose element.',
        'keywords': ['notional_promotion', 'psr_010105', 'salary_purposes', 'public_service_terms']
    },
    'policy_psr_020': {
        'question': 'In PSR usage, what is terminal leave?',
        'options': [
            'Leave granted before retirement.',
            'Leave taken after retirement.',
            'Leave taken during ordinary service.',
            'Leave taken before resignation only.'
        ],
        'explanation': 'PSR 010105 defines terminal leave as leave granted before retirement or termination of service. The best match is therefore the option that identifies it as pre-retirement leave.',
        'keywords': ['terminal_leave', 'psr_010105', 'pre_retirement_leave', 'public_service_terms']
    },
    'policy_psr_061': {
        'question': 'How often must the Mechanical Engineer verify and certify fuel and lubricants consumption?',
        'options': [
            'Monthly.',
            'Daily.',
            'Weekly.',
            'Annually.'
        ],
        'explanation': 'Financial Regulation 2008 requires the Mechanical Engineer to verify and certify fuel and lubricants consumption every month. The frequency being tested is therefore monthly.',
        'keywords': ['mechanical_engineer', 'fuel_consumption', 'lubricants', 'monthly_certification']
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
