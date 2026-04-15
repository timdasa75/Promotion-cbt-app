import json
from pathlib import Path

updates_by_file = {
    'data/core_competencies.json': {
        'competency_verbal_074': {
            'question': 'Which record is primarily used to track the usage of government vehicles?',
            'explanation': 'Government vehicle usage is primarily tracked through logbooks. Financial Regulations on transport management emphasize keeping the logbook up to date so journeys, mileage, and authorized use can be monitored properly.',
            'keywords': ['vehicle_logbook', 'government_vehicles', 'usage_tracking', 'transport_records']
        },
        'competency_verbal_076': {
            'question': 'What is the ultimate aim of a due-process workflow policy designed to eliminate waste?',
            'options': ['To prolong the duration of projects.', 'To secure value for money.', 'To increase government bureaucracy.', 'To increase government spending.'],
            'explanation': 'A due-process workflow policy aims to eliminate waste so that public spending delivers value for money. The item therefore tests the core procurement and governance objective linked to waste reduction.',
            'keywords': ['due_process', 'value_for_money', 'waste_reduction', 'public_spending']
        }
    },
    'data/constitutional_foi.json': {
        'FOI_AO_062': {
            'question': 'What term is used for a specific, objectively assessable, non-personality-based academic or factual idea?',
            'options': ['A skill.', 'A principle.', 'A concept.', 'A regulation.'],
            'explanation': 'A concept is a specific, objectively assessable academic or factual idea. The item therefore tests recognition of the general term used for that kind of idea or topic.',
            'keywords': ['concept', 'academic_idea', 'factual_topic', 'objective_assessment']
        },
        'FOI_OP_014': {
            'question': 'Under Section 29 of the FOI Act, falsification of public records by an officer constitutes what?',
            'explanation': 'Section 29 of the Freedom of Information Act treats falsification of public records by an officer as a criminal offense. The item therefore tests the legal status of that conduct under the Act.',
            'keywords': ['foi_act_section_29', 'falsification_of_records', 'criminal_offense', 'public_records']
        },
        'FOI_OP_022': {
            'question': 'Which act is treated as a criminal offense under Section 29 of the FOI Act?',
            'explanation': 'Section 29 of the Freedom of Information Act identifies falsification of public records as a criminal offense. The item therefore tests recognition of the conduct specifically penalized by that section.',
            'keywords': ['foi_section_29', 'criminal_action', 'falsification_of_public_records', 'foi_offences']
        },
        'clg_legal_compliance_gen_066': {
            'question': 'What does the phrase "For the attention of" mean in official correspondence?',
            'options': ['To address the public.', 'To address a specific person within a department.', 'To address the Chairman.', 'To address a specific department.'],
            'explanation': 'The phrase "For the attention of" is used when a letter is addressed to an organization or department but is intended for a specific person within it. The item therefore tests the correspondence purpose of that phrase.',
            'keywords': ['for_the_attention_of', 'official_correspondence', 'specific_person', 'departmental_letter']
        },
        'clg_gc_095': {
            'question': 'Under the PSR definition, what is excluded from working hours?',
            'explanation': 'The Public Service Rules definition of working hours excludes all officially recognized break periods. The item therefore tests the aspect that is left out when calculating official working hours under the rule.',
            'keywords': ['psr_working_hours', 'break_periods', 'rule_16_45', 'official_time']
        }
    }
}

def apply_updates(path_str, updates):
    path = Path(path_str)
    data = json.loads(path.read_text(encoding='utf-8'))
    changed = set()
    def walk(obj):
        if isinstance(obj, dict):
            qid = obj.get('id')
            if qid in updates:
                obj.update(updates[qid])
                changed.add(qid)
            for value in obj.values():
                walk(value)
        elif isinstance(obj, list):
            for value in obj:
                walk(value)
    walk(data)
    expected = set(updates)
    if changed != expected:
        missing = sorted(expected - changed)
        extra = sorted(changed - expected)
        raise RuntimeError(f'{path_str}: changed {len(changed)} items; missing={missing}; extra={extra}')
    path.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
    return len(changed)

total = 0
for path_str, updates in updates_by_file.items():
    total += apply_updates(path_str, updates)
print(f'Applied {total} final definition-alignment rewrites across constitutional and competency slices.')
