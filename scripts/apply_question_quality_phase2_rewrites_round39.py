import json
from pathlib import Path

path = Path('data/civil_service_ethics.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'csh_pt_003': {
        'question': 'Under which PSR rule is the standard incremental date for an officer appointed or promoted in the Federal Public Service set out?',
        'explanation': 'PSR Rule 040203 sets out the standard incremental date for an officer appointed or promoted in the Federal Public Service. It is the specific rule that governs how the incremental date is fixed in that situation.',
        'keywords': ['incremental_date', 'psr_rule_040203', 'appointment_promotion', 'standard_incremental_date'],
    },
    'csh_pt_037': {
        'question': 'Under which PSR rules are the definition and objectives of staff development set out?',
        'explanation': 'PSR Rule 070101 states what staff development means, while Rule 070102 sets out its objectives. Together, those two rules provide the definition and purpose of staff development in the public service.',
        'keywords': ['staff_development', 'psr_rules_070101_070102', 'training_policy', 'staff_development_objectives'],
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
print(f'Applied {changed} definition-alignment rewrites.')
