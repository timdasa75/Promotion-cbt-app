from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'data' / 'civil_service_ethics.json'

UPDATES = {
    'csh_principle_054': {
        'question': 'What is the principal accountability of the Executive arm of Government?',
        'options': [
            'Law making and confirmation of appointments.',
            'Adjudication of disputes.',
            'Monitoring revenue accruals only.',
            'Day-to-day management of government, including policy formulation and execution.'
        ],
        'explanation': 'The Executive is accountable for the day-to-day management of government and for formulating, executing, and monitoring policies, programmes, and projects.',
        'keywords': ['executive_arm', 'government_management', 'policy_execution', 'accountability'],
        'tags': ['civil_service_admin', 'csh_principles_ethics', 'executive_arm', 'government_management', 'policy_execution', 'accountability'],
    },
    'csh_principle_061': {
        'question': 'Who is primarily responsible for discrepancies in financial records within a self-accounting unit?',
        'explanation': 'The Accounting Officer bears primary responsibility for discrepancies in a self-accounting unit because that officer controls the records and internal checks for the unit.',
        'keywords': ['accounting_officer', 'self_accounting_unit', 'financial_records', 'accountability'],
        'tags': ['civil_service_admin', 'csh_principles_ethics', 'accounting_officer', 'self_accounting_unit', 'financial_records', 'accountability'],
    },
    'csh_principle_066': {
        'question': 'Which of the following is not one of the attributes civil servants should possess for quality service delivery?',
        'options': [
            'Be efficient and loyal.',
            'Be willing to accept bribes.',
            'Be punctual and dedicated.',
            'Be polite and cheerful.'
        ],
        'explanation': 'Accepting bribes is a corrupt act, not a service-delivery attribute. The handbook instead emphasizes qualities such as punctuality, politeness, cheerfulness, efficiency, and loyalty.',
        'keywords': ['service_delivery', 'civil_service_attributes', 'anti_bribery', 'integrity'],
        'tags': ['civil_service_admin', 'csh_principles_ethics', 'service_delivery', 'civil_service_attributes', 'anti_bribery', 'integrity'],
    },
    'csh_pt_060': {
        'options': [
            'Only financial management systems.',
            'Only disciplinary procedures.',
            'International diplomatic protocols.',
            'Performance Management System, Talent Sourcing, Volunteerism, and Virtual Meetings or Engagements.'
        ],
        'explanation': 'The 2021 Public Service Rules reflect emerging issues such as performance management systems, talent sourcing, volunteerism, and virtual meetings or engagements.',
        'keywords': ['psr_2021', 'emerging_issues', 'performance_management_system', 'virtual_meetings'],
        'tags': ['civil_service_admin', 'csh_performance_training', 'psr_2021', 'emerging_issues', 'performance_management_system', 'virtual_meetings'],
    },
    'csh_pt_068': {
        'question': 'Which body has the constitutional power to appoint persons to offices in the Federal Civil Service and exercise disciplinary control over them?',
        'options': [
            'The Federal Civil Service Commission (FCSC).',
            'The Office of the Head of the Civil Service of the Federation (OHCSF).',
            'The National Council on Establishments (NCE).',
            'The President.'
        ],
        'explanation': 'The Federal Civil Service Commission is the constitutional body empowered to appoint persons to offices in the Federal Civil Service and exercise disciplinary control over them.',
        'keywords': ['fcsc', 'constitutional_power', 'appointments', 'discipline'],
        'tags': ['civil_service_admin', 'csh_performance_training', 'fcsc', 'constitutional_power', 'appointments', 'discipline'],
    },
    'csh_pt_071': {
        'question': 'Which attribute listed in the handbook directly supports quality service delivery?',
        'options': [
            'Be punctual and dedicated.',
            'Be willing to accept bribes.',
            'Ignore official guidance.',
            'Delay assigned duties without explanation.'
        ],
        'correct': 0,
        'explanation': 'The handbook links quality service delivery with positive attributes such as punctuality and dedication, not bribery, neglect, or delay.',
        'keywords': ['service_delivery', 'positive_attributes', 'punctuality', 'dedication'],
        'tags': ['civil_service_admin', 'csh_performance_training', 'service_delivery', 'positive_attributes', 'punctuality', 'dedication'],
    },
    'csh_it_053': {
        'options': [
            'To conduct external audits of the ministry.',
            'To directly disburse all public funds.',
            'To approve all government contracts.',
            'To ensure staff comply with the Financial Regulations and the Accounting Code.'
        ],
        'explanation': 'One duty of the Head of Finance and Accounts is to ensure that staff comply with the Financial Regulations and the Accounting Code.',
        'keywords': ['head_of_finance_and_accounts', 'financial_regulations', 'accounting_code', 'staff_compliance'],
        'tags': ['civil_service_admin', 'csh_innovation_technology', 'head_of_finance_and_accounts', 'financial_regulations', 'accounting_code', 'staff_compliance'],
    },
    'eth_anti_corruption_gen_067': {
        'question': 'What quarterly vehicle returns must each Ministry, Extra-Ministerial Office, or other arm of government submit?',
        'explanation': 'Quarterly returns must cover all vehicles, including mileage covered, quantity of fuel consumed, and cost of repairs, so vehicle use can be monitored transparently.',
        'keywords': ['quarterly_returns', 'government_vehicles', 'fuel_consumption', 'repair_costs'],
        'tags': ['civil_service_admin', 'eth_anti_corruption', 'quarterly_returns', 'government_vehicles', 'fuel_consumption', 'repair_costs'],
    },
    'eth_anti_corruption_gen_074': {
        'question': 'Which practice best supports performance management in anti-corruption work?',
        'explanation': 'Objective indicators and structured feedback cycles support performance management because they make anti-corruption work reviewable and measurable over time.',
        'keywords': ['anti_corruption', 'performance_management', 'objective_indicators', 'structured_feedback'],
        'tags': ['civil_service_admin', 'eth_anti_corruption', 'performance_management', 'objective_indicators', 'structured_feedback', 'anti_corruption'],
    },
    'eth_code_conduct_gen_082': {
        'question': 'Which action best demonstrates anti-corruption safeguards under the Code of Conduct and Ethical Principles?',
        'options': [
            'Treat exceptions as routine without documented justification.',
            'Close cases without validating facts or required records.',
            'Escalate suspicious practices through proper reporting channels.',
            'Delay decisions until issues escalate into avoidable crises.'
        ],
        'explanation': 'Anti-corruption safeguards are demonstrated when suspicious practices are escalated through proper reporting channels instead of being ignored or normalized.',
        'keywords': ['code_of_conduct', 'anti_corruption', 'reporting_channels', 'suspicious_practices'],
        'tags': ['civil_service_admin', 'eth_code_conduct', 'code_of_conduct', 'anti_corruption', 'reporting_channels', 'suspicious_practices'],
    },
    'eth_general_gen_083': {
        'question': 'What does Schemes of Service refer to in the public service?',
        'explanation': 'Schemes of Service is the reference document that states the duties of each post, the method of entry, qualification requirements, and the prerequisites for advancement within and beyond cadres.',
        'keywords': ['schemes_of_service', 'public_service_reference', 'qualification_requirements', 'career_progression'],
        'tags': ['civil_service_admin', 'eth_general', 'schemes_of_service', 'public_service_reference', 'qualification_requirements', 'career_progression'],
    },
    'eth_general_gen_091': {
        'question': 'What is a key characteristic of a good minute?',
        'options': [
            'It should only be written by senior officers.',
            'It should be verbose and include all personal thoughts.',
            'It should be brief, factual, and free from grammatical errors.',
            'It should be written in a conversational tone.'
        ],
        'explanation': 'A good minute should be brief, factual, well reasoned, and free from grammatical errors, spelling mistakes, and ambiguity.',
        'keywords': ['good_minute', 'minute_writing', 'brevity', 'factual_accuracy'],
        'tags': ['civil_service_admin', 'eth_general', 'good_minute', 'minute_writing', 'brevity', 'factual_accuracy'],
    },
    'ethics_092': {
        'question': 'Can an officer with delegated expenditure control sub-delegate that duty?',
        'options': [
            'Only for minor expenses.',
            'Yes, freely.',
            'Yes, but only with the knowledge and approval of the officer controlling the vote.',
            'No, never.'
        ],
        'correct': 2,
        'explanation': 'Delegated expenditure control may only be sub-delegated with the knowledge and approval of the officer controlling the vote; it is not a free or automatic power.',
        'keywords': ['delegated_expenditure_control', 'sub_delegation', 'approval_requirement', 'vote_control'],
        'tags': ['civil_service_admin', 'eth_values_integrity', 'delegated_expenditure_control', 'sub_delegation', 'approval_requirement', 'vote_control'],
    },
}


def iter_questions(node: dict):
    for sub in node.get('subcategories', []):
        for question in sub.get('questions', []):
            if isinstance(question, dict):
                yield question


def main() -> None:
    data = json.loads(PATH.read_text(encoding='utf-8'))
    seen = set()
    for question in iter_questions(data):
        qid = str(question.get('id') or '').strip()
        if qid not in UPDATES:
            continue
        patch = UPDATES[qid]
        for key, value in patch.items():
            question[key] = value
        seen.add(qid)
    missing = sorted(set(UPDATES) - seen)
    if missing:
        raise SystemExit(f'Missing ids: {missing}')
    PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print('Updated residual civil_service_admin follow-up items')


if __name__ == '__main__':
    main()
