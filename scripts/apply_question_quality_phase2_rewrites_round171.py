# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'core_competencies.json'
TODAY = '2026-04-09'

UPDATES = {
    'comp_verbal_reasoning_gen_001': {
        'question': 'Which option best demonstrates good governance in verbal and analytical reasoning tasks?',
        'options': [
            'Approved procedures and complete records.',
            'Inconsistent rule application based on personal preference.',
            'Bypassing review and approval controls.',
            'Convenience before policy and legal requirements.',
        ],
        'correct': 0,
        'explanation': 'Approved procedures and complete records support consistency, compliance, and accountability in reasoning tasks.',
    },
    'comp_verbal_reasoning_gen_003': {
        'question': 'Which choice best reflects sound risk management in verbal and analytical reasoning work?',
        'options': [
            'Early identification of control gaps and prompt escalation of material exceptions.',
            'Bypassing review and approval controls.',
            'Convenience before policy and legal requirements.',
            'Ignoring feedback and continuing non-compliant procedures.',
        ],
        'correct': 0,
        'explanation': 'Early identification of control gaps and prompt escalation of material exceptions is the safest way to manage risk.',
    },
    'comp_verbal_reasoning_gen_007': {
        'question': 'For effective verbal and analytical reasoning, what is the best approach to problem solving?',
        'options': [
            'Breaking complex issues into testable, actionable parts.',
            'Ignoring feedback and continuing non-compliant procedures.',
            'Inconsistent rule application based on personal preference.',
            'Bypassing review and approval controls.',
        ],
        'correct': 0,
        'explanation': 'Breaking complex issues into testable, actionable parts makes the reasoning easier to check and resolve.',
    },
    'comp_verbal_reasoning_gen_009': {
        'question': 'Which option best reflects proper documented procedure standards in verbal and analytical reasoning work?',
        'options': [
            'Following documented procedure and keeping complete records.',
            'Inconsistent rule application.',
            'Bypassing review and approval controls.',
            'Convenience before policy and legal requirements.',
        ],
        'correct': 0,
        'explanation': 'Following documented procedure and keeping complete records makes the work traceable and reliable.',
    },
    'comp_verbal_reasoning_gen_011': {
        'question': 'Which option best demonstrates public accountability in verbal and analytical reasoning work?',
        'options': [
            'Providing traceable decisions with evidence-based justification.',
            'Bypassing review and approval controls.',
            'Convenience before policy and legal requirements.',
            'Ignoring feedback and continuing non-compliant procedures.',
        ],
        'correct': 0,
        'explanation': 'Providing traceable decisions with evidence-based justification allows the work to be reviewed and defended.',
    },
    'comp_verbal_reasoning_gen_013': {
        'question': 'Which option best supports risk control in verbal and analytical reasoning work?',
        'options': [
            'Identifying risk early, applying controls, and documenting mitigation.',
            'Convenience before policy and legal requirements.',
            'Ignoring feedback and continuing non-compliant procedures.',
            'Inconsistent rule application based on personal preference.',
        ],
        'correct': 0,
        'explanation': 'Identifying risk early, applying controls, and documenting mitigation reduces exposure and keeps the process controlled.',
    },
    'comp_verbal_reasoning_gen_015': {
        'question': 'Which practice best supports operational discipline in verbal and analytical reasoning work?',
        'options': [
            'Following approved workflows and verifying outputs before closure.',
            'Ignoring feedback and continuing non-compliant procedures.',
            'Inconsistent rule application based on personal preference.',
            'Bypassing review and approval controls.',
        ],
        'correct': 0,
        'explanation': 'Following approved workflows and verifying outputs before closure keeps the work disciplined and accurate.',
    },
    'competency_verbal_018': {
        'question': 'Which sentence is the correct indirect speech form of: He said, "I am ready"?',
        'options': [
            'He said that he was ready.',
            'He said that he is ready.',
            'He said that he would be ready.',
            'He said that he had been ready.',
        ],
        'correct': 0,
        'explanation': 'In indirect speech, the present tense "am" backshifts to "was" after the reporting verb in the past tense.',
    },
    'competency_verbal_056': {
        'question': 'Which sentence is the correct indirect speech form of: He said, "I am going to Abuja tomorrow"?',
        'options': [
            'He said that he was going to Abuja the next day.',
            'He said that he is going to Abuja tomorrow.',
            'He said that he would go to Abuja the next day.',
            'He said that he had been going to Abuja the next day.',
        ],
        'correct': 0,
        'explanation': 'In indirect speech, "am going" backshifts to "was going" and "tomorrow" becomes "the next day".',
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
        'explanation': 'File notes should be made when verbal discussions occur so the record is complete, accurate, and traceable.',
    },
    'competency_verbal_079': {
        'question': 'Why are file notes made after verbal discussions in government administration?',
        'options': [
            'To keep the record complete, accurate, and traceable.',
            'To avoid writing any formal record.',
            'To replace every written memo.',
            'To delay administrative action indefinitely.',
        ],
        'correct': 0,
        'explanation': 'File notes are made so that government records remain complete and accountable after verbal discussions.',
    },
    'competency_verbal_007': {
        'question': 'Identify the correctly spelt word.',
        'options': [
            'Acommodate.',
            'Accommodate.',
            'Acomodate.',
            'Accomodate.',
        ],
        'correct': 1,
        'explanation': 'Accommodate is the accepted spelling of the word.',
    },
    'competency_verbal_011': {
        'question': "Choose the correct preposition: 'He insisted ___ his right to appeal.'",
        'options': ['on.', 'at.', 'for.', 'to.'],
        'correct': 0,
        'explanation': 'Insist on is the fixed verb-preposition combination used in standard English.',
    },
    'competency_verbal_020': {
        'question': "Fill in the blank: 'She is very good ___ mathematics.'",
        'options': ['at.', 'in.', 'on.', 'with.'],
        'correct': 0,
        'explanation': 'Good at mathematics is the standard collocation.',
    },
    'competency_verbal_028': {
        'question': 'Select the odd one out: Apple, Mango, Banana, Chair',
        'options': ['Apple.', 'Mango.', 'Banana.', 'Chair.'],
        'correct': 3,
        'explanation': 'Chair is the odd one out because it is not a fruit.',
    },
    'competency_verbal_030': {
        'question': "Which word correctly completes the sentence: 'The manager gave a detailed ______ of the incident.'",
        'options': ['Account.', 'Discount.', 'Encounter.', 'Counter.'],
        'correct': 0,
        'explanation': 'An account is a detailed report or description of an incident.',
    },
    'competency_verbal_031': {
        'question': "Find the word most opposite in meaning to 'optimistic'.",
        'options': ['Hopeful.', 'Cheerful.', 'Pessimistic.', 'Positive.'],
        'correct': 2,
        'explanation': 'Pessimistic is the opposite of optimistic because it describes a negative outlook.',
    },
    'competency_verbal_041': {
        'question': "Which of these words is the antonym of 'complex'?",
        'options': ['Complicated.', 'Simple.', 'Intricate.', 'Detailed.'],
        'correct': 1,
        'explanation': 'Simple is the opposite of complex because it means not complicated.',
    },
    'competency_verbal_042': {
        'question': "Which of the following is a synonym for 'commence'?",
        'options': ['Begin.', 'Finish.', 'End.', 'Stop.'],
        'correct': 0,
        'explanation': 'Begin is the direct synonym of commence.',
    },
    'competency_verbal_043': {
        'question': 'Choose the correctly spelt word.',
        'options': ['Definately.', 'Definitely.', 'Definitly.', 'Defenetly.'],
        'correct': 1,
        'explanation': 'Definitely is the accepted spelling of the word.',
    },
    'competency_verbal_051': {
        'question': "Choose the synonym of 'brief'.",
        'options': ['Short.', 'Long.', 'Detailed.', 'Endless.'],
        'correct': 0,
        'explanation': 'Short is the synonym because brief means not long.',
    },
    'competency_verbal_055': {
        'question': "Fill in the blank: 'She is interested ___ music.'",
        'options': ['in.', 'on.', 'at.', 'for.'],
        'correct': 0,
        'explanation': 'Interested in is the fixed collocation used for hobbies, subjects, or activities.',
    },
    'competency_verbal_057': {
        'question': "What is the antonym of 'rapid'?",
        'options': ['Slow.', 'Fast.', 'Quick.', 'Swift.'],
        'correct': 0,
        'explanation': 'Slow is the opposite of rapid because rapid means fast.',
    },
    'competency_verbal_059': {
        'question': "Which word best completes: 'The Head of Service issued a strong ______ on discipline.'",
        'options': ['Command.', 'Directive.', 'Instruction.', 'Appeal.'],
        'correct': 1,
        'explanation': 'Directive is a formal instruction, so it fits a strong order on discipline.',
    },
}


def walk(node: object) -> int:
    if isinstance(node, list):
        return sum(walk(item) for item in node)
    if isinstance(node, dict):
        qid = node.get('id')
        patch = UPDATES.get(qid)
        if patch:
            for key, value in patch.items():
                node[key] = value
            node['lastReviewed'] = TODAY
            return 1
        return sum(walk(value) for value in node.values())
    return 0


def main() -> int:
    data = json.loads(TARGET.read_text(encoding='utf-8'))
    changed = walk(data)
    if changed != len(UPDATES):
        raise SystemExit(f'expected {len(UPDATES)} updates, applied {changed}')
    TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Applied round 171 updates to {changed} questions in {TARGET}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
