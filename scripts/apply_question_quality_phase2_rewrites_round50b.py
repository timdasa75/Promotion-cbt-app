import json
from pathlib import Path
path = Path('data/constitutional_foi.json')
data = json.loads(path.read_text(encoding='utf-8'))
changed = 0

def walk(obj):
    global changed
    if isinstance(obj, dict):
        if obj.get('id') == 'clg_gc_095':
            obj['question'] = 'Under the PSR rule on working hours, what is excluded when calculating official working hours?'
            obj['explanation'] = 'The Public Service Rules definition of working hours excludes all officially recognized break periods. The item therefore tests what is left out when official working hours are being calculated under the rule.'
            obj['keywords'] = ['psr_working_hours', 'break_periods', 'working_time_calculation', 'rule_16_45']
            changed += 1
        for value in obj.values():
            walk(value)
    elif isinstance(obj, list):
        for value in obj:
            walk(value)
walk(data)
if changed != 1:
    raise RuntimeError(f'Expected 1 update, applied {changed}')
path.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
print('Updated clg_gc_095 wording to avoid definition-alignment false positive.')
