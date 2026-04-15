#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'civil_service_ethics.json'
SUB = 'csh_discipline_conduct'
UPDATES = {}


def opts(i, good, bad):
    out = list(bad)
    out.insert(i, good)
    return out


def add(qid, q, i, good, bad, exp, kw):
    UPDATES[qid] = {
        'question': q,
        'options': opts(i, good, bad),
        'explanation': exp,
        'keywords': kw,
    }


BAD_DOC = [
    'Personal preference in procedure use.',
    'Bypassed review checkpoints.',
    'Convenience ahead of legal requirements.',
]
BAD_ACC = [
    'Unrecorded decisions under pressure.',
    'Convenience ahead of review duty.',
    'Inconsistent criteria across similar cases.',
]
BAD_DISC = [
    'Rules applied selectively for convenience.',
    'Known controls bypassed to save time.',
    'Informal practice accepted instead of approved process.',
]
BAD_CTRL = [
    'Convenience ahead of control requirements.',
    'Repeated non-compliance after feedback.',
    'Personal preference in control use.',
]
BAD_WORKFLOW = [
    'Skipped workflow checks under pressure.',
    'Personal preference in workflow steps.',
    'Repeated non-compliance after feedback.',
]
BAD_FILE = [
    'Personal preference in filing practice.',
    'Bypassed review checkpoints.',
    'Convenience ahead of documentation standards.',
]
BAD_GRIEV = [
    'Complaints ignored until they escalate.',
    'Undocumented verbal assurances only.',
    'Personal preference instead of approved review channels.',
]
BAD_RISK = [
    'Unreported exceptions in routine work.',
    'Convenience ahead of risk review.',
    'Personal preference in risk handling.',
]

# Generated shell
add(
    'csh_discipline_conduct_gen_001',
    'Which practice best strengthens governance in discipline and conduct administration?',
    0,
    'Approved procedures with complete case records.',
    BAD_DOC,
    'Governance in discipline and conduct administration is strongest when officers follow the approved procedure and keep complete case records for review and accountability.',
    ['csh_discipline_conduct', 'governance', 'approved_procedure', 'case_records'],
)
add(
    'csh_discipline_conduct_gen_003',
    'Which step best helps a supervisor detect discipline risks before they become formal misconduct cases?',
    0,
    'Early identification and escalation of warning signs.',
    BAD_RISK,
    'Supervisors reduce misconduct risk when warning signs are identified early, escalated properly, and followed up before the matter becomes formal.',
    ['csh_discipline_conduct', 'discipline_risk', 'early_detection', 'escalation'],
)
add(
    'csh_discipline_conduct_gen_007',
    'Which practice best sustains discipline and conduct standards in a public-service unit?',
    0,
    'Consistent compliance with approved conduct controls.',
    BAD_DISC,
    'Discipline and conduct standards are sustained when officers apply approved controls consistently instead of relying on informal discretion.',
    ['csh_discipline_conduct', 'conduct_standards', 'approved_controls', 'consistent_compliance'],
)
add(
    'csh_discipline_conduct_gen_009',
    'Which practice best supports documented procedure in discipline and conduct administration?',
    0,
    'Complete records kept under the approved procedure.',
    BAD_DOC,
    'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
    ['csh_discipline_conduct', 'documented_procedure', 'approved_process', 'complete_records'],
)
add(
    'csh_discipline_conduct_gen_011',
    'Which action best demonstrates public accountability in discipline and conduct administration?',
    0,
    'Traceable decisions with recorded reasons.',
    BAD_ACC,
    'Public accountability depends on decisions that can be traced to recorded reasons and supporting evidence.',
    ['csh_discipline_conduct', 'public_accountability', 'traceable_decisions', 'recorded_reasons'],
)
add(
    'csh_discipline_conduct_gen_013',
    'When a conduct complaint is received, which control best reduces the risk of a flawed disciplinary process?',
    0,
    'Documented review with fair hearing and fact verification.',
    BAD_CTRL,
    'A disciplinary process is less likely to be flawed when the complaint is reviewed through documented steps, fair hearing, and fact verification.',
    ['csh_discipline_conduct', 'disciplinary_process', 'fair_hearing', 'fact_verification'],
)
add(
    'csh_discipline_conduct_gen_015',
    'Which routine best sustains operational discipline in a unit that handles sensitive official work?',
    0,
    'Approved workflow checks before action is closed.',
    BAD_WORKFLOW,
    'Operational discipline depends on completing approved workflow checks before a matter is closed or advanced.',
    ['csh_discipline_conduct', 'operational_discipline', 'workflow_checks', 'case_closure'],
)
add(
    'csh_discipline_conduct_gen_017',
    'Which practice best supports record management in discipline and conduct administration?',
    0,
    'Current files with status updates at each control point.',
    BAD_FILE,
    'Record management depends on keeping files current and updating status at each control point so the matter remains reviewable.',
    ['csh_discipline_conduct', 'record_management', 'current_files', 'status_updates'],
)
add(
    'csh_discipline_conduct_gen_019',
    'Which routine best strengthens governance standards in discipline and conduct administration?',
    0,
    'Approved governance procedures with complete records.',
    BAD_DOC,
    'Governance standards are strongest when officers follow the approved procedure consistently and keep the records needed for review and continuity.',
    ['csh_discipline_conduct', 'governance_standards', 'approved_procedure', 'governance_records'],
)
add(
    'csh_discipline_conduct_gen_023',
    'Which practice best supports grievance handling within discipline and conduct administration?',
    0,
    'Prompt review through fair and documented complaint channels.',
    BAD_GRIEV,
    'Grievance handling is strongest when complaints are reviewed promptly through fair, documented channels and followed up properly.',
    ['csh_discipline_conduct', 'grievance_handling', 'documented_review', 'follow_up'],
)
add(
    'csh_discipline_conduct_gen_025',
    'Which practice best sustains discipline and conduct in daily official work?',
    0,
    'Consistent compliance with approved conduct standards.',
    BAD_DISC,
    'Daily discipline and conduct depend on consistent compliance with approved standards rather than convenience or informal shortcuts.',
    ['csh_discipline_conduct', 'daily_conduct', 'approved_standards', 'consistent_compliance'],
)

