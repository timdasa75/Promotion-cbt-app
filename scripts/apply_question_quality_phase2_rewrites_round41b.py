import json
from pathlib import Path
path = Path('data/psr_rules.json')
data = json.loads(path.read_text(encoding='utf-8'))
changed = 0
for subcategory in data.get('subcategories', []):
    for question in subcategory.get('questions', []):
        if question.get('id') != 'psr_docx_168':
            continue
        question['question'] = 'How is the personal use of government property regarded under public-service ethics?'
        question['explanation'] = 'Under public-service ethics, using government property for personal purposes is regarded as a breach of the Code of Conduct because public assets must be used only for official duties. The item therefore tests recognition of that ethical breach.'
        question['keywords'] = ['government_property', 'personal_use', 'public_service_ethics', 'code_of_conduct_breach']
        changed += 1
if changed != 1:
    raise RuntimeError(f'Expected 1 update, applied {changed}')
path.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
print('Applied 1 duplicate-cleanup rewrite.')
