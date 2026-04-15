from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / 'data' / 'civil_service_ethics.json'

REWRITES = {
    'csh_ap_155': {
        'question': 'What best supports an official case file during review?',
        'options': [
            'Keeping movement entries current and traceable at each control point.',
            'Applying rules inconsistently.',
            'Bypassing review controls.',
            'Leaving updates until the case is closed.',
        ],
        'correct': 0,
        'explanation': 'An official case file should stay current and traceable at each control point so reviewers can follow every movement without gaps.',
    },
    'csh_ap_217': {
        'question': 'What practice best keeps an objectives-and-institutions file easy to review?',
        'options': [
            'Keeping the file indexed and current at each control point.',
            'Applying rules inconsistently.',
            'Bypassing review controls.',
            'Prioritizing convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'An objectives-and-institutions file is easiest to review when it stays indexed, current, and updated at each control point for quick tracing.',
    },
    'csh_ap_228': {
        'question': 'What does an audit trail establish in record keeping?',
        'options': [
            'Traceability and accountability.',
            'Automatic approval of all payments.',
            'Budget expansion without controls.',
            'Removal of all record-keeping duties.',
        ],
        'correct': 0,
        'explanation': 'An audit trail helps establish traceability and accountability by showing what was done, when it was done, and by whom.',
    },
    'csh_disc_058': {
        'question': 'What risk arises when a civil servant accepts gifts from contractors or business people?',
        'options': [
            'Compromised integrity and impartiality.',
            'Automatic promotion.',
            'Improved transparency.',
            'Guaranteed efficiency.',
        ],
        'correct': 0,
        'explanation': 'Accepting gifts from contractors or business people can compromise impartiality and damage the civil servant\'s integrity.',
    },
    'csh_disc_062': {
        'question': 'What should be done when a file will need further action later?',
        'options': [
            'Place it on a bring-up pad and return it through registry channels.',
            'Discard it because it is not needed immediately.',
            'Keep it permanently in a desk drawer.',
            'Pass it to a colleague without recording the transfer.',
        ],
        'correct': 0,
        'explanation': 'A file that will require later action should be placed on a bring-up pad for the relevant date and returned through the proper registry process.',
    },
    'csh_duty_054': {
        'question': 'Which action is forbidden when a non-revenue officer receives public money in the course of duty?',
        'options': [
            'Supporting the lodgement with a paying-in form.',
            'Delaying lodgement of the money.',
            'Lodgement through a Sub-Accounting Officer.',
            'Official receipt issuance.',
        ],
        'correct': 1,
        'explanation': 'An officer who receives public money in the course of duty must not delay its lodgement, because delay weakens accountability over public funds.',
    },
    'csh_duty_057': {
        'question': 'What should officers controlling votes secure for services rendered?',
        'options': [
            'Settlement within the same financial year.',
            'Routine deferral of payments to the next financial year.',
            'Perfect validation beyond the year.',
            'Transfer of all outstanding claims to suspense accounts.',
        ],
        'correct': 0,
        'explanation': 'Officers controlling votes should ensure that payments for services rendered are settled within the same financial year whenever due.',
    },
    'csh_duty_058': {
        'question': 'What is the Chief Executive\'s key duty to the Board?',
        'options': [
            'Implementing Board decisions and policies.',
            'Reporting only to the supervising Minister.',
            'Refusing decisions that are personally disliked.',
            'Managing the Board\'s personal affairs.',
        ],
        'correct': 0,
        'explanation': 'The Chief Executive is accountable to the Board for implementing its approved decisions and policies.',
    },
    'csh_duty_064': {
        'question': 'What remains true after a Board of Survey finding for the officer in charge?',
        'options': [
            'The officer remains accountable for discrepancies until they are resolved.',
            'Automatic dismissal if a shortage is found.',
            'Immediate discharge of accountability once the finding is made.',
            'No consequence at all for the officer.',
        ],
        'correct': 0,
        'explanation': 'The officer in charge remains accountable for discrepancies disclosed by the Board of Survey until the matter is satisfactorily resolved.',
    },
    'csh_duty_068': {
        'question': 'What fiscal rule applies under the Fiscal Responsibility framework?',
        'options': [
            'Total expenditure must not exceed total revenue.',
            'Total revenue must always exceed expenditure by a fixed margin.',
            'Revenue is irrelevant to expenditure decisions.',
            'Expenditure may exceed revenue whenever grants are expected.',
        ],
        'correct': 0,
        'explanation': 'A core fiscal-responsibility rule is that total expenditure should not exceed total revenue.',
    },
    'csh_duty_070': {
        'question': 'What should a civil servant who has served for a very long time in one ministry avoid?',
        'options': [
            'Assuming personal experience alone is enough.',
            'Sharing institutional knowledge.',
            'Giving advice to the Minister.',
            'Offering useful suggestions for improvement.',
        ],
        'correct': 0,
        'explanation': 'Long service should not lead an officer to assume experience alone is sufficient, because institutional learning still requires openness and discipline.',
    },
    'csh_principle_024': {
        'question': 'How should public resources be used according to the Civil Service Handbook?',
        'options': [
            'Responsibly and strictly for official purposes.',
            'For personal benefit where rank permits.',
            'For family and private development projects.',
            'For informal sharing once duties are complete.',
        ],
        'correct': 0,
        'explanation': 'Public resources must be used responsibly and strictly for official purposes so accountability can be maintained.',
    },
    'csh_principle_064': {
        'question': 'What should a civil servant do after detecting financial abuse in the public service?',
        'options': [
            'Report it through the proper official reporting channel.',
            'Ignore it because it is not a personal duty.',
            'Wait for a superior to discover it first.',
            'Report it informally to a friend or colleague.',
        ],
        'correct': 0,
        'explanation': 'Financial abuse should be reported through the proper official channel so it can be investigated and addressed under the right procedure.',
    },
    'csh_principle_069': {
        'question': 'What should the secretary secure after a meeting closes?',
        'options': [
            'Minutes circulation and completion of agreed follow-up actions.',
            'Immediate closure of the record without further action.',
            'Transfer of all responsibility to meeting participants.',
            'No further attention once attendance is recorded.',
        ],
        'correct': 0,
        'explanation': 'After a meeting, the secretary should ensure that the minutes are written and circulated and that agreed follow-up actions are tracked to completion.',
    },
    'csh_principle_071': {
        'question': 'What is the Accountant-General chiefly accountable for regarding accounting systems?',
        'options': [
            'Providing adequate accounting systems and controls across government.',
            'Formulating national economic policy.',
            'Personally managing every public transaction.',
            'Auditing all public accounts personally each year.',
        ],
        'correct': 0,
        'explanation': 'The Accountant-General is chiefly accountable for ensuring that adequate accounting systems and controls exist across the arms of government.',
    },
    'csh_principle_072': {
        'question': 'Does delegation remove accountability?',
        'options': [
            'No, accountability remains with the delegating officer.',
            'Yes, once the delegation is in writing.',
            'Yes, where the subordinate accepts the task.',
            'Only where the delegated duty concerns revenue.',
        ],
        'correct': 0,
        'explanation': 'Delegation may transfer performance of the task, but it does not remove the delegating officer\'s accountability for the result.',
    },
    'csh_principle_075': {
        'question': 'What does delegation not remove from a Revenue Collector?',
        'options': [
            'Pecuniary responsibility for the delegated duty.',
            'The obligation to report only after loss occurs.',
            'The duty only when delegation is written.',
            'The role only where the delegate is also a collector.',
        ],
        'correct': 0,
        'explanation': 'Delegation does not remove the Revenue Collector\'s pecuniary responsibility for the duty entrusted to another person.',
    },
    'csh_it_024': {
        'question': 'What is a zero-day vulnerability in cybersecurity?',
        'options': [
            'An unknown vulnerability for which no vendor fix is yet available.',
            'A fully patched and secured system.',
            'A routine software update released by the vendor.',
            'A scheduled penetration test for network security.',
        ],
        'correct': 0,
        'explanation': 'A zero-day vulnerability is an unknown security flaw for which no vendor patch is yet available, so it can be exploited before defenders can respond.',
    },
    'csh_it_057': {
        'question': 'Under Financial Regulation 125, what remains with a Revenue Collector after duty is delegated?',
        'options': [
            'Pecuniary responsibility for the delegated duty.',
            'Only the right to delegate the same task again.',
            'Freedom from accountability once the instruction is written.',
            'Responsibility only when the substitute is not also a collector.',
        ],
        'correct': 0,
        'explanation': 'Delegation does not remove a Revenue Collector\'s pecuniary responsibility; the officer remains accountable for the duty entrusted to another person.',
    },
    'csh_it_061': {
        'question': 'What may happen when an Accounting Officer fails to comply with the Financial Regulations?',
        'options': [
            'Disciplinary action and possible surcharge.',
            'A verbal warning only.',
            'Automatic loss of self-accounting status.',
            'No consequence because the unit is self-accounting.',
        ],
        'correct': 0,
        'explanation': 'Failure to comply with the Financial Regulations may attract disciplinary action and surcharge, even where the unit operates as self-accounting.',
    },
    'csh_it_068': {
        'question': 'What remains the chief accountability of federal employees even when union activities exist?',
        'options': [
            'Discharging assigned duties to the public efficiently and on time.',
            'Ensuring union executives are posted to preferred locations.',
            'Attending every union meeting as a condition of service.',
            'Reporting directly to the Head of Service on union affairs.',
        ],
        'correct': 0,
        'explanation': 'Whatever union activities exist, federal employees remain chiefly accountable for the timely and efficient discharge of their assigned public duties.',
    },
    'csh_it_073': {
        'question': 'Why is it dangerous for a civil servant to accept gifts from contractors or business people?',
        'options': [
            'It can compromise official integrity and create conflict of interest.',
            'It is simply an act of kindness in official business.',
            'It is a normal feature of contractor relations.',
            'It is a reliable way to build workplace relationships.',
        ],
        'correct': 0,
        'explanation': 'Accepting gifts from contractors or business people can compromise a civil servant\'s integrity and create a conflict between official duty and private influence.',
    },
    'csh_innovation_technology_gen_007': {
        'question': 'Which practice best sustains discipline in the use of public-service technology systems?',
        'options': [
            'Consistent compliance with approved use and review controls.',
            'Selective rule application for convenience.',
            'Bypassing known controls to save time.',
            'Informal practice instead of approved process.',
        ],
        'correct': 0,
        'explanation': 'Discipline in technology use depends on consistent compliance with approved controls instead of shortcuts or informal practice.',
    },
    'csh_innovation_technology_gen_025': {
        'question': 'Which practice best sustains conduct standards in the use of public-service technology systems?',
        'options': [
            'Consistent compliance with approved conduct controls.',
            'Selective rule application for convenience.',
            'Bypassing known controls to save time.',
            'Informal practice instead of approved process.',
        ],
        'correct': 0,
        'explanation': 'Conduct standards are sustained when officers apply the approved controls consistently instead of treating system use as an area for informal discretion.',
    },
}


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding='utf-8'))
    updated = []
    for subcategory in data['subcategories']:
        for question in subcategory.get('questions', []):
            qid = question.get('id')
            if qid in REWRITES:
                payload = REWRITES[qid]
                question['question'] = payload['question']
                question['options'] = payload['options']
                question['correct'] = payload['correct']
                question['explanation'] = payload['explanation']
                updated.append(qid)
    DATA_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Updated {len(updated)} questions')
    for qid in updated:
        print(qid)


if __name__ == '__main__':
    main()
