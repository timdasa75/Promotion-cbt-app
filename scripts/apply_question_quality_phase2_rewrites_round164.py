# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'psr_rules.json'

UPDATES = {
    'psr_disc_026': {
        'question': 'Under the PSR, what follows termination rather than dismissal?',
        'options': [
            'Forfeiture of benefits that would otherwise remain payable.',
            'Honourable dismissal with automatic promotion rights.',
            'The same consequences as dismissal in every case.',
            'Automatic application to criminal offences only.',
        ],
        'correct': 0,
        'explanation': 'Termination under the PSR is not the same as dismissal; it is cessation of appointment otherwise than by resignation, dismissal, or retirement.',
    },
    'psr_discipline_gen_001': {
        'question': 'Which action best demonstrates sound governance in discipline and misconduct administration?',
        'options': [
            'Use of approved procedures and complete records.',
            'Inconsistent application of rules across similar cases.',
            'Bypassing review and approval controls.',
            'Prioritising convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Approved procedures and complete records are the best choice because they keep discipline cases fair, traceable, and accountable.',
    },
    'psr_discipline_gen_003': {
        'question': 'Which action best supports risk management in discipline and misconduct cases?',
        'options': [
            'Early identification of control gaps and prompt escalation of material exceptions.',
            'Bypassing review and approval controls.',
            'Ignoring feedback after review.',
            'Prioritising convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Early identification of control gaps and prompt escalation of exceptions is the safest way to manage risk in disciplinary matters.',
    },
    'psr_discipline_gen_007': {
        'question': 'Which approach best preserves promotion standards in discipline and misconduct administration?',
        'options': [
            'Eligibility confirmation before recommending advancement.',
            'Inconsistent criteria for similar officers.',
            'Bypassing review controls.',
            'Prioritising convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Eligibility must be confirmed before advancement is recommended so that promotion standards remain fair and consistent.',
    },
    'psr_discipline_gen_009': {
        'question': 'Which practice best reflects proper documented procedure in discipline and misconduct matters?',
        'options': [
            'Following approved steps and keeping complete records.',
            'Inconsistent application of rules across similar cases.',
            'Bypassing review and approval controls.',
            'Prioritising convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Following approved steps and keeping complete records is the best practice because it makes the process reliable and reviewable.',
    },
    'psr_discipline_gen_011': {
        'question': 'Which action best protects fairness in a disciplinary inquiry under the PSR?',
        'options': [
            'Opportunity for the officer to respond before a decision is taken.',
            'Bypassing review and approval controls.',
            'Prioritising convenience over compliance.',
            'Ignoring feedback after review.',
        ],
        'correct': 0,
        'explanation': 'Fairness requires a hearing opportunity before a decision is taken, so the officer can respond to the allegation.',
    },
    'psr_discipline_gen_013': {
        'question': 'Which option most strongly aligns with good public-service practice on risk control within discipline and misconduct?',
        'options': [
            'Early risk identification with documented mitigation.',
            'Convenience over policy requirements.',
            'Continued non-compliance after feedback.',
            'Inconsistent rule application across similar cases.',
        ],
        'correct': 0,
        'explanation': 'Early risk identification with documented mitigation is the best answer because it reduces exposure and leaves an audit trail.',
    },
    'psr_discipline_gen_015': {
        'question': 'Which practice should a responsible officer prioritize to sustain operational discipline in discipline and misconduct administration?',
        'options': [
            'Following approved workflows and verifying outputs before closure.',
            'Continued non-compliance after feedback.',
            'Inconsistent rule application across similar cases.',
            'Bypassing review and approval controls.',
        ],
        'correct': 0,
        'explanation': 'Following approved workflows and verifying outputs before closure is the best way to keep disciplinary administration orderly and accurate.',
    },
    'psr_discipline_gen_017': {
        'question': 'Which approach best preserves record management in discipline and misconduct administration?',
        'options': [
            'Accurate file maintenance and status updates at each control point.',
            'Inconsistent rule application across similar cases.',
            'Bypassing review and approval controls.',
            'Prioritising convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Accurate file maintenance and status updates are essential because disciplinary cases depend on traceable records at every stage.',
    },
    'psr_discipline_gen_019': {
        'question': 'Which action best reflects proper governance standards in discipline and misconduct matters?',
        'options': [
            'Use of approved procedures and complete records.',
            'Bypassing review and approval controls.',
            'Prioritising convenience over compliance.',
            'Continued non-compliance after feedback.',
        ],
        'correct': 0,
        'explanation': 'Approved procedures and complete records are the best governance standards because they support accountability and fairness.',
    },
    'psr_discipline_gen_023': {
        'question': 'Which practice best aligns with due process in discipline and misconduct administration?',
        'options': [
            'Fair hearing and documented decisions.',
            'Continued non-compliance after feedback.',
            'Inconsistent rule application across similar cases.',
            'Bypassing review and approval controls.',
        ],
        'correct': 0,
        'explanation': 'Due process requires a fair hearing and documented decisions so that the officer and the service can both rely on the outcome.',
    },
    'psr_discipline_gen_025': {
        'question': 'Which practice should a responsible officer prioritize to sustain promotion standards in discipline and misconduct administration?',
        'options': [
            'Eligibility confirmation before recommending advancement.',
            'Inconsistent criteria for similar officers.',
            'Bypassing review and approval controls.',
            'Prioritising convenience over compliance.',
        ],
        'correct': 0,
        'explanation': 'Promotion standards are sustained when eligibility is confirmed before advancement is recommended.',
    },
    'psr_docx_062': {
        'explanation': 'Rule 020107 treats the contravention as serious misconduct because false or improper birth-date declaration undermines trust and service records.',
    },
    'psr_docx_098': {
        'explanation': 'Rule 020211 treats membership in secret societies as serious misconduct because it conflicts with public-service integrity and accountability.',
    },
    'psr_docx_099': {
        'explanation': 'The rule provides dismissal from the service as the disciplinary action for contravening Rule 020211.',
    },
    'psr_docx_166': {
        'explanation': 'The whistleblowing policy encourages officers to report misconduct, corruption, and illegality so that wrongdoing can be checked early.',
    },
    'psr_docx_181': {
        'explanation': 'Dismissal is the ultimate penalty for serious misconduct that leads to forfeiture of benefits.',
    },
    'psr_docx_196': {
        'explanation': 'The maximum penalty for a breach of the Code of Conduct is dismissal, imprisonment, and disqualification, depending on the offense and the legal process.',
    },
    'psr_docx_198': {
        'explanation': 'Corruption, fraud, and criminal convictions are classified as serious misconduct because they involve grave breaches of public trust.',
    },
    'psr_docx_230': {
        'explanation': 'Termination of appointment means cessation of appointment by government otherwise than by resignation, dismissal, or retirement.',
    },
    'psr_docx_232': {
        'explanation': 'Dismissal is termination of appointment as a disciplinary measure for serious misconduct.',
    },
    'psr_docx_234': {
        'explanation': 'An officer on interdiction earns half salary under the PSR.',
    },
    'psr_docx_236': {
        'explanation': 'An officer on suspension earns no salary under the PSR.',
    },
    'psr_docx_237': {
        'explanation': 'Suspension applies where a prima facie case of a serious nature has been established.',
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
    print(f'Applied round 164 updates to {changed} questions in {TARGET}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
