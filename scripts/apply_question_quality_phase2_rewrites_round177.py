from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / 'data' / 'civil_service_ethics.json'

REWRITES = {
    'csh_administrative_procedures_gen_029': 'Accountable implementation requires approved procedures to be applied consistently and every material step to be documented so the work can be checked later.',
    'csh_it_024': 'A zero-day vulnerability is an unknown security flaw for which no vendor patch is yet available, so it can be exploited before defenders can respond.',
    'csh_it_054': 'Costing of projects and services is correct because due procedure is meant to protect fiscal transparency and compliance in public spending.',
    'csh_it_057': 'Delegation does not remove a Revenue Collector\'s pecuniary responsibility; the officer remains accountable for the duty entrusted to another person.',
    'csh_it_061': 'Failure to comply with the Financial Regulations may attract disciplinary action and surcharge, even where the unit operates as self-accounting.',
    'csh_it_068': 'Whatever union activities exist, federal employees remain chiefly accountable for the timely and efficient discharge of their assigned public duties.',
    'csh_it_071': 'A pyramid is correct because the Federal Civil Service is structured in levels of authority and responsibility that narrow toward the top.',
    'csh_it_073': 'Accepting gifts from contractors or business people can compromise a civil servant\'s integrity and create a conflict between official duty and private influence.',
    'csh_principle_009': 'Accepting gifts can create a conflict of interest and open the door to corruption, so civil servants are prohibited from doing it.',
    'csh_principle_010': 'Integrity, competence, and accountability are the leadership qualities emphasized because effective public service depends on sound judgment and lawful conduct.',
    'csh_principle_014': 'The PSR bases public service ethics on service to the public, integrity, neutrality, and accountability rather than private gain.',
    'csh_principle_023': 'Civil servants exist to serve the public interest and carry out lawful government policy faithfully.',
    'csh_principle_024': 'Public resources must be used responsibly and strictly for official purposes so accountability can be maintained.',
    'csh_principle_034': 'Honesty, integrity, and transparency are required by the PSR and the Civil Service Handbook so conduct stays open and accountable.',
    'csh_principle_036': 'Open records and transparent decisions make it possible to trace actions and hold officers accountable.',
    'csh_principle_041': 'Accountability is the missing principle because openness and rule of law must be supported by clear responsibility for decisions.',
    'csh_principle_046': 'Professional competence and obedience to lawful instructions are core public-service values because officers must serve efficiently and lawfully.',
    'csh_principle_061': 'The Accounting Officer is responsible for discrepancies in a self-accounting unit because that officer controls the records and internal checks for the unit.',
    'csh_principle_064': 'Financial abuse should be reported through the proper official channel so it can be investigated and addressed under the right procedure.',
    'csh_principle_069': 'After a meeting, the secretary should ensure that the minutes are written and circulated and that agreed follow-up actions are tracked to completion.',
    'csh_principle_071': 'The Accountant-General is chiefly accountable for ensuring that adequate accounting systems and controls exist across the arms of government.',
    'csh_principle_072': 'Delegation may transfer performance of the task, but it does not remove the delegating officer\'s accountability for the result.',
    'csh_principle_075': 'Delegation does not remove the Revenue Collector\'s pecuniary responsibility for the duty entrusted to another person.',
    'csh_principles_ethics_gen_028': 'Accountable implementation requires approved procedures to be applied consistently and every material step to be documented so the work can be checked later.',
    'csh_pt_047': 'The confirmation examination is held once a year so officers can be assessed regularly before confirmation is finalized.',
    'csh_sdg_005': 'Thirty days is correct because grievance appeals should be heard promptly and not left to linger without a decision.',
    'csh_sdg_008': 'Petitions on allowances or entitlements are handled by the appropriate staff committee or grievance channel because they concern service conditions and employee rights.',
    'csh_sdg_009': 'Open decisions and available records are necessary so grievance outcomes can be reviewed, justified, and held to account.',
    'csh_sdg_011': 'Respecting diversity helps create an inclusive workplace where officers are treated fairly regardless of background.',
    'csh_sdg_014': 'Accountability for government resources is addressed in the ethics and financial control chapter because resources must be used responsibly.',
    'csh_sdg_026': 'Fair and equitable service regardless of background is the practical meaning of impartial public service.',
    'csh_sdg_034': 'Service is the remaining core value because the civil service exists to deliver results to the public, not to advance private interests.',
    'csh_sdg_036': 'JSC and SSC committees handle personnel matters such as appointments, promotions, and discipline in parastatals.',
    'csh_sdg_040': 'Teamwork is emphasized because coordination, shared responsibility, and cooperation improve service delivery.',
    'csh_sdg_050': 'The FCSC acts as a central support body that improves staff welfare and strengthens administrative guidance across the public service.',
    'csh_sdg_068': 'Proper administrative ethics means applying approved timelines and documented procedures instead of using informal shortcuts.',
    'ethics_034': 'Accountability is correct because it means officers are answerable for their actions and decisions.',
    'ethics_035': 'Impartiality is correct because it requires civil servants to avoid favoritism in hiring and promotions.',
    'ethics_036': 'The ICPC is correct because it investigates corruption in public procurement and related contract abuse.',
    'ethics_039': 'Impartiality is correct because it requires civil servants to avoid discrimination in service delivery.',
    'ethics_055': 'The ICPC is correct because it investigates cases of bribery and gratification involving public officers.',
    'ethics_057': 'Accountability and transparency are correct because they underpin the Code of Conduct for Public Officers.',
    'ethics_060': 'Integrity is correct because it discourages corruption and promotes fairness in public service.',
    'ethics_063': 'The Code of Conduct Bureau is correct because it investigates breaches relating to asset declarations.',
    'ethics_064': 'Transparency is correct because openness in government contracting helps prevent abuse and concealment.',
    'ethics_069': 'Forgery is correct because falsifying official records for personal advantage is a form of record fraud.',
    'ethics_070': 'Professionalism is correct because it requires fair, respectful, and competent treatment of colleagues and subordinates.',
    'ethics_076': 'Impartiality is correct because it prohibits favoritism and demands equal treatment in public service.',
    'ethics_077': 'Accountability is correct because public funds must be managed responsibly and answerably for the public good.',
    'ethics_078': 'Insubordination is correct because deliberate refusal to obey lawful orders is a classic disciplinary offense.',
    'ethics_079': 'Transparency is correct because decisions should be taken openly and with reasons that can be justified.',
    'ethics_080': 'Abuse of office is correct because unauthorized use of official vehicles is a misuse of public authority and resources.',
    'ethics_109': 'Integrity is correct because honesty is required when safeguarding public resources and public trust.',
}


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding='utf-8'))
    updated = []
    for subcategory in data['subcategories']:
        for question in subcategory.get('questions', []):
            qid = question.get('id')
            if qid in REWRITES:
                question['explanation'] = REWRITES[qid]
                updated.append(qid)
    DATA_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Updated {len(updated)} questions')
    for qid in updated:
        print(qid)


if __name__ == '__main__':
    main()
