# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TODAY = '2026-04-09'

PROC = ROOT / 'data' / 'public_procurement.json'
PSR = ROOT / 'data' / 'psr_rules.json'
FIN = ROOT / 'data' / 'financial_regulations.json'

IN_PLACE = {
    'ppa_objectives_021': {
        'question': 'When is restricted tendering justified under the PPA?',
        'explanation': 'Restricted tendering is justified where only a limited number of qualified suppliers are available.',
    },
    'ppa_objectives_039': {
        'question': 'Procurement that requires advice on organizational restructuring or technical feasibility falls under which category?',
        'explanation': 'Advisory and intellectual tasks such as restructuring advice and feasibility studies are classified as Consultancy Services under the PPA.',
    },
    'ppa_objectives_062': {
        'question': 'What is the effect of using a nominee, trustee, or agent to carry out a prohibited act?',
        'explanation': 'Using a nominee, trustee, or agent does not remove responsibility; the act still breaches the Code.',
    },
    'ppa_bid_027': {
        'question': 'Which section requires procuring entities to use standard bidding documents containing clear specifications and criteria?',
        'explanation': 'Section 25 requires standard bidding documents so bidders are assessed against clear and comparable criteria.',
    },
    'ppa_bid_037': {
        'question': 'If a procuring entity cancels a procurement proceeding before contract award under Section 31, what must it do next?',
        'explanation': 'Section 31 requires the entity to publish notice of the cancellation after ending the procurement proceeding.',
    },
    'ppa_bid_041': {
        'question': 'What does domestic preference under Section 35 allow?',
        'explanation': 'Domestic preference may give Nigerian firms a scoring advantage or margin of preference where the law allows it.',
    },
    'ppa_bid_067': {
        'question': 'Which option correctly defines the objective of a register of correspondences?',
        'options': [
            'To list all the staff in a Ministry.',
            'To document all financial transactions.',
            'To list all the correspondences received and sent out by a Ministry.',
            'To document all official meetings.',
        ],
        'correct': 2,
        'explanation': 'A register of correspondences tracks the letters and other correspondence received and sent by the Ministry.',
    },
    'ppa_bid_075': {
        'question': 'Which section requires procuring entities to use standard bidding documents containing clear specifications and criteria?',
        'explanation': 'Section 25 requires standard bidding documents containing clear specifications and criteria for bidders.',
    },
    'ppa_elb_017': {
        'question': 'What is the significance of technical proposal submission for consulting services?',
        'explanation': 'The technical proposal is graded first to confirm competence before financial proposals are opened.',
    },
    'ppa_elb_042': {
        'question': 'Under what condition can an MDA legally pay a consultant using an Advance Payment Guarantee or Performance Bond?',
        'explanation': 'An MDA may make the payment only when the relevant safeguards and contract conditions allow it.',
    },
    'ppa_elb_055': {
        'question': 'Which bid-evaluation practice best reflects fair procurement procedure?',
        'explanation': 'Fair procurement requires published criteria to be applied consistently to all responsive bids.',
    },
    'ppa_elb_060': {
        'question': 'What must an Accounting Officer ensure about contractors debarred or blacklisted by the BPP?',
        'explanation': 'The Accounting Officer must ensure such contractors are excluded from all tenders while the sanction remains in force.',
    },
    'ppa_elb_063': {
        'question': 'Which practice best protects procurement ethics in eligibility and consultant selection?',
        'explanation': 'Procurement ethics are protected by preventing collusion, favoritism, and conflicts of interest.',
    },
    'ppa_elb_066': {
        'question': 'How should a consulting technical proposal be treated in the evaluation sequence?',
        'explanation': 'The technical proposal is graded first to confirm competence before the financial proposals are opened.',
    },
    'ppa_ims_003': {
        'question': 'What happens if a contractor fails to provide the required Performance Bond under Section 29 after contract award?',
        'explanation': 'If the required Performance Bond is not provided, the contract may be terminated.',
    },
    'ppa_ims_051': {
        'question': 'What is the objective of the Principle of Impartiality as it relates to members of the public?',
        'explanation': 'Impartiality requires that everyone be treated equally and fairly, regardless of background.',
    },
    'ppa_ims_053': {
        'question': 'May idle funds in the accounts of missions abroad be invested in short-term deposits?',
        'explanation': 'Idle funds in missions abroad may be invested only with prior approval and within the applicable controls.',
    },
    'ppa_ims_060': {
        'question': 'What action most directly strengthens risk management when a supervisor reviews compliance gaps in Implementation, Monitoring & Sanctions?',
        'explanation': 'Risk management is stronger when control gaps are identified early and material exceptions are escalated promptly.',
    },
    'ppa_ims_064': {
        'question': 'Which practice best supports document management during procurement implementation and monitoring?',
        'explanation': 'Document management is stronger when files are kept accurate and updated at each control point.',
    },
    'ppa_ims_072': {
        'question': 'Which bid-evaluation practice best aligns with sound public procurement procedure?',
        'explanation': 'Sound bid evaluation depends on applying the published criteria consistently to every responsive bid.',
    },
    'ppa_ims_074': {
        'question': 'When should implementation, monitoring, and sanctions be handled to keep governance standards proper?',
        'explanation': 'Implementation, monitoring, and sanctions should follow approved procedures and be fully documented.',
    },
    'ppa_objectives_070': {
        'question': 'What is the purpose of maintaining a departmental dishonored cheques register?',
        'explanation': 'The register helps the department pursue clearances and recoveries after cheques are dishonored.',
    },
    'ppa_objectives_071': {
        'question': 'What action is required when an incorrect entry is found on a receipt or licence?',
        'explanation': 'An incorrect entry must be cancelled and the document reissued correctly.',
    },
}

