# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'core_competencies.json'

UPDATES = {
    'comp_verbal_reasoning_gen_001': {
        'question': 'Which action best demonstrates good governance in verbal and analytical reasoning tasks?',
        'options': [
            'The officer uses approved procedures and keeps complete records.',
            'The officer applies rules inconsistently based on personal preference.',
            'The officer bypasses review and approval controls to save time.',
            'The officer puts convenience before policy and legal requirements.',
        ],
        'correct': 0,
        'explanation': 'Using approved procedures and complete records is the best choice because it supports consistency, compliance, and accountability.',
    },
    'comp_verbal_reasoning_gen_003': {
        'question': 'Which choice best reflects sound risk management in verbal and analytical reasoning work?',
        'options': [
            'The officer identifies control gaps early and escalates material exceptions promptly.',
            'The officer bypasses review and approval controls to save time.',
            'The officer puts convenience before policy and legal requirements.',
            'The officer ignores feedback and continues non-compliant procedures.',
        ],
        'correct': 0,
        'explanation': 'Identifying control gaps early and escalating exceptions promptly is the safest way to manage risk and keep the work on course.',
    },
    'comp_verbal_reasoning_gen_007': {
        'question': 'For effective verbal and analytical reasoning, what is the best approach to problem solving?',
        'options': [
            'The officer breaks complex issues into testable and actionable parts.',
            'The officer ignores feedback and continues non-compliant procedures.',
            'The officer applies rules inconsistently based on personal preference.',
            'The officer bypasses review and approval controls to save time.',
        ],
        'correct': 0,
        'explanation': 'Breaking complex issues into testable and actionable parts is the best problem-solving method because it makes the reasoning easier to check and resolve.',
    },
    'comp_verbal_reasoning_gen_009': {
        'question': 'Which action best reflects proper documented procedure standards in verbal and analytical reasoning work?',
        'options': [
            'The officer follows documented procedure and keeps complete records.',
            'The officer applies rules inconsistently based on personal preference.',
            'The officer bypasses review and approval controls to save time.',
            'The officer puts convenience before policy and legal requirements.',
        ],
        'correct': 0,
        'explanation': 'Following documented procedure and keeping complete records is the best option because it makes the work traceable and reliable.',
    },
    'comp_verbal_reasoning_gen_011': {
        'question': 'Which action best demonstrates public accountability in verbal and analytical reasoning work?',
        'options': [
            'The officer provides traceable decisions with evidence-based justification.',
            'The officer bypasses review and approval controls to save time.',
            'The officer puts convenience before policy and legal requirements.',
            'The officer ignores feedback and continues non-compliant procedures.',
        ],
        'correct': 0,
        'explanation': 'Providing traceable decisions with evidence-based justification is the best way to show accountability because it allows the work to be reviewed and defended.',
    },
    'comp_verbal_reasoning_gen_013': {
        'question': 'Which action best supports risk control in verbal and analytical reasoning work?',
        'options': [
            'The officer identifies risk early, applies controls, and documents mitigation.',
            'The officer puts convenience before policy and legal requirements.',
            'The officer ignores feedback and continues non-compliant procedures.',
            'The officer applies rules inconsistently based on personal preference.',
        ],
        'correct': 0,
        'explanation': 'Identifying risk early, applying controls, and documenting mitigation is the best answer because it reduces exposure and keeps the process controlled.',
    },
    'comp_verbal_reasoning_gen_015': {
        'question': 'Which practice best supports operational discipline in verbal and analytical reasoning work?',
        'options': [
            'The officer follows approved workflows and verifies outputs before closure.',
            'The officer ignores feedback and continues non-compliant procedures.',
            'The officer applies rules inconsistently based on personal preference.',
            'The officer bypasses review and approval controls to save time.',
        ],
        'correct': 0,
        'explanation': 'Following approved workflows and verifying outputs before closure is the best practice because it keeps the work disciplined and accurate.',
    },
    'competency_verbal_018': {
        'question': "What is the correct indirect speech form of: He said, 'I am ready'?",
        'options': [
            'He said that he is ready.',
            'He said that he was ready.',
            'He said that he would be ready.',
            'He said that he had been ready.',
        ],
        'correct': 1,
        'explanation': "In indirect speech, the present tense 'am' backshifts to 'was' after the reporting verb in the past tense.",
    },
    'competency_verbal_056': {
        'question': "Select the correct indirect speech: He said, 'I am going to Abuja tomorrow.'",
        'options': [
            'He said that he is going to Abuja tomorrow.',
            'He said that he was going to Abuja the next day.',
            'He said that he would go to Abuja the next day.',
            'He said that he had been going to Abuja the next day.',
        ],
        'correct': 1,
        'explanation': "In indirect speech, 'am going' backshifts to 'was going' and 'tomorrow' becomes 'the next day'.",
    },
    'competency_verbal_078': {
        'question': 'When should file notes be made?',
        'options': [
            'File notes should be made only for very important decisions.',
            'File notes should be made when verbal discussions are held by telephone or otherwise.',
            'File notes should be made only at the end of the day.',
            'File notes should never be made because they are not formal.',
        ],
        'correct': 1,
        'explanation': 'File notes should be made when verbal discussions occur so that the record is complete, accurate, and traceable.',
    },
    'competency_verbal_079': {
        'question': 'Within government administration, when should file notes be made?',
        'options': [
            'File notes should be made only for very important decisions.',
            'File notes should be made only at the end of the day.',
            'File notes should be made when verbal discussions are held by telephone or otherwise.',
            'File notes should never be made because they are not formal.',
        ],
        'correct': 2,
        'explanation': 'File notes should be made when verbal discussions occur so that government records remain complete and accountable.',
    },
    'competency_verbal_007': {
        'explanation': 'Conscientious is the accepted spelling of the word, so it is the correct choice.',
    },
    'competency_verbal_008': {
        'explanation': 'Crisis becomes crises in the plural because words ending in -is often change to -es.',
    },
    'competency_verbal_009': {
        'explanation': 'Chair is the odd one out because it is furniture, while dog, cat, and cow are animals.',
    },
    'competency_verbal_011': {
        'explanation': 'Insist on is the fixed verb-preposition combination used in standard English.',
    },
    'competency_verbal_014': {
        'explanation': 'Unanimous means fully agreed by everyone, so it is the option that shows complete agreement.',
    },
    'competency_verbal_020': {
        'explanation': 'Good at mathematics is the standard collocation, so at is the correct preposition.',
    },
    'competency_verbal_021': {
        'explanation': 'Conscientious is the correctly spelt form; the other options miss or rearrange letters.',
    },
    'competency_verbal_026': {
        'explanation': 'Neutral is the closest synonym because impartial means unbiased or not taking sides.',
    },
    'competency_verbal_028': {
        'explanation': 'Chair is the odd one out because it is not a fruit.',
    },
    'competency_verbal_029': {
        'explanation': 'Outdated is the closest synonym because obsolete means no longer in use.',
    },
    'competency_verbal_030': {
        'explanation': 'An account is a detailed report or description of an incident.',
    },
    'competency_verbal_031': {
        'explanation': 'Pessimistic is the opposite of optimistic because it describes a negative outlook.',
    },
    'competency_verbal_036': {
        'explanation': 'Divided on is the standard collocation used when people disagree about a proposal.',
    },
    'competency_verbal_041': {
        'explanation': 'Simple is the opposite of complex because it means not complicated.',
    },
    'competency_verbal_042': {
        'explanation': 'Begin is the direct synonym of commence.',
    },
    'competency_verbal_043': {
        'explanation': 'Definitely is the accepted spelling of the word.',
    },
    'competency_verbal_051': {
        'explanation': 'Short is the synonym because brief means not long.',
    },
    'competency_verbal_055': {
        'explanation': 'Interested in is the fixed collocation used for hobbies, subjects, or activities.',
    },
    'competency_verbal_057': {
        'explanation': 'Slow is the opposite of rapid because rapid means fast.',
    },
    'competency_verbal_059': {
        'explanation': 'Directive is a formal instruction, so it fits a strong order on discipline.',
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
    print(f'Applied round 162 updates to {changed} questions in {TARGET}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
