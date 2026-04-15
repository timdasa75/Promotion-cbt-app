from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'data' / 'general_current_affairs.json'

FACTUAL_UPDATES = {
    'ca_general_004': {
        'question': 'As of 2025, who was the President of Nigeria?',
        'keywords': ['president of nigeria', 'bola ahmed tinubu', '2025', 'federal executive'],
        'tags': ['current_affairs', 'general_knowledge', 'ca_general', 'president_of_nigeria', 'bola_ahmed_tinubu', 'federal_executive'],
    },
    'ca_general_043': {
        'question': 'As of 2025, who was the Speaker of the House of Representatives?',
        'keywords': ['speaker of the house of representatives', 'tajudeen abbas', '2025', 'national assembly'],
        'tags': ['current_affairs', 'general_knowledge', 'ca_general', 'speaker_of_house_of_representatives', 'tajudeen_abbas', 'national_assembly'],
    },
    'ca_general_051': {
        'question': "Who heads the Federal Government in Nigeria's presidential system?",
        'options': [
            'The President, Commander-in-Chief of the Armed Forces.',
            'The President of the Senate.',
            'The Chief Justice of Nigeria.',
            'The Speaker of the House of Representatives.',
        ],
        'keywords': ['presidential system', 'federal government', 'president', 'commander in chief'],
        'tags': ['current_affairs', 'general_knowledge', 'ca_general', 'presidential_system', 'federal_government', 'president'],
    },
    'ca_general_052': {
        'keywords': ['senate', 'president of the senate', 'federal legislature', 'national assembly'],
        'tags': ['current_affairs', 'general_knowledge', 'ca_general', 'senate', 'president_of_the_senate', 'national_assembly'],
    },
    'ca_general_053': {
        'question': 'Who heads the Judiciary at the federal level?',
        'options': [
            'The President, Commander-in-Chief.',
            'The Speaker of the House of Representatives.',
            'The President of the Senate.',
            'The Chief Justice of Nigeria.',
        ],
        'keywords': ['judiciary', 'federal level', 'chief justice of nigeria', 'separation of powers'],
        'tags': ['current_affairs', 'general_knowledge', 'ca_general', 'judiciary', 'chief_justice_of_nigeria', 'federal_level'],
    },
    'ca_general_054': {
        'question': 'When a cheque is received for government business, how should it be made payable?',
        'options': [
            "To the payee's name.",
            'To Federal Government of Nigeria.',
            'To the specific ministry or department.',
            'To the Accountant-General.',
        ],
        'keywords': ['cheque', 'government business', 'federal government of nigeria', 'payee instruction'],
        'tags': ['current_affairs', 'general_knowledge', 'ca_general', 'cheque_payee', 'federal_government_of_nigeria', 'financial_procedure'],
    },
    'ca_general_055': {
        'question': 'Which body is responsible for the printing of all Treasury and other receipt and licence books?',
        'options': [
            'The Accountant-General.',
            'The Ministry of Finance.',
            'The Central Bank of Nigeria.',
            'The Federal Government Printer.',
        ],
        'keywords': ['treasury books', 'receipt books', 'licence books', 'ministry of finance'],
        'tags': ['current_affairs', 'general_knowledge', 'ca_general', 'treasury_books', 'receipt_and_licence_books', 'ministry_of_finance'],
    },
    'ca_general_057': {
        'keywords': ['auditor-general', 'accounts of the federation', 'national assembly', 'public accountability'],
        'tags': ['current_affairs', 'general_knowledge', 'ca_general', 'auditor_general', 'accounts_of_the_federation', 'national_assembly'],
    },
    'ca_general_058': {
        'question': 'What was the traditional public perception of the Civil Service in Nigeria?',
        'options': [
            'It was considered a less desirable career path than the private sector.',
            'It was a place for political patronage and incompetence.',
            'It was seen as an inefficient and corrupt body.',
            'It attracted the very best talent and enjoyed high recognition and respect.',
        ],
        'keywords': ['civil service perception', 'nigeria', 'public respect', 'career prestige'],
        'tags': ['current_affairs', 'general_knowledge', 'ca_general', 'civil_service_perception', 'public_respect', 'nigeria'],
    },
    'ca_general_059': {
        'keywords': ['provisional general warrant', 'accountant-general', 'government finance', 'warrant procedure'],
        'tags': ['current_affairs', 'general_knowledge', 'ca_general', 'provisional_general_warrant', 'accountant_general', 'government_finance'],
    },
    'ca_general_060': {
        'keywords': ['supplementary provision', 'minister of finance', 'budget application', 'financial regulation'],
        'tags': ['current_affairs', 'general_knowledge', 'ca_general', 'supplementary_provision', 'minister_of_finance', 'budget_application'],
    },
    'ca_general_061': {
        'question': 'Which office has full authority to direct matters relating to the finance and accounting affairs of the Federation that are not assigned by law to another Minister?',
        'keywords': ['minister of finance', 'finance and accounting affairs', 'federation', 'ministerial authority'],
        'tags': ['current_affairs', 'general_knowledge', 'ca_general', 'minister_of_finance', 'federation_finance', 'ministerial_authority'],
    },
    'ca_general_065': {
        'keywords': ['receipt books', 'licence books', 'defects', 'federal government printer'],
        'tags': ['current_affairs', 'general_knowledge', 'ca_general', 'receipt_books', 'licence_books', 'federal_government_printer'],
    },
    'ca_general_066': {
        'keywords': ['triplicate receipts', 'receipt book', 'retention', 'financial controls'],
        'tags': ['current_affairs', 'general_knowledge', 'ca_general', 'triplicate_receipts', 'receipt_book', 'retention'],
    },
    'ca_general_068': {
        'keywords': ['public accounts committees', 'auditor-general report', 'government accounts', 'legislative scrutiny'],
        'tags': ['current_affairs', 'general_knowledge', 'ca_general', 'public_accounts_committees', 'auditor_general_report', 'legislative_scrutiny'],
    },
    'ca_general_069': {
        'keywords': ['public service reform programme 1999', 'civil service modernization', 'efficiency', 'professional service'],
        'tags': ['current_affairs', 'general_knowledge', 'ca_general', 'public_service_reform_programme_1999', 'civil_service_modernization', 'efficiency'],
    },
    'ca_general_072': {
        'question': "Who ultimately pays the salaries of civil servants?",
        'options': [
            'The President.',
            'The government.',
            'The Central Bank of Nigeria.',
            'Nigerian taxpayers.',
        ],
        'keywords': ['civil servants salaries', 'taxpayers', 'public finance', 'salary funding'],
        'tags': ['current_affairs', 'general_knowledge', 'ca_general', 'civil_servants_salaries', 'taxpayers', 'public_finance'],
    },
    'ca_general_073': {
        'keywords': ['paramilitary service', 'federal ministry of finance', 'customs', 'immigration'],
        'tags': ['current_affairs', 'general_knowledge', 'ca_general', 'paramilitary_service', 'federal_ministry_of_finance', 'immigration_and_customs'],
    },
    'ca_general_074': {
        'question': 'What is the principal source of provisions for government financial business in Nigeria?',
        'options': [
            'The 1999 Constitution of the Federal Republic of Nigeria.',
            'The Annual Appropriation Act.',
            'The Finance (Control and Management) Act.',
            'Treasury Circulars.',
        ],
        'keywords': ['government financial business', '1999 constitution', 'principal source', 'financial provisions'],
        'tags': ['current_affairs', 'general_knowledge', 'ca_general', 'government_financial_business', '1999_constitution', 'financial_provisions'],
    },
}

