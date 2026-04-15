#!/usr/bin/env python3
"""Round 92: normalize pol_public_sector_planning non-parallel option sets."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'policy_analysis.json'
SUBCATEGORY_ID = 'pol_public_sector_planning'

UPDATES = {
    'pol_public_sector_planning_gen_001': {
        'question': 'Which practice best demonstrates governance discipline in public sector planning?',
        'options': ['Approved planning procedure with complete governance records.', 'Personal preference in planning decisions.', 'Bypassed review checkpoints.', 'Convenience ahead of planning requirements.'],
        'explanation': 'Governance discipline in public sector planning depends on following the approved procedure and keeping a complete governance record for review.',
        'keywords': ['public_sector_planning', 'governance_discipline', 'approved_procedure', 'governance_records'],
    },
    'pol_public_sector_planning_gen_003': {
        'question': 'Which practice best supports risk management in public sector planning?',
        'options': ['Early escalation of control gaps and material exceptions.', 'Bypassed review checkpoints.', 'Convenience ahead of planning requirements.', 'Continued non-compliance after feedback.'],
        'explanation': 'Risk management in planning work depends on identifying control gaps early and escalating material exceptions before they damage implementation.',
        'keywords': ['public_sector_planning', 'risk_management', 'control_gaps', 'exception_escalation'],
    },
    'pol_public_sector_planning_gen_007': {
        'question': 'Which practice best protects evidence quality in public sector planning?',
        'options': ['Credible data sources with validated assumptions.', 'Continued non-compliance after feedback.', 'Personal preference in evidence use.', 'Bypassed review checkpoints.'],
        'explanation': 'Evidence quality is protected when planning decisions rely on credible data sources and assumptions that have been checked and validated.',
        'keywords': ['public_sector_planning', 'evidence_quality', 'credible_sources', 'validated_assumptions'],
    },
    'pol_public_sector_planning_gen_009': {
        'question': 'Which practice best supports documented procedure in public sector planning?',
        'options': ['Complete records under the approved planning procedure.', 'Personal preference in procedure use.', 'Bypassed review checkpoints.', 'Convenience ahead of procedural standards.'],
        'explanation': 'Documented procedure in planning is strongest when each action is tied to the approved process and supported by complete records.',
        'keywords': ['public_sector_planning', 'documented_procedure', 'complete_records', 'approved_process'],
    },
    'pol_public_sector_planning_gen_011': {
        'question': 'Which action best demonstrates public accountability in public sector planning?',
        'options': ['Traceable decisions with evidence-based reasons.', 'Bypassed review checkpoints.', 'Convenience ahead of planning requirements.', 'Continued non-compliance after feedback.'],
        'explanation': 'Public accountability in planning requires decisions that can be traced to recorded reasons and supporting evidence.',
        'keywords': ['public_sector_planning', 'public_accountability', 'traceable_decisions', 'evidence_based_reasons'],
    },
    'pol_public_sector_planning_gen_013': {
        'question': 'Which practice best supports risk control in public sector planning?',
        'options': ['Documented mitigation for identified planning risks.', 'Convenience ahead of control requirements.', 'Continued non-compliance after feedback.', 'Personal preference in control use.'],
        'explanation': 'Risk control in planning improves when identified risks are matched with documented mitigation and follow-up action.',
        'keywords': ['public_sector_planning', 'risk_control', 'documented_mitigation', 'planning_risks'],
    },
    'pol_public_sector_planning_gen_015': {
        'question': 'Which practice best sustains operational discipline in public sector planning?',
        'options': ['Approved workflow checks before file closure.', 'Continued non-compliance after feedback.', 'Personal preference in workflow use.', 'Bypassed review checkpoints.'],
        'explanation': 'Operational discipline in planning depends on completing the approved workflow checks before the file is closed.',
        'keywords': ['public_sector_planning', 'operational_discipline', 'workflow_checks', 'file_closure'],
    },
    'pol_public_sector_planning_gen_017': {
        'question': 'Which practice best supports record management in public sector planning?',
        'options': ['Current files with status updates at each control point.', 'Personal preference in filing practice.', 'Bypassed review checkpoints.', 'Convenience ahead of documentation standards.'],
        'explanation': 'Record management in planning depends on keeping files current and updating status at each control point for later review.',
        'keywords': ['public_sector_planning', 'record_management', 'current_files', 'status_updates'],
    },
    'pol_public_sector_planning_gen_019': {
        'question': 'Which practice best reflects governance standards in public sector planning?',
        'options': ['Approved planning procedure with sustained records.', 'Bypassed review checkpoints.', 'Convenience ahead of planning requirements.', 'Continued non-compliance after feedback.'],
        'explanation': 'Planning governance standards are reflected by following the approved procedure and sustaining the records needed for oversight.',
        'keywords': ['public_sector_planning', 'governance_standards', 'approved_procedure', 'sustained_records'],
    },
    'pol_public_sector_planning_gen_023': {
        'question': 'Which practice best supports implementation planning in public sector planning?',
        'options': ['Recorded responsibilities, timelines, and performance metrics.', 'Continued non-compliance after feedback.', 'Personal preference in implementation choices.', 'Bypassed review checkpoints.'],
        'explanation': 'Implementation planning is strongest when responsibilities, timelines, and performance metrics are recorded clearly before execution begins.',
        'keywords': ['public_sector_planning', 'implementation_planning', 'timelines', 'performance_metrics'],
    },
    'pol_public_sector_planning_gen_025': {
        'question': 'Which practice best sustains evidence quality in public sector planning?',
        'options': ['Credible data sources with validated assumptions.', 'Personal preference in evidence use.', 'Bypassed review checkpoints.', 'Convenience ahead of planning requirements.'],
        'explanation': 'Evidence quality is sustained when planning decisions rely on credible sources and assumptions that have been checked rather than guessed.',
        'keywords': ['public_sector_planning', 'evidence_quality', 'credible_sources', 'validated_assumptions'],
    },
    'pol_public_sector_planning_gen_027': {
        'question': 'Which practice best preserves procedural documentation in public sector planning?',
        'options': ['Complete records tied to each approved planning step.', 'Bypassed review checkpoints.', 'Convenience ahead of procedural standards.', 'Continued non-compliance after feedback.'],
        'explanation': 'Procedural documentation is preserved when each planning action is tied to the approved step and supported by complete records.',
        'keywords': ['public_sector_planning', 'procedural_documentation', 'approved_steps', 'complete_records'],
    },
    'pol_public_sector_planning_gen_031': {
        'question': 'Which action best demonstrates active risk control in public sector planning?',
        'options': ['Early risk identification with documented mitigation.', 'Continued non-compliance after feedback.', 'Personal preference in control use.', 'Bypassed review checkpoints.'],
        'explanation': 'Active risk control in planning requires early identification of risks and documented mitigation before implementation suffers.',
        'keywords': ['public_sector_planning', 'active_risk_control', 'early_identification', 'documented_mitigation'],
    },
    'pol_public_sector_planning_gen_033': {
        'question': 'Which practice best supports workflow discipline in public sector planning?',
        'options': ['Approved workflow completion before case closure.', 'Personal preference in workflow use.', 'Bypassed review checkpoints.', 'Convenience ahead of procedure.'],
        'explanation': 'Workflow discipline is maintained when the approved planning workflow is completed before a case is closed or advanced.',
        'keywords': ['public_sector_planning', 'workflow_discipline', 'approved_workflow', 'case_closure'],
    },
    'pol_public_sector_planning_gen_035': {
        'question': 'Which routine best sustains planning records?',
        'options': ['Accurate files with control-point status updates.', 'Bypassed review checkpoints.', 'Convenience ahead of record standards.', 'Continued non-compliance after feedback.'],
        'explanation': 'Planning records remain reliable when files are accurate and the status is updated at each control point.',
        'keywords': ['public_sector_planning', 'planning_records', 'accurate_files', 'status_updates'],
    },
    'pol_public_sector_planning_gen_039': {
        'question': 'Which practice best reflects planning risk-management standards?',
        'options': ['Early escalation of control gaps and material exceptions.', 'Continued non-compliance after feedback.', 'Personal preference in rule use.', 'Bypassed review checkpoints.'],
        'explanation': 'Planning risk-management standards are reflected by escalating control gaps and material exceptions before they affect delivery.',
        'keywords': ['public_sector_planning', 'risk_management_standards', 'control_gaps', 'exception_escalation'],
    },
    'pol_public_sector_planning_gen_041': {
        'question': 'Which action best demonstrates implementation planning in public sector planning?',
        'options': ['Recorded responsibilities, timelines, and performance metrics.', 'Personal preference in implementation choices.', 'Bypassed review checkpoints.', 'Convenience ahead of planning requirements.'],
        'explanation': 'Implementation planning is demonstrated by assigning responsibilities, setting timelines, and defining performance measures on the record.',
        'keywords': ['public_sector_planning', 'implementation_planning', 'assigned_responsibilities', 'performance_metrics'],
    },
    'pol_public_sector_planning_gen_043': {
        'question': 'Which practice best demonstrates evidence quality in public sector planning?',
        'options': ['Credible data sources with validated assumptions.', 'Bypassed review checkpoints.', 'Convenience ahead of planning requirements.', 'Continued non-compliance after feedback.'],
        'explanation': 'Evidence quality in planning is demonstrated when data sources are credible and assumptions have been validated before use.',
        'keywords': ['public_sector_planning', 'evidence_quality', 'credible_data', 'validated_assumptions'],
    },
    'pol_public_sector_planning_gen_045': {
        'question': 'A desk officer receives a public sector planning case that requires governance action. What should be done first?',
        'options': ['Personal preference in rule application.', 'Convenience ahead of legal requirements.', 'Approved planning procedure with complete records.', 'Bypassed review checkpoints.'],
        'explanation': 'The first planning-governance step is to apply the approved procedure and keep the complete record needed for oversight.',
        'keywords': ['public_sector_planning', 'governance_action', 'desk_officer', 'complete_records'],
    },
    'pol_public_sector_planning_gen_047': {
        'question': 'When a supervisor reviews compliance gaps, which step most directly strengthens planning risk management?',
        'options': ['Convenience ahead of planning requirements.', 'Early escalation of control gaps and material exceptions.', 'Continued non-compliance after feedback.', 'Bypassed review checkpoints.'],
        'explanation': 'The most direct way to strengthen planning risk management is to escalate control gaps and material exceptions before they affect implementation.',
        'keywords': ['public_sector_planning', 'supervisor_review', 'risk_management', 'exception_escalation'],
    },
    'pol_public_sector_planning_gen_051': {
        'question': 'In a time-sensitive planning file, which step best protects evidence quality without breaching process?',
        'options': ['Continued non-compliance after feedback.', 'Credible data sources with validated assumptions.', 'Bypassed review checkpoints.', 'Personal preference in evidence use.'],
        'explanation': 'Even in a time-sensitive planning file, evidence quality is protected by using credible sources and validated assumptions instead of shortcuts.',
        'keywords': ['public_sector_planning', 'evidence_quality', 'time_sensitive_file', 'validated_assumptions'],
    },
    'pol_public_sector_planning_gen_053': {
        'question': 'A desk officer receives a planning case that requires documented procedure. What should be done first?',
        'options': ['Complete records under the approved planning procedure.', 'Personal preference in procedure use.', 'Bypassed review checkpoints.', 'Convenience ahead of procedural standards.'],
        'explanation': 'The first procedural step is to follow the approved planning process and create the record that supports each action.',
        'keywords': ['public_sector_planning', 'documented_procedure', 'desk_officer', 'approved_process'],
    },
    'pol_public_sector_planning_gen_055': {
        'question': 'When a supervisor reviews compliance gaps, which action most directly strengthens public accountability?',
        'options': ['Convenience ahead of planning requirements.', 'Continued non-compliance after feedback.', 'Bypassed review checkpoints.', 'Traceable decisions with evidence-based reasons.'],
        'explanation': 'Public accountability is strengthened when planning decisions can be traced to recorded reasons and supporting evidence.',
        'keywords': ['public_sector_planning', 'public_accountability', 'supervisor_review', 'traceable_decisions'],
    },
    'pol_public_sector_planning_gen_057': {
        'question': 'Which practice best supports risk control under planning accountability controls?',
        'options': ['Personal preference in rule application.', 'Applied controls with documented mitigation.', 'Convenience ahead of control requirements.', 'Continued non-compliance after feedback.'],
        'explanation': 'Risk control under planning accountability is stronger when applied controls are paired with documented mitigation and follow-up.',
        'keywords': ['public_sector_planning', 'risk_control', 'accountability_controls', 'documented_mitigation'],
    },
    'pol_public_sector_planning_gen_059': {
        'question': 'In a time-sensitive planning file, which step best preserves operational discipline without breaching process?',
        'options': ['Personal preference in workflow use.', 'Bypassed review checkpoints.', 'Continued non-compliance after feedback.', 'Approved workflow checks before closure.'],
        'explanation': 'Operational discipline is preserved when the approved workflow checks are completed before closure, even where time is tight.',
        'keywords': ['public_sector_planning', 'operational_discipline', 'time_sensitive_file', 'workflow_checks'],
    },
    'pol_public_sector_planning_gen_063': {
        'question': 'When a supervisor reviews compliance gaps, which action most directly strengthens planning governance?',
        'options': ['Continued non-compliance after feedback.', 'Convenience ahead of planning requirements.', 'Approved planning procedure with complete records.', 'Bypassed review checkpoints.'],
        'explanation': 'Planning governance is strengthened when the supervisor restores the approved procedure and the complete record needed for review.',
        'keywords': ['public_sector_planning', 'governance', 'supervisor_review', 'complete_records'],
    },
    'pol_public_sector_planning_gen_069': {
        'question': 'A desk officer receives a planning case that requires evidence-quality review. What should be done first?',
        'options': ['Credible data sources with validated assumptions.', 'Personal preference in evidence use.', 'Bypassed review checkpoints.', 'Convenience ahead of planning requirements.'],
        'explanation': 'The first evidence-quality step is to rely on credible data sources and validate the assumptions behind the planning recommendation.',
        'keywords': ['public_sector_planning', 'evidence_quality', 'desk_officer', 'credible_sources'],
    },
    'pol_public_sector_planning_gen_070': {
        'question': 'When a planning unit faces competing priorities, which action best preserves policy-formulation rigour?',
        'options': ['Convenience ahead of approved process requirements.', 'Bypassed review checkpoints under time pressure.', 'Discretionary shortcuts despite control gaps.', 'Defined problem, options, and measurable criteria before choice.'],
        'explanation': 'Policy-formulation rigour is preserved when the planning unit defines the problem, the available options, and the measurable criteria before choosing a policy path.',
        'keywords': ['public_sector_planning', 'policy_formulation_rigour', 'defined_problem', 'measurable_criteria'],
    },
    'pol_public_sector_planning_gen_072': {
        'question': 'When a supervisor reviews planning gaps, which action best strengthens control and consistency?',
        'options': ['Convenience ahead of approved process requirements.', 'Defined problem, options, and measurable criteria before choice.', 'Bypassed review checkpoints under time pressure.', 'Inconsistent criteria across similar cases.'],
        'explanation': 'Control and consistency are strengthened when the same planning problem, options, and measurable criteria are clearly defined before a policy choice is made.',
        'keywords': ['public_sector_planning', 'control_and_consistency', 'measurable_criteria', 'policy_choice'],
    },
    'pol_public_sector_planning_gen_074': {
        'question': 'Which practice should be prioritized first for sustainable results in public sector planning?',
        'options': ['Defined problem, options, and measurable criteria before choice.', 'Inconsistent criteria across similar cases.', 'Convenience ahead of approved process requirements.', 'Discretionary shortcuts despite control gaps.'],
        'explanation': 'Sustainable planning results depend first on a disciplined process that defines the problem, options, and measurable criteria before choice.',
        'keywords': ['public_sector_planning', 'sustainable_results', 'defined_problem', 'planning_criteria'],
    },
    'pol_public_sector_planning_gen_079': {
        'question': 'When a planning unit faces competing priorities, which action best preserves compliance and service quality?',
        'options': ['Defined problem, options, and measurable criteria before choice.', 'Bypassed review checkpoints under time pressure.', 'Discretionary shortcuts despite control gaps.', 'Convenience ahead of approved procedure requirements.'],
        'explanation': 'Compliance and service quality are preserved when a planning unit works through a disciplined process that defines the problem, options, and criteria before deciding.',
        'keywords': ['public_sector_planning', 'compliance_and_service_quality', 'disciplined_process', 'planning_criteria'],
    },
    'pol_public_sector_planning_gen_081': {
        'question': 'Which practice best supports planning risk management?',
        'options': ['Bypassed review checkpoints.', 'Continued non-compliance after feedback.', 'Convenience ahead of planning requirements.', 'Early escalation of control gaps and material exceptions.'],
        'explanation': 'Planning risk management depends on identifying control gaps early and escalating material exceptions before they undermine delivery.',
        'keywords': ['public_sector_planning', 'planning_risk_management', 'control_gaps', 'material_exceptions'],
    },
    'pol_public_sector_planning_gen_083': {
        'question': 'In a time-sensitive planning file, which step best preserves operational discipline without breaching procedure?',
        'options': ['Continued non-compliance after feedback.', 'Bypassed review checkpoints.', 'Approved workflow checks before closure.', 'Personal preference in workflow use.'],
        'explanation': 'Operational discipline is maintained when approved workflow checks are completed before closure even in a time-sensitive planning file.',
        'keywords': ['public_sector_planning', 'operational_discipline', 'planning_file', 'workflow_checks'],
    },
    'pol_public_sector_planning_gen_084': {
        'question': 'A desk officer handling planning work receives a case that requires log management. What should be done first?',
        'options': ['Accurate files with control-point status updates.', 'Personal preference in record handling.', 'Convenience ahead of documentation standards.', 'Bypassed review checkpoints.'],
        'explanation': 'Log management starts with accurate files and status updates at each control point so the planning record remains reliable for review.',
        'keywords': ['public_sector_planning', 'log_management', 'accurate_files', 'status_updates'],
    },
    'pol_public_sector_planning_gen_086': {
        'question': 'Which practice should an officer in charge prioritize to sustain evidence quality in public sector planning?',
        'options': ['Convenience ahead of planning requirements.', 'Credible data sources with validated assumptions.', 'Bypassed review checkpoints.', 'Personal preference in evidence use.'],
        'explanation': 'An officer in charge sustains evidence quality by relying on credible data sources and validating the assumptions behind the planning advice.',
        'keywords': ['public_sector_planning', 'evidence_quality', 'officer_in_charge', 'validated_assumptions'],
    },
    'pol_public_sector_planning_gen_094': {
        'question': 'Which approach best guarantees evidence quality in public sector planning?',
        'options': ['Bypassed review checkpoints.', 'Credible data sources with validated assumptions.', 'Personal preference in evidence use.', 'Continued non-compliance after feedback.'],
        'explanation': 'Evidence quality is best guaranteed when planning work relies on credible data sources and tested assumptions instead of expedient guesses.',
        'keywords': ['public_sector_planning', 'evidence_quality', 'credible_sources', 'tested_assumptions'],
    },
    'pol_public_sector_planning_gen_099': {
        'question': 'When a supervisor reviews compliance gaps in public sector planning, which action best strengthens risk management?',
        'options': ['Continued non-compliance after feedback.', 'Bypassed review checkpoints.', 'Early escalation of control gaps and material exceptions.', 'Convenience ahead of planning requirements.'],
        'explanation': 'Risk management is strengthened when the supervisor identifies control gaps early and escalates material exceptions before they become delivery failures.',
        'keywords': ['public_sector_planning', 'risk_management', 'supervisor_review', 'exception_escalation'],
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
    print(f'Applied round 92 rewrites to {updated} questions')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