MOVES = {
    'ppa_objectives_060': {
        'target_file': FIN,
        'target_subcategory': 'fin_general',
        'new_id': 'fin_gen_085',
        'question': 'What must be done when an incorrect entry is made on a receipt or licence?',
        'options': [
            'Cancel the document and complete a new one.',
            'Cross it out and keep the document as it is.',
            'File the document without correction.',
            'Leave the mistake for the paying officer to fix later.',
        ],
        'correct': 0,
        'explanation': 'An incorrect entry requires cancellation of the document and completion of a new one.',
        'chapter': 'General Financial Management - Expansion Set',
        'keywords': ['receipt', 'licence', 'error_control', 'financial_record'],
        'sourceDocument': 'Financial Regulations (FR)',
        'sourceSection': 'General Financial Management',
        'sourceTopicId': 'financial_regulations',
        'sourceSubcategoryId': 'fin_general',
        'sourceSubcategoryName': 'General Financial Management',
        'tags': ['fin_gen', 'financial_regulations', 'receipts', 'licences'],
        'year': 2009,
    },
    'ppa_objectives_071': {
        'target_file': FIN,
        'target_subcategory': 'fin_general',
        'new_id': 'fin_gen_086',
        'question': 'What action is required when an incorrect entry is found on a receipt or licence?',
        'options': [
            'Leave the mistake and file the document.',
            'Cancel the document and issue a new one.',
            'Only cross out the error.',
            'Ask the recipient to amend it privately.',
        ],
        'correct': 1,
        'explanation': 'An incorrect entry must be cancelled and the document reissued correctly.',
        'chapter': 'General Financial Management - Expansion Set',
        'keywords': ['receipt', 'licence', 'error_control', 'financial_record'],
        'sourceDocument': 'Financial Regulations (FR)',
        'sourceSection': 'General Financial Management',
        'sourceTopicId': 'financial_regulations',
        'sourceSubcategoryId': 'fin_general',
        'sourceSubcategoryName': 'General Financial Management',
        'tags': ['fin_gen', 'financial_regulations', 'receipts', 'licences'],
        'year': 2009,
    },
    'ppa_objectives_070': {
        'target_file': FIN,
        'target_subcategory': 'fin_general',
        'new_id': 'fin_gen_087',
        'question': 'What is the purpose of maintaining a departmental dishonored cheques register?',
        'options': [
            'To ensure clearances are pursued and recoveries are made.',
            'To provide a summary of daily bank transactions.',
            'To track bank charges.',
            'To log all incoming and outgoing cheques.',
        ],
        'correct': 0,
        'explanation': 'The register helps the department pursue clearances and recoveries after cheques are dishonored.',
        'chapter': 'General Financial Management - Expansion Set',
        'keywords': ['dishonored_cheques', 'register', 'recoveries', 'financial_control'],
        'sourceDocument': 'Financial Regulations (FR)',
        'sourceSection': 'General Financial Management',
        'sourceTopicId': 'financial_regulations',
        'sourceSubcategoryId': 'fin_general',
        'sourceSubcategoryName': 'General Financial Management',
        'tags': ['fin_gen', 'financial_regulations', 'dishonored_cheques', 'register'],
        'year': 2009,
    },
    'ppa_objectives_064': {
        'target_file': PSR,
        'target_subcategory': 'psr_general_admin',
        'new_id': 'psr_admin_072',
        'question': 'Do the eligibility rules specify a minimum number of years of service for appointment as Permanent Secretary?',
        'options': [
            'No specific minimum number of years is stated.',
            'Yes, 15 years.',
            'Yes, 17 years.',
            'Yes, 20 years.',
        ],
        'correct': 0,
        'explanation': 'The stated rules do not give a fixed minimum number of years of service for appointment as Permanent Secretary.',
        'chapter': 'General Administration & Office Procedures - Expansion Set',
        'keywords': ['permanent_secretary', 'eligibility', 'service_years', 'psr'],
        'sourceDocument': 'Public Service Rules (PSR 2021)',
        'sourceSection': 'General Administration & Office Procedures',
        'sourceTopicId': 'psr',
        'sourceSubcategoryId': 'psr_general_admin',
        'sourceSubcategoryName': 'General Administration & Office Procedures',
        'tags': ['psr', 'psr_general_admin', 'permanent_secretary', 'eligibility'],
        'year': 2021,
    },
    'ppa_objectives_075': {
        'target_file': PSR,
        'target_subcategory': 'psr_ethics',
        'new_id': 'psr_eth_061',
        'question': 'Which officers are required to swear to the Oath of Secrecy?',
        'options': [
            'All new hires.',
            'Only the Permanent Secretary.',
            'All civil servants.',
            'Those who have access to classified information.',
        ],
        'correct': 3,
        'explanation': 'Officers who have access to classified information should, as soon as possible, swear to the Oath of Secrecy.',
        'chapter': 'Conduct & Ethics - Expansion Set',
        'keywords': ['oath_of_secrecy', 'classified_information', 'psr', 'ethics'],
        'sourceDocument': 'Public Service Rules (PSR 2021)',
        'sourceSection': 'Conduct & Ethics',
        'sourceTopicId': 'psr',
        'sourceSubcategoryId': 'psr_ethics',
        'sourceSubcategoryName': 'Conduct & Ethics',
        'tags': ['psr', 'psr_ethics', 'oath_of_secrecy', 'classified_information'],
        'year': 2021,
    },
}


