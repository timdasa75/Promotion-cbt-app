import json
from pathlib import Path

path = Path('data/general_current_affairs.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'PSIR_114': {
        'question': 'Under Financial Regulation 319, what is the maximum period for which a Provisional Development Fund General Warrant may authorize the withdrawal of money?',
        'options': ['Twelve months.', 'Three months.', 'Nine months.', 'Six months.'],
        'explanation': 'Financial Regulation 319 states that a Provisional Development Fund General Warrant may authorize the withdrawal of money for a period not exceeding six months. The item therefore tests the maximum duration allowed under the regulation.',
        'keywords': ['fr_319', 'provisional_development_fund', 'general_warrant', 'six_months']
    },
    'ca_general_010': {
        'question': "As of 2025, what is Nigeria's national minimum wage?",
        'options': ['N30,000.', 'N50,000.', 'N70,000.', 'N100,000.'],
        'correct': 2,
        'explanation': "Nigeria's national minimum wage was set at N70,000 under the National Minimum Wage (Amendment) Act, 2024, and that remained the benchmark in 2025. The item therefore tests the wage level in force during 2025.",
        'keywords': ['nigeria_minimum_wage', '2025_current_affairs', 'national_minimum_wage_act_2024', 'labour_policy']
    },
    'IRA_117': {
        'question': 'When an officer is seconded to the service of an approved international organization, what does that arrangement involve?',
        'explanation': 'Secondment is the temporary release of an officer to the service of another approved body or recognized international organization for a specified period. The item therefore tests the administrative meaning of secondment in service practice.',
        'keywords': ['secondment', 'international_organization', 'temporary_release', 'service_practice']
    },
    'NEKP_173': {
        'question': 'If an interdicted officer ignores instructions delivered to his address for seven days, how is the officer treated?',
        'options': ['Payment of a fine.', 'Temporary transfer.', 'Warning.', 'Regarded as absent from duty without leave.'],
        'explanation': 'If an interdicted officer fails to comply within seven days with instructions delivered to the stated address, the officer is regarded as absent from duty without leave. The item therefore tests the consequence of non-compliance during interdiction.',
        'keywords': ['interdiction', 'non_compliance', 'absence_without_leave', 'disciplinary_procedure']
    },
    'NGPD_010': {
        'question': 'What is the term for the temporary removal of an officer from normal duties on half salary while dismissal proceedings are being considered?',
        'explanation': 'Interdiction is the temporary removal of an officer from normal duties while disciplinary proceedings for dismissal are being undertaken, and the officer is placed on half salary. The item therefore tests recognition of the correct disciplinary term.',
        'keywords': ['interdiction', 'half_salary', 'disciplinary_proceedings', 'public_service_discipline']
    },
    'NGPD_050': {
        'question': 'What status applies if an interdicted officer fails to comply within seven days with instructions delivered to the recorded address?',
        'options': ['Warning.', 'Temporary transfer.', 'Payment of a fine.', 'Deemed absent from duty without leave.'],
        'explanation': 'An interdicted officer who fails to comply within seven days with instructions delivered to the stated address is deemed to be absent from duty without leave. The item therefore tests the status that follows non-compliance during interdiction.',
        'keywords': ['interdiction', 'seven_day_rule', 'absence_without_leave', 'disciplinary_status']
    },
    'NGPD_070': {
        'question': 'What is the minimum rank authorized to sign disbursement vouchers?',
        'options': ['Senior Executive Officer (Accounts) or Accountant I.', 'Head of Finance and Accounts.', 'Assistant Executive Officer (Accounts).', 'Accounting Officer.'],
        'explanation': 'Financial Regulation 411 states that officers authorized to sign payment vouchers must not be below the rank of Accountant I or Senior Executive Officer (Accounts). The item therefore tests the minimum authorized rank for signing disbursement vouchers.',
        'keywords': ['fr_411', 'disbursement_vouchers', 'accountant_i', 'senior_executive_officer_accounts']
    },
    'PSIR_123': {
        'question': 'Under Financial Regulation 123(i)(p), how many days does a public officer have to reply to formal queries or other enquiries from the Accountant-General or Auditor-General?',
        'options': ['21 days.', '14 days.', '7 days.', '30 days.'],
        'explanation': 'Financial Regulation 123(i)(p) requires a public officer to reply within twenty-one days to formal queries or other enquiries from the Accountant-General or Auditor-General. The item therefore tests the response period fixed by the regulation.',
        'keywords': ['fr_123_i_p', 'formal_queries', 'accountant_general', 'auditor_general']
    }
}
changed = set()

def walk(obj):
    if isinstance(obj, dict):
        qid = obj.get('id')
        if qid in updates:
            obj.update(updates[qid])
            changed.add(qid)
        for value in obj.values():
            walk(value)
    elif isinstance(obj, list):
        for value in obj:
            walk(value)

walk(data)
expected = set(updates)
if changed != expected:
    missing = sorted(expected - changed)
    extra = sorted(changed - expected)
    raise RuntimeError(f'Changed {len(changed)} items; missing={missing}; extra={extra}')
path.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
print(f'Applied {len(changed)} general current affairs definition-alignment rewrites.')
