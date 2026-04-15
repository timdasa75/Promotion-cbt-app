#!/usr/bin/env python3
"""Round 95: normalize pol_analysis_methods non-parallel option sets."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'policy_analysis.json'
SUBCATEGORY_ID = 'pol_analysis_methods'

UPDATES = {
    'pol_analysis_methods_gen_001': {
        'question': 'Which practice best demonstrates governance discipline in policy analysis?',
        'options': ['Approved analytical procedure with complete records.', 'Personal preference in rule application.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.'],
        'explanation': 'Governance discipline in policy analysis depends on using the approved analytical procedure and keeping complete records that allow the work to be reviewed later.',
        'keywords': ['policy_analysis', 'governance_discipline', 'approved_procedure', 'complete_records'],
    },
    'pol_analysis_methods_gen_003': {
        'question': 'Which practice best supports risk management in policy analysis?',
        'options': ['Early escalation of control gaps and material exceptions.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.'],
        'explanation': 'Risk management in policy analysis improves when control gaps and material exceptions are identified early and escalated before they affect the recommendation.',
        'keywords': ['policy_analysis', 'risk_management', 'control_gaps', 'exception_escalation'],
    },
    'pol_analysis_methods_gen_007': {
        'question': 'Which practice best protects evidence quality in policy analysis?',
        'options': ['Credible data sources with validated assumptions.', 'Continued non-compliance after feedback.', 'Personal preference in evidence use.', 'Bypassed review checkpoints.'],
        'explanation': 'Evidence quality is protected when analysts rely on credible data sources and validate the assumptions behind the recommendation before using them.',
        'keywords': ['policy_analysis', 'evidence_quality', 'credible_sources', 'validated_assumptions'],
    },
    'pol_analysis_methods_gen_016': {
        'question': 'Which practice best supports documented procedure in policy analysis?',
        'options': ['Complete records under the approved procedure.', 'Personal preference in procedure use.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.'],
        'explanation': 'Documented procedure in policy analysis requires complete records under the approved process so each analytical step can be traced and reviewed.',
        'keywords': ['policy_analysis', 'documented_procedure', 'approved_process', 'complete_records'],
    },
    'pol_analysis_methods_gen_018': {
        'question': 'Which action best demonstrates public accountability in policy analysis?',
        'options': ['Traceable decisions with evidence-based reasons.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.'],
        'explanation': 'Public accountability in policy analysis depends on decisions that can be traced to the evidence used and the reasons recorded for the recommendation.',
        'keywords': ['policy_analysis', 'public_accountability', 'traceable_decisions', 'evidence_based_reasons'],
    },
    'pol_analysis_methods_gen_020': {
        'question': 'Which practice best supports risk control in policy analysis?',
        'options': ['Applied controls with documented mitigation.', 'Convenience ahead of control requirements.', 'Continued non-compliance after feedback.', 'Personal preference in control use.'],
        'explanation': 'Risk control is stronger when the team applies the needed controls and documents the mitigation taken for identified process risks.',
        'keywords': ['policy_analysis', 'risk_control', 'documented_mitigation', 'process_risks'],
    },
    'pol_analysis_methods_gen_022': {
        'question': 'Which practice best sustains operational discipline in policy analysis?',
        'options': ['Approved workflow checks before closure.', 'Continued non-compliance after feedback.', 'Personal preference in workflow use.', 'Bypassed review checkpoints.'],
        'explanation': 'Operational discipline depends on completing the approved workflow checks before analytical work is closed or moved forward.',
        'keywords': ['policy_analysis', 'operational_discipline', 'workflow_checks', 'case_closure'],
    },
    'pol_analysis_methods_gen_024': {
        'question': 'Which practice best supports record management in policy analysis?',
        'options': ['Current files with status updates at each control point.', 'Personal preference in filing practice.', 'Bypassed review checkpoints.', 'Convenience ahead of documentation standards.'],
        'explanation': 'Record management in policy analysis depends on keeping files current and updating their status at each control point for later review.',
        'keywords': ['policy_analysis', 'record_management', 'current_files', 'status_updates'],
    },
    'pol_analysis_methods_gen_026': {
        'question': 'Which practice best reflects governance standards in policy analysis?',
        'options': ['Approved analytical procedure with sustained records.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.'],
        'explanation': 'Governance standards in policy analysis are reflected by following the approved procedure and sustaining the records needed for oversight.',
        'keywords': ['policy_analysis', 'governance_standards', 'approved_procedure', 'sustained_records'],
    },
    'pol_analysis_methods_gen_030': {
        'question': 'Which practice best supports implementation planning in policy analysis?',
        'options': ['Recorded responsibilities, timelines, and performance measures.', 'Continued non-compliance after feedback.', 'Personal preference in implementation choices.', 'Bypassed review checkpoints.'],
        'explanation': 'Implementation planning is stronger when responsibilities, timelines, and performance measures are recorded clearly before rollout begins.',
        'keywords': ['policy_analysis', 'implementation_planning', 'responsibilities', 'performance_measures'],
    },
    'pol_analysis_methods_gen_032': {
        'question': 'Which practice best sustains evidence quality in policy analysis?',
        'options': ['Credible data sources with validated assumptions.', 'Personal preference in evidence use.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.'],
        'explanation': 'Evidence quality is sustained when analysts consistently use credible data sources and validate the assumptions supporting the recommendation.',
        'keywords': ['policy_analysis', 'evidence_quality', 'credible_sources', 'validated_assumptions'],
    },
    'pol_analysis_methods_gen_033': {
        'question': 'A desk officer receives a policy-analysis case requiring governance action. What should be done first?',
        'options': ['Personal preference in rule application.', 'Approved analytical procedure with complete records.', 'Convenience ahead of legal requirements.', 'Bypassed review checkpoints.'],
        'explanation': 'The first governance step is to apply the approved analytical procedure and create the complete record needed for later oversight.',
        'keywords': ['policy_analysis', 'governance_action', 'desk_officer', 'complete_records'],
    },
    'pol_analysis_methods_gen_035': {
        'question': 'When a supervisor reviews compliance gaps, which step most directly strengthens policy-analysis risk management?',
        'options': ['Bypassed review checkpoints.', 'Continued non-compliance after feedback.', 'Early escalation of control gaps and material exceptions.', 'Convenience ahead of legal requirements.'],
        'explanation': 'Risk management is strengthened when a supervisor responds to control gaps early and escalates material exceptions before they affect the recommendation.',
        'keywords': ['policy_analysis', 'supervisor_review', 'risk_management', 'exception_escalation'],
    },
    'pol_analysis_methods_gen_039': {
        'question': 'In a time-sensitive policy-analysis file, which step best protects evidence quality without breaking procedure?',
        'options': ['Continued non-compliance after feedback.', 'Credible data sources with validated assumptions.', 'Personal preference in evidence use.', 'Bypassed review checkpoints.'],
        'explanation': 'Even in a time-sensitive file, evidence quality is protected by relying on credible data and validated assumptions instead of analytical shortcuts.',
        'keywords': ['policy_analysis', 'evidence_quality', 'time_sensitive_file', 'validated_assumptions'],
    },
    'pol_analysis_methods_gen_040': {
        'question': 'When a policy unit is under pressure to recommend action quickly, which first step best preserves formulation rigour?',
        'options': ['Option appraisal skipped during political pressure.', 'Defined problem, options, and assessment criteria.', 'Preferred solution chosen before analysis.', 'Analytical standards suspended for speed.'],
        'explanation': 'Formulation rigour begins with a clearly defined problem, a set of options, and assessment criteria before the team chooses a direction.',
        'keywords': ['policy_analysis', 'formulation_rigour', 'problem_definition', 'assessment_criteria'],
    },
    'pol_analysis_methods_gen_041': {
        'question': 'Which routine most strongly supports accountable policy formulation when several teams contribute inputs?',
        'options': ['Shared appraisal frame with recorded evidence and reasons.', 'Unstated assumptions across separate teams.', 'Competing views removed from the record.', 'Undocumented amendments for convenience.'],
        'explanation': 'Accountable formulation across multiple teams depends on a shared appraisal frame that records the evidence used and the reasons for each recommendation.',
        'keywords': ['policy_analysis', 'accountable_formulation', 'shared_appraisal_frame', 'recommendation_reasons'],
    },
    'pol_analysis_methods_gen_044': {
        'question': 'For sustainable formulation quality, what should a policy team prioritize first?',
        'options': ['Accelerated clearance before the problem is defined.', 'Disciplined method for problem definition and option testing.', 'Unchecked reliance on precedent.', 'Analytical shortcuts for familiar issues.'],
        'explanation': 'Sustainable formulation quality depends on a disciplined method that defines the problem, tests the options, and compares them against clear criteria.',
        'keywords': ['policy_analysis', 'formulation_quality', 'disciplined_method', 'option_testing'],
    },
    'pol_analysis_methods_gen_049': {
        'question': 'Which step most improves traceability when implementation responsibilities are shared across agencies?',
        'options': ['Exceptions treated as normal without written justification.', 'Unverified ownership of implementation actions.', 'Mapped responsibilities, dependencies, and reporting lines.', 'Delayed coordination until delivery failure.'],
        'explanation': 'Traceability improves when shared responsibilities, dependencies, and reporting lines are mapped clearly in the implementation record.',
        'keywords': ['policy_analysis', 'traceability', 'shared_implementation', 'reporting_lines'],
    },
    'pol_analysis_methods_gen_051': {
        'question': 'In an urgent policy case, which action best keeps implementation planning within lawful administrative standards?',
        'options': ['Verbal approval before formal planning records.', 'Unvalidated source records and delivery conditions.', 'Exceptions treated as normal for a beneficial policy.', 'Confirmed legal authority, named owners, and review path.'],
        'explanation': 'Urgency does not remove the need to confirm legal authority, implementation ownership, and the review path before rollout approval.',
        'keywords': ['policy_analysis', 'lawful_administration', 'implementation_ownership', 'review_path'],
    },
    'pol_analysis_methods_gen_054': {
        'question': 'A supervisor is reviewing weak evidence standards in policy submissions. Which requirement best strengthens consistency?',
        'options': ['Optional source citation unless challenged.', 'Accepted recommendations with unstated assumptions.', 'Required source citation with stated assumptions.', 'Separate evidence standards by unit.'],
        'explanation': 'Consistency improves when every submission cites its sources and states the assumptions used, creating one evidence standard across the unit.',
        'keywords': ['policy_analysis', 'evidence_standards', 'source_citation', 'assumption_disclosure'],
    },
    'pol_analysis_methods_gen_056': {
        'question': 'Which practice should be prioritized first to sustain evidence integrity in policy analysis over time?',
        'options': ['Validated data treated as optional under pressure.', 'Recorded assumptions delayed until implementation.', 'Documented evidence trail with validated data.', 'Variable evidence thresholds across submissions.'],
        'explanation': 'Evidence integrity is sustained when the team maintains a documented evidence trail and validates data before it is used in analysis.',
        'keywords': ['policy_analysis', 'evidence_integrity', 'evidence_trail', 'data_validation'],
    },
    'pol_analysis_methods_gen_058': {
        'question': 'A second policy team is handling a competing-priorities case. Which step best preserves formulation rigour at the appraisal stage?',
        'options': ['Inconsistent criteria across similar cases.', 'Bypassed review checkpoints under time pressure.', 'Option testing against objectives, constraints, and criteria.', 'Process shortcuts for faster escalation.'],
        'explanation': 'Formulation rigour at the appraisal stage depends on testing each option against the policy objective, the constraints, and the measurable criteria.',
        'keywords': ['policy_analysis', 'appraisal_stage', 'formulation_rigour', 'measurable_criteria'],
    },
    'pol_analysis_methods_gen_059': {
        'question': 'During routine formulation work, which approach most strongly supports accountable implementation planning?',
        'options': ['Linked delivery steps, assigned responsibilities, and review points.', 'Implementation details deferred until approval.', 'Assumed agency resolution of feasibility gaps.', 'Preferred outcomes without delivery conditions.'],
        'explanation': 'Accountable implementation planning links the recommended option to realistic delivery steps, assigned responsibilities, and review points.',
        'keywords': ['policy_analysis', 'implementation_planning', 'delivery_steps', 'review_points'],
    },
    'pol_analysis_methods_gen_060': {
        'question': 'A supervisor wants stronger consistency across policy submissions. Which tool best improves formulation control?',
        'options': ['Analyst preference instead of a common template.', 'Standard formulation template with objectives, options, criteria, risks, and assumptions.', 'Final-recommendation review without method checks.', 'Optional assumptions for difficult issues.'],
        'explanation': 'A standard formulation template improves control because each submission must present the same core elements for supervisory review.',
        'keywords': ['policy_analysis', 'formulation_control', 'standard_template', 'submission_consistency'],
    },
    'pol_analysis_methods_gen_063': {
        'question': 'In a time-sensitive second review, which action best aligns formulation work with lawful administrative standards?',
        'options': ['Confirmed authority, consultation steps, and administrative feasibility.', 'Verbal approval before a formal record.', 'Optional consultation under urgency.', 'Deferred feasibility concerns until endorsement.'],
        'explanation': 'Even in a time-sensitive second review, lawful formulation requires confirming authority, consultation requirements, and administrative feasibility before submission.',
        'keywords': ['policy_analysis', 'lawful_standards', 'consultation_steps', 'administrative_feasibility'],
    },
    'pol_analysis_methods_gen_065': {
        'question': 'Which implementation check most strongly improves delivery realism in a second review cycle?',
        'options': ['Unvalidated delivery assumptions.', 'Exceptions treated as normal under an ambitious timeline.', 'Tested staffing, sequencing, and reporting arrangements.', 'Delayed escalation until after launch.'],
        'explanation': 'Delivery realism improves when the team tests whether staffing, sequencing, and reporting arrangements can actually support the proposed rollout.',
        'keywords': ['policy_analysis', 'delivery_realism', 'staffing_feasibility', 'sequencing'],
    },
    'pol_analysis_methods_gen_069': {
        'question': 'In a time-sensitive second review, which action best aligns implementation planning with lawful standards?',
        'options': ['Unvalidated source records and delivery assumptions.', 'Delayed escalation until delivery problems appear.', 'Confirmed authority, named implementers, and review checkpoints.', 'Verbal approval before the administrative record.'],
        'explanation': 'Lawful implementation planning still requires confirmed authority, named implementers, and review checkpoints before a revised plan is approved.',
        'keywords': ['policy_analysis', 'lawful_implementation', 'named_implementers', 'review_checkpoints'],
    },
    'pol_analysis_methods_gen_070': {
        'question': 'A policy-analysis unit is under time pressure. Which step best preserves evidence integrity in the final recommendation?',
        'options': ['Easiest available figures regardless of quality.', 'Skipped source checks for a plausible conclusion.', 'Validated source quality with recorded assumptions.', 'Different evidence standards across similar cases.'],
        'explanation': 'Evidence integrity in a final recommendation depends on validating source quality and recording the assumptions behind the recommendation even under time pressure.',
        'keywords': ['policy_analysis', 'evidence_integrity', 'source_quality', 'assumption_recording'],
    },
    'pol_analysis_methods_gen_072': {
        'question': 'A supervisor wants stronger evidence discipline in policy-analysis work. Which requirement best improves assurance?',
        'options': ['Team-level discretion over evidence sufficiency.', 'Undocumented assumptions where results look plausible.', 'Recommendations without stated source limitations.', 'Cited sources, verification notes, and evidence grading.'],
        'explanation': 'Evidence discipline improves when each submission includes cited sources, verification notes, and a clear grading of the evidence used.',
        'keywords': ['policy_analysis', 'evidence_discipline', 'verification_notes', 'evidence_grading'],
    },
    'pol_analysis_methods_gen_083': {
        'question': 'Which action best demonstrates sound governance in policy analysis work?',
        'options': ['Convenience ahead of legal requirements.', 'Bypassed review checkpoints.', 'Approved analytical procedure with complete records.', 'Personal preference in rule application.'],
        'explanation': 'Sound governance in policy analysis requires approved analytical procedure and complete records that allow the work to be checked later.',
        'keywords': ['policy_analysis', 'sound_governance', 'approved_procedure', 'complete_records'],
    },
    'pol_analysis_methods_gen_084': {
        'question': 'Which practice best protects evidence quality in policy analysis work?',
        'options': ['Personal preference in evidence use.', 'Convenience ahead of legal requirements.', 'Bypassed review checkpoints.', 'Credible data sources with validated assumptions.'],
        'explanation': 'Evidence quality is protected when policy analysis relies on credible data sources and assumptions that have been checked before use.',
        'keywords': ['policy_analysis', 'evidence_quality', 'credible_sources', 'validated_assumptions'],
    },
    'pol_analysis_methods_gen_088': {
        'question': 'Which practice best supports risk management in policy analysis work?',
        'options': ['Convenience ahead of legal requirements.', 'Bypassed review checkpoints.', 'Continued non-compliance after feedback.', 'Early escalation of control gaps and material exceptions.'],
        'explanation': 'Risk management in policy analysis depends on identifying control gaps early and escalating any material exception before it harms the recommendation.',
        'keywords': ['policy_analysis', 'risk_management', 'control_gaps', 'exception_escalation'],
    },
    'pol_analysis_methods_gen_091': {
        'question': 'When a policy-analysis unit faces competing priorities, which action best preserves compliance and service quality?',
        'options': ['Bypassed review checkpoints under time pressure.', 'Convenience ahead of approved procedure.', 'Assigned roles, timelines, resources, and monitoring checkpoints.', 'Discretionary shortcuts despite control safeguards.'],
        'explanation': 'Compliance and service quality are preserved when the unit assigns roles, timelines, resources, and monitoring checkpoints before rollout instead of relying on shortcuts.',
        'keywords': ['policy_analysis', 'compliance_and_service_quality', 'monitoring_checkpoints', 'implementation_control'],
    },
    'pol_analysis_methods_gen_093': {
        'question': 'A supervisor is reviewing gaps in policy analysis work. Which action best strengthens control and consistency before rollout?',
        'options': ['Inconsistent criteria across similar cases.', 'Bypassed review checkpoints under time pressure.', 'Convenience ahead of approved procedure.', 'Assigned roles, timelines, resources, and monitoring checkpoints.'],
        'explanation': 'Control and consistency improve when the unit defines roles, timelines, resources, and monitoring checkpoints before rollout begins.',
        'keywords': ['policy_analysis', 'control_and_consistency', 'roles', 'monitoring_checkpoints'],
    },
    'pol_analysis_methods_gen_094': {
        'question': 'For sustainable results in policy analysis, which practice should be prioritized first?',
        'options': ['Discretionary shortcuts despite control safeguards.', 'Validated data sources with documented assumptions.', 'Convenience ahead of approved procedure.', 'Bypassed review checkpoints under time pressure.'],
        'explanation': 'Sustainable analytical results depend first on using validated data sources and documenting the assumptions behind the recommendation.',
        'keywords': ['policy_analysis', 'sustainable_results', 'validated_sources', 'documented_assumptions'],
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
    print(f'Applied round 95 rewrites to {updated} questions')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
