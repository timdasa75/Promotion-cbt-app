import json
from pathlib import Path

path = Path('data/constitutional_foi.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'clg_constitutional_governance_gen_060': {
        'question': 'What distinguishes the Civil Service from elected officials such as members of the National Assembly?',
        'options': ['Civil servants are not paid salaries.', 'Civil servants serve only short fixed terms.', 'The Civil Service enjoys continuity of existence.', 'The Civil Service has no pool of experience.'],
        'explanation': 'A key distinction is that the Civil Service enjoys continuity of existence. Unlike elected officials who serve limited terms, the Civil Service remains in place as a permanent institution that carries administrative experience forward.',
        'keywords': ['civil_service', 'continuity_of_existence', 'elected_officials', 'constitutional_governance']
    },
    'clg_constitutional_governance_gen_070': {
        'question': 'What must all civil servants take on entry into service?',
        'options': ['A pledge of allegiance.', 'An Oath of Office.', 'An Oath of Secrecy.', 'A vow of poverty.'],
        'explanation': 'All civil servants are required to take an Oath of Secrecy. The item therefore tests the formal undertaking tied to responsible handling of official information in public service.',
        'keywords': ['oath_of_secrecy', 'civil_service_entry', 'official_information', 'public_service_rules']
    },
    'clg_constitutional_governance_gen_071': {
        'question': 'Which oath are civil servants required to take?',
        'options': ['A vow of poverty.', 'An Oath of Secrecy.', 'An Oath of Office.', 'A pledge of allegiance.'],
        'explanation': 'Civil servants are required to take an Oath of Secrecy. The oath underlines the duty to protect official information and handle government records responsibly.',
        'keywords': ['civil_servants', 'oath_of_secrecy', 'official_records', 'service_obligation']
    },
    'clg_constitutional_governance_gen_082': {
        'question': 'Which oath is compulsory for all civil servants?',
        'options': ['An Oath of Office.', 'A vow of poverty.', 'A pledge of allegiance.', 'An Oath of Secrecy.'],
        'explanation': 'The compulsory oath for all civil servants is the Oath of Secrecy. The question therefore tests the formal confidentiality obligation attached to public service.',
        'keywords': ['compulsory_oath', 'oath_of_secrecy', 'civil_service_confidentiality', 'public_service']
    },
    'clg_constitutional_governance_gen_083': {
        'question': 'What oath must a civil servant take to formalize the duty of confidentiality?',
        'options': ['An Oath of Office.', 'A pledge of allegiance.', 'A vow of poverty.', 'An Oath of Secrecy.'],
        'explanation': 'A civil servant formalizes the duty of confidentiality by taking the Oath of Secrecy. The item therefore tests the oath linked to safeguarding official information.',
        'keywords': ['confidentiality', 'oath_of_secrecy', 'civil_service_ethics', 'official_information']
    },
    'clg_legal_compliance_gen_062': {
        'question': 'What is the purpose of the Oath of Secrecy sworn by some civil servants?',
        'options': ['To hide personal assets from the public.', 'To prevent them from talking to the media.', 'To ensure loyalty to a political party.', 'To protect government secrets and classified information.'],
        'explanation': 'The purpose of the Oath of Secrecy is to protect government secrets and classified information. It is required of officers who handle sensitive information so that confidentiality duties are formally acknowledged.',
        'keywords': ['oath_of_secrecy', 'classified_information', 'government_secrets', 'legal_compliance']
    },
    'clg_legal_compliance_gen_063': {
        'question': 'What does the Oath of Secrecy require a civil servant to protect?',
        'options': ['Loyalty to a political party.', 'Government secrets and classified information.', 'Freedom to speak to the media at any time.', 'Private assets of officers.'],
        'explanation': 'The Oath of Secrecy requires a civil servant to protect government secrets and classified information. The item therefore tests the confidentiality purpose of the oath rather than political loyalty or media control.',
        'keywords': ['oath_of_secrecy', 'confidentiality', 'government_secrets', 'classified_information']
    },
    'clg_legal_compliance_gen_065': {
        'question': 'What is the chairman expected to do when summarizing the conclusions of a meeting?',
        'options': ['Do it quickly without consultation.', 'Summarize only the points he agrees with.', 'Summarize the conclusions to the agreement of the other members.', 'Write the summary alone and show it to no one.'],
        'explanation': 'The chairman is expected to summarize the conclusions of the meeting to the agreement of the other members. This helps the secretariat capture the agreed position accurately in the minutes.',
        'keywords': ['chairman', 'meeting_conclusions', 'minutes', 'meeting_procedure']
    },
    'clg_legal_compliance_gen_069': {
        'question': 'If further grounds for dismissal emerge during a disciplinary inquiry, what must the FCSC give the officer?',
        'explanation': 'If further grounds for dismissal are disclosed during an inquiry, the FCSC must furnish the officer with a written statement of the new grounds and repeat the due-process steps applicable to the original grounds. The item therefore tests the fairness safeguard built into disciplinary procedure.',
        'keywords': ['fcsc', 'disciplinary_inquiry', 'new_grounds_for_dismissal', 'due_process']
    },
    'clg_legal_compliance_gen_072': {
        'question': 'How should a chairman summarize the conclusions of a meeting?',
        'options': ['To summarize the conclusions to the agreement of the other members.', 'To do it quickly without consultation.', 'To write the summary alone and not show it to anyone.', 'To summarize only the points he agrees with.'],
        'explanation': 'A chairman should summarize the conclusions to the agreement of the other members. That shared confirmation helps ensure that the minutes reflect the meeting\'s actual decisions.',
        'keywords': ['chairman', 'meeting_summary', 'agreement_of_members', 'minutes']
    },
    'clg_legal_compliance_gen_073': {
        'question': 'Which procurement method is the statutory default for goods, works, and services because it promotes transparency and fair competition?',
        'explanation': 'Open Competitive Bidding is the statutory default and preferred method for the procurement of goods, works, and services because it promotes transparency and fair competition. The item therefore tests the standard procurement method recognized in law.',
        'keywords': ['open_competitive_bidding', 'procurement_method', 'transparency', 'fair_competition']
    },
    'clg_legal_compliance_gen_075': {
        'question': 'Which action most directly strengthens public accountability in legal and statutory compliance work?',
        'explanation': 'Public accountability is strengthened when decisions are traceable and justified with evidence. In legal and statutory compliance work, that makes it easier to review whether the decision followed proper authority and process.',
        'keywords': ['public_accountability', 'statutory_compliance', 'traceable_decisions', 'evidence_based_justification']
    },
    'clg_legal_compliance_gen_079': {
        'question': 'Which practice best supports risk control in legal and statutory compliance work?',
        'explanation': 'Risk control is best supported by identifying risks early, applying the necessary controls, and documenting mitigation. That keeps legal and statutory compliance work reviewable and less vulnerable to preventable failure.',
        'keywords': ['risk_control', 'legal_compliance', 'documented_mitigation', 'statutory_compliance']
    },
    'FOI_AO_053': {
        'question': 'When should fees for invigilators and examiners be processed and paid?',
        'options': ['Immediately after the examination.', 'Before the examination.', 'As soon as the claim is submitted and approved.', 'After the examination results are released.'],
        'explanation': 'Fees for invigilators and examiners should be processed and paid as soon as the claim has been submitted and approved. The item therefore tests the normal public-service payment principle that verified claims are paid upon approval.',
        'keywords': ['invigilator_fees', 'examiner_fees', 'claim_approval', 'payment_processing']
    },
    'FOI_AO_056': {
        'question': 'What is the role of classifying documents in the Civil Service?',
        'options': ['To hide their contents from other Ministries.', 'To alert officers to the degree of care required for each document.', 'To make them difficult to access.', 'To prevent new staff from seeing them.'],
        'explanation': 'The role of classifying documents is to alert officers to the degree of care required for each one. Classification therefore guides handling standards rather than merely hiding information.',
        'keywords': ['document_classification', 'degree_of_care', 'civil_service_records', 'handling_standards']
    },
    'FOI_AO_069': {
        'question': 'What should be attached to a meeting notice and agenda?',
        'explanation': 'The minutes of the last meeting and any other relevant documents should be attached to the notice and agenda. That helps members prepare properly and keeps discussion linked to the existing record.',
        'keywords': ['notice_and_agenda', 'meeting_minutes', 'relevant_documents', 'meeting_preparation']
    },
    'FOI_AO_071': {
        'question': 'Which practice should an accountable officer prioritize to balance access rights and legal exemptions under the FOI Act?',
        'explanation': 'An accountable officer should apply exemptions narrowly and justify decisions with a legal basis. That approach respects the right of access while preserving the limited protections recognized by the Act.',
        'keywords': ['foi_rights_balancing', 'narrow_exemptions', 'legal_basis', 'accountable_officer']
    },
    'FOI_AO_072': {
        'question': 'Which action best demonstrates compliance with FOI access obligations?',
        'explanation': 'Compliance with FOI access obligations is demonstrated by responding to information requests within the legal timelines. The item therefore tests the practical behavior that reflects respect for the right of access.',
        'keywords': ['foi_access_obligations', 'legal_timelines', 'information_requests', 'compliance']
    }
}
changed = 0
for sub in data.get('subcategories', []):
    for q in sub.get('questions', []):
        update = updates.get(q.get('id'))
        if not update:
            continue
        q.update(update)
        changed += 1
if changed != len(updates):
    raise RuntimeError(f'Expected {len(updates)} updates, applied {changed}')
path.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
print(f'Applied {changed} weak-framing rewrites in constitutional-law round 58.')
