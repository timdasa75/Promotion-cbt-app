import json
from pathlib import Path

path = Path('data/civil_service_ethics.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'csh_principle_052': {
        'question': 'Which conduct is expressly forbidden under the Principle of Integrity?',
        'explanation': 'The Principle of Integrity expressly forbids using public office for personal gain. That includes nepotism, corruption, influence peddling, and illicit enrichment, all of which undermine fairness and public trust.',
        'keywords': ['principle_of_integrity', 'forbidden_conduct', 'corruption', 'illicit_enrichment'],
    },
    'eth_code_conduct_gen_065': {
        'question': 'Which action violates the Principle of Integrity in public service?',
        'explanation': 'The Principle of Integrity is violated when an officer uses public office for personal gain. Nepotism, corruption, influence peddling, and illicit enrichment fall squarely within that prohibition.',
        'keywords': ['integrity_violation', 'public_office_abuse', 'nepotism', 'corruption'],
    },
    'csh_duty_060': {
        'question': 'Under the cited rule, what share of recruitment must be reserved for persons with disabilities?',
        'explanation': 'The rule cited in the item requires that five percent of recruitment be reserved for persons with disabilities. The concept being tested is the specific quota set by the rule.',
        'keywords': ['disability_recruitment_quota', 'five_percent', 'inclusive_recruitment', 'quota_requirement'],
    },
    'ethics_088': {
        'question': 'What quota for persons with disabilities does the rule cited in this item require in public-service recruitment?',
        'explanation': 'The rule cited in the item requires a five percent quota for persons with disabilities in recruitment. The point being tested is the mandated proportion, not a general definition of inclusion.',
        'keywords': ['disability_quota', 'five_percent', 'inclusive_recruitment', 'public_service_recruitment'],
    },
    'ethics_094': {
        'question': 'Which duty do Sub-Accounting Officers owe in relation to receipt and licence books?',
        'explanation': 'Sub-Accounting Officers owe a duty to keep receipt and licence books in safe custody and ensure they are properly used. That control protects official revenue documents from misuse, loss, and unauthorized handling.',
        'keywords': ['sub_accounting_officers', 'receipt_books', 'licence_books', 'safe_custody_duty'],
    },
    'ethics_107': {
        'question': 'What control must Sub-Accounting Officers maintain over receipt and licence books?',
        'explanation': 'Sub-Accounting Officers must maintain safe custody and proper use of receipt and licence books. Those controls help prevent misuse, loss, and unauthorized handling of official revenue documents.',
        'keywords': ['sub_accounting_officer', 'receipt_books', 'licence_books', 'document_control'],
    },
}
changed = 0
for subcategory in data.get('subcategories', []):
    for question in subcategory.get('questions', []):
        update = updates.get(question.get('id'))
        if not update:
            continue
        question.update(update)
        changed += 1

expected = len(updates)
if changed != expected:
    raise RuntimeError(f'Expected {expected} updates, applied {changed}')

path.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
print(f'Applied {changed} duplicate-cleanup rewrites.')