GENERATED_UPDATES = {
    'ca_general_gen_002': {
        'question': 'Which practice best supports compliance in general current-affairs work?',
        'keywords': ['general affairs compliance', 'lawful criteria', 'documented decisions', 'public-service practice'],
    },
    'ca_general_gen_004': {
        'question': 'Which practice best reflects sound institutional awareness in general current-affairs work?',
        'keywords': ['institutional awareness', 'verified public sources', 'current developments', 'general affairs'],
    },
    'ca_general_gen_006': {
        'question': 'Which action best shows strong regional and global awareness in general current-affairs work?',
        'keywords': ['regional and global context', 'international events', 'administrative priorities', 'general affairs'],
    },
    'ca_general_gen_008': {
        'question': 'Which action best demonstrates civic relevance in general current-affairs work?',
        'keywords': ['civic relevance', 'public-sector responsibilities', 'general affairs', 'public-service practice'],
    },
    'ca_general_gen_010': {
        'question': 'Which practice best sustains compliance assurance in general current-affairs work?',
        'keywords': ['compliance assurance', 'consistent rule application', 'exception escalation', 'general affairs'],
    },
    'ca_general_gen_012': {
        'question': 'Which practice best preserves service integrity in general current-affairs work?',
        'keywords': ['service integrity', 'conflict disclosure', 'general affairs', 'public-service practice'],
    },
    'ca_general_gen_014': {
        'question': 'Which action best demonstrates decision transparency in general current-affairs work?',
        'keywords': ['decision transparency', 'clear criteria', 'prompt communication', 'general affairs'],
    },
    'ca_general_gen_016': {
        'question': 'Which action best reflects citizen-focused service in general current-affairs work?',
        'keywords': ['citizen-focused service', 'fairness', 'timeliness', 'service quality'],
    },
    'ca_general_gen_018': {
        'question': 'Which practice best supports sound performance standards in general current-affairs work?',
        'keywords': ['performance standards', 'measurable targets', 'monitoring', 'general affairs'],
    },
    'ca_general_gen_020': {
        'question': 'Which practice best sustains compliance in general current-affairs work?',
        'keywords': ['general affairs compliance', 'lawful criteria', 'transparent documentation', 'public-service practice'],
    },
    'ca_general_gen_021': {
        'question': 'Which action best demonstrates risk management in general current-affairs work?',
        'keywords': ['risk management', 'control gaps', 'exception escalation', 'general affairs'],
    },
    'ca_general_gen_022': {
        'question': 'Which practice best preserves institutional awareness in general current-affairs work?',
        'keywords': ['institutional awareness', 'verified public sources', 'general affairs', 'current developments'],
    },
    'ca_general_gen_024': {
        'question': 'Which action best reflects regional and global awareness in general current-affairs work?',
        'keywords': ['regional and global context', 'international events', 'national priorities', 'general affairs'],
    },
}


def find_ca_general_items(data: dict) -> list[dict]:
    sub = next(s for s in data['subcategories'] if s['id'] == 'ca_general')
    items = []
    for block in sub.get('questions', []):
        if isinstance(block, dict) and 'id' in block:
            items.append(block)
        elif isinstance(block, dict):
            for value in block.values():
                if isinstance(value, list):
                    for q in value:
                        if isinstance(q, dict) and q.get('id'):
                            items.append(q)
    return items


def apply_updates(items: list[dict]) -> list[str]:
    updated = []
    for q in items:
        qid = q['id']
        if qid in FACTUAL_UPDATES:
            q.update(FACTUAL_UPDATES[qid])
            updated.append(qid)
        elif qid in GENERATED_UPDATES:
            q.update(GENERATED_UPDATES[qid])
            updated.append(qid)
    return updated


def main() -> None:
    data = json.loads(PATH.read_text(encoding='utf-8'))
    items = find_ca_general_items(data)
    updated = apply_updates(items)
    PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Updated {len(updated)} questions in {PATH.name}')
    for qid in updated:
        print(qid)


if __name__ == '__main__':
    main()
