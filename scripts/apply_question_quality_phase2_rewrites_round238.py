from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'data' / 'financial_regulations.json'

UPDATES = {
    'fin_aud_061': {
        'question': 'What kinds of financial problems does an audit query issued by the Auditor-General typically draw attention to?',
        'options': [
            'Approval of new projects.',
            'Questions about government policy choices.',
            'Financial anomalies, unauthorized expenditures, or failures in proper accounting.',
            'Recommendations for new appointments.'
        ],
        'explanation': 'An audit query is used to draw attention to financial anomalies, unauthorized expenditures, and failures in proper accounting so the issues can be explained or corrected.',
        'keywords': ['audit_query', 'financial_irregularities', 'unauthorized_expenditure', 'public_accountability'],
        'tags': ['financial_regulations', 'fin_audits_sanctions', 'audit_query', 'financial_irregularities', 'unauthorized_expenditure', 'public_accountability'],
    },
    'fin_bgt_060': {
        'options': [
            'The National Assembly.',
            'The Accountant-General.',
            'The Minister of Finance.',
            'The Auditor-General.'
        ],
        'explanation': 'The Minister of Finance may exclude an item of expenditure from the Annual General Warrant when special control is desired, which is why that office is the correct answer.',
    },
    'fin_pro_059': {
        'options': [
            'To guide public officers on procurement only.',
            'To dictate the national budget.',
            'To set tax policies.',
            'To guide public officers on the receipts and disbursements of public funds and the management of public assets.'
        ],
        'explanation': 'The Financial Regulations guide public officers on receipts, disbursements, and the management of public assets; they are broader than procurement alone.',
    },
    'fin_pro_061': {
        'options': [
            'Value-for-Money (Performance) Audit.',
            'Appropriation Audit.',
            'Financial Audit.',
            'Financial Control Audit.'
        ],
        'explanation': 'A Financial Control Audit checks whether laid-down procedures are being followed in tendering, contracts, and store-keeping to prevent waste, pilferage, and extravagance.',
    },
    'fin_pro_070': {
        'options': [
            'To conduct external audits of the ministry.',
            'To approve all government contracts.',
            'To ensure staff comply with the Financial Regulations and the Accounting Code.',
            'To directly disburse all public funds.'
        ],
        'explanation': 'One duty of the Head of Finance and Accounts is to ensure that staff under that office comply with the Financial Regulations and the Accounting Code.',
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
    print('Updated finance follow-up items for rounds 238')


if __name__ == '__main__':
    main()
