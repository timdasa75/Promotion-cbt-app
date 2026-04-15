from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REWRITES = {
    ROOT / 'data' / 'civil_service_ethics.json': {
        'ethics_089': {
            'options': [
                'Maintenance of adequate accounting systems and control arrangements.',
                'Formulation of national economic policy.',
                'Personal audit of every account.',
                'Personal execution of all payments.',
            ],
        },
    },
    ROOT / 'data' / 'constitutional_foi.json': {
        'clg_general_competency_gen_042': {'options': ['Verification of legal authority with documented basis.', 'Delay of documentation until after action.', 'Use of inconsistent criteria across similar cases.', 'Bypassing of review checkpoints to save time.']},
        'clg_general_competency_gen_057': {'options': ['Application of safeguards with documented mitigation.', 'Preference for convenience over control requirements.', 'Continuation of non-compliance after feedback.', 'Reliance on personal preference in control use.']},
        'clg_general_competency_gen_067': {'options': ['Delay of documentation until after action.', 'Verification of legal authority with documented basis.', 'Use of inconsistent criteria across similar cases.', 'Bypassing of review checkpoints to save time.']},
        'clg_general_competency_gen_077': {'options': ['Application of safeguards with documented mitigation.', 'Preference for convenience over control requirements.', 'Continuation of non-compliance after feedback.', 'Reliance on personal preference in control use.']},
        'clg_general_competency_gen_085': {'options': ['Application of safeguards with documented mitigation.', 'Preference for convenience over control requirements.', 'Continuation of non-compliance after feedback.', 'Reliance on personal preference in control use.']},
        'clg_legal_compliance_gen_013': {'options': ['Application of safeguards with documented mitigation.', 'Preference for convenience over control requirements.', 'Continuation of non-compliance after feedback.', 'Reliance on personal preference in control use.']},
        'clg_legal_compliance_gen_036': {'options': ['Verification of legal authority with documented basis.', 'Delay of documentation until after action.', 'Use of inconsistent criteria across similar cases.', 'Bypassing of review checkpoints to save time.']},
        'clg_legal_compliance_gen_051': {'options': ['Application of safeguards with documented mitigation.', 'Preference for convenience over control requirements.', 'Continuation of non-compliance after feedback.', 'Reliance on personal preference in control use.']},
        'clg_legal_compliance_gen_067': {'options': ['Delay of documentation until after action.', 'Use of inconsistent criteria across similar cases.', 'Verification of legal authority with documented basis.', 'Bypassing of review checkpoints to save time.']},
        'clg_legal_compliance_gen_079': {'options': ['Preference for convenience over control requirements.', 'Application of safeguards with documented mitigation.', 'Continuation of non-compliance after feedback.', 'Reliance on personal preference in control use.']},
        'foi_access_obligations_gen_023': {'options': ['Verification of legal authority with documented basis.', 'Delay of documentation until after action.', 'Use of inconsistent criteria across similar cases.', 'Bypassing of review checkpoints to save time.']},
    },
    ROOT / 'data' / 'general_current_affairs.json': {
        'ca_general_gen_001': {'options': ['Approved procedure supported by complete records.', 'Inconsistent application of rules.', 'Bypassing of review checkpoints.', 'Preference for convenience over compliance.']},
        'ca_general_gen_003': {'options': ['Early identification of control gaps with prompt escalation of material exceptions.', 'Bypassing of review checkpoints.', 'Disregard of feedback after review.', 'Preference for convenience over compliance.']},
        'ca_general_gen_009': {'options': ['Documented procedure supported by complete records.', 'Inconsistent application of rules.', 'Bypassing of review checkpoints.', 'Preference for convenience over compliance.']},
        'ca_general_gen_011': {'options': ['Traceable decisions supported by evidence-based justification.', 'Bypassing of review checkpoints.', 'Preference for convenience over compliance.', 'Disregard of feedback after review.']},
        'ca_general_gen_013': {'options': ['Early risk identification with applied safeguards and documented mitigation.', 'Preference for convenience over compliance.', 'Disregard of corrective feedback.', 'Inconsistent application of rules.']},
        'ca_general_gen_015': {'options': ['Approved workflows with verification of outputs before closure.', 'Disregard of corrective feedback.', 'Inconsistent application of rules.', 'Bypassing of review checkpoints.']},
        'ca_general_gen_019': {'options': ['Application of approved procedures with a complete record trail.', 'Continuation of non-compliant procedures after feedback.', 'Preference for convenience over policy and legal requirements.', 'Bypassing of review and approval checkpoints.']},
        'ca_general_gen_023': {'options': ['Tracking of policy changes and their implications for service delivery.', 'Bypassing of review checkpoints.', 'Continuation of non-compliant procedures after feedback.', 'Inconsistent application of rules based on preference.']},
        'ca_general_gen_025': {'options': ['Separation of verified updates from misinformation.', 'Preference for convenience over policy and legal requirements.', 'Bypassing of review checkpoints to save time.', 'Inconsistent application of rules based on personal preference.']},
        'ca_national_events_gen_013': {'options': ['Application of approved safeguards with documented mitigation.', 'Preference for convenience over control requirements.', 'Continuation of non-compliance after feedback.', 'Personal preference in the use of safeguards.']},
        'ca_national_events_gen_040': {'options': ['Application of approved safeguards with documented mitigation.', 'Preference for convenience over control requirements.', 'Continuation of non-compliance after feedback.', 'Personal preference in the use of safeguards.']},
    },
    ROOT / 'data' / 'ict_digital.json': {
        'ict_e_governance_gen_001': {'options': ['Verification of service safeguards and supporting documentation before go-live.', 'Deferral of documentation until after implementation.', 'Use of different review standards for similar cases.', 'Bypassing of review checkpoints to save time.']},
        'ict_li_051': {'options': ['Use of mute settings according to the meeting agreement.', 'Continuous use of loudspeaker output throughout the meeting.', 'Routine use of satellite phones as the standard control.', 'Keeping every participant microphone open at all times.']},
        'ict_literacy_innovation_gen_004': {'options': ['Least-privilege access, timely patching, and incident reporting.', 'Routine treatment of exceptions without documentation.', 'Closure of cases before required checks are completed.', 'Reliance on informal instructions instead of documented procedures.']},
        'ict_literacy_innovation_gen_007': {'options': ['Prepared backup, recovery, and resilience arrangements.', 'Dependence on a single point of failure without recovery planning.', 'Undocumented exceptions left unresolved.', 'Preference for convenience over resilience safeguards.']},
        'ict_literacy_innovation_gen_008': {'options': ['Deployment supported by training, safeguards, and user assistance.', 'Uncontrolled rollout without user support.', 'Informal deployment outside the approved process.', 'Convenience placed ahead of review and support safeguards.']},
        'ict_security_gen_001': {'options': ['Use of approved security procedures with complete records.', 'Inconsistent application of rules based on preference.', 'Bypassing of review checkpoints for convenience.', 'Preference for speed over policy compliance.']},
        'ict_security_gen_002': {'options': ['Checking access, audit, and incident safeguards before implementation.', 'Postponing documentation until after implementation.', 'Using different review standards for similar cases.', 'Skipping review checkpoints to save time.']},
    },
    ROOT / 'data' / 'leadership_negotiation.json': {
        'NLR_P_002': {'options': ['Confrontational bargaining under routine safeguards.', 'Interest-based bargaining.', 'Mutual gains problem solving.', 'Principled negotiation focused on issues.']},
        'neg_dispute_law_gen_013': {'options': ['Applied safeguards with documented mitigation.', 'Convenience ahead of control requirements.', 'Repeated non-compliance after feedback.', 'Untracked exceptions after control failure.']},
        'neg_dispute_law_gen_031': {'options': ['Applied safeguards with documented mitigation.', 'Convenience ahead of control requirements.', 'Repeated non-compliance after feedback.', 'Untracked exceptions after control failure.']},
        'neg_dispute_law_gen_049': {'options': ['Convenience ahead of control requirements.', 'Repeated non-compliance after feedback.', 'Untracked exceptions after control failure.', 'Applied safeguards with documented mitigation.']},
        'neg_principles_outcomes_gen_013': {'options': ['Applied safeguards with documented mitigation.', 'Convenience ahead of control requirements.', 'Repeated non-compliance after feedback.', 'Untracked exceptions after control failure.']},
        'neg_principles_outcomes_gen_031': {'options': ['Applied safeguards with documented mitigation.', 'Convenience ahead of control requirements.', 'Repeated non-compliance after feedback.', 'Untracked exceptions after control failure.']},
        'neg_principles_outcomes_gen_050': {'options': ['Application of safeguards with documented mitigation steps.', 'Convenience ahead of control requirements.', 'Repeated non-compliance after feedback.', 'Untracked exceptions after control failure.']},
        'neg_structure_bodies_gen_013': {'options': ['Applied safeguards with documented mitigation.', 'Convenience ahead of control requirements.', 'Repeated non-compliance after feedback.', 'Untracked exceptions after control failure.']},
        'neg_structure_bodies_gen_031': {'options': ['Applied safeguards with documented mitigation.', 'Convenience ahead of control requirements.', 'Repeated non-compliance after feedback.', 'Untracked exceptions after control failure.']},
        'neg_structure_bodies_gen_051': {'options': ['Application of safeguards with documented mitigation steps.', 'Convenience ahead of control requirements.', 'Repeated non-compliance after feedback.', 'Untracked exceptions after control failure.']},
        'neg_structure_bodies_gen_068': {'options': ['Convenience ahead of control requirements.', 'Repeated non-compliance after feedback.', 'Applied safeguards with documented mitigation.', 'Untracked exceptions after control failure.']},
    },
    ROOT / 'data' / 'policy_analysis.json': {
        'pol_analysis_methods_gen_020': {'options': ['Applied safeguards with documented mitigation.', 'Convenience ahead of control requirements.', 'Repeated non-compliance after feedback.', 'Untracked exceptions after control failure.']},
        'pol_formulation_cycle_gen_001': {'options': ['Approved procedure supported by complete records.', 'Inconsistent application of rules.', 'Bypassing of review checkpoints to save time.', 'Preference for convenience over compliance.']},
        'pol_formulation_cycle_gen_009': {'options': ['Approved procedure supported by complete records.', 'Inconsistent application of rules.', 'Bypassing of review checkpoints when workloads rise.', 'Preference for convenience over compliance.']},
        'pol_implementation_evaluation_gen_025': {'options': ['Applied safeguards with documented mitigation.', 'Convenience ahead of control requirements.', 'Repeated non-compliance after feedback.', 'Untracked exceptions after control failure.']},
        'pol_public_sector_planning_gen_057': {'options': ['Convenience ahead of control requirements.', 'Applied safeguards with documented mitigation.', 'Repeated non-compliance after feedback.', 'Untracked exceptions after control failure.']},
    },
    ROOT / 'data' / 'public_procurement.json': {
        'ppa_elb_023': {'options': ['Operational training requirements under established safeguards.', 'Budget-padding permissions under open discretion.', 'Contract-splitting authority under internal preference.', 'Emergency procurement without legal thresholds.']},
        'ppa_elb_055': {'options': ['Consistent application of published criteria to all responsive bids.', 'Ignoring feedback after review.', 'Inconsistent rule application.', 'Bypassing of review and approval checkpoints to save time.']},
        'ppa_elb_063': {'options': ['Disclosure of conflicts and preservation of impartiality.', 'Inconsistent application of rules across similar bids.', 'Preference for convenience over procurement compliance.', 'Bypassing of review and approval checkpoints to save time.']},
        'ppa_ims_060': {'options': ['Bypassing of review and approval checkpoints to save time.', 'Preference for convenience over compliance.', 'Disregard of feedback after review.', 'Early identification of control gaps with prompt escalation of material exceptions.']},
        'ppa_ims_064': {'options': ['Accurate files with status updates at each control point.', 'Preference for convenience over compliance.', 'Bypassing of review and approval checkpoints to save time.', 'Inconsistent application of rules across similar cases.']},
        'ppa_ims_072': {'options': ['Traceable decisions supported by evidence-based justification.', 'Bypassing of review and approval checkpoints to save time.', 'Preference for convenience over compliance.', 'Disregard of feedback after review.']},
        'ppa_ims_074': {'options': ['Bypassing of review and approval checkpoints to save time.', 'Preference for convenience over compliance.', 'Disregard of feedback after review.', 'Approved procedures supported by complete records.']},
        'proc_bidding_evaluation_gen_001': {'options': ['Compliance with approved bidding procedures supported by complete records.', 'Inconsistent application of rules across similar bids.', 'Bypassing of review checkpoints during evaluation.', 'Preference for convenience over procurement compliance.']},
        'proc_bidding_evaluation_gen_003': {'options': ['Early identification of control gaps with prompt escalation of material exceptions.', 'Bypassing of review checkpoints.', 'Disregard of feedback after review.', 'Preference for convenience over compliance.']},
        'proc_bidding_evaluation_gen_007': {'options': ['Prevention of collusion, favoritism, and conflicts of interest.', 'Inconsistent application of rules across similar bids.', 'Bypassing of review checkpoints during evaluation.', 'Preference for convenience over procurement compliance.']},
        'proc_bidding_evaluation_gen_009': {'options': ['Recording of each decision step with preserved file evidence.', 'Inconsistent application of rules across similar bids.', 'Bypassing of review checkpoints during evaluation.', 'Preference for convenience over procurement compliance.']},
        'proc_bidding_evaluation_gen_011': {'options': ['Traceable decisions supported by evidence-based justification.', 'Bypassing of review checkpoints during evaluation.', 'Preference for convenience over procurement compliance.', 'Disregard of feedback after review.']},
        'proc_bidding_evaluation_gen_015': {'options': ['Approved workflows with verification of outputs before closure.', 'Disregard of feedback after review.', 'Inconsistent application of rules.', 'Bypassing of review checkpoints.']},
        'proc_bidding_evaluation_gen_017': {'options': ['Accurate files with status updates at each control point.', 'Inconsistent application of rules.', 'Bypassing of review checkpoints.', 'Preference for convenience over compliance.']},
        'proc_bidding_evaluation_gen_019': {'options': ['Maintenance of an auditable decision trail.', 'Bypassing of review checkpoints during evaluation.', 'Preference for convenience over procurement compliance.', 'Disregard of feedback after review.']},
        'proc_bidding_evaluation_gen_023': {'options': ['Consistent application of published criteria to all responsive bids.', 'Disregard of feedback after review.', 'Inconsistent application of rules.', 'Bypassing of review checkpoints.']},
        'proc_bidding_evaluation_gen_025': {'options': ['Disclosure of conflicts with preservation of impartiality.', 'Inconsistent application of rules across similar bids.', 'Bypassing of review checkpoints during evaluation.', 'Preference for convenience over procurement compliance.']},
        'proc_eligibility_consultants_budgeting_gen_013': {'options': ['Early identification of risk with applied safeguards and documented mitigation.', 'Untracked exceptions after a control failure.', 'Preference for convenience over control requirements.', 'Repeated non-compliance after feedback.']},
        'proc_implementation_sanctions_gen_016': {'options': ['Early identification of risk with applied safeguards and documented mitigation.', 'Untracked exceptions after a control failure.', 'Preference for convenience over control requirements.', 'Repeated non-compliance after feedback.']},
        'proc_implementation_sanctions_gen_029': {'options': ['Preference for convenience over policy and legal requirements.', 'Bypassing of review and approval checkpoints to save time.', 'Application of approved implementation, monitoring, and sanctions procedures with complete records.', 'Inconsistent application of rules based on personal preference.']},
        'proc_objectives_institutions_gen_001': {'options': ['Compliance with approved procedures supported by complete records.', 'Inconsistent application of rules across similar cases.', 'Bypassing of review checkpoints during implementation.', 'Preference for convenience over procurement compliance.']},
        'proc_objectives_institutions_gen_003': {'options': ['Early identification of control gaps with prompt escalation of material exceptions.', 'Bypassing of review checkpoints.', 'Disregard of feedback after review.', 'Preference for convenience over compliance.']},
        'proc_objectives_institutions_gen_007': {'options': ['Prevention of collusion, favoritism, and conflicts of interest in consultant selection.', 'Disregard of feedback after review.', 'Inconsistent application of rules across similar cases.', 'Bypassing of review checkpoints during implementation.']},
        'proc_objectives_institutions_gen_009': {'options': ['Recording of each decision step with preserved file evidence.', 'Inconsistent application of rules across similar cases.', 'Bypassing of review checkpoints during implementation.', 'Preference for convenience over procurement compliance.']},
        'proc_objectives_institutions_gen_011': {'options': ['Traceable decisions supported by evidence-based justification.', 'Bypassing of review checkpoints during implementation.', 'Preference for convenience over procurement compliance.', 'Disregard of feedback after review.']},
        'proc_objectives_institutions_gen_013': {'options': ['Early identification of risk with applied safeguards and documented mitigation.', 'Preference for convenience over compliance.', 'Disregard of feedback after review.', 'Inconsistent application of rules.']},
        'proc_objectives_institutions_gen_015': {'options': ['Approved workflows with verification of outputs before closure.', 'Disregard of feedback after review.', 'Inconsistent application of rules.', 'Bypassing of review checkpoints.']},
        'proc_objectives_institutions_gen_019': {'options': ['Maintenance of an auditable trail for every decision.', 'Bypassing of review checkpoints.', 'Preference for convenience over compliance.', 'Disregard of feedback after review.']},
        'proc_transparency_ethics_gen_013': {'options': ['Early identification of risk with applied safeguards and documented mitigation.', 'Untracked exceptions after a control failure.', 'Preference for convenience over control requirements.', 'Repeated non-compliance after feedback.']},
        'proc_transparency_ethics_gen_026': {'options': ['Consistent application of published criteria with complete evaluation records.', 'Bypassing of review checkpoints where timelines are tight.', 'Preference for convenience over approved process requirements.', 'Application of discretionary shortcuts regardless of safeguards.']},
    },
    ROOT / 'data' / 'psr_rules.json': {
        'circ_leave_welfare_allowances_gen_037': {'options': ['Compliance with approved procedure supported by complete records.', 'Preference for convenience over compliance requirements.', 'Disregard of feedback after review.', 'Bypassing of review and approval checkpoints.']},
        'circ_leave_welfare_allowances_gen_041': {'options': ['Eligibility confirmation before recommendation for advancement.', 'Inconsistent criteria for similar officers.', 'Preference for convenience over compliance requirements.', 'Bypassing of review and approval checkpoints.']},
        'circ_leave_welfare_allowances_gen_043': {'options': ['Approved steps supported by complete records.', 'Disregard of feedback after review.', 'Preference for convenience over compliance requirements.', 'Bypassing of review and approval checkpoints.']},
        'circ_leave_welfare_allowances_gen_045': {'options': ['Bypassing of review and approval checkpoints.', 'Disregard of feedback after review.', 'Preference for convenience over compliance requirements.', 'Traceable decisions supported by evidence-based justification.']},
        'circ_leave_welfare_allowances_gen_049': {'options': ['Bypassing of review and approval checkpoints.', 'Disregard of feedback after review.', 'Inconsistent application of rules.', 'Approved workflows with verification of outputs before closure.']},
        'circ_leave_welfare_allowances_gen_051': {'options': ['Accurate files with status updates at each control point.', 'Preference for convenience over compliance requirements.', 'Bypassing of review and approval checkpoints.', 'Inconsistent application of rules.']},
        'circ_leave_welfare_allowances_gen_057': {'options': ['Fair hearing with documented decisions.', 'Bypassing of review and approval checkpoints.', 'Preference for convenience over compliance requirements.', 'Disregard of feedback after review.']},
        'circ_leave_welfare_allowances_gen_059': {'options': ['Eligibility confirmation before recommendation for advancement.', 'Bypassing of review and approval checkpoints.', 'Preference for convenience over compliance requirements.', 'Inconsistent criteria for similar officers.']},
        'circ_leave_welfare_allowances_gen_060': {'options': ['Use of credible official sources with confirmation of facts before conclusions.', 'Disregard of feedback after review.', 'Preference for convenience over compliance requirements.', 'Discretionary shortcuts regardless of safeguards.']},
        'leadership_mpf_041': {'options': ['Annual-holiday leave under normal safeguards.', 'Maternity leave only.', 'Sick leave only.', 'Leave to join a spouse on grounds of public policy only.']},
        'psr_discipline_gen_001': {'options': ['Approved procedure supported by complete records.', 'Inconsistent treatment of similar cases.', 'Bypassing of review and approval checkpoints.', 'Preference for convenience over compliance requirements.']},
        'psr_discipline_gen_003': {'options': ['Early identification of control gaps with prompt escalation of material exceptions.', 'Bypassing of review and approval checkpoints.', 'Disregard of feedback after review.', 'Preference for convenience over compliance requirements.']},
        'psr_discipline_gen_007': {'options': ['Eligibility confirmation before recommendation for advancement.', 'Inconsistent criteria for similar officers.', 'Bypassing of review checkpoints.', 'Preference for convenience over compliance requirements.']},
        'psr_discipline_gen_009': {'options': ['Approved steps supported by complete records.', 'Inconsistent treatment of similar cases.', 'Bypassing of review and approval checkpoints.', 'Preference for convenience over compliance requirements.']},
        'psr_discipline_gen_011': {'options': ['Opportunity for the officer to respond before a decision is taken.', 'Bypassing of review and approval checkpoints.', 'Preference for convenience over compliance requirements.', 'Disregard of feedback after review.']},
        'psr_discipline_gen_015': {'options': ['Approved workflow with verification of outputs before closure.', 'Continuation of non-compliance after feedback.', 'Inconsistent treatment of similar cases.', 'Bypassing of review and approval checkpoints.']},
        'psr_discipline_gen_017': {'options': ['Accurate file maintenance with status updates at each control point.', 'Inconsistent treatment of similar cases.', 'Bypassing of review and approval checkpoints.', 'Preference for convenience over compliance requirements.']},
        'psr_discipline_gen_019': {'options': ['Approved procedure supported by complete records.', 'Bypassing of review and approval checkpoints.', 'Preference for convenience over compliance requirements.', 'Continuation of non-compliance after feedback.']},
        'psr_discipline_gen_023': {'options': ['Fair hearing with documented decisions.', 'Continuation of non-compliance after feedback.', 'Inconsistent treatment of similar cases.', 'Bypassing of review and approval checkpoints.']},
        'psr_discipline_gen_025': {'options': ['Eligibility confirmation before recommendation for advancement.', 'Inconsistent criteria for similar officers.', 'Bypassing of review and approval checkpoints.', 'Preference for convenience over compliance requirements.']},
        'psr_ethics_gen_023': {'options': ['Disclosure of conflicts with preservation of impartiality.', 'Preference for convenience over compliance requirements.', 'Known safeguards bypassed to save time.', 'Disregard of feedback after review.']},
        'psr_general_admin_gen_003': {'options': ['Compliance with approved procedures supported by complete records.', 'Bypassing of review and approval checkpoints to save time.', 'Preference for convenience over compliance requirements.', 'Inconsistent application of rules across similar cases.']},
        'psr_general_admin_gen_007': {'options': ['Eligibility confirmation before recommendation for advancement.', 'Inconsistent criteria for similar officers.', 'Preference for convenience over compliance requirements.', 'Bypassing of review and approval checkpoints to save time.']},
        'psr_general_admin_gen_009': {'options': ['Use of credible official sources with confirmation of facts before conclusions.', 'Disregard of feedback after review.', 'Discretionary shortcuts regardless of safeguards.', 'Preference for convenience over compliance requirements.']},
        'psr_medical_gen_023': {'options': ['Prompt documentation of clinical decisions with preserved records.', 'Preference for convenience over compliance requirements.', 'Known safeguards bypassed to save time.', 'Disregard of feedback after review.']},
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
    for path, rewrites in REWRITES.items():
        updated = update_file(path, rewrites)
        print(f'Updated {len(updated)} questions in {path.name}')
        for qid in updated:
            print(qid)
        total += len(updated)
    print(f'Total updated: {total}')


if __name__ == '__main__':
    main()
