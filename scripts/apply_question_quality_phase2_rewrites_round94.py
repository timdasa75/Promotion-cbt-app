#!/usr/bin/env python3
"""Round 94: normalize eth_misconduct non-parallel option sets."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'civil_service_ethics.json'
SUBCATEGORY_ID = 'eth_misconduct'

UPDATES = {
    'eth_misconduct_gen_004': {
        'question': 'Which conduct best reflects ethical handling of misconduct cases?',
        'options': ['Neutrality, integrity, and procedural fairness.', 'Personal sympathy shaping rule application.', 'Unwritten understandings in place of recorded procedure.', 'Incomplete fact-finding accepted under pressure.'],
        'explanation': 'Misconduct cases must be handled with neutrality, integrity, and procedural fairness so the office can justify both the process and the outcome.',
        'keywords': ['misconduct', 'ethical_handling', 'procedural_fairness', 'neutrality'],
    },
    'eth_misconduct_gen_007': {
        'question': 'Which approach best sustains discipline and conduct in misconduct administration?',
        'options': ['Consistent response to misconduct under approved policy.', 'Continued non-compliance after feedback.', 'Personal preference in rule application.', 'Bypassed review checkpoints.'],
        'explanation': 'Discipline and conduct are sustained when misconduct is addressed consistently under approved policy rather than through ad hoc exceptions.',
        'keywords': ['misconduct', 'discipline_and_conduct', 'consistent_response', 'approved_policy'],
    },
    'eth_misconduct_gen_009': {
        'question': 'Which practice best supports documented procedure in misconduct administration?',
        'options': ['Complete records under the approved disciplinary procedure.', 'Personal preference in procedure use.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.'],
        'explanation': 'Documented procedure in misconduct administration depends on complete records under the approved disciplinary process.',
        'keywords': ['misconduct', 'documented_procedure', 'disciplinary_process', 'complete_records'],
    },
    'eth_misconduct_gen_011': {
        'question': 'Which action best demonstrates public accountability in misconduct administration?',
        'options': ['Traceable decisions with evidence-based reasons.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.'],
        'explanation': 'Public accountability is demonstrated when misconduct decisions are traceable and supported by evidence-based reasons that can be reviewed later.',
        'keywords': ['misconduct', 'public_accountability', 'traceable_decisions', 'evidence_based_reasons'],
    },
    'eth_misconduct_gen_013': {
        'question': 'Which practice best supports risk control in misconduct administration?',
        'options': ['Documented mitigation for identified process risks.', 'Convenience ahead of control requirements.', 'Continued non-compliance after feedback.', 'Personal preference in control use.'],
        'explanation': 'Risk control in misconduct administration is stronger when identified process risks are matched with documented mitigation and follow-up action.',
        'keywords': ['misconduct', 'risk_control', 'documented_mitigation', 'process_risks'],
    },
    'eth_misconduct_gen_015': {
        'question': 'Which practice best sustains operational discipline in misconduct administration?',
        'options': ['Approved workflow checks before closure.', 'Continued non-compliance after feedback.', 'Personal preference in workflow use.', 'Bypassed review checkpoints.'],
        'explanation': 'Operational discipline depends on completing the approved workflow checks before a misconduct file is closed.',
        'keywords': ['misconduct', 'operational_discipline', 'workflow_checks', 'file_closure'],
    },
    'eth_misconduct_gen_017': {
        'question': 'Which practice best supports record management in misconduct administration?',
        'options': ['Current files with status updates at each control point.', 'Personal preference in filing practice.', 'Bypassed review checkpoints.', 'Convenience ahead of documentation standards.'],
        'explanation': 'Record management in misconduct work depends on keeping files current and updating status at each control point.',
        'keywords': ['misconduct', 'record_management', 'current_files', 'status_updates'],
    },
    'eth_misconduct_gen_019': {
        'question': 'Which practice best reflects governance standards in misconduct administration?',
        'options': ['Approved misconduct procedure with complete records.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.'],
        'explanation': 'Governance standards are reflected when the approved misconduct procedure is followed and complete records are maintained.',
        'keywords': ['misconduct', 'governance_standards', 'approved_procedure', 'complete_records'],
    },
    'eth_misconduct_gen_023': {
        'question': 'Which practice best supports grievance handling in misconduct administration?',
        'options': ['Fair complaint review through timely documented steps.', 'Continued non-compliance after feedback.', 'Personal preference in complaint handling.', 'Bypassed review checkpoints.'],
        'explanation': 'Grievance handling remains defensible when complaints connected with misconduct issues are reviewed through fair, timely, and documented steps.',
        'keywords': ['misconduct', 'grievance_handling', 'fair_review', 'documented_steps'],
    },
    'eth_misconduct_gen_025': {
        'question': 'Which practice best sustains discipline and conduct standards in misconduct administration?',
        'options': ['Consistent response to misconduct under approved policy.', 'Personal preference in discipline cases.', 'Bypassed review checkpoints.', 'Convenience ahead of conduct rules.'],
        'explanation': 'Discipline and conduct standards are sustained when misconduct is handled consistently under approved policy rather than through arbitrary choices.',
        'keywords': ['misconduct', 'discipline_and_conduct', 'standards', 'approved_policy'],
    },
    'eth_misconduct_gen_027': {
        'question': 'Which practice best preserves procedural documentation in misconduct administration?',
        'options': ['Complete records tied to each approved process step.', 'Bypassed review checkpoints.', 'Convenience ahead of procedural standards.', 'Continued non-compliance after feedback.'],
        'explanation': 'Procedural documentation is preserved when each misconduct action is tied to the approved process step and supported by complete records.',
        'keywords': ['misconduct', 'procedural_documentation', 'approved_steps', 'complete_records'],
    },
    'eth_misconduct_gen_031': {
        'question': 'Which action best demonstrates active risk control in misconduct administration?',
        'options': ['Early risk identification with documented mitigation.', 'Continued non-compliance after feedback.', 'Personal preference in control use.', 'Bypassed review checkpoints.'],
        'explanation': 'Active risk control requires early identification of process risks and documented mitigation before the case handling breaks down.',
        'keywords': ['misconduct', 'active_risk_control', 'early_identification', 'documented_mitigation'],
    },
    'eth_misconduct_gen_033': {
        'question': 'Which practice best supports workflow discipline in misconduct administration?',
        'options': ['Approved workflow completion before case closure.', 'Personal preference in workflow use.', 'Bypassed review checkpoints.', 'Convenience ahead of procedure.'],
        'explanation': 'Workflow discipline is maintained when the approved misconduct workflow is completed before the case is closed.',
        'keywords': ['misconduct', 'workflow_discipline', 'approved_workflow', 'case_closure'],
    },
    'eth_misconduct_gen_035': {
        'question': 'Which routine best sustains records in misconduct administration?',
        'options': ['Accurate files with control-point status updates.', 'Bypassed review checkpoints.', 'Convenience ahead of record standards.', 'Continued non-compliance after feedback.'],
        'explanation': 'Misconduct records remain reliable when files are accurate and their status is updated at each control point.',
        'keywords': ['misconduct', 'records', 'accurate_files', 'status_updates'],
    },
    'eth_misconduct_gen_039': {
        'question': 'Which practice best reflects misconduct risk-management standards?',
        'options': ['Early escalation of control gaps and material exceptions.', 'Continued non-compliance after feedback.', 'Personal preference in rule use.', 'Bypassed review checkpoints.'],
        'explanation': 'Misconduct risk-management standards are reflected by escalating control gaps and material exceptions before procedural failures spread.',
        'keywords': ['misconduct', 'risk_management_standards', 'control_gaps', 'exception_escalation'],
    },
    'eth_misconduct_gen_041': {
        'question': 'Which action best demonstrates grievance review in misconduct administration?',
        'options': ['Fair complaint resolution through timely documented procedure.', 'Personal preference in complaint handling.', 'Bypassed review checkpoints.', 'Convenience ahead of grievance rules.'],
        'explanation': 'Grievance review in misconduct administration should follow fair, timely, and documented procedure so the case remains reviewable.',
        'keywords': ['misconduct', 'grievance_review', 'timely_procedure', 'documented_resolution'],
    },
    'eth_misconduct_gen_043': {
        'question': 'Which practice best supports discipline and conduct standards in misconduct administration?',
        'options': ['Consistent response to misconduct under approved policy.', 'Bypassed review checkpoints.', 'Convenience ahead of conduct rules.', 'Continued non-compliance after feedback.'],
        'explanation': 'Discipline and conduct standards are protected when misconduct is addressed consistently under approved policy instead of through shortcuts or discretion.',
        'keywords': ['misconduct', 'discipline_and_conduct', 'standards', 'approved_policy'],
    },
    'eth_misconduct_gen_044': {
        'question': 'A desk officer receives a misconduct case that requires governance action. What should be done first?',
        'options': ['Bypassed review checkpoints.', 'Approved misconduct procedure with complete records.', 'Personal preference in rule application.', 'Convenience ahead of legal requirements.'],
        'explanation': 'The first governance step is to apply the approved misconduct procedure and keep the complete record needed for oversight.',
        'keywords': ['misconduct', 'governance_action', 'desk_officer', 'complete_records'],
    },
    'eth_misconduct_gen_046': {
        'question': 'When a supervisor reviews compliance gaps, which step most directly strengthens misconduct risk management?',
        'options': ['Early escalation of control gaps and material exceptions.', 'Bypassed review checkpoints.', 'Continued non-compliance after feedback.', 'Convenience ahead of legal requirements.'],
        'explanation': 'The most direct way to strengthen misconduct risk management is to escalate control gaps and material exceptions before the process fails.',
        'keywords': ['misconduct', 'supervisor_review', 'risk_management', 'exception_escalation'],
    },
    'eth_misconduct_gen_050': {
        'question': 'In a time-sensitive misconduct file, which step best preserves discipline and conduct without breaching process?',
        'options': ['Continued non-compliance after feedback.', 'Bypassed review checkpoints.', 'Consistent response to misconduct under approved policy.', 'Personal preference in discipline handling.'],
        'explanation': 'Even in a time-sensitive file, discipline and conduct are best preserved by responding to misconduct consistently under the approved policy.',
        'keywords': ['misconduct', 'discipline_and_conduct', 'time_sensitive_file', 'approved_policy'],
    },
    'eth_misconduct_gen_052': {
        'question': 'A desk officer receives a misconduct case that requires documented procedure. What should be done first?',
        'options': ['Personal preference in rule application.', 'Complete records under the approved procedure.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.'],
        'explanation': 'The first procedural step is to follow the approved misconduct process and create the record that supports each action.',
        'keywords': ['misconduct', 'documented_procedure', 'desk_officer', 'approved_process'],
    },
    'eth_misconduct_gen_054': {
        'question': 'When a supervisor reviews compliance gaps, which action most directly strengthens public accountability?',
        'options': ['Traceable decisions with evidence-based reasons.', 'Continued non-compliance after feedback.', 'Convenience ahead of legal requirements.', 'Bypassed review checkpoints.'],
        'explanation': 'Public accountability is strengthened when misconduct decisions can be traced to recorded reasons and supporting evidence.',
        'keywords': ['misconduct', 'public_accountability', 'supervisor_review', 'traceable_decisions'],
    },
    'eth_misconduct_gen_056': {
        'question': 'Which practice best supports risk control under misconduct accountability controls?',
        'options': ['Convenience ahead of legal requirements.', 'Personal preference in rule application.', 'Applied controls with documented mitigation.', 'Continued non-compliance after feedback.'],
        'explanation': 'Risk control under misconduct accountability is stronger when applied controls are paired with documented mitigation and follow-up.',
        'keywords': ['misconduct', 'risk_control', 'accountability_controls', 'documented_mitigation'],
    },
    'eth_misconduct_gen_058': {
        'question': 'In a time-sensitive misconduct file, which step best preserves operational discipline without breaching process?',
        'options': ['Approved workflow checks before closure.', 'Bypassed review checkpoints.', 'Continued non-compliance after feedback.', 'Personal preference in workflow use.'],
        'explanation': 'Operational discipline is preserved when the approved workflow checks are completed before closure, even where time is tight.',
        'keywords': ['misconduct', 'operational_discipline', 'time_sensitive_file', 'workflow_checks'],
    },
    'eth_misconduct_gen_060': {
        'question': 'A desk officer receives a misconduct case that requires record management. What should be done first?',
        'options': ['Convenience ahead of legal requirements.', 'Bypassed review checkpoints.', 'Personal preference in record handling.', 'Current files with status updates at each control point.'],
        'explanation': 'The first record-management step is to keep the file current and update status at each control point so oversight remains possible.',
        'keywords': ['misconduct', 'record_management', 'desk_officer', 'status_updates'],
    },
    'eth_misconduct_gen_062': {
        'question': 'When a supervisor reviews compliance gaps, which action most directly strengthens misconduct governance?',
        'options': ['Bypassed review checkpoints.', 'Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.', 'Approved misconduct procedure with complete records.'],
        'explanation': 'Misconduct governance is strengthened when the supervisor restores the approved procedure and the complete record needed for review.',
        'keywords': ['misconduct', 'governance', 'supervisor_review', 'complete_records'],
    },
    'eth_misconduct_gen_066': {
        'question': 'In a time-sensitive misconduct file, which step best preserves grievance handling without breaching process?',
        'options': ['Personal preference in complaint handling.', 'Continued non-compliance after feedback.', 'Bypassed review checkpoints.', 'Fair complaint review through timely documented steps.'],
        'explanation': 'Even in a time-sensitive file, grievance handling remains sound only when complaints are reviewed through timely and documented steps.',
        'keywords': ['misconduct', 'grievance_handling', 'time_sensitive_file', 'documented_steps'],
    },
    'eth_misconduct_gen_068': {
        'question': 'A desk officer receives a misconduct case that requires discipline and conduct action. What should be done first?',
        'options': ['Convenience ahead of legal requirements.', 'Consistent response to misconduct under approved policy.', 'Personal preference in discipline handling.', 'Bypassed review checkpoints.'],
        'explanation': 'The first step is to address the conduct issue through the approved policy so the response remains consistent and reviewable.',
        'keywords': ['misconduct', 'discipline_and_conduct', 'desk_officer', 'misconduct_response'],
    },
    'eth_misconduct_gen_070': {
        'question': 'When a misconduct case requires formal handling, what should be done first to keep the process defensible?',
        'options': ['Personal preference in rule application.', 'Convenience ahead of legal requirements.', 'Bypassed review checkpoints.', 'Complete records under the approved procedure.'],
        'explanation': 'A misconduct process remains defensible when the approved documented procedure is followed and complete records are kept from the start.',
        'keywords': ['misconduct', 'defensible_process', 'approved_procedure', 'complete_records'],
    },
    'eth_misconduct_gen_072': {
        'question': 'Which document-management practice should an officer prioritize in misconduct cases?',
        'options': ['Accurate files with control-point status updates.', 'Convenience ahead of legal requirements.', 'Bypassed review checkpoints.', 'Continued non-compliance after feedback.'],
        'explanation': 'Misconduct cases require accurate files and updated status records at each control point so the audit trail remains complete and reviewable.',
        'keywords': ['misconduct', 'document_management', 'accurate_files', 'status_updates'],
    },
    'eth_misconduct_gen_084': {
        'question': 'Which action best demonstrates risk control in misconduct-case management?',
        'options': ['Personal preference in rule application.', 'Bypassed review checkpoints.', 'Applied controls with documented mitigation.', 'Continued non-compliance after feedback.'],
        'explanation': 'Risk control in misconduct-case management is demonstrated by identifying risks early, applying the necessary controls, and documenting the mitigation steps taken.',
        'keywords': ['misconduct', 'risk_control', 'case_management', 'documented_mitigation'],
    },
    'eth_misconduct_gen_085': {
        'question': 'Which practice best aligns with misconduct risk-management standards?',
        'options': ['Convenience ahead of legal requirements.', 'Bypassed review checkpoints.', 'Continued non-compliance after feedback.', 'Early escalation of control gaps and material exceptions.'],
        'explanation': 'Misconduct risk-management standards are reflected by identifying control gaps early and escalating material exceptions before they turn into procedural failure.',
        'keywords': ['misconduct', 'risk_management_standards', 'control_gaps', 'exception_escalation'],
    },
    'eth_misconduct_gen_088': {
        'question': 'When handling a misconduct case, what should be done first to preserve records for audit and oversight?',
        'options': ['Personal preference in record handling.', 'Accurate files with control-point status updates.', 'Convenience ahead of legal requirements.', 'Bypassed review checkpoints.'],
        'explanation': 'The first priority is to maintain accurate files and update status at each control point so the audit trail remains intact.',
        'keywords': ['misconduct', 'record_management', 'audit_trail', 'status_updates'],
    },
    'eth_misconduct_gen_090': {
        'question': 'Which practice best supports accountability and risk control in misconduct cases?',
        'options': ['Continued non-compliance after feedback.', 'Applied controls with documented mitigation.', 'Convenience ahead of legal requirements.', 'Personal preference in rule application.'],
        'explanation': 'Accountability and risk control are best supported when risks are identified early, controls are applied, and mitigating steps are documented for later review.',
        'keywords': ['misconduct', 'accountability', 'risk_control', 'documented_mitigation'],
    },
    'eth_misconduct_gen_093': {
        'question': 'In a time-sensitive misconduct file, which step best preserves grievance handling without breaking procedure?',
        'options': ['Personal preference in complaint handling.', 'Fair complaint review through timely documented steps.', 'Continued non-compliance after feedback.', 'Bypassed review checkpoints.'],
        'explanation': 'Grievance handling is preserved when complaints are resolved through fair, timely, and documented procedures that keep the case reviewable.',
        'keywords': ['misconduct', 'grievance_handling', 'time_sensitive_file', 'documented_steps'],
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
    print(f'Applied round 94 rewrites to {updated} questions')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
