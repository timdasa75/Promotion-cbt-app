import json
from pathlib import Path

path = Path('data/psr_rules.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'circ_appointments_tenure_discipline_gen_074': {
        'question': 'What is the consequence if an officer negligently disregards Regulation 719 when accepting a cheque that is later dishonoured?',
        'options': [
            'A formal warning.',
            'Referral to the Auditor-General.',
            'Suspension of duties.',
            'Surcharge for the full amount.'
        ],
        'explanation': 'Financial Regulation 731 provides that an officer who negligently disregards Regulation 719 when accepting a cheque that is later dishonoured must be surcharged for the full amount. The rule therefore makes surcharge, not a warning or suspension, the stated consequence.',
        'keywords': ['dishonoured_cheque', 'financial_regulation_731', 'surcharge', 'regulation_719']
    },
    'circ_appointments_tenure_discipline_gen_076': {
        'question': 'How long must a deposit remain unclaimed before it is transferred to revenue?',
        'options': [
            'Three years.',
            'Two years.',
            'Six months.',
            'One year.'
        ],
        'explanation': 'Financial Regulation 1311 states that money left on deposit for more than three years is to be transferred to revenue. The period being tested is therefore three years.',
        'keywords': ['unclaimed_deposit', 'financial_regulation_1311', 'transfer_to_revenue', 'three_years']
    },
    'circ_appointments_tenure_discipline_gen_081': {
        'question': 'What consequence may follow if an Accounting Officer fails to appear before the Public Accounts Committee when summoned?',
        'options': [
            "A penalty of two years' imprisonment.",
            'Suspension from duty.',
            'The committee may recommend sanctions, including dismissal.',
            'A simple warning.'
        ],
        'explanation': 'Failure of an Accounting Officer to appear before the Public Accounts Committee when summoned is treated as a serious matter. The committee may therefore recommend sanctions, including dismissal.',
        'keywords': ['public_accounts_committee', 'accounting_officer', 'committee_sanctions', 'dismissal']
    },
    'circ_appointments_tenure_discipline_gen_084': {
        'question': 'What probation period applies to an officer newly appointed to the service under Rule 020301?',
        'options': [
            'Not less than six months and not more than two years.',
            'Three years.',
            'Two years only.',
            'One year.'
        ],
        'explanation': 'Rule 020301 provides that an officer on probation serves for two years, but the period may be reduced to not less than six months or extended up to two years. The option that captures the permissible probation range is therefore the correct one.',
        'keywords': ['probation_period', 'psr_020301', 'new_appointment', 'probation_range']
    },
    'circ_leave_welfare_allowances_gen_069': {
        'question': 'What is the mandatory training period for newly appointed Foreign Service Officers at the Foreign Service Academy?',
        'options': [
            'One year.',
            'Three months.',
            'Two years.',
            'Six months.'
        ],
        'explanation': 'Newly appointed Foreign Service Officers must undergo a mandatory one-year course in diplomatic practice at the Foreign Service Academy. The required training period is therefore one year.',
        'keywords': ['foreign_service_academy', 'foreign_service_officers', 'mandatory_training', 'one_year']
    },
    'circ_leave_welfare_allowances_gen_071': {
        'question': 'What notice period applies when an officer relinquishes an appointment during probation?',
        'options': [
            "One month's notice or one month's salary in lieu of notice.",
            'Three months.',
            'Two weeks.',
            'One month only with no payment in lieu.'
        ],
        'explanation': 'Rule 020902 allows an officer on probation to relinquish the appointment by giving one month\'s notice or by paying one month\'s salary in lieu of notice. That full rule statement is what the item is testing.',
        'keywords': ['probationary_relinquishment', 'psr_020902', 'notice_period', 'salary_in_lieu']
    },
    'circ_leave_welfare_allowances_gen_076': {
        'question': 'What duty does Rule 010103 place on every officer regarding the Public Service Rules and other extant regulations and circulars?',
        'explanation': 'Rule 010103 states that every officer has a duty to acquaint himself with the Public Service Rules and other extant regulations and circulars. The item therefore tests that personal duty of familiarization.',
        'keywords': ['psr_010103', 'officer_duty', 'regulations_and_circulars', 'acquaint_himself']
    },
    'circ_leave_welfare_allowances_gen_082': {
        'question': 'What duty do Sub-Accounting Officers have regarding receipt and licence books?',
        'options': [
            'To ensure their safe custody and proper use.',
            'To leave them unsecured.',
            'To print their own replacements.',
            'To dispose of them after use.'
        ],
        'explanation': 'Financial Regulation 1130 places Sub-Accounting Officers in charge of the safe custody and proper use of all receipt and licence books issued to them. The duty being tested is therefore custody and proper use.',
        'keywords': ['sub_accounting_officers', 'financial_regulation_1130', 'receipt_books', 'licence_books']
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