def find_question_list_and_index(node: object, qid: str):
    if isinstance(node, dict):
        if node.get('questions') and isinstance(node['questions'], list):
            for idx, q in enumerate(node['questions']):
                if q.get('id') == qid:
                    return node['questions'], idx, q
        for value in node.values():
            if isinstance(value, (dict, list)):
                result = find_question_list_and_index(value, qid)
                if result:
                    return result
    elif isinstance(node, list):
        for item in node:
            result = find_question_list_and_index(item, qid)
            if result:
                return result
    return None


def find_subcategory(node: object, sub_id: str):
    if isinstance(node, dict):
        if node.get('id') == sub_id and 'questions' in node:
            return node
        for value in node.values():
            if isinstance(value, (dict, list)):
                result = find_subcategory(value, sub_id)
                if result:
                    return result
    elif isinstance(node, list):
        for item in node:
            result = find_subcategory(item, sub_id)
            if result:
                return result
    return None


def apply_updates(root: object) -> int:
    changed = 0
    for qid, patch in IN_PLACE.items():
        found = find_question_list_and_index(root, qid)
        if not found:
            raise SystemExit(f'Could not find question {qid}')
        _, _, question = found
        for key, value in patch.items():
            question[key] = value
        question['lastReviewed'] = TODAY
        changed += 1
    return changed


def move_question(source_root: object, target_root: object, qid: str, cfg: dict[str, object]) -> None:
    found = find_question_list_and_index(source_root, qid)
    if not found:
        raise SystemExit(f'Could not find question {qid}')
    question_list, idx, question = found
    question_list.pop(idx)

    target_sub = find_subcategory(target_root, cfg['target_subcategory'])
    if not target_sub:
        raise SystemExit(f"Could not find target subcategory {cfg['target_subcategory']}")

    moved = deepcopy(question)
    moved.update({
        'id': cfg['new_id'],
        'question': cfg['question'],
        'options': cfg['options'],
        'correct': cfg['correct'],
        'explanation': cfg['explanation'],
        'chapter': cfg['chapter'],
        'keywords': cfg['keywords'],
        'source': 'moved_from_public_procurement',
        'sourceDocument': cfg['sourceDocument'],
        'sourceSection': cfg['sourceSection'],
        'year': cfg['year'],
        'lastReviewed': TODAY,
        'sourceTopicId': cfg['sourceTopicId'],
        'sourceSubcategoryId': cfg['sourceSubcategoryId'],
        'sourceSubcategoryName': cfg['sourceSubcategoryName'],
        'legacyQuestionIds': [qid],
        'tags': cfg['tags'],
    })
    target_sub['questions'].append(moved)


def main() -> int:
    procurement = json.loads(PROC.read_text(encoding='utf-8'))
    psr = json.loads(PSR.read_text(encoding='utf-8'))
    fin = json.loads(FIN.read_text(encoding='utf-8'))

    changed = apply_updates(procurement)
    for qid, cfg in MOVES.items():
        target_root = fin if cfg['target_file'] == FIN else psr
        move_question(procurement, target_root, qid, cfg)
        changed += 1

    expected = len(IN_PLACE) + len(MOVES)
    if changed != expected:
        raise SystemExit(f'expected {expected} updates, applied {changed}')

    PROC.write_text(json.dumps(procurement, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    PSR.write_text(json.dumps(psr, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    FIN.write_text(json.dumps(fin, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Applied round 170 updates to {changed} questions')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
