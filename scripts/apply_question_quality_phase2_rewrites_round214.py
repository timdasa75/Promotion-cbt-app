from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'ict_digital.json': {
        'ict_f_003': {
            'question': 'In computing, what is RAM primarily used for?',
            'options': [
                'Permanent storage for files and programs.',
                'Temporary storage for data while the computer is running.',
                'Image output to the display screen.',
                'Internet connectivity for the device.',
            ],
            'explanation': 'RAM is volatile memory used to hold data and instructions that the computer is actively using, so it supports temporary working storage rather than permanent retention.',
        },
        'ict_f_018': {
            'question': 'What is the primary function of a compiler?',
            'options': [
                'Virus scanning for infected files.',
                'Translation of high-level source code into machine code.',
                'Random-number generation for software tests.',
                'Data transfer between network servers.',
            ],
            'explanation': 'A compiler translates source code written in a high-level language into machine code that a computer can execute, which is why translation is its core function.',
        },
        'ict_f_038': {
            'question': 'What is a database in computing?',
            'options': [
                'A programming language used to build software.',
                'A structured collection of data that can be stored, managed, and updated electronically.',
                'A network device used to route internet traffic.',
                'A security protocol used to protect online sessions.',
            ],
            'explanation': 'A database is an organized collection of data that can be stored, accessed, managed, and updated electronically, so it is a data-management resource rather than a device or protocol.',
        },
        'ict_f_048': {
            'question': 'What does bandwidth measure in networking?',
            'options': [
                'The physical size of a computer system.',
                'The amount of data that can be transmitted over a network within a given time.',
                'The complexity of a software algorithm.',
                'The purchase price of network equipment.',
            ],
            'explanation': 'Bandwidth measures the volume of data a network can carry within a given time, so it describes transmission capacity rather than hardware size or software complexity.',
        },
        'ict_f_061': {
            'question': 'What is an algorithm in computing?',
            'options': [
                'A physical hardware component inside a computer.',
                'A step-by-step procedure for solving a problem or performing a task.',
                'A type of long-term memory storage.',
                'A protocol used to secure a network.',
            ],
            'explanation': 'An algorithm is a defined sequence of steps for solving a problem or carrying out a task, which is why it is treated as a procedure rather than a physical component or storage medium.',
        },
        'ict_f_067': {
            'question': 'What is the role of a primary key in a database record?',
            'options': [
                'Encryption of every record in the system.',
                'Identification of each record with a unique value.',
                'Generation of passwords for users.',
                'Operation of the web server hosting the database.',
            ],
            'explanation': 'A primary key gives each record a unique identifier so records can be distinguished from one another and duplication can be controlled.',
        },
        'ict_f_081': {
            'question': 'Which statement best describes the civil service role in supporting good governance?',
            'options': [
                'Obstruction of government policy implementation.',
                'Exclusive formulation of all government policies.',
                'Passive observation of governance without participation.',
                'Support for public administration consistent with good-governance attributes.',
            ],
            'explanation': 'The civil service supports good governance by helping public administration operate in line with recognised attributes such as accountability, transparency, responsiveness, and rule-based procedure.',
        },
        'ict_f_089': {
            'question': 'What does Rule 010101 imply when contract terms conflict with the Public Service Rules?',
            'options': [
                'The PSR becomes only advisory guidance.',
                'Approved contract terms can prevail over the PSR in that appointment.',
                'Exceptions can only be created personally by the Head of Service.',
                'The PSR always overrides every written contract term.',
            ],
            'explanation': 'Rule 010101 provides that the Public Service Rules apply except where they conflict with specific terms approved by the Federal Government and written into the contract or letter of appointment.',
        },
        'ict_f_098': {
            'question': 'Which outcome best reflects the civil service contribution to good governance?',
            'options': [
                'Direct control of all policy formulation.',
                'Deliberate obstruction of policy implementation.',
                'Withdrawal from active participation in administration.',
                'Administration carried out in line with good-governance principles.',
            ],
            'explanation': 'A core contribution of the civil service to good governance is helping ensure administration reflects principles such as accountability, responsiveness, transparency, and lawful procedure.',
        },
        'ict_f_100': {
            'question': 'Which statement correctly defines a key civil service role in good governance?',
            'options': [
                'Acting as political opposition to the government.',
                'Formulating all government policies without other institutions.',
                'Ensuring administration reflects the recognised attributes of good governance.',
                'Managing every social conflict in the country directly.',
            ],
            'explanation': 'The civil service contributes to good governance by helping ensure that public administration reflects recognised governance attributes rather than acting as a political opposition or sole policy maker.',
        },
        'ict_eg_062': {
            'question': 'What is the key difference between IPPIS and GIFMIS?',
            'options': [
                'IPPIS handles personnel and payroll, while GIFMIS handles budget execution and financial reporting.',
                'IPPIS handles government assets, while GIFMIS handles public debt only.',
                'IPPIS handles revenue collection, while GIFMIS handles tax policy only.',
                'IPPIS and GIFMIS perform exactly the same function.',
            ],
            'explanation': 'IPPIS is designed for personnel and payroll management, while GIFMIS supports budget execution and financial reporting, so the two systems serve different administrative functions.',
        },
        'ict_e_governance_gen_001': {
            'question': 'What is the best first step in an e-governance compliance review?',
            'options': [
                'Verification of service controls and supporting documentation before go-live.',
                'Deferral of documentation until after implementation.',
                'Use of different review standards for similar cases.',
                'Bypassing of review controls to save time.',
            ],
            'explanation': 'An e-governance compliance review should begin with checking service controls and supporting documentation so there is evidence that the system meets requirements before implementation.',
        },
        'ict_eg_083': {
            'question': 'What is a key public-service role in promoting good governance?',
            'options': [
                'Ensuring administration is carried out in line with good-governance principles.',
                'Formulating all government policies alone.',
                'Acting as an opposition party to government.',
                'Managing every conflict in society directly.',
            ],
            'explanation': 'A key role of the public service in good governance is helping ensure that administration is conducted in line with recognised governance principles and established public procedures.',
        },
        'ict_sec_056': {
            'question': 'What does non-repudiation mean in digital security?',
            'options': [
                'Proof that the sender cannot deny the action or message.',
                'Automatic end-to-end encryption for all data.',
                'Operation of a system without network connection.',
                'Compression of a file before transmission.',
            ],
            'explanation': 'Non-repudiation provides evidence that a particular sender performed an action or sent a message, so the sender cannot later deny it credibly.',
        },
        'ict_security_gen_001': {
            'question': 'Which action best demonstrates digital security governance?',
            'options': [
                'Use of approved security procedures with complete records.',
                'Inconsistent application of rules based on preference.',
                'Bypassing of review controls for convenience.',
                'Preference for speed over policy compliance.',
            ],
            'explanation': 'Digital security governance depends on applying approved procedures and keeping complete records so security controls remain consistent, traceable, and auditable.',
        },
        'ict_security_gen_002': {
            'question': 'What should come first in a digital security review?',
            'options': [
                'Checking access, audit, and incident controls before implementation.',
                'Postponing documentation until after implementation.',
                'Using different review standards for similar cases.',
                'Skipping review controls to save time.',
            ],
            'explanation': 'A digital security review should begin by checking access, audit, and incident controls so the system is assessed from a control and accountability perspective before implementation.',
        },
        'ict_sec_079': {
            'question': 'How should a strong-room or reserve cash safe be secured when it contains cash, stamps, or licence books?',
            'options': [
                'With at least two locks and different officers holding the keys.',
                'With one lock held by the cashier alone.',
                'With a simple padlock only.',
                'With no lock if the room itself is guarded.',
            ],
            'explanation': 'The regulation requires not less than two locks with the keys held by different officers so a strong-room or reserve cash safe cannot be accessed by one person acting alone.',
        },
        'ict_sec_095': {
            'question': 'Who may open a strong-room or safe under Financial Regulation 1118?',
            'options': [
                'Authorised key holders who remain present while it is open.',
                'Any officer who happens to be on duty.',
                'The cashier acting alone.',
                'Security staff without the authorised key holders.',
            ],
            'explanation': 'Financial Regulation 1118 limits access to authorised key holders, and they must remain present while the strong-room or safe is open so control over access is maintained.',
        },
        'ict_sec_096': {
            'question': 'What approval is required for journeys outside office hours, weekends, or public holidays?',
            'options': [
                'Written permission from the Accounting Officer or an authorised delegate.',
                'No approval requirement at all.',
                'Approval from the police authority.',
                'Approval only from a junior officer in the unit.',
            ],
            'explanation': 'Journeys outside office hours, on weekends, or on public holidays require written permission from the Accounting Officer or a properly delegated representative before the travel is undertaken.',
        },
        'ict_sec_099': {
            'question': 'What is the minimum lock requirement for a strong-room or reserve cash safe?',
            'options': [
                'Not less than two locks with keys held by different officers.',
                'One lock held only by the cashier.',
                'A simple padlock as the sole safeguard.',
                'No lock where a guard is on duty.',
            ],
            'explanation': 'The minimum standard is not less than two locks, with the keys held by different officers, so access to the strong-room or reserve cash safe remains jointly controlled.',
        },
        'ict_li_051': {
            'question': 'Which practice helps reduce noise interference during official virtual meetings?',
            'options': [
                'Use of mute controls according to the meeting agreement.',
                'Continuous use of loudspeaker output throughout the meeting.',
                'Routine use of satellite phones as the standard control.',
                'Keeping every participant microphone open at all times.',
            ],
            'explanation': 'Using mute controls according to the meeting agreement helps reduce extraneous noise and keeps official virtual meetings orderly and intelligible.',
        },
        'ict_li_072': {
            'question': 'What is the rule when an officer on approved training is being paid by an overseas employer?',
            'options': [
                'Automatic payment of both Nigerian and overseas salaries.',
                'Federal Government emoluments or allowances are not payable unless specifically approved.',
                'Mandatory remittance of the overseas salary to the Treasury.',
                'Immediate cessation of all Nigerian emoluments in every case.',
            ],
            'explanation': 'Where an officer on approved training is receiving salary from an overseas employer, Federal Government emoluments or allowances are not payable unless specific approval has been granted.',
        },
        'ict_literacy_innovation_gen_004': {
            'question': 'Which practice best supports cybersecurity hygiene in digital literacy and innovation work?',
            'options': [
                'Least-privilege access, timely patching, and incident reporting.',
                'Routine treatment of exceptions without documentation.',
                'Closure of cases before required checks are completed.',
                'Reliance on informal instructions instead of documented controls.',
            ],
            'explanation': 'Cybersecurity hygiene is strongest when user access is limited appropriately, systems are patched promptly, and incidents are reported through approved control processes.',
        },
        'ict_literacy_innovation_gen_007': {
            'question': 'Which practice best supports business continuity in digital literacy and innovation work?',
            'options': [
                'Prepared backup, recovery, and resilience arrangements.',
                'Dependence on a single point of failure without recovery planning.',
                'Undocumented exceptions left unresolved.',
                'Preference for convenience over resilience controls.',
            ],
            'explanation': 'Business continuity depends on having backup, recovery, and resilience arrangements ready for use so service can continue or be restored after disruption.',
        },
        'ict_literacy_innovation_gen_008': {
            'question': 'Which practice best supports responsible technology adoption in public service?',
            'options': [
                'Deployment supported by training, controls, and user assistance.',
                'Uncontrolled rollout without user support.',
                'Informal deployment outside the approved process.',
                'Convenience placed ahead of review and support controls.',
            ],
            'explanation': 'Responsible technology adoption requires controlled deployment, user training, and support so the system can be used effectively and within approved governance arrangements.',
        },
        'ict_li_089': {
            'question': 'Which practice is required when officers handle Executive Council papers?',
            'options': [
                'Careful verification of the facts, figures, and data provided.',
                'Treating the papers as routine and unimportant.',
                'Assuming close review is unnecessary.',
                'Ignoring them unless personally addressed to the officer.',
            ],
            'explanation': 'Executive Council papers support high-level policy decisions, so officers must verify the facts, figures, and data carefully before the papers proceed for consideration.',
        },
    },
}


def update_file(path: Path, rewrites: dict[str, dict[str, object]]) -> list[str]:
    data = json.loads(path.read_text(encoding='utf-8'))
    updated: list[str] = []

    def walk(node):
        if isinstance(node, dict):
            qid = node.get('id')
            if qid in rewrites:
                node.update(rewrites[qid])
                updated.append(qid)
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)

    walk(data)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    return updated


def main() -> None:
    total = 0
    for path, rewrites in FILES.items():
        updated = update_file(path, rewrites)
        print(f'Updated {len(updated)} questions in {path.name}')
        for qid in updated:
            print(qid)
        total += len(updated)
    print(f'Total updated: {total}')


if __name__ == '__main__':
    main()
