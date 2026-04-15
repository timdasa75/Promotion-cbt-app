#!/usr/bin/env python3
"""Round 91: normalize eth_anti_corruption non-parallel option sets."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'civil_service_ethics.json'
SUBCATEGORY_ID = 'eth_anti_corruption'

UPDATES = {
    'eth_anti_corruption_gen_007': {
        'question': 'Which approach best sustains discipline and conduct in anti-corruption administration?',
        'options': [
            'Consistent response to misconduct under approved policy.',
            'Continued non-compliance after feedback.',
            'Personal preference in rule application.',
            'Bypassed review checkpoints.',
        ],
        'explanation': 'Discipline and conduct are sustained when misconduct is addressed consistently under the approved policy instead of through ad hoc shortcuts.',
        'keywords': ['anti_corruption', 'discipline_and_conduct', 'consistent_response', 'approved_policy'],
    },
    'eth_anti_corruption_gen_009': {
        'question': 'Which practice best supports documented procedure in anti-corruption administration?',
        'options': [
            'Complete records with the approved procedural trail.',
            'Personal preference in procedure use.',
            'Bypassed review checkpoints.',
            'Convenience ahead of legal requirements.',
        ],
        'explanation': 'Documented procedure is strongest when each anti-corruption action is supported by complete records and the approved procedural trail.',
        'keywords': ['anti_corruption', 'documented_procedure', 'complete_records', 'procedural_trail'],
    },
    'eth_anti_corruption_gen_011': {
        'question': 'Which action best demonstrates public accountability in anti-corruption administration?',
        'options': [
            'Traceable decisions with evidence-based reasons.',
            'Bypassed review checkpoints.',
            'Convenience ahead of legal requirements.',
            'Continued non-compliance after feedback.',
        ],
        'explanation': 'Public accountability is demonstrated when decisions are traceable and supported by evidence-based reasons that can be reviewed later.',
        'keywords': ['anti_corruption', 'public_accountability', 'traceable_decisions', 'evidence_based_reasons'],
    },
    'eth_anti_corruption_gen_013': {
        'question': 'Which practice best supports risk control in anti-corruption administration?',
        'options': [
            'Documented mitigation for identified control risks.',
            'Convenience ahead of control requirements.',
            'Continued non-compliance after feedback.',
            'Personal preference in rule application.',
        ],
        'explanation': 'Risk control is strongest when identified control risks are matched with documented mitigation and follow-up action.',
        'keywords': ['anti_corruption', 'risk_control', 'documented_mitigation', 'control_risks'],
    },
    'eth_anti_corruption_gen_015': {
        'question': 'Which practice best sustains operational discipline in anti-corruption administration?',
        'options': [
            'Completion of approved workflow checks before closure.',
            'Continued non-compliance after feedback.',
            'Personal preference in workflow use.',
            'Bypassed review checkpoints.',
        ],
        'explanation': 'Operational discipline depends on completing the approved workflow checks before a file is closed or escalated.',
        'keywords': ['anti_corruption', 'operational_discipline', 'workflow_checks', 'file_closure'],
    },
    'eth_anti_corruption_gen_017': {
        'question': 'Which practice best supports record management in anti-corruption administration?',
        'options': [
            'Current files with status updates at each control point.',
            'Personal preference in filing practice.',
            'Bypassed review checkpoints.',
            'Convenience ahead of documentation standards.',
        ],
        'explanation': 'Record management in anti-corruption work depends on current files and status updates at each control point.',
        'keywords': ['anti_corruption', 'record_management', 'status_updates', 'control_points'],
    },
    'eth_anti_corruption_gen_019': {
        'question': 'Which practice best supports governance standards in anti-corruption administration?',
        'options': [
            'Approved procedures with complete governance records.',
            'Bypassed review checkpoints.',
            'Convenience ahead of legal requirements.',
            'Continued non-compliance after feedback.',
        ],
        'explanation': 'Governance standards are protected when approved procedures are followed and the supporting governance record is kept complete.',
        'keywords': ['anti_corruption', 'governance', 'approved_procedures', 'governance_records'],
    },
    'eth_anti_corruption_gen_023': {
        'question': 'Which practice best supports grievance handling in anti-corruption administration?',
        'options': [
            'Fair complaint review through timely documented steps.',
            'Continued non-compliance after feedback.',
            'Personal preference in complaint handling.',
            'Bypassed review checkpoints.',
        ],
        'explanation': 'Grievance handling remains defensible when complaints are reviewed through fair, timely, and documented steps.',
        'keywords': ['anti_corruption', 'grievance_handling', 'documented_steps', 'fair_review'],
    },
    'eth_anti_corruption_gen_025': {
        'question': 'Which practice best sustains conduct standards in anti-corruption administration?',
        'options': [
            'Consistent treatment of misconduct under approved policy.',
            'Personal preference in discipline cases.',
            'Bypassed review checkpoints.',
            'Convenience ahead of conduct rules.',
        ],
        'explanation': 'Conduct standards are sustained when misconduct is treated consistently under approved policy rather than personal discretion.',
        'keywords': ['anti_corruption', 'conduct_standards', 'misconduct_response', 'approved_policy'],
    },
    'eth_anti_corruption_gen_027': {
        'question': 'Which practice best preserves procedural documentation in anti-corruption administration?',
        'options': [
            'Complete records tied to each approved process step.',
            'Bypassed review checkpoints.',
            'Convenience ahead of procedural standards.',
            'Continued non-compliance after feedback.',
        ],
        'explanation': 'Procedural documentation is preserved when each anti-corruption action is tied to the approved process step and recorded fully.',
        'keywords': ['anti_corruption', 'procedural_documentation', 'approved_process', 'complete_records'],
    },
    'eth_anti_corruption_gen_031': {
        'question': 'Which action best demonstrates active risk control in anti-corruption administration?',
        'options': [
            'Early risk identification with applied controls and documented mitigation.',
            'Continued non-compliance after feedback.',
            'Personal preference in control use.',
            'Bypassed review checkpoints.',
        ],
        'explanation': 'Active risk control requires early identification of risk, application of controls, and documented mitigation for follow-up.',
        'keywords': ['anti_corruption', 'active_risk_control', 'early_identification', 'documented_mitigation'],
    },
    'eth_anti_corruption_gen_033': {
        'question': 'Which practice best supports workflow discipline in anti-corruption administration?',
        'options': [
            'Approved workflow completion before case closure.',
            'Personal preference in workflow use.',
            'Bypassed review checkpoints.',
            'Convenience ahead of procedure.',
        ],
        'explanation': 'Workflow discipline is preserved when the approved anti-corruption workflow is completed before any case is closed.',
        'keywords': ['anti_corruption', 'workflow_discipline', 'case_closure', 'approved_workflow'],
    },
    'eth_anti_corruption_gen_035': {
        'question': 'Which routine best sustains records in anti-corruption administration?',
        'options': [
            'Accurate files with control-point status updates.',
            'Bypassed review checkpoints.',
            'Convenience ahead of record standards.',
            'Continued non-compliance after feedback.',
        ],
        'explanation': 'Anti-corruption records stay reliable when files remain accurate and their status is updated at each control point.',
        'keywords': ['anti_corruption', 'records', 'accurate_files', 'status_updates'],
    },
    'eth_anti_corruption_gen_039': {
        'question': 'Which practice best supports anti-corruption risk management?',
        'options': [
            'Early escalation of control gaps and material exceptions.',
            'Continued non-compliance after feedback.',
            'Personal preference in rule application.',
            'Bypassed review checkpoints.',
        ],
        'explanation': 'Anti-corruption risk management depends on identifying control gaps early and escalating material exceptions before they spread.',
        'keywords': ['anti_corruption', 'risk_management', 'control_gaps', 'exception_escalation'],
    },
    'eth_anti_corruption_gen_041': {
        'question': 'Which action best demonstrates grievance review in anti-corruption administration?',
        'options': [
            'Fair complaint resolution through timely documented procedure.',
            'Personal preference in complaint handling.',
            'Bypassed review checkpoints.',
            'Convenience ahead of grievance rules.',
        ],
        'explanation': 'Grievance review in anti-corruption work should follow fair, timely, and documented procedure so the case remains reviewable.',
        'keywords': ['anti_corruption', 'grievance_review', 'timely_procedure', 'documented_resolution'],
    },
    'eth_anti_corruption_gen_042': {
        'question': 'A desk officer receives an anti-corruption case requiring governance action. What should be done first?',
        'options': [
            'Approved anti-corruption procedure with complete records.',
            'Personal preference in rule application.',
            'Convenience ahead of legal requirements.',
            'Bypassed review checkpoints.',
        ],
        'explanation': 'The first step is to apply the approved anti-corruption procedure and keep a complete record of the action taken.',
        'keywords': ['anti_corruption', 'governance_action', 'approved_procedure', 'complete_records'],
    },
    'eth_anti_corruption_gen_044': {
        'question': 'When a supervisor reviews compliance gaps, which step most directly strengthens anti-corruption risk management?',
        'options': [
            'Bypassed review checkpoints.',
            'Continued non-compliance after feedback.',
            'Convenience ahead of legal requirements.',
            'Early escalation of control gaps and material exceptions.',
        ],
        'explanation': 'The most direct way to strengthen anti-corruption risk management is to escalate control gaps and material exceptions early.',
        'keywords': ['anti_corruption', 'risk_management', 'supervisor_review', 'exception_escalation'],
    },
    'eth_anti_corruption_gen_048': {
        'question': 'In a time-sensitive anti-corruption file, which step best preserves discipline and conduct without breaching process?',
        'options': [
            'Bypassed review checkpoints.',
            'Continued non-compliance after feedback.',
            'Personal preference in rule application.',
            'Consistent response to misconduct under approved policy.',
        ],
        'explanation': 'Even in a time-sensitive file, discipline and conduct are best preserved by responding to misconduct consistently under the approved policy.',
        'keywords': ['anti_corruption', 'discipline_and_conduct', 'time_sensitive_file', 'approved_policy'],
    },
    'eth_anti_corruption_gen_050': {
        'question': 'A desk officer receives an anti-corruption case that requires documented procedure. What should be done first?',
        'options': [
            'Personal preference in rule application.',
            'Convenience ahead of legal requirements.',
            'Complete records under the approved procedure.',
            'Bypassed review checkpoints.',
        ],
        'explanation': 'The first requirement is to follow the approved procedure and create the complete record that supports each step.',
        'keywords': ['anti_corruption', 'documented_procedure', 'desk_officer', 'approved_procedure'],
    },
    'eth_anti_corruption_gen_052': {
        'question': 'When a supervisor reviews compliance gaps, which action most directly strengthens public accountability?',
        'options': [
            'Convenience ahead of legal requirements.',
            'Traceable decisions with evidence-based reasons.',
            'Bypassed review checkpoints.',
            'Continued non-compliance after feedback.',
        ],
        'explanation': 'Public accountability is strongest when decisions are traceable and supported by evidence-based reasons that can be examined later.',
        'keywords': ['anti_corruption', 'public_accountability', 'supervisor_review', 'traceable_decisions'],
    },
    'eth_anti_corruption_gen_054': {
        'question': 'Which practice best supports risk control under anti-corruption accountability controls?',
        'options': [
            'Convenience ahead of legal requirements.',
            'Personal preference in rule application.',
            'Applied controls with documented mitigation.',
            'Continued non-compliance after feedback.',
        ],
        'explanation': 'Risk control is improved when identified risks are met with applied controls and documented mitigation rather than informal handling.',
        'keywords': ['anti_corruption', 'risk_control', 'accountability_controls', 'documented_mitigation'],
    },
    'eth_anti_corruption_gen_056': {
        'question': 'In a time-sensitive anti-corruption file, which step best preserves operational discipline without breaching process?',
        'options': [
            'Bypassed review checkpoints.',
            'Approved workflow checks before closure.',
            'Continued non-compliance after feedback.',
            'Personal preference in workflow use.',
        ],
        'explanation': 'Operational discipline is preserved when the approved workflow checks are completed before closure, even where time is tight.',
        'keywords': ['anti_corruption', 'operational_discipline', 'workflow_checks', 'time_sensitive_file'],
    },
    'eth_anti_corruption_gen_058': {
        'question': 'A desk officer receives an anti-corruption case that requires record management. What should be done first?',
        'options': [
            'Convenience ahead of legal requirements.',
            'Personal preference in record handling.',
            'Bypassed review checkpoints.',
            'Current files with status updates at each control point.',
        ],
        'explanation': 'The first record-management step is to keep the file current and update status at each control point so oversight remains possible.',
        'keywords': ['anti_corruption', 'record_management', 'desk_officer', 'status_updates'],
    },
    'eth_anti_corruption_gen_060': {
        'question': 'When a supervisor reviews compliance gaps, which action most directly strengthens anti-corruption governance?',
        'options': [
            'Approved anti-corruption procedure with complete records.',
            'Convenience ahead of legal requirements.',
            'Bypassed review checkpoints.',
            'Continued non-compliance after feedback.',
        ],
        'explanation': 'Anti-corruption governance is strengthened most directly by returning the process to approved procedure and keeping a complete record of the action taken.',
        'keywords': ['anti_corruption', 'governance', 'supervisor_review', 'complete_records'],
    },
    'eth_anti_corruption_gen_064': {
        'question': 'In a time-sensitive anti-corruption file, which step best preserves grievance handling without breaching process?',
        'options': [
            'Fair complaint review through timely documented steps.',
            'Bypassed review checkpoints.',
            'Continued non-compliance after feedback.',
            'Personal preference in complaint handling.',
        ],
        'explanation': 'Even in a time-sensitive file, grievance handling remains sound only when complaints are reviewed through timely and documented steps.',
        'keywords': ['anti_corruption', 'grievance_handling', 'time_sensitive_file', 'documented_steps'],
    },
    'eth_anti_corruption_gen_066': {
        'question': 'A desk officer receives an anti-corruption case that requires discipline and conduct action. What should be done first?',
        'options': [
            'Convenience ahead of legal requirements.',
            'Bypassed review checkpoints.',
            'Personal preference in discipline handling.',
            'Consistent response to misconduct under approved policy.',
        ],
        'explanation': 'The first step is to address the conduct issue through the approved policy so the response remains consistent and reviewable.',
        'keywords': ['anti_corruption', 'discipline_and_conduct', 'desk_officer', 'misconduct_response'],
    },
    'eth_anti_corruption_gen_068': {
        'question': 'Which document-management practice best supports anti-corruption control work?',
        'options': [
            'Personal preference in record handling.',
            'Bypassed review checkpoints.',
            'Accurate files with control-point status updates.',
            'Convenience ahead of documentation standards.',
        ],
        'explanation': 'Anti-corruption control work depends on accurate files and status updates that make each step traceable and reviewable.',
        'keywords': ['anti_corruption', 'document_management', 'accurate_files', 'control_points'],
    },
    'eth_anti_corruption_gen_070': {
        'question': 'When a supervisor reviews compliance gaps, which action most directly strengthens accountability?',
        'options': [
            'Bypassed review checkpoints.',
            'Traceable decisions with evidence-based reasons.',
            'Continued non-compliance after feedback.',
            'Convenience ahead of legal requirements.',
        ],
        'explanation': 'Accountability is strengthened when the supervisor can show traceable decisions and evidence-based reasons for each step taken.',
        'keywords': ['anti_corruption', 'accountability', 'supervisor_review', 'evidence_based_reasons'],
    },
    'eth_anti_corruption_gen_071': {
        'question': 'Which practice best supports procedural documentation in anti-corruption work?',
        'options': [
            'Personal preference in rule application.',
            'Complete records under the approved procedure.',
            'Bypassed review checkpoints.',
            'Convenience ahead of legal requirements.',
        ],
        'explanation': 'Procedural documentation in anti-corruption work depends on keeping complete records under the approved procedure rather than informal shortcuts.',
        'keywords': ['anti_corruption', 'procedural_documentation', 'complete_records', 'approved_procedure'],
    },
    'eth_anti_corruption_gen_072': {
        'question': 'Which approach best promotes discipline and conduct under anti-corruption controls?',
        'options': [
            'Continued non-compliance after feedback.',
            'Personal preference in discipline handling.',
            'Consistent response to misconduct under approved policy.',
            'Bypassed review checkpoints.',
        ],
        'explanation': 'Discipline and conduct are promoted when misconduct is addressed consistently under approved policy instead of through arbitrary responses.',
        'keywords': ['anti_corruption', 'discipline_and_conduct', 'approved_policy', 'consistent_response'],
    },
    'eth_anti_corruption_gen_073': {
        'question': 'A desk officer receives an anti-corruption case that requires governance action. What should be done first to preserve fairness and compliance?',
        'options': [
            'Convenience ahead of legal requirements.',
            'Approved anti-corruption procedure with complete records.',
            'Bypassed review checkpoints.',
            'Personal preference in rule application.',
        ],
        'explanation': 'Fairness and compliance are preserved when the desk officer begins with the approved anti-corruption procedure and a complete record of the action taken.',
        'keywords': ['anti_corruption', 'governance_action', 'fairness', 'complete_records'],
    },
    'eth_anti_corruption_gen_075': {
        'question': 'Which action best demonstrates public accountability in anti-corruption work?',
        'options': [
            'Convenience ahead of legal requirements.',
            'Traceable decisions with evidence-based reasons.',
            'Continued non-compliance after feedback.',
            'Bypassed review checkpoints.',
        ],
        'explanation': 'Public accountability in anti-corruption work is demonstrated when decisions can be traced to evidence-based reasons recorded on the file.',
        'keywords': ['anti_corruption', 'public_accountability', 'traceable_decisions', 'file_record'],
    },
    'eth_anti_corruption_gen_076': {
        'question': 'Which practice should an accountable officer prioritize to sustain operational discipline in anti-corruption work?',
        'options': [
            'Personal preference in workflow use.',
            'Bypassed review checkpoints.',
            'Continued non-compliance after feedback.',
            'Approved workflow checks before closure.',
        ],
        'explanation': 'An accountable officer sustains operational discipline by ensuring that approved workflow checks are completed before closure.',
        'keywords': ['anti_corruption', 'operational_discipline', 'accountable_officer', 'workflow_checks'],
    },
    'eth_anti_corruption_gen_081': {
        'question': 'Which practice best reflects governance standards in anti-corruption work?',
        'options': [
            'Convenience ahead of legal requirements.',
            'Approved anti-corruption procedure with sustained records.',
            'Bypassed review checkpoints.',
            'Continued non-compliance after feedback.',
        ],
        'explanation': 'Governance standards in anti-corruption work require the approved procedure and a sustained record that can be checked later.',
        'keywords': ['anti_corruption', 'governance_standards', 'approved_procedure', 'sustained_records'],
    },
    'eth_anti_corruption_gen_082': {
        'question': 'Which practice best reflects risk-management standards in anti-corruption work?',
        'options': [
            'Bypassed review checkpoints.',
            'Continued non-compliance after feedback.',
            'Personal preference in control use.',
            'Early escalation of control gaps and material exceptions.',
        ],
        'explanation': 'Risk-management standards are reflected by identifying control gaps early and escalating material exceptions before they become entrenched.',
        'keywords': ['anti_corruption', 'risk_management', 'control_gaps', 'material_exceptions'],
    },
    'eth_anti_corruption_gen_084': {
        'question': 'In an anti-corruption case file, which step best preserves grievance handling without breaking workflow or losing the audit trail?',
        'options': [
            'Bypassed review checkpoints.',
            'Continued non-compliance after feedback.',
            'Fair complaint review through timely documented steps.',
            'Personal preference in complaint handling.',
        ],
        'explanation': 'Grievance handling remains auditable when complaints are reviewed through timely documented steps that fit the approved workflow.',
        'keywords': ['anti_corruption', 'grievance_handling', 'audit_trail', 'approved_workflow'],
    },
    'eth_anti_corruption_gen_088': {
        'question': 'Which practice should an accountable officer prioritize to sustain discipline and conduct in anti-corruption work?',
        'options': [
            'Bypassed review checkpoints.',
            'Personal preference in discipline handling.',
            'Consistent response to misconduct under approved policy.',
            'Convenience ahead of conduct rules.',
        ],
        'explanation': 'An accountable officer sustains discipline and conduct by responding to misconduct consistently under the approved policy.',
        'keywords': ['anti_corruption', 'discipline_and_conduct', 'accountable_officer', 'approved_policy'],
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
    print(f'Applied round 91 rewrites to {updated} questions')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
