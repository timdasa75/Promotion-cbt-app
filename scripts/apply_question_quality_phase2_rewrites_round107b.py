#!/usr/bin/env python3
import json
from pathlib import Path

path = Path('data/civil_service_ethics.json')
data = json.loads(path.read_text(encoding='utf-8'))

for sub in data.get('subcategories', []):
    for q in sub.get('questions', []):
        if q.get('id') == 'ethics_097':
            q['question'] = 'What may the Board of Survey\'s findings reveal about an officer in charge?'
            q['explanation'] = 'The findings may reveal discrepancies for which the officer in charge remains accountable until the matter is resolved satisfactorily.'
            q['keywords'] = ['board_of_survey', 'officer_in_charge', 'discrepancies', 'accountability']
        if q.get('id') == 'csh_sdg_060':
            q['question'] = 'What should a handing-over note give to a successor?'
            q['explanation'] = 'A handing-over note should give the successor a clear guide to the duties, responsibilities, files, and important matters attached to the post.'
            q['keywords'] = ['handing_over_note', 'successor', 'duties_and_responsibilities', 'continuity']

path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Applied round 107B duplicate cleanup.')
