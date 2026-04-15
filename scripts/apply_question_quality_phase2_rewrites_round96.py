#!/usr/bin/env python3
"""Round 96: normalize neg_principles_outcomes non-parallel option sets."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'leadership_negotiation.json'
SUBCATEGORY_ID = 'neg_principles_outcomes'

UPDATES = {
    'NLR_P_002': {
        'question': "The principle of good faith in negotiation primarily requires parties to:",
        'options': ['Confrontational bargaining under routine controls.', 'Honest engagement with genuine settlement intent.', 'Delayed decisions within authorized workflow.', 'Refusal to compromise under established standards.'],
        'explanation': 'Good faith in negotiation requires honesty, fairness, and a genuine willingness to work toward a lawful and workable settlement.',
        'keywords': ['negotiation', 'good_faith', 'honest_engagement', 'settlement_intent'],
    },
    'NLR_P_009': {
        'question': 'The principle of collective responsibility in negotiated agreements means:',
        'options': ['Separate implementation by each side.', 'Joint ownership of agreement implementation.', 'Government-only implementation duty.', 'Unilateral revision by one party.'],
        'explanation': 'Collective responsibility means all parties share ownership of the agreement and must support its implementation rather than shifting the burden to one side.',
        'keywords': ['negotiation', 'collective_responsibility', 'agreement_implementation', 'joint_ownership'],
    },
    'NLR_P_011': {
        'question': 'The primary duty of a registered trade union in the public service is:',
        'options': ['Funding of political parties.', 'Lawful protection of members welfare and conditions.', 'Unilateral setting of salary scales.', 'Restriction of entry into the civil service.'],
        'explanation': 'A registered trade union exists to protect members welfare and employment conditions through lawful representation, negotiation, and advocacy.',
        'keywords': ['trade_union', 'public_service', 'members_welfare', 'lawful_representation'],
    },
    'neg_principles_outcomes_gen_001': {
        'question': 'Which practice best demonstrates governance discipline in negotiation work?',
        'options': ['Approved negotiation procedure with complete records.', 'Personal preference in rule application.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.'],
        'explanation': 'Governance discipline in negotiation work depends on following the approved procedure and keeping complete records that allow later review and accountability.',
        'keywords': ['negotiation', 'governance_discipline', 'approved_procedure', 'complete_records'],
    },
    'neg_principles_outcomes_gen_003': {
        'question': 'Which practice best supports risk management in negotiation work?',
        'options': ['Early escalation of control gaps and material exceptions.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.'],
        'explanation': 'Risk management in negotiation work improves when control gaps and material exceptions are identified early and escalated before they damage the process.',
        'keywords': ['negotiation', 'risk_management', 'control_gaps', 'exception_escalation'],
    },
    'neg_principles_outcomes_gen_007': {
        'question': 'During a negotiated reform process, which step best supports change management?',
        'options': ['Sequenced reforms with communication, training, and monitoring.', 'Continued non-compliance after feedback.', 'Personal preference in reform handling.', 'Bypassed review checkpoints.'],
        'explanation': 'Change management in negotiated reform is strongest when reforms are sequenced and supported by communication, training, and monitoring.',
        'keywords': ['negotiation', 'change_management', 'sequenced_reforms', 'monitoring'],
    },
    'neg_principles_outcomes_gen_009': {
        'question': 'Which practice best supports documented procedure in negotiation work?',
        'options': ['Complete records under the approved procedure.', 'Personal preference in procedure use.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.'],
        'explanation': 'Documented procedure in negotiation work requires complete records under the approved process so each step can be traced and defended later.',
        'keywords': ['negotiation', 'documented_procedure', 'approved_process', 'complete_records'],
    },
    'neg_principles_outcomes_gen_011': {
        'question': 'Which action best demonstrates public accountability in negotiation work?',
        'options': ['Traceable decisions with evidence-based reasons.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.'],
        'explanation': 'Public accountability in negotiation work depends on decisions that can be traced to clear reasons and supporting evidence.',
        'keywords': ['negotiation', 'public_accountability', 'traceable_decisions', 'evidence_based_reasons'],
    },
    'neg_principles_outcomes_gen_013': {
        'question': 'Which practice best supports risk control in negotiation work?',
        'options': ['Applied controls with documented mitigation.', 'Convenience ahead of control requirements.', 'Continued non-compliance after feedback.', 'Personal preference in control use.'],
        'explanation': 'Risk control in negotiation work is stronger when the necessary controls are applied and the mitigating actions are documented for review.',
        'keywords': ['negotiation', 'risk_control', 'documented_mitigation', 'control_application'],
    },
    'neg_principles_outcomes_gen_015': {
        'question': 'Which practice best sustains operational discipline in negotiation work?',
        'options': ['Approved workflow checks before closure.', 'Continued non-compliance after feedback.', 'Personal preference in workflow use.', 'Bypassed review checkpoints.'],
        'explanation': 'Operational discipline is sustained when the approved workflow checks are completed before negotiation work is closed or advanced.',
        'keywords': ['negotiation', 'operational_discipline', 'workflow_checks', 'case_closure'],
    },
    'neg_principles_outcomes_gen_017': {
        'question': 'What is the most reliable way to maintain record management during negotiation follow-up?',
        'options': ['Current files with status updates at each control point.', 'Personal preference in filing practice.', 'Bypassed review checkpoints.', 'Convenience ahead of documentation standards.'],
        'explanation': 'Record management during negotiation follow-up depends on keeping files current and updating status at each control point so the audit trail remains intact.',
        'keywords': ['negotiation', 'record_management', 'current_files', 'status_updates'],
    },
    'neg_principles_outcomes_gen_019': {
        'question': 'Which practice best reflects governance standards in negotiation work?',
        'options': ['Approved negotiation procedure with sustained records.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.'],
        'explanation': 'Governance standards in negotiation work are reflected by following the approved procedure and sustaining the records needed for oversight.',
        'keywords': ['negotiation', 'governance_standards', 'approved_procedure', 'sustained_records'],
    },
    'neg_principles_outcomes_gen_023': {
        'question': 'Which practice best supports stakeholder negotiation in public-service work?',
        'options': ['Principled engagement with documented commitments.', 'Continued non-compliance after feedback.', 'Personal preference in stakeholder handling.', 'Bypassed review checkpoints.'],
        'explanation': 'Stakeholder negotiation is stronger when the engagement follows principled negotiation and the commitments reached are documented clearly.',
        'keywords': ['negotiation', 'stakeholder_engagement', 'principled_negotiation', 'documented_commitments'],
    },
    'neg_principles_outcomes_gen_025': {
        'question': 'Which leadership habit best sustains change management after a negotiation outcome has been agreed?',
        'options': ['Sequenced reforms with communication, training, and monitoring.', 'Personal preference in reform handling.', 'Bypassed review checkpoints.', 'Convenience ahead of implementation standards.'],
        'explanation': 'After a negotiation outcome is agreed, change management is sustained by sequencing the reforms and supporting them with communication, training, and monitoring.',
        'keywords': ['negotiation', 'change_management', 'leadership_habit', 'implementation_monitoring'],
    },
    'neg_principles_outcomes_gen_027': {
        'question': 'Which practice best secures documented procedure in negotiation work?',
        'options': ['Complete records under the approved procedure.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.'],
        'explanation': 'Documented procedure in negotiation work is secured when the approved process is followed and complete records are kept from the start.',
        'keywords': ['negotiation', 'documented_procedure', 'approved_process', 'complete_records'],
    },
    'neg_principles_outcomes_gen_031': {
        'question': 'Which action best demonstrates risk control in negotiation work?',
        'options': ['Applied controls with documented mitigation.', 'Continued non-compliance after feedback.', 'Personal preference in control use.', 'Bypassed review checkpoints.'],
        'explanation': 'Risk control is demonstrated when controls are applied to identified risks and the mitigation taken is documented for later review.',
        'keywords': ['negotiation', 'risk_control', 'documented_mitigation', 'reviewable_controls'],
    },
    'neg_principles_outcomes_gen_033': {
        'question': 'Which practice best supports operational discipline in negotiation work?',
        'options': ['Approved workflow checks before closure.', 'Personal preference in workflow use.', 'Bypassed review checkpoints.', 'Convenience ahead of procedure.'],
        'explanation': 'Operational discipline in negotiation work depends on completing approved workflow checks before closing or escalating the case.',
        'keywords': ['negotiation', 'operational_discipline', 'approved_workflow', 'closure_checks'],
    },
    'neg_principles_outcomes_gen_038': {
        'question': 'A desk officer receives a negotiation case that requires governance action. What should be done first?',
        'options': ['Approved negotiation procedure with complete records.', 'Personal preference in rule application.', 'Convenience ahead of legal requirements.', 'Bypassed review checkpoints.'],
        'explanation': 'The first governance step is to apply the approved negotiation procedure and create the complete record needed for later oversight.',
        'keywords': ['negotiation', 'governance_action', 'desk_officer', 'complete_records'],
    },
    'neg_principles_outcomes_gen_040': {
        'question': 'When a supervisor reviews compliance gaps in negotiation work, which step most directly strengthens risk management?',
        'options': ['Early escalation of control gaps and material exceptions.', 'Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.', 'Bypassed review checkpoints.'],
        'explanation': 'Risk management is strengthened when a supervisor identifies control gaps early and escalates material exceptions before the negotiation process breaks down.',
        'keywords': ['negotiation', 'supervisor_review', 'risk_management', 'exception_escalation'],
    },
    'neg_principles_outcomes_gen_044': {
        'question': 'In a time-sensitive negotiation file, which step best preserves change management without breaking procedure?',
        'options': ['Bypassed review checkpoints under time pressure.', 'Sequenced reforms with communication, training, and monitoring.', 'Continued non-compliance after feedback.', 'Personal preference in reform handling.'],
        'explanation': 'Even in a time-sensitive file, change management is preserved by sequencing reforms and supporting them with communication, training, and monitoring.',
        'keywords': ['negotiation', 'change_management', 'time_sensitive_file', 'sequenced_reforms'],
    },
    'neg_principles_outcomes_gen_046': {
        'question': 'A desk officer receives a negotiation case that requires documented procedure. What should be done first?',
        'options': ['Convenience ahead of legal requirements.', 'Bypassed review checkpoints.', 'Complete records under the approved procedure.', 'Personal preference in rule application.'],
        'explanation': 'The first procedural step is to follow the approved negotiation process and create the complete record that supports each action.',
        'keywords': ['negotiation', 'documented_procedure', 'desk_officer', 'complete_records'],
    },
    'neg_principles_outcomes_gen_048': {
        'question': 'When a supervisor reviews compliance gaps in negotiation work, which action most directly strengthens public accountability?',
        'options': ['Bypassed review checkpoints.', 'Continued non-compliance after feedback.', 'Traceable decisions with evidence-based reasons.', 'Convenience ahead of legal requirements.'],
        'explanation': 'Public accountability is strengthened when negotiation decisions can be traced to recorded reasons and supporting evidence.',
        'keywords': ['negotiation', 'public_accountability', 'supervisor_review', 'traceable_decisions'],
    },
    'neg_principles_outcomes_gen_050': {
        'question': 'Which practice best supports risk control under negotiation accountability arrangements?',
        'options': ['Applied controls with documented mitigation.', 'Personal preference in rule application.', 'Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.'],
        'explanation': 'Risk control under negotiation accountability is stronger when controls are applied to identified risks and the mitigation steps are documented clearly.',
        'keywords': ['negotiation', 'risk_control', 'accountability_arrangements', 'documented_mitigation'],
    },
    'neg_principles_outcomes_gen_052': {
        'question': 'In a time-sensitive negotiation file, which step best preserves operational discipline without breaking procedure?',
        'options': ['Approved workflow checks before closure.', 'Bypassed review checkpoints under time pressure.', 'Personal preference in workflow use.', 'Continued non-compliance after feedback.'],
        'explanation': 'Operational discipline in a time-sensitive negotiation file still depends on completing approved workflow checks before closure.',
        'keywords': ['negotiation', 'operational_discipline', 'time_sensitive_file', 'workflow_checks'],
    },
    'neg_principles_outcomes_gen_056': {
        'question': 'When a supervisor reviews compliance gaps in negotiation work, which action most directly strengthens governance?',
        'options': ['Convenience ahead of legal requirements.', 'Bypassed review checkpoints.', 'Approved negotiation procedure with complete records.', 'Continued non-compliance after feedback.'],
        'explanation': 'Governance is strengthened when the supervisor restores the approved negotiation procedure and the complete record needed for review and oversight.',
        'keywords': ['negotiation', 'governance', 'supervisor_review', 'complete_records'],
    },
    'neg_principles_outcomes_gen_062': {
        'question': 'A desk officer receives a negotiation case that requires change management. What should be done first?',
        'options': ['Personal preference in reform handling.', 'Bypassed review checkpoints.', 'Sequenced reforms with communication, training, and monitoring.', 'Convenience ahead of implementation standards.'],
        'explanation': 'The first change-management step is to sequence the reforms and support them with communication, training, and monitoring instead of improvising under pressure.',
        'keywords': ['negotiation', 'change_management', 'desk_officer', 'sequenced_reforms'],
    },
    'neg_principles_outcomes_gen_072': {
        'question': 'Which practice best reflects sound risk management in negotiation work?',
        'options': ['Continued non-compliance after feedback.', 'Convenience ahead of legal requirements.', 'Early escalation of control gaps and material exceptions.', 'Bypassed review checkpoints.'],
        'explanation': 'Sound risk management in negotiation work depends on identifying control gaps early and escalating material exceptions before they affect the outcome.',
        'keywords': ['negotiation', 'risk_management', 'control_gaps', 'exception_escalation'],
    },
    'neg_principles_outcomes_gen_077': {
        'question': 'Which practice best secures documented procedure in negotiation work?',
        'options': ['Complete records under the approved procedure.', 'Continued non-compliance after feedback.', 'Convenience ahead of legal requirements.', 'Bypassed review checkpoints.'],
        'explanation': 'Documented procedure is secured when negotiation work follows the approved process and keeps complete records from the start.',
        'keywords': ['negotiation', 'documented_procedure', 'approved_process', 'complete_records'],
    },
    'neg_principles_outcomes_gen_078': {
        'question': 'Which action most directly strengthens public accountability in negotiation work?',
        'options': ['Traceable decisions with evidence-based reasons.', 'Continued non-compliance after feedback.', 'Convenience ahead of legal requirements.', 'Bypassed review checkpoints.'],
        'explanation': 'Public accountability in negotiation work is strengthened by traceable decisions and evidence-based reasons that can be reviewed later.',
        'keywords': ['negotiation', 'public_accountability', 'traceable_decisions', 'evidence_based_reasons'],
    },
    'neg_principles_outcomes_gen_080': {
        'question': 'Which practice best reflects governance standards in negotiation work?',
        'options': ['Approved negotiation procedure with complete records.', 'Continued non-compliance after feedback.', 'Convenience ahead of legal requirements.', 'Bypassed review checkpoints.'],
        'explanation': 'Governance standards in negotiation work are reflected by following the approved procedure and keeping the complete record needed for oversight.',
        'keywords': ['negotiation', 'governance_standards', 'approved_procedure', 'complete_records'],
    },
    'neg_principles_outcomes_gen_082': {
        'question': 'When compliance gaps are found in negotiation work, which action best strengthens risk management while preserving the audit trail?',
        'options': ['Early escalation of control gaps and material exceptions.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.'],
        'explanation': 'Risk management and the audit trail are strengthened when control gaps are identified early and material exceptions are escalated promptly.',
        'keywords': ['negotiation', 'risk_management', 'audit_trail', 'exception_escalation'],
    },
    'neg_principles_outcomes_gen_084': {
        'question': 'Which practice should an accountable officer prioritize to sustain log management in negotiation work?',
        'options': ['Continued non-compliance after feedback.', 'Bypassed review checkpoints.', 'Accurate files with status updates at each control point.', 'Convenience ahead of documentation standards.'],
        'explanation': 'Log management in negotiation work is sustained when an accountable officer keeps accurate files and updates status at each control point.',
        'keywords': ['negotiation', 'log_management', 'accountable_officer', 'status_updates'],
    },
    'neg_principles_outcomes_gen_086': {
        'question': 'When a negotiation case requires formal handling, what should be done first?',
        'options': ['Complete records under the approved procedure.', 'Convenience ahead of legal requirements.', 'Personal preference in rule application.', 'Bypassed review checkpoints.'],
        'explanation': 'Formal handling begins with the approved procedure and the complete record needed to preserve fairness and later reviewability.',
        'keywords': ['negotiation', 'formal_handling', 'approved_procedure', 'complete_records'],
    },
    'neg_principles_outcomes_gen_087': {
        'question': 'Which approach best supports change management in negotiation work?',
        'options': ['Sequenced reforms with communication, training, and monitoring.', 'Bypassed review checkpoints.', 'Continued non-compliance after feedback.', 'Personal preference in reform handling.'],
        'explanation': 'Change management in negotiation work is best supported by sequencing reforms and backing them with communication, training, and monitoring.',
        'keywords': ['negotiation', 'change_management', 'communication', 'monitoring'],
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
        for question in sub.get('questions', []):
            qid = question.get('id')
            if qid not in UPDATES:
                continue
            for key, value in UPDATES[qid].items():
                question[key] = value
            updated += 1
        break
    write_json(TARGET, payload)
    print(f'Applied round 96 rewrites to {updated} questions')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
