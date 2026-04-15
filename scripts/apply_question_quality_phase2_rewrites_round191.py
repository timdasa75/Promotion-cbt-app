from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'constitutional_foi.json': {
        'FOI_AO_036': {
            'question': 'When may an applicant waive the right to challenge a denial of access in court?',
            'options': [
                'No waiver on denial.',
                'Partial disclosure.',
                'Fee nonpayment.',
                'Secret classification.',
            ],
            'correct': 0,
            'explanation': 'A denial of access does not itself amount to a waiver of the applicant\'s right to challenge the denial in court.',
        },
        'FOI_AO_047': {
            'question': 'What follows if a public institution exceeds the statutory response time without notifying the applicant of an extension?',
            'options': [
                'Deemed denial.',
                'Officer commendation.',
                'Automatic fee doubling.',
                'Fresh request required.',
            ],
            'correct': 0,
            'explanation': 'If the statutory response time passes without a valid extension notice, the request is treated as denied and the applicant may go to court.',
        },
        'FOI_AO_053': {
            'question': 'When should invigilators and examiners fees be processed for payment?',
            'options': [
                'Claim submission and approval.',
                'Before examination begins.',
                'After examination only.',
                'After results release.',
            ],
            'correct': 0,
            'explanation': 'Processing and payment should follow submission and approval of the claim rather than the mere timing of the examination itself.',
        },
        'FOI_AO_058': {
            'question': 'Why are official documents classified?',
            'options': [
                'Required care level.',
                'Hard-to-access always.',
                'Total concealment.',
                'Other-ministry secrecy.',
            ],
            'correct': 0,
            'explanation': 'Classification indicates the level of care and protection required for a document, not simply a blanket rule of concealment.',
        },
        'FOI_AO_061': {
            'question': 'When should the disbursement of invigilators and examiners fees be processed and paid?',
            'options': [
                'Claim submission and approval.',
                'After examination.',
                'Before examination.',
                'After results release.',
            ],
            'correct': 0,
            'explanation': 'Disbursement should be processed once the claim has been submitted and approved, because that is the point at which payment becomes properly regularized.',
        },
        'FOI_AO_071': {
            'question': 'Which practice best balances access rights and legal exemptions under the FOI Act?',
            'options': [
                'Narrow exemptions with legal basis.',
                'Convenience over law.',
                'Inconsistent treatment.',
                'Review-control bypass.',
            ],
            'correct': 0,
            'explanation': 'Access rights and exemptions are balanced properly when exemptions are interpreted narrowly and each restriction is supported by a recorded legal basis.',
        },
        'FOI_EX_017': {
            'question': 'How are salary and emolument records of public servants generally treated under the FOI Act?',
            'options': [
                'Publicly disclosable.',
                'Privacy exemption.',
                'Trade-secret protection.',
                'Political discretion.',
            ],
            'correct': 0,
            'explanation': 'Although the Act protects private information, salary and emolument records of public servants are commonly treated as disclosable because they relate to public expenditure and accountability.',
        },
        'FOI_EX_038': {
            'question': 'When may information concerning pending criminal proceedings be released?',
            'options': [
                'No interference with proceedings.',
                'Prior AG approval.',
                'Separate citizenship proof.',
                'Blanket exemption.',
            ],
            'correct': 0,
            'explanation': 'The law-enforcement exemption protects pending proceedings only where disclosure would interfere with the investigation or trial, so release remains possible when that risk is absent.',
        },
        'FOI_EX_046': {
            'question': 'Which statement correctly describes exemptions under the FOI Act?',
            'options': [
                'Public-interest override.',
                'Absolute exemptions.',
                'Executive-only application.',
                'Broad interpretation against disclosure.',
            ],
            'correct': 0,
            'explanation': 'FOI exemptions are not absolute. Section 28 requires a public-interest assessment, and the Act expects exemptions to be read narrowly rather than expansively.',
        },
        'FOI_OP_054': {
            'question': 'What does clear writing require in official communication?',
            'options': [
                'Legibility and clear style.',
                'Illegible presentation.',
                'Style without readability.',
                'Hidden meaning.',
            ],
            'correct': 0,
            'explanation': 'Clear writing requires both readable presentation and a style that communicates the message plainly.',
        },
        'FOI_OP_061': {
            'question': 'Which action best demonstrates public accountability when enforcing FOI offences and penalties?',
            'options': [
                'Traceable evidence and reasons.',
                'Feedback ignored.',
                'Review-control shortcuts.',
                'Convenience first.',
            ],
            'correct': 0,
            'explanation': 'Public accountability in FOI enforcement is strongest when the decision can be traced to recorded reasons, supporting evidence, and the legal basis for the sanction or refusal.',
        },
        'FOI_OP_066': {
            'question': 'Which practice best supports legal compliance before an FOI sanction or enforcement step is taken?',
            'options': [
                'Statutory authority check.',
                'Personal preference.',
                'Feedback ignored.',
                'Approval bypass.',
            ],
            'correct': 0,
            'explanation': 'Before an FOI sanction or enforcement step is taken, officers should confirm the governing legal authority and record the basis for the action so the decision remains reviewable and lawful.',
        },
        'FOI_OP_072': {
            'question': 'When does the protection in Section 27 not apply to an officer\'s disclosure?',
            'options': [
                'Malicious disclosure.',
                'Formal letter.',
                'Legal advice.',
                'Court order.',
            ],
            'correct': 0,
            'explanation': 'Section 27 protects disclosures made in good faith. That protection falls away where the officer acts maliciously or without good faith.',
        },
        'clg_constitutional_governance_gen_023': {
            'question': 'Which practice best supports legal compliance in constitutional-governance work?',
            'options': [
                'Legal-authority checks and documented decision basis.',
                'Delayed documentation.',
                'Inconsistent criteria.',
                'Review-control bypass.',
            ],
            'correct': 0,
            'explanation': 'Legal compliance is stronger when statutory authority is checked before action and the basis for the decision is documented clearly.',
        },
        'clg_general_competency_gen_013': {
            'question': 'Which practice best supports risk control in general competency, ethics, and reform work?',
            'options': [
                'Documented control mitigation.',
                'Convenience bias.',
                'Ongoing non-compliance.',
                'Personal control preference.',
            ],
            'correct': 0,
            'explanation': 'Risk control is stronger when risks are identified early, appropriate controls are applied, and the mitigation used is documented for later review.',
        },
    },
    ROOT / 'data' / 'core_competencies.json': {
        'competency_verbal_018': {
            'question': 'Which indirect-speech change is correct for "I am ready"?',
            'options': [
                'Past-tense backshift.',
                'Present-tense retention.',
                'Future-intent reporting.',
                'Past-perfect backshift.',
            ],
            'correct': 0,
            'explanation': 'In indirect speech, the present tense "am" backshifts to "was" after the reporting verb in the past tense.',
        },
        'competency_verbal_056': {
            'question': 'Which indirect-speech change is correct for "I am going to Abuja tomorrow"?',
            'options': [
                'Past-tense backshift with time shift.',
                'Present-tense retention.',
                'Future-conditional form.',
                'Past-perfect reporting.',
            ],
            'correct': 0,
            'explanation': 'In indirect speech, "am going" backshifts to "was going" and "tomorrow" becomes "the next day".',
        },
        'competency_verbal_078': {
            'question': 'When should file notes be made?',
            'options': [
                'Verbal discussions.',
                'Important decisions only.',
                'End-of-day notes only.',
                'No formal notes.',
            ],
            'correct': 0,
            'explanation': 'File notes should be made when verbal discussions occur so the record is complete, accurate, and traceable.',
        },
    },
}


def update_file(path: Path, rewrites: dict[str, dict[str, object]]) -> list[str]:
    data = json.loads(path.read_text(encoding='utf-8'))
    updated: list[str] = []

    def walk(node):
        if isinstance(node, dict):
            qid = node.get('id')
            if qid in rewrites:
                node.update(rewrites[qid])
                updated.append(qid)
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)

    walk(data)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    return updated


def main() -> None:
    total = 0
    for path, rewrites in FILES.items():
        updated = update_file(path, rewrites)
        print(f'Updated {len(updated)} questions in {path.name}')
        for qid in updated:
            print(qid)
        total += len(updated)
    print(f'Total updated: {total}')


if __name__ == '__main__':
    main()
