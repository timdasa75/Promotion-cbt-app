# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'core_competencies.json'

STRUCTURAL_UPDATES = {
    'comp_verbal_reasoning_gen_001': {
        'question': 'Which action best demonstrates good governance in verbal and analytical reasoning tasks?',
        'options': [
            'Using approved procedures and keeping complete records.',
            'Applying rules inconsistently based on personal preference.',
            'Bypassing review and approval controls to save time.',
            'Putting convenience before policy and legal requirements.',
        ],
        'correct': 0,
    },
    'comp_verbal_reasoning_gen_003': {
        'question': 'Which choice best reflects sound risk management in verbal and analytical reasoning work?',
        'options': [
            'Identifying control gaps early and escalating material exceptions promptly.',
            'Bypassing review and approval controls to save time.',
            'Putting convenience before policy and legal requirements.',
            'Ignoring feedback and continuing non-compliant procedures.',
        ],
        'correct': 0,
    },
    'comp_verbal_reasoning_gen_007': {
        'question': 'For effective verbal and analytical reasoning, what is the best approach to problem solving?',
        'options': [
            'Breaking complex issues into testable and actionable parts.',
            'Ignoring feedback and continuing non-compliant procedures.',
            'Applying rules inconsistently based on personal preference.',
            'Bypassing review and approval controls to save time.',
        ],
        'correct': 0,
    },
    'comp_verbal_reasoning_gen_009': {
        'question': 'Which action best reflects proper documented procedure standards in verbal and analytical reasoning work?',
        'options': [
            'Following documented procedure and keeping complete records.',
            'Applying rules inconsistently based on personal preference.',
            'Bypassing review and approval controls to save time.',
            'Putting convenience before policy and legal requirements.',
        ],
        'correct': 0,
    },
    'comp_verbal_reasoning_gen_011': {
        'question': 'Which action best demonstrates public accountability in verbal and analytical reasoning work?',
        'options': [
            'Providing traceable decisions with evidence-based justification.',
            'Bypassing review and approval controls to save time.',
            'Putting convenience before policy and legal requirements.',
            'Ignoring feedback and continuing non-compliant procedures.',
        ],
        'correct': 0,
    },
    'comp_verbal_reasoning_gen_013': {
        'question': 'Which action best supports risk control in verbal and analytical reasoning work?',
        'options': [
            'Identifying risk early, applying controls, and documenting mitigation.',
            'Putting convenience before policy and legal requirements.',
            'Ignoring feedback and continuing non-compliant procedures.',
            'Applying rules inconsistently based on personal preference.',
        ],
        'correct': 0,
    },
    'comp_verbal_reasoning_gen_015': {
        'question': 'Which practice best supports operational discipline in verbal and analytical reasoning work?',
        'options': [
            'Following approved workflows and verifying outputs before closure.',
            'Ignoring feedback and continuing non-compliant procedures.',
            'Applying rules inconsistently based on personal preference.',
            'Bypassing review and approval controls to save time.',
        ],
        'correct': 0,
    },
    'competency_verbal_018': {
        'question': "What is the correct indirect speech form of: He said, 'I am ready'?",
        'options': [
            'He said that he is ready.',
            'He said that he was ready.',
            'He said that he will be ready.',
            'He said that he had been ready.',
        ],
        'correct': 1,
    },
    'competency_verbal_056': {
        'question': "Select the correct indirect speech: He said, 'I am going to Abuja tomorrow.'",
        'options': [
            'He said that he is going to Abuja tomorrow.',
            'He said that he was going to Abuja the next day.',
            'He said that he goes to Abuja tomorrow.',
            'He said that he will go to Abuja the next day.',
        ],
        'correct': 1,
    },
    'competency_verbal_078': {
        'question': 'When should file notes be made?',
        'options': [
            'Only for very important decisions.',
            'When verbal discussions are held by telephone or otherwise.',
            'Only at the end of the day.',
            'Never, because they are not formal.',
        ],
        'correct': 1,
    },
    'competency_verbal_079': {
        'question': 'Within government administration, when should file notes be made?',
        'options': [
            'Only for very important decisions.',
            'Only at the end of the day.',
            'When verbal discussions are held by telephone or otherwise.',
            'Never, because they are not formal.',
        ],
        'correct': 2,
    },
}

