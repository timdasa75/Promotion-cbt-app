#!/usr/bin/env python3
"""Round 93: normalize eth_conflict_interest non-parallel option sets."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'civil_service_ethics.json'
SUBCATEGORY_ID = 'eth_conflict_interest'

UPDATES = {
    'eth_conflict_interest_gen_003': {
        'question': 'Which practice best supports conflict-of-interest risk management in public service?',
        'options': ['Early review of interests with prompt escalation of unresolved conflicts.', 'Delayed checking until a complaint is filed.', 'Routine treatment of disclosure failures as minor issues.', 'Informal exceptions for senior officers.'],
        'explanation': 'Conflict-of-interest risk is reduced when interests are reviewed early and unresolved conflicts are escalated before a public decision is compromised.',
        'keywords': ['conflict_of_interest', 'risk_management', 'interest_review', 'conflict_escalation'],
    },
    'eth_conflict_interest_gen_004': {
        'question': 'Which conduct best reflects ethical handling of a conflict of interest?',
        'options': ['Neutrality, transparency, and professional restraint.', 'Personal relationships shaping rule application.', 'Private understandings in place of recorded disclosure handling.', 'Acceptance of incomplete declarations without review.'],
        'explanation': 'Proper handling of a conflict of interest requires neutrality, transparency, and professional restraint so the decision remains trusted and reviewable.',
        'keywords': ['conflict_of_interest', 'ethical_handling', 'neutrality', 'transparency'],
    },
    'eth_conflict_interest_gen_007': {
        'question': 'Which approach best sustains discipline and conduct in conflict-of-interest administration?',
        'options': ['Consistent response to misconduct under approved policy.', 'Continued non-compliance after feedback.', 'Personal preference in rule application.', 'Bypassed review checkpoints.'],
        'explanation': 'Discipline and conduct are sustained when misconduct is addressed consistently under approved policy rather than through ad hoc exceptions.',
        'keywords': ['conflict_of_interest', 'discipline_and_conduct', 'misconduct_response', 'approved_policy'],
    },
    'eth_conflict_interest_gen_009': {
        'question': 'Which practice best supports documented procedure in conflict-of-interest administration?',
        'options': ['Complete records under the approved disclosure procedure.', 'Personal preference in procedure use.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.'],
        'explanation': 'Documented procedure in conflict-of-interest administration depends on complete records under the approved disclosure and review process.',
        'keywords': ['conflict_of_interest', 'documented_procedure', 'complete_records', 'disclosure_process'],
    },
    'eth_conflict_interest_gen_011': {
        'question': 'Which action best demonstrates public accountability in conflict-of-interest administration?',
        'options': ['Traceable decisions with evidence-based reasons.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.'],
        'explanation': 'Public accountability is demonstrated when decisions are traceable and supported by evidence-based reasons that can be reviewed later.',
        'keywords': ['conflict_of_interest', 'public_accountability', 'traceable_decisions', 'evidence_based_reasons'],
    },
    'eth_conflict_interest_gen_013': {
        'question': 'Which practice best supports risk control in conflict-of-interest administration?',
        'options': ['Documented mitigation for identified conflict risks.', 'Convenience ahead of control requirements.', 'Continued non-compliance after feedback.', 'Personal preference in control use.'],
        'explanation': 'Risk control is stronger when identified conflict risks are matched with documented mitigation and follow-up action.',
        'keywords': ['conflict_of_interest', 'risk_control', 'documented_mitigation', 'conflict_risks'],
    },
    'eth_conflict_interest_gen_015': {
        'question': 'Which practice best sustains operational discipline in conflict-of-interest administration?',
        'options': ['Approved workflow checks before closure.', 'Continued non-compliance after feedback.', 'Personal preference in workflow use.', 'Bypassed review checkpoints.'],
        'explanation': 'Operational discipline in conflict-of-interest administration depends on completing the approved workflow checks before a file is closed.',
        'keywords': ['conflict_of_interest', 'operational_discipline', 'workflow_checks', 'file_closure'],
    },
    'eth_conflict_interest_gen_017': {
        'question': 'Which practice best supports record management in conflict-of-interest administration?',
        'options': ['Current files with status updates at each control point.', 'Personal preference in filing practice.', 'Bypassed review checkpoints.', 'Convenience ahead of documentation standards.'],
        'explanation': 'Record management in conflict-of-interest work depends on keeping files current and updating status at each control point.',
        'keywords': ['conflict_of_interest', 'record_management', 'current_files', 'status_updates'],
    },
    'eth_conflict_interest_gen_019': {
        'question': 'Which practice best reflects governance standards in conflict-of-interest administration?',
        'options': ['Approved conflict-of-interest procedure with complete records.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.'],
        'explanation': 'Governance standards are reflected when the approved conflict-of-interest procedure is followed and complete records are maintained.',
        'keywords': ['conflict_of_interest', 'governance_standards', 'approved_procedure', 'complete_records'],
    },
    'eth_conflict_interest_gen_023': {
        'question': 'Which practice best supports grievance handling in conflict-of-interest administration?',
        'options': ['Fair complaint review through timely documented steps.', 'Continued non-compliance after feedback.', 'Personal preference in complaint handling.', 'Bypassed review checkpoints.'],
        'explanation': 'Grievance handling remains defensible when complaints are reviewed through fair, timely, and documented steps.',
        'keywords': ['conflict_of_interest', 'grievance_handling', 'fair_review', 'documented_steps'],
    },
    'eth_conflict_interest_gen_025': {
        'question': 'Which practice best sustains discipline and conduct in conflict-of-interest administration?',
        'options': ['Consistent response to misconduct under approved policy.', 'Personal preference in discipline cases.', 'Bypassed review checkpoints.', 'Convenience ahead of conduct rules.'],
        'explanation': 'Discipline and conduct are sustained when misconduct is handled consistently under approved policy rather than through arbitrary choices.',
        'keywords': ['conflict_of_interest', 'discipline_and_conduct', 'approved_policy', 'consistent_response'],
    },
    'eth_conflict_interest_gen_027': {
        'question': 'Which practice best preserves procedural documentation in conflict-of-interest administration?',
        'options': ['Complete records tied to each approved process step.', 'Bypassed review checkpoints.', 'Convenience ahead of procedural standards.', 'Continued non-compliance after feedback.'],
        'explanation': 'Procedural documentation is preserved when each conflict-of-interest action is tied to the approved process step and supported by complete records.',
        'keywords': ['conflict_of_interest', 'procedural_documentation', 'approved_steps', 'complete_records'],
    },
    'eth_conflict_interest_gen_031': {
        'question': 'Which action best demonstrates active risk control in conflict-of-interest administration?',
        'options': ['Early risk identification with documented mitigation.', 'Continued non-compliance after feedback.', 'Personal preference in control use.', 'Bypassed review checkpoints.'],
        'explanation': 'Active risk control requires early identification of conflict risk and documented mitigation before a public decision is affected.',
        'keywords': ['conflict_of_interest', 'active_risk_control', 'early_identification', 'documented_mitigation'],
    },
    'eth_conflict_interest_gen_033': {
        'question': 'Which practice best supports workflow discipline in conflict-of-interest administration?',
        'options': ['Approved workflow completion before case closure.', 'Personal preference in workflow use.', 'Bypassed review checkpoints.', 'Convenience ahead of procedure.'],
        'explanation': 'Workflow discipline is maintained when the approved conflict-of-interest workflow is completed before the case is closed.',
        'keywords': ['conflict_of_interest', 'workflow_discipline', 'approved_workflow', 'case_closure'],
    },
    'eth_conflict_interest_gen_035': {
        'question': 'Which routine best sustains records in conflict-of-interest administration?',
        'options': ['Accurate files with control-point status updates.', 'Bypassed review checkpoints.', 'Convenience ahead of record standards.', 'Continued non-compliance after feedback.'],
        'explanation': 'Conflict-of-interest records remain reliable when files are accurate and their status is updated at each control point.',
        'keywords': ['conflict_of_interest', 'records', 'accurate_files', 'status_updates'],
    },
    'eth_conflict_interest_gen_039': {
        'question': 'Which practice best reflects conflict-of-interest risk-management standards?',
        'options': ['Early escalation of control gaps and unresolved conflicts.', 'Continued non-compliance after feedback.', 'Personal preference in rule use.', 'Bypassed review checkpoints.'],
        'explanation': 'Conflict-of-interest risk-management standards are reflected by escalating control gaps and unresolved conflicts before decisions are compromised.',
        'keywords': ['conflict_of_interest', 'risk_management_standards', 'control_gaps', 'conflict_escalation'],
    },
    'eth_conflict_interest_gen_041': {
        'question': 'Which action best demonstrates grievance review in conflict-of-interest administration?',
        'options': ['Fair complaint resolution through timely documented procedure.', 'Personal preference in complaint handling.', 'Bypassed review checkpoints.', 'Convenience ahead of grievance rules.'],
        'explanation': 'Grievance review in conflict-of-interest administration should follow fair, timely, and documented procedure so the case remains reviewable.',
        'keywords': ['conflict_of_interest', 'grievance_review', 'timely_procedure', 'documented_resolution'],
    },
    'eth_conflict_interest_gen_043': {
        'question': 'Which practice best supports conduct standards in conflict-of-interest administration?',
        'options': ['Consistent response to misconduct under approved policy.', 'Bypassed review checkpoints.', 'Convenience ahead of conduct rules.', 'Continued non-compliance after feedback.'],
        'explanation': 'Conduct standards are protected when misconduct is addressed consistently under approved policy instead of through shortcuts or discretion.',
        'keywords': ['conflict_of_interest', 'conduct_standards', 'misconduct_response', 'approved_policy'],
    },
    'eth_conflict_interest_gen_047': {
        'question': 'A desk officer receives a conflict-of-interest case that requires governance action. What should be done first?',
        'options': ['Bypassed review checkpoints.', 'Convenience ahead of legal requirements.', 'Approved conflict-of-interest procedure with complete records.', 'Personal preference in rule application.'],
        'explanation': 'The first governance step is to apply the approved conflict-of-interest procedure and keep the complete record needed for oversight.',
        'keywords': ['conflict_of_interest', 'governance_action', 'desk_officer', 'complete_records'],
    },
    'eth_conflict_interest_gen_049': {
        'question': 'When a supervisor reviews compliance gaps, which step most directly strengthens conflict-of-interest risk management?',
        'options': ['Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.', 'Bypassed review checkpoints.', 'Early escalation of control gaps and unresolved conflicts.'],
        'explanation': 'The most direct way to strengthen conflict-of-interest risk management is to escalate control gaps and unresolved conflicts before a decision is taken.',
        'keywords': ['conflict_of_interest', 'supervisor_review', 'risk_management', 'conflict_escalation'],
    },
    'eth_conflict_interest_gen_053': {
        'question': 'In a time-sensitive conflict-of-interest file, which step best preserves discipline and conduct without breaching process?',
        'options': ['Consistent response to misconduct under approved policy.', 'Personal preference in discipline handling.', 'Bypassed review checkpoints.', 'Continued non-compliance after feedback.'],
        'explanation': 'Even in a time-sensitive file, discipline and conduct are best preserved by responding to misconduct consistently under the approved policy.',
        'keywords': ['conflict_of_interest', 'discipline_and_conduct', 'time_sensitive_file', 'approved_policy'],
    },
    'eth_conflict_interest_gen_055': {
        'question': 'A desk officer receives a conflict-of-interest case that requires documented procedure. What should be done first?',
        'options': ['Bypassed review checkpoints.', 'Complete records under the approved procedure.', 'Personal preference in procedure use.', 'Convenience ahead of legal requirements.'],
        'explanation': 'The first procedural step is to follow the approved conflict-of-interest process and create the record that supports each action.',
        'keywords': ['conflict_of_interest', 'documented_procedure', 'desk_officer', 'approved_process'],
    },
    'eth_conflict_interest_gen_057': {
        'question': 'When a supervisor reviews compliance gaps, which action most directly strengthens public accountability?',
        'options': ['Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.', 'Bypassed review checkpoints.', 'Traceable decisions with evidence-based reasons.'],
        'explanation': 'Public accountability is strengthened when conflict-of-interest decisions can be traced to recorded reasons and supporting evidence.',
        'keywords': ['conflict_of_interest', 'public_accountability', 'supervisor_review', 'traceable_decisions'],
    },
    'eth_conflict_interest_gen_059': {
        'question': 'Which practice best supports risk control under conflict-of-interest accountability controls?',
        'options': ['Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.', 'Applied controls with documented mitigation.', 'Personal preference in rule application.'],
        'explanation': 'Risk control under conflict-of-interest accountability is stronger when applied controls are paired with documented mitigation and follow-up.',
        'keywords': ['conflict_of_interest', 'risk_control', 'accountability_controls', 'documented_mitigation'],
    },
    'eth_conflict_interest_gen_061': {
        'question': 'In a time-sensitive conflict-of-interest file, which step best preserves operational discipline without breaching process?',
        'options': ['Continued non-compliance after feedback.', 'Bypassed review checkpoints.', 'Personal preference in workflow use.', 'Approved workflow checks before closure.'],
        'explanation': 'Operational discipline is preserved when the approved workflow checks are completed before closure, even where time is tight.',
        'keywords': ['conflict_of_interest', 'operational_discipline', 'time_sensitive_file', 'workflow_checks'],
    },
    'eth_conflict_interest_gen_063': {
        'question': 'A desk officer receives a conflict-of-interest case that requires record management. What should be done first?',
        'options': ['Personal preference in record handling.', 'Convenience ahead of legal requirements.', 'Bypassed review checkpoints.', 'Current files with status updates at each control point.'],
        'explanation': 'The first record-management step is to keep the file current and update status at each control point so oversight remains possible.',
        'keywords': ['conflict_of_interest', 'record_management', 'desk_officer', 'status_updates'],
    },
    'eth_conflict_interest_gen_065': {
        'question': 'When a supervisor reviews compliance gaps, which action most directly strengthens conflict-of-interest governance?',
        'options': ['Continued non-compliance after feedback.', 'Bypassed review checkpoints.', 'Approved conflict-of-interest procedure with complete records.', 'Convenience ahead of legal requirements.'],
        'explanation': 'Conflict-of-interest governance is strengthened when the supervisor restores the approved procedure and the complete record needed for review.',
        'keywords': ['conflict_of_interest', 'governance', 'supervisor_review', 'complete_records'],
    },
    'eth_conflict_interest_gen_069': {
        'question': 'In a time-sensitive conflict-of-interest file, which step best preserves grievance handling without breaching process?',
        'options': ['Personal preference in complaint handling.', 'Fair complaint review through timely documented steps.', 'Bypassed review checkpoints.', 'Continued non-compliance after feedback.'],
        'explanation': 'Even in a time-sensitive file, grievance handling remains sound only when complaints are reviewed through timely and documented steps.',
        'keywords': ['conflict_of_interest', 'grievance_handling', 'time_sensitive_file', 'documented_steps'],
    },
    'eth_conflict_interest_gen_071': {
        'question': 'A desk officer receives a conflict-of-interest case that requires discipline and conduct action. What should be done first?',
        'options': ['Bypassed review checkpoints.', 'Consistent response to misconduct under approved policy.', 'Personal preference in discipline handling.', 'Convenience ahead of conduct rules.'],
        'explanation': 'The first step is to address the conduct issue through the approved policy so the response remains consistent and reviewable.',
        'keywords': ['conflict_of_interest', 'discipline_and_conduct', 'desk_officer', 'misconduct_response'],
    },
    'eth_conflict_interest_gen_072': {
        'question': 'Which practice best supports risk control in conflict-of-interest management?',
        'options': ['Continued non-compliance after feedback.', 'Applied controls with documented mitigation.', 'Personal preference in rule application.', 'Convenience ahead of legal requirements.'],
        'explanation': 'Conflict-of-interest risk is best controlled when risks are identified early, appropriate controls are applied, and mitigation is documented for review.',
        'keywords': ['conflict_of_interest', 'risk_control', 'applied_controls', 'documented_mitigation'],
    },
    'eth_conflict_interest_gen_074': {
        'question': 'Which practice should an officer prioritize to sustain discipline and conduct in conflict-of-interest cases?',
        'options': ['Consistent response to misconduct under approved policy.', 'Bypassed review checkpoints.', 'Personal preference in discipline handling.', 'Convenience ahead of conduct rules.'],
        'explanation': 'Discipline and conduct are sustained when misconduct is addressed consistently under approved policy instead of through expedient shortcuts.',
        'keywords': ['conflict_of_interest', 'discipline_and_conduct', 'officer_priorities', 'approved_policy'],
    },
    'eth_conflict_interest_gen_084': {
        'question': 'When handling a conflict-of-interest case, what should be done first to preserve records for audit and oversight?',
        'options': ['Personal preference in record handling.', 'Bypassed review checkpoints.', 'Accurate files with control-point status updates.', 'Convenience ahead of documentation standards.'],
        'explanation': 'The first priority is to maintain accurate files and update status at each control point so the audit trail remains intact.',
        'keywords': ['conflict_of_interest', 'record_management', 'audit_trail', 'status_updates'],
    },
    'eth_conflict_interest_gen_085': {
        'question': 'A desk officer receives a conflict-of-interest case that requires governance action. What should be done first to preserve fairness and compliance?',
        'options': ['Convenience ahead of legal requirements.', 'Personal preference in rule application.', 'Bypassed review checkpoints.', 'Approved conflict-of-interest procedure with complete records.'],
        'explanation': 'Fairness and compliance are preserved when the desk officer begins with the approved conflict-of-interest procedure and a complete record of the action taken.',
        'keywords': ['conflict_of_interest', 'governance_action', 'fairness', 'complete_records'],
    },
    'eth_conflict_interest_gen_087': {
        'question': 'Which action best demonstrates public accountability in conflict-of-interest management?',
        'options': ['Traceable decisions with evidence-based reasons.', 'Convenience ahead of legal requirements.', 'Bypassed review checkpoints.', 'Continued non-compliance after feedback.'],
        'explanation': 'Public accountability in conflict-of-interest management is demonstrated when decisions can be traced to evidence-based reasons recorded on the file.',
        'keywords': ['conflict_of_interest', 'public_accountability', 'traceable_decisions', 'recorded_reasons'],
    },
    'eth_conflict_interest_gen_095': {
        'question': 'In a time-sensitive conflict-of-interest file, which step best preserves operational discipline within approved timelines?',
        'options': ['Bypassed review checkpoints.', 'Continued non-compliance after feedback.', 'Approved workflow checks before closure.', 'Personal preference in workflow use.'],
        'explanation': 'Operational discipline is preserved when the approved workflow is followed and outputs are verified before closure, even under tight timelines.',
        'keywords': ['conflict_of_interest', 'operational_discipline', 'approved_timelines', 'workflow_checks'],
    },
    'eth_conflict_interest_gen_096': {
        'question': 'Which practice best aligns with sound conflict-of-interest risk management in public service?',
        'options': ['Convenience ahead of legal requirements.', 'Bypassed review checkpoints.', 'Continued non-compliance after feedback.', 'Early escalation of control gaps and material exceptions.'],
        'explanation': 'Sound conflict-of-interest risk management requires early identification of control gaps and prompt escalation of material exceptions before they harden into integrity failures.',
        'keywords': ['conflict_of_interest', 'risk_management', 'control_gaps', 'exception_escalation'],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def main() -> int:
    payload = load_json(TARGET)
    updated = 0
    for sub in payload.get('subcategories', []):
        if sub.get('id') != SUBCATEGORY_ID:
            continue
        bank = sub.get('questions', [])
        for question in bank:
            qid = question.get('id')
            if qid not in UPDATES:
                continue
            for key, value in UPDATES[qid].items():
                question[key] = value
            updated += 1
        break
    write_json(TARGET, payload)
    print(f'Applied round 93 rewrites to {updated} questions')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
