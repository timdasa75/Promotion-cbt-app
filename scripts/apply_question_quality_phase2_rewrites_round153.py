# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    (
        ROOT / 'data' / 'ict_digital.json',
        {
            'ict_eg_003': {
                'explanation': 'GIFMIS integrates budget execution, accounting, and reporting, so it is the core financial management platform used to control public funds.',
            },
            'ict_eg_008': {
                'explanation': 'Biometric attendance systems improve attendance tracking and workforce accountability by recording who is present and when.',
            },
            'ict_eg_010': {
                'explanation': 'NOCOPO supports open contracting and procurement transparency by publishing procurement information electronically.',
            },
            'ict_eg_012': {
                'explanation': 'The platform used for ghost-pensioner control is built to verify beneficiaries and remove duplicate or fictitious pension records.',
            },
            'ict_eg_015': {
                'explanation': 'CBT promotion examinations are meant to standardize assessment and make promotion testing more objective and transparent.',
            },
            'ict_eg_018': {
                'explanation': 'The TSA is supported by a platform that consolidates government cash management so public funds can be monitored centrally.',
            },
            'ict_eg_021': {
                'explanation': 'Electronic procurement platforms let MDAs handle tendering and related procurement steps digitally to improve transparency.',
            },
            'ict_eg_023': {
                'explanation': 'Electronic customs clearance platforms speed up trade facilitation by replacing manual clearance with digital processing and tracking.',
            },
            'ict_eg_028': {
                'explanation': 'Ghost-pensioner tracking platforms verify pensioners electronically so fictitious records can be detected and removed.',
            },
            'ict_eg_037': {
                'explanation': 'BVN provides biometric verification for bank customers and linked payroll beneficiaries, helping reduce identity fraud.',
            },
            'ict_eg_039': {
                'explanation': 'Electronic justice delivery relies on digital filing, scheduling, and records systems so court processes can move faster and more transparently.',
            },
            'ict_eg_042': {
                'explanation': 'Transparent public procurement is supported by electronic portals that publish tender opportunities and award information for public scrutiny.',
            },
            'ict_eg_043': {
                'explanation': 'NITDA is the Nigerian agency responsible for promoting ICT innovation and guiding digital development.',
            },
            'ict_eg_047': {
                'explanation': 'The Office of the Head of the Civil Service of the Federation issues many implementation circulars for digital reforms and systems guidance in the public service.',
            },
            'ict_eg_050': {
                'explanation': 'Centralizing government applications and hosting means consolidating systems and data into shared infrastructure so they can be managed consistently.',
            },
            'ict_eg_051': {
                'explanation': 'The IPPIS placement rule ensures officers are captured quickly in payroll records after assumption of duty so pay administration stays current.',
            },
            'ict_eg_053': {
                'explanation': 'The Nigerian Communications Commission regulates telecommunications operators, making it the correct agency for the question.',
            },
            'ict_eg_057': {
                'explanation': 'The Unified Personnel Database reform aims to centralize personnel records so government can manage staff data more accurately and consistently.',
            },
            'ict_eg_060': {
                'explanation': 'NITDA is the agency that oversees ICT policy and development in Nigeria.',
            },
            'ict_eg_063': {
                'explanation': 'Servicom dashboards monitor service indicators, turnaround time, and compliance so MDAs can improve accountability in service delivery.',
            },
            'ict_eg_064': {
                'explanation': 'NITDA is responsible for issuing ICT standards and guidelines for MDAs so systems can stay interoperable and compliant.',
            },
            'ict_eg_065': {
                'explanation': 'Electronic land registration platforms support digital land records, title management, and easier verification of ownership details.',
            },
            'ict_eg_066': {
                'explanation': 'Online verification portals are designed to verify staff, beneficiaries, or other public-service records quickly and accurately.',
            },
            'ict_eg_068': {
                'explanation': 'CBT-based promotion exams are designed to improve fairness, standardization, and integrity in promotion testing.',
            },
            'ict_eg_071': {
                'explanation': 'Electronic procurement in Nigeria is supported by the public procurement portal that makes tender processes more transparent and traceable.',
            },
            'ict_eg_096': {
                'explanation': 'A notable late-1980s weakness of the Nigerian civil service was declining morale and efficiency, reflecting broader administrative decline at the time.',
            },
            'ict_eg_098': {
                'explanation': 'The platform that manages staff records, leave, postings, and promotions is the Human Resource Management Information System (HRMIS).',
            },
            'ict_sec_004': {
                'explanation': 'Regular software updates patch known vulnerabilities, which is why updating software is a core ICT security practice.',
            },
            'ict_sec_007': {
                'explanation': 'Malicious software that damages or exploits systems is called malware, so that is the correct ICT security term.',
            },
            'ict_sec_015': {
                'explanation': 'NITDA enforces NDPR compliance and data-protection standards in Nigeria, so it is the correct agency here.',
            },
            'ict_sec_017': {
                'explanation': 'NITDA oversees the enforcement of data privacy in Nigeria through the NDPR framework.',
            },
            'ict_sec_020': {
                'explanation': 'Data integrity checks ensure that information stays accurate, complete, and unaltered except by authorized processes.',
            },
            'ict_sec_021': {
                'explanation': 'Cyber hygiene training teaches users safe online behavior, threat awareness, and good security habits.',
            },
            'ict_sec_024': {
                'explanation': 'Flooding a system with traffic so legitimate users cannot access it is a distributed denial-of-service attack.',
            },
            'ict_sec_025': {
                'explanation': 'Malicious software is called malware, the standard term for harmful code that damages or exploits systems.',
            },
            'ict_sec_026': {
                'explanation': 'Passwords, biometrics, and similar checks are authentication controls used to prevent unauthorized access to systems.',
            },
            'ict_sec_028': {
                'explanation': 'A software flaw with no available vendor fix is called a zero-day vulnerability.',
            },
            'ict_sec_030': {
                'explanation': 'Separating payment approval, custody, and recording duties is a classic internal-control measure that reduces fraud and error.',
            },
            'ict_sec_035': {
                'explanation': 'Antivirus or anti-malware software is designed to detect and remove malicious code from computer systems.',
            },
            'ict_sec_036': {
                'explanation': 'NDPR stands for Nigeria Data Protection Regulation, the framework used to protect personal data.',
            },
            'ict_sec_037': {
                'explanation': 'Encryption and access controls help prevent unauthorized copying of sensitive files, which is why they are used for file protection.',
            },
            'ict_sec_039': {
                'explanation': 'The EFCC investigates and prosecutes financial crimes, including digital fraud affecting the public sector.',
            },
            'ict_sec_040': {
                'explanation': 'Backups are critical for data-loss prevention because they let systems recover information after crashes or power failures.',
            },
            'ict_sec_049': {
                'explanation': 'Access Control Lists define who can access network resources and what they are allowed to do.',
            },
            'ict_sec_051': {
                'explanation': 'The PSR rule on freedom from financial embarrassment helps ensure that officers meet the service entry requirements set by the rules.',
            },
            'ict_sec_052': {
                'explanation': 'Habitual lateness is a form of misconduct because repeated absence or lateness undermines discipline and productivity.',
            },
            'ict_sec_054': {
                'explanation': 'Procurement fraud and collusion attract serious penalties under the PPA, including dismissal and other statutory sanctions.',
            },
            'ict_sec_055': {
                'explanation': 'The Cybercrimes (Prohibition, Prevention, etc.) Act is the law used to criminalize online fraud and hacking in Nigeria.',
            },
            'ict_sec_057': {
                'explanation': 'The duty of secrecy is reinforced by the Official Secrets framework, which protects confidential government information in all forms of communication.',
            },
            'ict_sec_058': {
                'explanation': 'Separation of duties helps prevent fraud, error, and abuse by ensuring no one person controls every stage of a financial process.',
            },
            'ict_sec_059': {
                'explanation': 'Access controls and authentication protect systems from unauthorized access by restricting login and use rights.',
            },
            'ict_sec_070': {
                'explanation': 'Encryption and related file-protection controls reduce the risk of unauthorized copying of sensitive files.',
            },
            'ict_sec_071': {
                'explanation': 'A firewall is primarily used to prevent unauthorized access to or from a private network.',
            },
            'ict_sec_072': {
                'explanation': 'Gross misconduct such as digital fraud can attract dismissal under the PSR and related civil-service discipline rules.',
            },
            'ict_sec_089': {
                'explanation': 'The Secretary to the Government of the Federation handles the Secretary to the Federal Executive Council role and coordinates FEC business.',
            },
        },
    ),
    (
        ROOT / 'data' / 'ict_digital.json',
        {
            'ict_li_008': {
                'explanation': 'Data analytics tools are used to process large government datasets so decision-makers can identify patterns and make evidence-based choices.',
            },
            'ict_li_009': {
                'explanation': 'Official government or institutional websites are generally the most reliable sources for public-service information because they are primary sources.',
            },
            'ict_li_010': {
                'explanation': 'Effective online communication in the civil service depends on clarity, professionalism, and respect for the official audience.',
            },
            'ict_li_013': {
                'explanation': 'Email and other messages that are read later are examples of asynchronous communication because the sender and recipient do not respond at the same time.',
            },
            'ict_li_015': {
                'explanation': 'Track changes lets team members see edits in shared documents, which supports collaboration and accountability.',
            },
            'ict_li_016': {
                'explanation': 'Netiquette means proper online etiquette, including respectful and professional behavior in digital communication.',
            },
            'ict_li_018': {
                'explanation': 'Digital collaboration tools make teamwork easier by improving document sharing, communication, and coordination across staff.',
            },
            'ict_li_019': {
                'explanation': 'Informal slang, careless wording, and similar habits should be avoided in formal digital communication because they reduce professionalism.',
            },
            'ict_li_020': {
                'explanation': 'Secure virtual-meeting platforms are used to host online meetings and webinars while protecting access and meeting privacy.',
            },
            'ict_li_021': {
                'explanation': 'GIS is used to map and analyze spatial data, which helps with planning, resource allocation, and governance decisions.',
            },
            'ict_li_024': {
                'explanation': 'Poor infrastructure, low digital skills, and resistance to change are common barriers to ICT adoption in the civil service.',
            },
            'ict_li_025': {
                'explanation': 'Good virtual-meeting etiquette includes joining on time, muting when necessary, and staying focused on the meeting agenda.',
            },
            'ict_li_029': {
                'explanation': 'The Handbook encourages innovation to improve efficiency, service delivery, and problem solving in the civil service.',
            },
            'ict_li_044': {
                'explanation': 'Python supports data analysis and automation, which makes it useful for innovation and complex government planning work.',
            },
            'ict_li_060': {
                'explanation': 'Electronic land-registration initiatives make land records digital so ownership and title information can be verified more easily.',
            },
            'ict_li_061': {
                'explanation': 'Version history and track changes show who edited a document and allow previous versions to be recovered when needed.',
            },
            'ict_li_068': {
                'explanation': 'The platform used for online payslips and leave requests centralizes payroll and staff-service workflows for easier administration.',
            },
            'ict_li_101': {
                'explanation': 'Handing-over notes should be signed by the outgoing and incoming officers, with the relevant supervising office witnessing or acknowledging them as required.',
            },
        },
    ),
]


def update(node: object, updates: dict[str, dict]) -> int:
    if isinstance(node, list):
        return sum(update(item, updates) for item in node)
    if isinstance(node, dict):
        qid = node.get('id')
        if qid in updates:
            payload = updates[qid]
            for key, value in payload.items():
                node[key] = value
            return 1
        return sum(update(value, updates) for value in node.values())
    return 0


def main() -> None:
    total_changed = 0
    for target, updates in TARGETS:
        data = json.loads(target.read_text(encoding='utf-8'))
        changed = update(data, updates)
        if changed != len(updates):
            raise SystemExit(f'{target.name}: expected {len(updates)} updates, applied {changed}')
        target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        total_changed += changed
        print(f'Applied round 153 updates to {changed} questions in {target}')
    print(f'Applied round 153 updates to {total_changed} questions across {len(TARGETS)} files')


if __name__ == '__main__':
    raise SystemExit(main())