TARGET_IDS = set(STRUCTURAL_UPDATES) | {
    'competency_verbal_001',
    'competency_verbal_004',
    'competency_verbal_005',
    'competency_verbal_006',
    'competency_verbal_007',
    'competency_verbal_008',
    'competency_verbal_009',
    'competency_verbal_010',
    'competency_verbal_011',
    'competency_verbal_013',
    'competency_verbal_014',
    'competency_verbal_015',
    'competency_verbal_016',
    'competency_verbal_017',
    'competency_verbal_019',
    'competency_verbal_020',
    'competency_verbal_021',
    'competency_verbal_022',
    'competency_verbal_023',
    'competency_verbal_024',
    'competency_verbal_025',
    'competency_verbal_026',
    'competency_verbal_027',
    'competency_verbal_028',
    'competency_verbal_029',
    'competency_verbal_030',
    'competency_verbal_031',
    'competency_verbal_032',
    'competency_verbal_034',
    'competency_verbal_035',
    'competency_verbal_036',
    'competency_verbal_037',
    'competency_verbal_038',
    'competency_verbal_039',
    'competency_verbal_040',
    'competency_verbal_041',
    'competency_verbal_042',
    'competency_verbal_043',
    'competency_verbal_044',
    'competency_verbal_045',
    'competency_verbal_046',
    'competency_verbal_047',
    'competency_verbal_048',
    'competency_verbal_049',
    'competency_verbal_050',
    'competency_verbal_051',
    'competency_verbal_052',
    'competency_verbal_053',
    'competency_verbal_054',
    'competency_verbal_055',
    'competency_verbal_057',
    'competency_verbal_058',
    'competency_verbal_059',
    'competency_verbal_060',
}


def extract_target(question: str) -> str:
    match = re.search(r"'([^']+)'", question)
    if not match:
        match = re.search(r'"([^"]+)"', question)
    if not match:
        return ''
    return match.group(1).strip(' :?.,').strip()


