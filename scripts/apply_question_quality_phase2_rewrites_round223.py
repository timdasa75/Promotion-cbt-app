from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REWRITES = {
    ROOT / 'data' / 'civil_service_ethics.json': {
        'csh_ap_051': {
            'question': 'What must a ministry do after making an acting appointment?',
            'options': [
                'Conduct a fresh promotion exercise.',
                'Inform the Federal Civil Service Commission about the acting appointment.',
                'Give the officer a written test.',
                'Obtain approval from the Head of the Civil Service of the Federation.',
            ],
            'keywords': ['acting appointment', 'ministry duty', 'federal civil service commission', 'notification'],
        },
        'csh_ap_053': {
            'question': 'What principle of financial management is supported by the detailed pension accounting procedures in Chapter 19?',
            'options': [
                'Centralized control.',
                'Transparency and accountability in public finance.',
                'Minimizing documentation.',
                'Discretionary spending.',
            ],
            'keywords': ['pension accounting', 'financial regulations', 'public finance', 'accountability'],
        },
        'csh_ap_054': {
            'question': 'What do the Schemes of Service indicate for each cadre?',
            'options': [
                'The correct nomenclature, salary grade levels, qualifications for entry, and schedule of duties for each cadre.',
                'The amount of pension to be paid to retired officers.',
                'The disciplinary procedures for all civil servants.',
                'The number of staff to be recruited each year.',
            ],
            'keywords': ['schemes of service', 'cadre', 'salary grade level', 'schedule of duties'],
        },
        'csh_ap_057': {
            'question': 'When does an acting appointment take effect?',
            'keywords': ['acting appointment', 'effective date', 'assumption of duties', 'administrative procedure'],
        },
        'csh_ap_058': {
            'question': 'What happens when an officer on acting appointment proceeds on casual or special leave?',
            'keywords': ['acting appointment', 'casual leave', 'special leave', 'acting duties'],
        },
        'csh_ap_060': {
            'question': 'What is the principal objective of the Financial Regulations as stated in the preface?',
            'options': [
                'To guarantee probity and transparency in the control and management of public funds and resources.',
                'To reduce the number of public servants.',
                'To increase government revenue.',
                'To simplify administrative processes.',
            ],
            'keywords': ['financial regulations', 'preface', 'public funds', 'probity and transparency'],
        },
        'csh_ap_061': {
            'question': 'What must a relieving officer do during the handover of keys and contents?',
            'options': [
                'Accept without verification.',
                'Discard old records.',
                'Verify the contents and sign the certificate of handing-over.',
                'Report any discrepancies later.',
            ],
            'keywords': ['handover', 'relieving officer', 'keys and contents', 'certificate of handing-over'],
        },
        'csh_ap_063': {
            'question': 'Why does the Subsidiary Account Pension Unit function independently?',
            'options': [
                'It simplifies the overall accounting workflow.',
                'It guarantees specialization and clear accountability for pension-related financial procedures.',
                'It prevents any external audits.',
                'It allows for less oversight.',
            ],
            'keywords': ['subsidiary account pension unit', 'specialization', 'accountability', 'pension procedures'],
        },
        'csh_ap_064': {
            'question': 'What is the chief duty of the Executive arm of Government?',
            'options': [
                'Monitoring revenue accruals only.',
                'Adjudication of disputes.',
                'Day-to-day management of Government, including policy formulation and execution.',
                'Law making and confirmation of appointments.',
            ],
            'keywords': ['executive arm', 'government', 'policy execution', 'day-to-day management'],
        },
        'csh_ap_066': {
            'question': 'Which characteristic of good governance emphasizes fair legal frameworks enforced impartially?',
            'options': [
                'Rule of Law',
                'Accountability',
                'Transparency',
                'Participation',
            ],
            'keywords': ['good governance', 'rule of law', 'legal frameworks', 'impartial enforcement'],
        },
        'csh_ap_067': {
            'question': 'Which of the following is an example of non-tax revenue?',
            'options': [
                'Operating surplus from parastatals.',
                'Excise duties.',
                'Purchase tax.',
                'Import duties.',
            ],
            'keywords': ['non-tax revenue', 'government income', 'parastatals', 'public finance'],
        },
        'csh_ap_069': {
            'question': 'Which areas of government activity did the Due Process policy target for transparency and accountability?',
            'keywords': ['due process policy', 'public procurement', 'budgeting', 'financial operations'],
        },
        'csh_ap_070': {
            'question': 'What personnel-related duty does the Board of a Parastatal perform?',
            'keywords': ['parastatal board', 'staff appointment', 'promotion approval', 'personnel oversight'],
        },
        'csh_ap_074': {
            'question': 'Under the Principle of Accountability, what must public officers be personally accountable for?',
            'options': [
                'The actions of the government as a whole.',
                'The actions of their colleagues.',
                'The decisions of the Minister.',
                'Their individual actions or omissions in the performance of their duties.',
            ],
            'keywords': ['principle of accountability', 'public officers', 'actions or omissions', 'official duties'],
        },
        'csh_ap_075': {
            'question': 'What does e-governance mean in service delivery?',
            'options': [
                'A new form of government.',
                'A system of political appointments.',
                'A method for organizing government meetings.',
                'The application of appropriate information and communication technologies.',
            ],
            'keywords': ['e-governance', 'service delivery', 'information and communication technologies', 'digital government'],
        },
        'csh_ap_079': {
            'question': 'Which action best preserves due procedure and an auditable outcome in a time-sensitive negotiation file?',
            'keywords': ['negotiation file', 'due procedure', 'documented commitments', 'audit trail'],
        },
        'csh_ap_080': {
            'question': 'Which action best preserves planning discipline in a time-sensitive official file?',
            'keywords': ['official file', 'planning discipline', 'timelines', 'performance measures'],
        },
        'csh_ap_085': {
            'question': 'What does a file minute usually begin with?',
            'keywords': ['file minute', 'matter at issue', 'official minute', 'administrative writing'],
        },
        'csh_ap_105': {
            'question': 'What should a handing-over note provide to the incoming officer?',
            'options': [
                'Details of the projects, files, and responsibilities of the post for the successor.',
                'A record of all the money spent by the officer.',
                'A list of all official meetings.',
                'A log of the officer''s personal assets.',
            ],
            'keywords': ['handing-over note', 'incoming officer', 'projects and files', 'continuity of work'],
        },
        'csh_ap_106': {
            'question': "Who is described as the 'Officer Taking Over' in a handing-over note?",
            'keywords': ['handing-over note', 'officer taking over', 'incoming officer', 'assumption of post'],
        },
        'csh_ap_107': {
            'question': 'In a handing-over note, who assumes responsibility for taking over the post?',
            'keywords': ['handing-over note', 'taking over', 'incoming officer', 'post transition'],
        },
        'csh_ap_117': {
            'question': 'What is a key aim of a handing-over note?',
            'options': [
                'To guarantee a smooth transition of responsibilities from one officer to another.',
                'To document all the money spent by an officer.',
                'To provide a list of all official meetings.',
                'To detail the personal assets of the officer.',
            ],
            'keywords': ['handing-over note', 'transition of responsibilities', 'administrative continuity', 'succession'],
        },
        'csh_ap_118': {
            'question': 'What is the objective of a handing-over note?',
            'options': [
                'To provide a list of all official meetings.',
                'To detail the projects, files, and responsibilities of a position for a successor.',
                'To document all the money spent by an officer.',
                'To document the personal assets of an officer.',
            ],
            'keywords': ['handing-over note', 'successor', 'projects and files', 'position responsibilities'],
        },
        'csh_ap_120': {
            'question': 'What abbreviation should appear at the foot of an official letter when there are enclosures?',
            'options': [
                'Ref. or Refs.',
                'App. or Apps.',
                'Enc. or Encs.',
                'Att. or Atts.',
            ],
            'keywords': ['official letter', 'enclosures', 'abbreviation', 'letter foot'],
        },
        'csh_ap_121': {
            'question': 'Which abbreviation indicates enclosures at the foot of an official letter?',
            'options': [
                'Att. or Atts.',
                'Enc. or Encs.',
                'Ref. or Refs.',
                'App. or Apps.',
            ],
            'keywords': ['official letter', 'enclosures', 'Enc. or Encs.', 'letter format'],
        },
        'csh_ap_123': {
            'question': 'Why do official files keep separate "Minutes" and "Correspondence" sides?',
            'options': [
                'To guarantee a clear distinction between the official notes of officers and the documents received or sent out.',
                'To make the file easier to read.',
                'To make the file thicker.',
                'To hide the minutes from the public.',
            ],
            'keywords': ['official file', 'minutes side', 'correspondence side', 'file structure'],
        },
        'csh_ap_124': {
            'question': 'What key role does a handing-over note serve?',
            'options': [
                'To detail the personal assets of the officer.',
                'To provide a list of all official meetings.',
                'To guarantee a smooth transition of responsibilities from one officer to another.',
                'To document all the money spent by an officer.',
            ],
            'keywords': ['handing-over note', 'role', 'smooth transition', 'responsibility transfer'],
        },
        'csh_ap_125': {
            'question': 'What should a handing-over note focus on for the incoming officer?',
            'options': [
                'The projects, files, and responsibilities of the position for the successor.',
                'A list of all official meetings.',
                'All the money spent by the officer.',
                'The personal assets of the officer.',
            ],
            'keywords': ['handing-over note', 'incoming officer', 'projects files responsibilities', 'successor'],
        },
        'csh_ap_126': {
            'question': 'What is the objective of separating the "Minutes" and "Correspondence" sides of a file?',
            'options': [
                'To hide the minutes from the public.',
                'To secure a clear distinction between the official notes of officers and the documents received or sent out.',
                'To make the file easier to read.',
                'To make the file thicker.',
            ],
            'keywords': ['file sides', 'minutes and correspondence', 'official notes', 'received or sent documents'],
        },
        'csh_ap_128': {
            'question': 'What should a registry do when it receives classified material addressed to another ministry?',
            'options': [
                'Forward it immediately to the intended recipient without recording.',
                'Publish its contents internally.',
                'Open and read it.',
                'Document receipt and dispatch it through a secure channel to the intended ministry.',
            ],
            'keywords': ['registry', 'classified material', 'secure dispatch', 'document receipt'],
        },
        'csh_ap_153': {
            'question': 'Which record is used primarily to track the usage of government vehicles?',
            'keywords': ['vehicle logbook', 'government vehicles', 'usage tracking', 'transport records'],
        },
        'csh_ap_155': {
            'question': 'Which recordkeeping practice best supports an official case file during review?',
            'keywords': ['case file', 'recordkeeping', 'movement entries', 'control points'],
        },
        'csh_ap_226': {
            'question': 'Which action best preserves operational discipline when distributing a time-sensitive planning file?',
            'keywords': ['planning file', 'distribution stage', 'release record', 'office notification'],
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
    for path, rewrites in REWRITES.items():
        updated = update_file(path, rewrites)
        print(f'Updated {len(updated)} questions in {path.name}')
        for qid in updated:
            print(qid)
        total += len(updated)
    print(f'Total updated: {total}')


if __name__ == '__main__':
    main()


