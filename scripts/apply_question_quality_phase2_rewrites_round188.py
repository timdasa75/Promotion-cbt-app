from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'civil_service_ethics.json': {
        'csh_pt_008': {
            'question': "What may happen to an officer's increment while the officer is under interdiction or suspension?",
            'options': [
                'Increment withheld or deferred.',
                'Full increment payment.',
                'Automatic increment doubling.',
                'Increment payment without review.',
            ],
            'correct': 0,
            'explanation': 'Under the PSR, an officer under interdiction or suspension may have the normal increment withheld or deferred.',
        },
        'csh_pt_010': {
            'question': 'What is true about restoring a withheld increment?',
            'options': [
                'No retrospective restoration.',
                'Automatic retrospective restoration.',
                'Three-month restoration.',
                'Ministerial restoration approval.',
            ],
            'correct': 0,
            'explanation': 'A withheld increment cannot be restored retrospectively.',
        },
        'csh_pt_048': {
            'question': 'What happens if an officer leaves the Service after taking more proportionate leave than was earned?',
            'options': [
                'Refund of salary for excess leave days.',
                'Automatic loss of all terminal benefits.',
                'Refund of transport and utility allowances.',
                'Automatic leave without pay.',
            ],
            'correct': 0,
            'explanation': 'Where more proportionate leave was enjoyed than earned, the officer must refund salary for the excess leave days.',
        },
        'csh_pt_051': {
            'question': 'What is the purpose of a handing-over note?',
            'options': [
                'Projects, files, and responsibilities for the successor.',
                'Reasons for leaving the Service.',
                'Personal assets of the outgoing officer.',
                'All money spent by the outgoing officer.',
            ],
            'correct': 0,
            'explanation': 'A handing-over note helps continuity by setting out the projects, files, and responsibilities that the successor needs to take over properly.',
        },
        'csh_pt_070': {
            'question': 'What should a civil servant do after detecting financial abuse?',
            'options': [
                'Official-channel reporting.',
                'Friend-or-colleague reporting.',
                'Delayed superior reporting.',
                'Abuse avoidance.',
            ],
            'correct': 0,
            'explanation': 'Financial abuse should be reported through the proper official channel so that it can be investigated and addressed under the right procedure.',
        },
        'csh_pt_073': {
            'question': 'If a file will be needed again later, what should be done after working on it?',
            'options': [
                'Bring-up system with registry follow-up.',
                'Desk-drawer storage.',
                'Unrecorded handoff.',
                'Immediate disposal.',
            ],
            'correct': 0,
            'explanation': 'A file needed again later should be placed on a bring-up system and routed properly through registry channels so later follow-up is controlled.',
        },
        'csh_pt_074': {
            'question': 'What information should a handing-over note contain?',
            'options': [
                'Projects, files, and responsibilities for the successor.',
                'Reasons for leaving the Service.',
                'Personal assets of the outgoing officer.',
                'All money spent by the outgoing officer.',
            ],
            'correct': 0,
            'explanation': 'A handing-over note should set out the projects, files, and responsibilities that will pass to the successor so work can continue without confusion.',
        },
        'csh_sdg_032': {
            'question': 'What happens to an appeal or petition that is illegible or meaningless under Rule 110208(iii)?',
            'options': [
                'Not entertained.',
                'Direct court transfer.',
                'Automatic correction return.',
                'Warning only.',
            ],
            'correct': 0,
            'explanation': 'Rule 110208(iii) provides that an appeal or petition that is illegible or meaningless will not be entertained.',
        },
        'csh_sdg_035': {
            'question': 'When do PSR provisions apply to a federal parastatal?',
            'options': [
                'Absent or inconsistent internal rules.',
                'Complete internal rules.',
                'Temporary ministry directions.',
                'Research-institution status.',
            ],
            'correct': 0,
            'explanation': 'The PSR applies in a federal parastatal where internal rules are absent or contain gaps or inconsistencies that require the general service rules to fill them.',
        },
        'csh_service_delivery_grievance_gen_014': {
            'question': 'Which practice best supports risk control in service delivery and grievance administration?',
            'options': [
                'Applied controls with documented mitigation.',
                'Convenience bias.',
                'Ongoing non-compliance.',
                'Personal control preference.',
            ],
            'correct': 0,
            'explanation': 'Risk control is stronger when risks are identified early, appropriate controls are applied, and the mitigation used is documented for later review.',
        },
        'eth_anti_corruption_gen_031': {
            'question': 'Which action best demonstrates active risk control in anti-corruption administration?',
            'options': [
                'Early risk identification with applied controls and documented mitigation.',
                'Ongoing non-compliance.',
                'Personal control preference.',
                'Review-checkpoint bypass.',
            ],
            'correct': 0,
            'explanation': 'Active risk control requires early identification of risk, application of controls, and documented mitigation for follow-up.',
        },
        'eth_anti_corruption_gen_052': {
            'question': 'What should a supervisor do after identifying compliance gaps to strengthen public accountability?',
            'options': [
                'Corrective action plan with deadline follow-up.',
                'Gap neglect.',
                'Deferred audit cycle.',
                'Record-trail removal.',
            ],
            'correct': 0,
            'explanation': 'Public accountability is strengthened when compliance gaps are answered with a corrective plan and deadline follow-up.',
        },
        'eth_anti_corruption_gen_054': {
            'question': 'Which practice best supports risk control under anti-corruption accountability controls?',
            'options': [
                'Applied controls with documented mitigation.',
                'Convenience bias.',
                'Personal rule preference.',
                'Ongoing non-compliance.',
            ],
            'correct': 0,
            'explanation': 'Risk control is improved when identified risks are met with applied controls and documented mitigation rather than informal handling.',
        },
        'eth_code_conduct_gen_013': {
            'question': 'Which practice best supports risk control under the Code of Conduct?',
            'options': [
                'Documented control application and mitigation.',
                'Convenience bias.',
                'Ongoing non-compliance.',
                'Personal control preference.',
            ],
            'correct': 0,
            'explanation': 'Risk control is stronger when approved controls are applied early and the mitigation is documented for later review.',
        },
        'eth_code_conduct_gen_031': {
            'question': 'Which action best demonstrates active risk control under the Code of Conduct?',
            'options': [
                'Documented control application and mitigation.',
                'Convenience bias.',
                'Ongoing non-compliance.',
                'Personal control preference.',
            ],
            'correct': 0,
            'explanation': 'Active risk control requires approved controls, not convenience, and it should be supported by documented mitigation.',
        },
        'eth_code_conduct_gen_046': {
            'question': 'Which practice best supports risk control under Code-of-Conduct accountability arrangements?',
            'options': [
                'Documented control application and mitigation.',
                'Convenience bias.',
                'Ongoing non-compliance.',
                'Personal control preference.',
            ],
            'correct': 0,
            'explanation': 'Accountability arrangements work best when risks are matched with approved controls and the mitigation is recorded.',
        },
        'eth_code_conduct_gen_063': {
            'question': 'Are gifts or presentations allowed for Foreign Service Officers who render services?',
            'options': [
                'No gift acceptance.',
                'Declared gifts only.',
                'Diplomatic-counterpart gifts.',
                'Minimal-value gifts.',
            ],
            'correct': 0,
            'explanation': 'Foreign Service Officers are not allowed to accept gifts or presentations from any person for services rendered or to be rendered.',
        },
        'eth_code_conduct_gen_070': {
            'question': 'What is the role of the Accounting Officer in a vehicle-accident investigation?',
            'options': [
                'Reports, investigation, and disciplinary follow-up.',
                'Personal investigation.',
                'Personal damages payment.',
                'Accident concealment.',
            ],
            'correct': 0,
            'explanation': 'The Accounting Officer must ensure that the reports are obtained, the investigation is conducted, and disciplinary follow-up is taken.',
        },
        'eth_code_conduct_gen_079': {
            'question': 'When an imprest issued by a Sub-Accounting Officer is retired at another station, what must the issuing officer verify?',
            'options': [
                'Receipt voucher particulars.',
                'Ministerial notice.',
                'Fresh audit completion.',
                'New cash advance.',
            ],
            'correct': 0,
            'explanation': 'The issuing Sub-Accounting Officer remains responsible for verifying the receipt voucher particulars before accepting the retirement.',
        },
        'eth_conflict_interest_gen_003': {
            'question': 'Which practice best supports conflict-of-interest risk management in public service?',
            'options': [
                'Early interest review and conflict escalation.',
                'Delayed complaint-only checking.',
                'Minor-breach tolerance.',
                'Senior-officer exceptions.',
            ],
            'correct': 0,
            'explanation': 'Conflict-of-interest risk is reduced when interests are reviewed early and unresolved conflicts are escalated before a public decision is compromised.',
        },
        'eth_conflict_interest_gen_059': {
            'question': 'Which practice best supports risk control under conflict-of-interest accountability controls?',
            'options': [
                'Applied controls with documented mitigation.',
                'Convenience bias.',
                'Personal rule preference.',
                'Ongoing non-compliance.',
            ],
            'correct': 0,
            'explanation': 'Risk control under conflict-of-interest accountability is stronger when applied controls are paired with documented mitigation and follow-up.',
        },
        'eth_conflict_interest_gen_072': {
            'question': 'Which practice best supports risk control in conflict-of-interest management?',
            'options': [
                'Applied controls with documented mitigation.',
                'Ongoing non-compliance.',
                'Personal rule preference.',
                'Convenience bias.',
            ],
            'correct': 0,
            'explanation': 'Conflict-of-interest risk is best controlled when risks are identified early, appropriate controls are applied, and mitigation is documented for review.',
        },
        'eth_general_gen_013': {
            'question': 'Which practice best supports risk control in general ethics?',
            'options': [
                'Applied controls with documented mitigation.',
                'Convenience bias.',
                'Ongoing non-compliance.',
                'Personal control preference.',
            ],
            'correct': 0,
            'explanation': 'Risk control in general ethics is stronger when identified risks are matched with applied controls and documented mitigation.',
        },
        'eth_general_gen_031': {
            'question': 'Which action best demonstrates active risk control in general ethics administration?',
            'options': [
                'Applied controls with documented mitigation.',
                'Convenience bias.',
                'Ongoing non-compliance.',
                'Personal control preference.',
            ],
            'correct': 0,
            'explanation': 'Risk control in general ethics is stronger when identified risks are matched with applied controls and documented mitigation.',
        },
        'eth_general_gen_037': {
            'question': 'Which governance practice most strengthens ethical standards across a public institution?',
            'options': [
                'Clear reporting channels with periodic review and documented follow-up.',
                'Unsupervised ethics controls.',
                'Unrecorded minor breaches.',
                'Awareness notices without oversight.',
            ],
            'correct': 0,
            'explanation': 'Institutional ethical standards are strongest when reporting channels are clear, reviews are periodic, and breaches receive documented follow-up.',
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
