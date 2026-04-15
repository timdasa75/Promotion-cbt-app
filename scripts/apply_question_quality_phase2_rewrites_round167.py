# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'general_current_affairs.json'

UPDATES = {
    'NEKP_161': {
        'explanation': 'The Public Service Rules apply equally to men and women even where older wording uses gendered terms.',
    },
    'NEKP_165': {
        'explanation': 'If the officer does not respond within the allowed time, the appropriate sanction may be invoked on the basis of the unanswered allegation.',
    },
    'ca_national_events_gen_013': {
        'question': 'Which practice best supports risk control in national-events administration?',
        'options': [
            'Application of approved controls with documented mitigation.',
            'Convenience ahead of control requirements.',
            'Continued non-compliance after feedback.',
            'Personal preference in control use.',
        ],
        'correct': 0,
        'explanation': 'Risk control is stronger when risks are identified early, approved controls are applied, and the mitigation is documented for later review.',
    },
    'ca_national_events_gen_040': {
        'question': 'Which practice best supports risk control when handling national-events updates under approval and documentation controls?',
        'options': [
            'Application of approved controls with documented mitigation.',
            'Convenience ahead of control requirements.',
            'Continued non-compliance after feedback.',
            'Personal preference in control use.',
        ],
        'correct': 0,
        'explanation': 'Risk control improves when updates are handled through approved controls and the mitigation is recorded for review.',
    },
    'ca_national_events_gen_053': {
        'question': 'When a unit handling national events faces competing priorities, which action best preserves compliance and service quality?',
        'options': [
            'Credible official sources checked before conclusions are drawn.',
            'Discretionary shortcuts despite control safeguards.',
            'Convenience ahead of approved process requirements.',
            'Bypassing review checkpoints under time pressure.',
        ],
        'correct': 0,
        'explanation': 'Compliance and service quality are best preserved when officers rely on credible official sources and confirm facts before drawing conclusions.',
    },
    'ca_national_events_gen_055': {
        'question': 'When a supervisor reviews gaps in national-events administration, which option best strengthens control and consistency?',
        'options': [
            'Credible official sources checked before conclusions are drawn.',
            'Discretionary shortcuts despite control safeguards.',
            'Convenience ahead of approved process requirements.',
            'Bypassing review checkpoints under time pressure.',
        ],
        'correct': 0,
        'explanation': 'Control and consistency improve when supervisors require credible sources and confirmed facts before decisions are made.',
    },
    'ca_national_events_gen_065': {
        'explanation': 'The officer who neglected to press for the claim is held in charge because the neglect should not prejudice the private party.',
    },
    'ca_national_events_gen_076': {
        'explanation': 'The authority to notify the bank of changes in empowered signatories must not be delegated under the financial regulation.',
    },
    'ca_national_events_gen_077': {
        'explanation': 'If a government bank account is overdrawn, the accountable officer must refund any bank charges incurred because of the overdraft.',
    },
    'ca_national_events_gen_081': {
        'explanation': 'Cheques received by a Sub-Accounting Officer must not be endorsed or assigned to a third party under any circumstances.',
    },
    'NEKP_152': {
        'question': 'Who signed the Foreword to the 2021 PSR Edition as President of the Federal Republic of Nigeria?',
        'options': [
            'Goodluck Jonathan.',
            'Olusegun Obasanjo.',
            'Muhammadu Buhari.',
            'Bola Ahmed Tinubu.',
        ],
        'correct': 2,
        'explanation': 'Muhammadu Buhari signed the Foreword as President of the Federal Republic of Nigeria in the 2021 PSR Edition.',
    },
    'NEKP_155': {
        'question': 'Who is cited as Nigeria’s Minister of Transportation in the sources?',
        'options': [
            'Bola Ahmed Tinubu.',
            'Rotimi Amaechi.',
            'Lai Mohammed.',
            'Zainab Ahmed.',
        ],
        'correct': 1,
        'explanation': 'The source identifies Rotimi Amaechi as Nigeria’s Minister of Transportation.',
    },
    'NEKP_159': {
        'question': 'Who is the inventor of the computer?',
        'options': [
            'Bill Gates.',
            'Steve Jobs.',
            'Charles Babbage.',
            'Alan Turing.',
        ],
        'correct': 2,
        'explanation': 'Charles Babbage is credited as the inventor of the computer in the classical exam context.',
    },
    'NEKP_160': {
        'question': 'Who is known as the fastest man in the world?',
        'options': [
            'Jesse Owens.',
            'Carl Lewis.',
            'Usain Bolt.',
            'Justin Gatlin.',
        ],
        'correct': 2,
        'explanation': 'Usain Bolt is known as the fastest man in the world because of his sprint records.',
    },
    'NEKP_162': {
        'question': 'When was Google founded?',
        'options': [
            '1995.',
            '1998.',
            '2001.',
            '2004.',
        ],
        'correct': 1,
        'explanation': 'Google was founded on 4 September 1998.',
    },
    'NEKP_163': {
        'question': 'Who discovered the internet?',
        'options': [
            'Tim Berners-Lee.',
            'Steve Wozniak.',
            'Robert E. Kahn and Vint Cerf.',
            'Elon Musk.',
        ],
        'correct': 2,
        'explanation': 'Robert E. Kahn and Vint Cerf are credited with the development of the internet protocol foundation.',
    },
    'NEKP_170': {
        'question': 'The FCSC makes appointments to posts graded GL.07–17. In how many national newspapers must the advertisement be placed?',
        'options': [
            'Two.',
            'Four.',
            'Five.',
            'Three.',
        ],
        'correct': 3,
        'explanation': 'The advertisement must be placed in three national newspapers and on the Commission’s website.',
    },
    'NEKP_172': {
        'question': 'Within what period must decisions on deferment, withholding of increment, or stoppage of salary be communicated to the officer concerned?',
        'options': [
            'Six weeks.',
            'One month.',
            'Two weeks.',
            'Three months.',
        ],
        'correct': 2,
        'explanation': 'The decision must be communicated to the officer concerned within two weeks.',
    },
    'ca_national_events_gen_054': {
        'explanation': 'Accountable implementation is strongest when officers rely on credible official sources and confirm facts before conclusions are shared.',
    },
    'ca_national_events_gen_056': {
        'explanation': 'Traceability and fairness improve when officers rely on credible official sources and confirm facts before conclusions are made.',
    },
}


def update(node: object) -> int:
    if isinstance(node, list):
        return sum(update(item) for item in node)
    if isinstance(node, dict):
        qid = node.get('id')
        patch = UPDATES.get(qid)
        if patch:
            for field, value in patch.items():
                node[field] = value
            return 1
        return sum(update(value) for value in node.values())
    return 0


def main() -> int:
    data = json.loads(TARGET.read_text(encoding='utf-8'))
    changed = update(data)
    if changed != len(UPDATES):
        raise SystemExit(f'expected {len(UPDATES)} updates, applied {changed}')
    TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Applied round 167 updates to {changed} questions in {TARGET}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