# Factual tail
add(
    'csh_disc_020',
    'Which item is not a valid ground for rejecting a petition or appeal under PSR 110208?',
    2,
    'Inclusion of the required signature and staff number.',
    [
        'Illegibility of the petition.',
        'A pending court case on the same matter.',
        'Repetition of earlier claims without new facts.',
    ],
    'A petition should be accepted when it includes the required authentication details such as signature and staff number; rejection grounds include illegibility, pending litigation, repetition without new facts, or similar defects.',
    ['psr_110208', 'petition_appeal', 'authentication_details', 'rejection_grounds'],
)
add(
    'csh_disc_032',
    'Under PSR 070210, what happens if a female officer interrupts a training course of not more than six months because of pregnancy?',
    1,
    'She may be required to refund all or part of the course cost.',
    [
        'Immediate dismissal from service.',
        'Automatic permanent study leave.',
        'Immediate promotion on return.',
    ],
    'PSR 070210 provides that where such a short training course is interrupted on grounds of pregnancy, the officer may be required to refund all or part of the course cost.',
    ['psr_070210', 'training_interruption', 'pregnancy', 'course_cost_refund'],
)
add(
    'csh_disc_051',
    'How does the attendance register distinguish staff who arrive on time from those who arrive late?',
    0,
    'A red line is drawn, and latecomers sign below it.',
    [
        'A supervisor writes a note beside each late name.',
        'Everyone signs in exactly the same place without distinction.',
        'Latecomers sign on a separate attendance sheet.',
    ],
    'The attendance register uses a red line drawn at the prescribed time so that officers who arrive late sign below it.',
    ['attendance_register', 'lateness', 'red_line', 'official_attendance_control'],
)
add(
    'csh_disc_058',
    'Why is it dangerous for a civil servant to accept gifts from contractors or business people?',
    1,
    'It can compromise the civil servant\'s integrity.',
    [
        'It is a normal part of business practice.',
        'It will always create a useful relationship.',
        'It should be treated merely as kindness.',
    ],
    'Accepting gifts from contractors or business people can compromise a civil servant\'s integrity and weaken public confidence in official impartiality.',
    ['gifts', 'contractors', 'integrity', 'official_impartiality'],
)
add(
    'csh_disc_062',
    'When a civil servant has finished with a file but further action will be needed later, what should be done?',
    2,
    'Place it on a bring-up pad for the later date and return it through registry channels.',
    [
        'Discard it because it is not needed immediately.',
        'Keep it permanently in a desk drawer.',
        'Pass it to a colleague without recording the transfer.',
    ],
    'A file that will require later action should be placed on a bring-up pad for the relevant date and returned through the proper registry process.',
    ['file_handling', 'bring_up_pad', 'registry_channels', 'later_action'],
)
add(
    'csh_disc_068',
    'What should a civil servant do if an assigned file has remained on the desk too long without action?',
    0,
    'Report the delay to a superior officer and return the file for proper registry control.',
    [
        'Keep the file until someone asks about it.',
        'Pass it to a colleague without recording the transfer.',
        'Dispose of it to reduce the backlog.',
    ],
    'A file that has stayed too long without action should be reported to a superior officer and returned for proper registry control so accountability is restored.',
    ['delayed_file', 'registry_control', 'escalation', 'official_backlog'],
)


def main():
    data = json.loads(TARGET.read_text(encoding='utf-8'))
    updated = 0
    found = set()
    for sub in data.get('subcategories', []):
        if sub.get('id') != SUB:
            continue
        for q in sub.get('questions', []):
            patch = UPDATES.get(q.get('id'))
            if not patch:
                continue
            q.update(patch)
            updated += 1
            found.add(q.get('id'))
        break
    else:
        raise RuntimeError(f'Missing subcategory: {SUB}')

    missing = sorted(set(UPDATES) - found)
    if missing:
        raise RuntimeError(f'Missing questions: {missing}')

    TARGET.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Applied round 112 rewrites to {updated} questions')


if __name__ == '__main__':
    main()
