# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'civil_service_ethics.json'

UPDATES = {
    'eth_code_conduct_gen_013': {
        'question': 'Which practice best supports risk control under the Code of Conduct?',
        'options': [
            'Application of approved controls with documented mitigation.',
            'Convenience ahead of control requirements.',
            'Continued non-compliance after feedback.',
            'Personal preference in control use.',
        ],
        'correct': 0,
        'explanation': 'Risk control is stronger when approved controls are applied early and the mitigation is documented for later review.',
    },
    'eth_code_conduct_gen_031': {
        'question': 'Which action best demonstrates active risk control under the Code of Conduct?',
        'options': [
            'Application of approved controls with documented mitigation.',
            'Convenience ahead of control requirements.',
            'Continued non-compliance after feedback.',
            'Personal preference in control use.',
        ],
        'correct': 0,
        'explanation': 'Active risk control requires approved controls, not convenience, and it should be supported by documented mitigation.',
    },
    'eth_code_conduct_gen_046': {
        'question': 'Which practice best supports risk control under Code-of-Conduct accountability arrangements?',
        'options': [
            'Application of approved controls with documented mitigation.',
            'Convenience ahead of control requirements.',
            'Continued non-compliance after feedback.',
            'Personal preference in control use.',
        ],
        'correct': 0,
        'explanation': 'Accountability arrangements work best when risks are matched with approved controls and the mitigation is recorded.',
    },
    'eth_code_conduct_gen_063': {
        'question': 'Are Foreign Service Officers allowed to accept gifts or presentations for services rendered?',
        'options': [
            'No, they may not accept such gifts or presentations from any person.',
            'Yes, if the gift is declared to the ministry.',
            'Yes, but only from diplomatic counterparts.',
            'Yes, if the value is minimal.',
        ],
        'correct': 0,
        'explanation': 'Foreign Service Officers are not allowed to accept gifts or presentations from any person for services rendered or to be rendered.',
    },
    'eth_code_conduct_gen_070': {
        'question': 'What is the role of the Accounting Officer in a vehicle-accident investigation?',
        'options': [
            'Ensuring reports, investigation, and disciplinary follow-up are completed.',
            'Directly investigating the accident personally.',
            'Paying for all damages personally.',
            'Concealing the accident from review.',
        ],
        'correct': 0,
        'explanation': 'The Accounting Officer must ensure that the reports are obtained, the investigation is conducted, and disciplinary follow-up is taken.',
    },
    'eth_code_conduct_gen_079': {
        'question': 'When an imprest issued by a Sub-Accounting Officer is retired at another station, what must the issuing officer verify?',
        'options': [
            'The receipt voucher particulars are correct.',
            'The Minister of Finance has been informed.',
            'A fresh audit has already been completed.',
            'A new cash advance has been issued.',
        ],
        'correct': 0,
        'explanation': 'The issuing Sub-Accounting Officer remains responsible for verifying the receipt voucher particulars before accepting the retirement.',
    },
    'eth_code_conduct_gen_069': {
        'question': 'When an imprest is retired at another station, what is the accountability of the Sub-Accounting Officer who issued it?',
        'options': [
            'To verify the receipt voucher particulars.',
            'To issue a new cash advance.',
            'To inform the Minister of Finance.',
            'To conduct an audit.',
        ],
        'correct': 0,
        'explanation': 'Financial Regulation 1011(ii) makes the issuing Sub-Accounting Officer accountable for verifying the receipt voucher particulars.',
    },
    'eth_code_conduct_gen_071': {
        'question': 'Which of these is an exclusive accountability of the Federal Government, according to the handbook?',
        'options': [
            'Foreign Affairs.',
            'Roads.',
            'Health.',
            'Education.',
        ],
        'correct': 0,
        'explanation': 'Foreign Affairs is a federal responsibility, so it is the exclusive accountability listed here.',
    },
    'eth_code_conduct_gen_072': {
        'question': 'Which action best demonstrates Code of Conduct risk management?',
        'options': [
            'Identify control gaps early and escalate material exceptions promptly.',
            'Prioritize convenience over policy and legal requirements.',
            'Apply rules inconsistently based on personal preference.',
            'Ignore feedback and continue non-compliant procedures.',
        ],
        'correct': 0,
        'explanation': 'Risk management under the Code of Conduct means identifying control gaps early and escalating material exceptions promptly.',
    },
    'eth_code_conduct_gen_075': {
        'question': 'Which practice best aligns with administrative ethics standards while maintaining fairness and legal compliance?',
        'options': [
            'Uphold neutrality, integrity, and service professionalism.',
            'Rely on informal instructions without documentary evidence.',
            'Close cases without validating facts or maintaining records.',
            'Treat exceptions as routine without documented justification.',
        ],
        'correct': 0,
        'explanation': 'Neutrality, integrity, and professionalism are the standards that best support fair and lawful administration.',
    },
    'eth_code_conduct_gen_078': {
        'question': 'Which choice best reflects proper administrative ethics standards in Code of Conduct work?',
        'options': [
            'Uphold neutrality, integrity, and service professionalism.',
            'Treat exceptions as routine without documented justification.',
            'Rely on informal instructions without documentary evidence.',
            'Close cases without validating facts or maintaining records.',
        ],
        'correct': 0,
        'explanation': 'The best administrative ethics response is to uphold neutrality, integrity, and professionalism.',
    },
    'eth_code_conduct_gen_080': {
        'question': 'For effective Code of Conduct practice, what is the most appropriate approach to secure service integrity?',
        'options': [
            'Avoid conflicts of interest and disclose relevant constraints.',
            'Close cases without validating facts or maintaining records.',
            'Treat exceptions as routine without documented justification.',
            'Rely on informal instructions without documentary evidence.',
        ],
        'correct': 0,
        'explanation': 'Service integrity is secured when conflicts of interest are avoided and relevant constraints are disclosed.',
    },
    'eth_code_conduct_gen_081': {
        'question': 'Which choice most effectively promotes decision transparency in a ministry unit without bypassing established review procedures?',
        'options': [
            'Use clear criteria and communicate decisions promptly.',
            'Rely on informal instructions without documentary evidence.',
            'Delay decisions until issues escalate into avoidable crises.',
            'Close cases without validating facts or maintaining records.',
        ],
        'correct': 0,
        'explanation': 'Clear criteria and prompt communication improve transparency and preserve the review trail.',
    },
    'ethics_003': {
        'explanation': 'The Code of Conduct prohibits public officers from maintaining foreign bank accounts.',
    },
    'ethics_024': {
        'explanation': 'The Code of Conduct Tribunal is empowered to prosecute public officers who breach the Code of Conduct.',
    },
    'ethics_057': {
        'explanation': 'Accountability and transparency form the constitutional basis for the Code of Conduct.',
    },
    'ethics_063': {
        'explanation': 'The Code of Conduct Bureau investigates breaches relating to asset declarations.',
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
    print(f'Applied round 166 updates to {changed} questions in {TARGET}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