def build_explanation(question: str, correct: str, qid: str) -> str:
    q = question.lower()
    c = correct.rstrip('.').strip()
    target = extract_target(question)

    if qid == 'competency_verbal_001':
        return 'The Federal Civil Service competency framework groups competencies into Core, Leadership, and Functional categories.'
    if qid == 'competency_verbal_004':
        return 'Tact means diplomacy or sensitivity, so it fits praise for handling a matter well.'
    if qid == 'competency_verbal_005':
        return 'The analogy is profession to workplace: a doctor works in a hospital, and a teacher works in a school.'
    if qid == 'competency_verbal_006':
        return 'Ambiguous means unclear or open to more than one meaning, so uncertain is the closest match.'
    if qid == 'competency_verbal_007':
        return 'Conscientious is the standard spelling of the word.'
    if qid == 'competency_verbal_008':
        return 'The plural of crisis is crises.'
    if qid == 'competency_verbal_009':
        return 'Chair is the odd one out because it is furniture, not an animal.'
    if qid == 'competency_verbal_010':
        return 'Expedite means to speed up or hasten, so the correct answer is the word with that meaning.'
    if qid == 'competency_verbal_011':
        return 'Insist on is the standard fixed phrase used with this verb.'
    if qid == 'competency_verbal_013':
        return 'Careless is the opposite of diligent because diligent means careful, hard-working, and attentive.'
    if qid == 'competency_verbal_014':
        return 'Unanimous means fully agreed, so it is the best word for that idea.'
    if qid == 'competency_verbal_015':
        return 'Scarce means in short supply, so the opposite is the word that means plentiful.'
    if qid == 'competency_verbal_016':
        return 'Book is the odd one out because it is reading material, while the others are writing-related items.'
    if qid == 'competency_verbal_017':
        return 'Meticulous means very careful and precise, so the closest word is the one with that meaning.'
    if qid == 'competency_verbal_019':
        return 'Expand means increase or enlarge, so increase is the synonym that matches the question.'
    if qid == 'competency_verbal_020':
        return 'Good at mathematics is the standard collocation, so at is the correct preposition.'
    if qid == 'competency_verbal_021':
        return 'Conscientious is the correctly spelt form of the word.'
    if qid == 'competency_verbal_022':
        return 'Expand means grow or increase, so the opposite is the word that means contract or shrink.'
    if qid == 'competency_verbal_023':
        return 'Ambiguous means unclear or uncertain, so the closest synonym is the option with that meaning.'
    if qid == 'competency_verbal_024':
        return 'A stitch in time saves nine is the established proverb, so nine completes it correctly.'
    if qid == 'competency_verbal_025':
        return 'Rigid means stiff or inflexible, so the antonym is the word that means flexible.'
    if qid == 'competency_verbal_026':
        return 'Impartial means neutral and unbiased, so the synonym is the option with that meaning.'
    if qid == 'competency_verbal_027':
        return 'The fixed phrase is strict adherence to rules, so adherence is the correct completion.'
    if qid == 'competency_verbal_028':
        return 'Chair is the odd one out because the other items are fruits.'
    if qid == 'competency_verbal_029':
        return 'Obsolete means outdated, so the synonym is the option with that meaning.'
    if qid == 'competency_verbal_030':
        return 'An account is a detailed report or description, so it fits the sentence best.'
    if qid == 'competency_verbal_031':
        return 'Optimistic means hopeful, so the opposite is the word that means pessimistic.'
    if qid == 'competency_verbal_032':
        return 'Vivid means bright, clear, or striking, so the closest synonym is the word with that meaning.'
    if qid == 'competency_verbal_034':
        return 'Generous means kind and giving, so the antonym is the word that means selfish or mean.'
    if qid == 'competency_verbal_035':
        return 'Lucid means clear and easy to understand, so the closest synonym is the word with that meaning.'
    if qid == 'competency_verbal_036':
        return 'Divided on the proposal is the standard collocation, so on is the correct preposition.'
    if qid == 'competency_verbal_037':
        return 'Too many cooks spoil the broth is the established proverb, so broth completes it correctly.'
    if qid == 'competency_verbal_038':
        return 'Miserable is not a synonym of happy; it is its opposite, which makes it the correct choice here.'
    if qid == 'competency_verbal_039':
        return 'Improve efficiency is the intended meaning, so improve is the word that best completes the sentence.'
    if qid == 'competency_verbal_040':
        return 'Resilient means strong and able to recover quickly, so the closest synonym is the word with that meaning.'
    if qid == 'competency_verbal_041':
        return 'Complex means complicated, so the antonym is the word that means simple.'
    if qid == 'competency_verbal_042':
        return 'Commence means begin, so the synonym is the word with that meaning.'
    if qid == 'competency_verbal_043':
        return 'Definitely is the correctly spelt form of the word.'
    if qid == 'competency_verbal_044':
        return 'Benevolent means kind or well-meaning, so the closest synonym is the word with that meaning.'
    if qid == 'competency_verbal_045':
        return 'Artificial means not natural, so the antonym is the word that means natural.'
    if qid == 'competency_verbal_046':
        return 'Curb means reduce or restrain, so it fits the sentence about limiting corruption.'
    if qid == 'competency_verbal_047':
        return 'Teacher is the odd one out because the other items are stationery or writing tools.'
    if qid == 'competency_verbal_048':
        return 'Candid means honest and open, so the closest synonym is the word with that meaning.'
    if qid == 'competency_verbal_049':
        return 'Expand means grow larger, so the antonym is the word that means shrink.'
    if qid == 'competency_verbal_050':
        return 'Tact means diplomacy and sensitivity, so it fits praise for handling a crisis well.'
    if qid == 'competency_verbal_051':
        return 'Brief means short or concise, so the synonym is the word with that meaning.'
    if qid == 'competency_verbal_052':
        return 'The pen is mightier than the sword is the established proverb, so sword completes it correctly.'
    if qid == 'competency_verbal_053':
        return 'Prosperity means success or wealth, so the antonym is the word that means poverty.'
    if qid == 'competency_verbal_054':
        return 'Fragile means delicate or easily broken, so the synonym is the word with that meaning.'
    if qid == 'competency_verbal_055':
        return 'Interested in music is the standard collocation, so in is the correct preposition.'
    if qid == 'competency_verbal_057':
        return 'Rapid means fast, so the antonym is the word that means slow.'
    if qid == 'competency_verbal_058':
        return 'Precise means exact and accurate, so the closest synonym is the word with that meaning.'
    if qid == 'competency_verbal_059':
        return 'A directive is a formal instruction, so it fits a strong order on discipline.'
    if qid == 'competency_verbal_060':
        return 'Bread is the odd one out because the other items are furniture, while bread is food.'

    if 'what are the three main categories' in q:
        return 'The Federal Civil Service competency framework groups competencies into Core, Leadership, and Functional categories.'
    if 'same relationship' in q:
        return 'The analogy is profession to workplace: a doctor works in a hospital, and a teacher works in a school.'
    if 'indirect speech' in q:
        if 'tomorrow' in q:
            return 'Indirect speech normally backshifts the tense and changes \"tomorrow\" to \"the next day\".'
        return 'Indirect speech usually backshifts the tense from present to past.'
    if 'correctly spelt' in q or 'correct spelling' in q:
        return f"{c} is the standard spelling of the word."
    if 'plural of' in q:
        return f"{c} is correct because it is the standard plural form of the noun."
    if 'odd one out' in q:
        return f"{c} is the odd one out because it does not belong to the same category as the other items."
    if 'proverb' in q:
        return f"{c} completes the established proverb."
    if 'antonym' in q or 'most opposite' in q:
        if target:
            return f"{c} is correct because it gives the opposite meaning of '{target}'."
        return f"{c} is correct because it gives the opposite meaning of the target word."
    if 'synonym' in q or 'closest in meaning' in q or 'most similar in meaning' in q:
        if target:
            return f"{c} is correct because it means the same as '{target}'."
        return f"{c} is correct because it has the same meaning as the target word."
    if 'fill in the blank' in q or 'best completes' in q or 'completes the sentence' in q:
        if 'good ___ mathematics' in q or 'good at mathematics' in q:
            return f"Good at mathematics is the standard collocation, so {c} is correct."
        if 'interested ___ music' in q or 'interested in music' in q:
            return f"Interested in music is the standard collocation, so {c} is correct."
        if 'divided ______ the proposal' in q or 'divided ____ the proposal' in q:
            return f"Divided on the proposal is the standard collocation, so {c} is correct."
        if 'strict ______ to rules' in q or 'strict ____ to rules' in q:
            return f"Strict adherence to rules is the standard phrase, so {c} is correct."
        if 'detailed ______ of the incident' in q:
            return f"An account is a detailed report or description, so {c} fits the sentence best."
        if 'help to ______ efficiency' in q:
            return f"The sentence means improve efficiency, so {c} is the best fit."
        if 'will ______ corruption' in q:
            return f"The sentence means curb corruption, so {c} is the best fit."
        if 'praised for his ______ in handling the matter' in q or 'praised for his ______ in handling the crisis' in q:
            return f"{c} fits because it means tact or sensitive judgment in handling the situation well."
        if 'strong ______ on discipline' in q:
            return f"{c} fits because a directive is a formal instruction on discipline."
        if 'saves ____' in q or 'mightier than the ____' in q:
            return f"{c} completes the established proverb."
        if 'very good ___ mathematics' in q:
            return f"Good at mathematics is the standard collocation, so {c} is correct."
        return f"{c} is the best fit for the sentence because it preserves the intended meaning and grammar."
    if 'preposition' in q or 'insisted' in q:
        return f"{c} completes the fixed English collocation in the sentence."
    if 'categories of competencies' in q:
        return 'The Federal Civil Service competency framework groups competencies into Core, Leadership, and Functional categories.'
    if 'government administration' in q and 'file notes' in q:
        return 'File notes should be made whenever verbal discussions occur so that the record is complete and traceable.'
    return f"{c} is the best answer because it matches the word, phrase, or rule tested by the question."


def update(node: object) -> int:
    if isinstance(node, list):
        return sum(update(item) for item in node)
    if isinstance(node, dict):
        qid = node.get('id')
        if qid in TARGET_IDS:
            if qid in STRUCTURAL_UPDATES:
                patch = STRUCTURAL_UPDATES[qid]
                node['question'] = patch['question']
                node['options'] = patch['options']
                node['correct'] = patch['correct']
                node['explanation'] = build_explanation(node['question'], node['options'][node['correct']], qid)
            else:
                node['explanation'] = build_explanation(node.get('question', ''), node['options'][node['correct']], qid)
            return 1
        return sum(update(value) for value in node.values())
    return 0


def main() -> int:
    data = json.loads(TARGET.read_text(encoding='utf-8'))
    changed = update(data)
    if changed != len(TARGET_IDS):
        raise SystemExit(f'expected {len(TARGET_IDS)} updates, applied {changed}')
    TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Applied round 161 updates to {changed} questions in {TARGET}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
