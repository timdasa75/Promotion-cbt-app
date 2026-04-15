from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'general_current_affairs.json': {
        'IRA_155': {
            'options': [
                'Immediate reporting of the loss to the Accountant-General and the Auditor-General.',
                'No official action because the book is old.',
                'Notification only to the Head of Department.',
                'Replacement of the book without formal reporting.',
            ],
            'explanation': 'A missing receipt or licence book must be reported immediately to the Accountant-General and the Auditor-General because it concerns accountability for official revenue instruments.',
        },
        'NGPD_052': {
            'options': [
                'Automatic withdrawal of self-accounting status.',
                'Disciplinary action and surcharge.',
                'A verbal warning only.',
                'No consequence because the unit is self-accounting.',
            ],
            'explanation': 'Failure by an Accounting Officer in a self-accounting unit to comply with the Financial Regulations can attract disciplinary action and surcharge because the officer remains personally accountable for compliance.',
        },
        'PSIR_078': {
            'options': [
                'Recall limited to weekends only.',
                'Return before the approved leave period ends when official need arises.',
                'Recall only where the officer is abroad.',
                'Recall restricted to officers on GL 07 and above.',
            ],
            'explanation': 'An officer on leave may be recalled when official need requires the officer to return before the authorised leave period expires.',
        },
        'PSIR_103': {
            'options': [
                'Prevention of pilferage and extravagance only.',
                'Assessment of economy, efficiency, and effectiveness in government projects.',
                'Certification that accounts are faithfully kept only.',
                'Confirmation that expenditure matched appropriation only.',
            ],
            'explanation': 'A Value-for-Money audit examines whether public programmes and projects achieve economy, efficiency, and effectiveness, not merely whether records were kept correctly.',
        },
        'PSIR_125': {
            'options': [
                'Expiry when the available funds are fully spent.',
                'Expiry at the end of the relevant financial year.',
                'Expiry at the end of the calendar year.',
                'Expiry after a period of three months.',
            ],
            'explanation': 'Authority for recurrent expenditure conveyed by warrant lapses at the end of the financial year for which the warrant was issued.',
        },
        'ca_general_gen_001': {
            'options': [
                'Approved procedure supported by complete records.',
                'Inconsistent application of rules.',
                'Bypassing of review controls.',
                'Preference for convenience over compliance.',
            ],
            'explanation': 'Good governance in general affairs depends on following approved procedure and keeping complete records so decisions can be checked and justified later.',
        },
        'ca_general_gen_003': {
            'options': [
                'Early identification of control gaps with prompt escalation of material exceptions.',
                'Bypassing of review controls.',
                'Disregard of feedback after review.',
                'Preference for convenience over compliance.',
            ],
            'explanation': 'Risk management improves when control gaps are identified early and material exceptions are escalated before they grow into larger failures.',
        },
        'ca_general_gen_009': {
            'options': [
                'Documented procedure supported by complete records.',
                'Inconsistent application of rules.',
                'Bypassing of review controls.',
                'Preference for convenience over compliance.',
            ],
            'explanation': 'Proper documented procedure means following the required steps and keeping records that support later verification and review.',
        },
        'ca_general_gen_011': {
            'options': [
                'Traceable decisions supported by evidence-based justification.',
                'Bypassing of review controls.',
                'Preference for convenience over compliance.',
                'Disregard of feedback after review.',
            ],
            'explanation': 'Public accountability is shown when decisions are traceable and supported by reasons and evidence that others can examine later.',
        },
        'ca_general_gen_013': {
            'options': [
                'Early risk identification with applied controls and documented mitigation.',
                'Preference for convenience over compliance.',
                'Disregard of corrective feedback.',
                'Inconsistent application of rules.',
            ],
            'explanation': 'Risk control requires identifying risks early, applying appropriate controls, and documenting how those risks were mitigated.',
        },
        'ca_general_gen_015': {
            'options': [
                'Approved workflows with verification of outputs before closure.',
                'Disregard of corrective feedback.',
                'Inconsistent application of rules.',
                'Bypassing of review controls.',
            ],
            'explanation': 'Operational discipline depends on following approved workflows and verifying outputs before a matter is closed.',
        },
        'ca_general_gen_019': {
            'options': [
                'Application of approved procedures with a complete record trail.',
                'Continuation of non-compliant procedures after feedback.',
                'Preference for convenience over policy and legal requirements.',
                'Bypassing of review and approval controls.',
            ],
            'explanation': 'Proper general-affairs governance depends on approved procedure, compliance, and a record trail that can be reviewed later.',
        },
        'ca_general_gen_023': {
            'options': [
                'Tracking of policy changes and their implications for service delivery.',
                'Bypassing of review controls.',
                'Continuation of non-compliant procedures after feedback.',
                'Inconsistent application of rules based on preference.',
            ],
            'explanation': 'Officials keep up with national governance updates by tracking policy changes and understanding what those changes mean for service delivery.',
        },
        'ca_general_gen_025': {
            'options': [
                'Separation of verified updates from misinformation.',
                'Preference for convenience over policy and legal requirements.',
                'Bypassing of review controls to save time.',
                'Inconsistent application of rules based on personal preference.',
            ],
            'explanation': 'Public communication literacy is improved when accountable officers distinguish verified information from misinformation before acting or communicating.',
        },
        'ca_international_affairs_gen_042': {
            'options': [
                'Use of credible official sources with confirmation of facts before conclusions.',
                'Discretionary shortcuts under pressure.',
                'Preference for convenience over approved process.',
                'Bypassing of review checkpoints.',
            ],
            'explanation': 'Compliance and service quality are best preserved when officers rely on credible official sources and confirm facts before drawing conclusions under pressure.',
        },
        'ca_international_affairs_gen_044': {
            'options': [
                'Discretionary shortcuts under pressure.',
                'Preference for convenience over approved process.',
                'Use of credible official sources with confirmation of facts before conclusions.',
                'Bypassing of review checkpoints.',
            ],
            'explanation': 'Control and consistency improve when supervisors require the use of credible official sources and confirmation of facts before conclusions are reached.',
        },
        'ca_national_events_gen_013': {
            'options': [
                'Application of approved controls with documented mitigation.',
                'Preference for convenience over control requirements.',
                'Continuation of non-compliance after feedback.',
                'Personal preference in the use of controls.',
            ],
            'explanation': 'Risk control is stronger when approved controls are applied and the mitigation taken is documented for later review.',
        },
        'ca_national_events_gen_040': {
            'options': [
                'Application of approved controls with documented mitigation.',
                'Preference for convenience over control requirements.',
                'Continuation of non-compliance after feedback.',
                'Personal preference in the use of controls.',
            ],
            'explanation': 'Where national-events updates require approval and documentation, risk control improves when approved controls are applied and the mitigation is recorded.',
        },
        'ca_national_events_gen_053': {
            'options': [
                'Use of credible official sources with confirmation of facts before conclusions.',
                'Discretionary shortcuts despite control safeguards.',
                'Preference for convenience over approved process requirements.',
                'Bypassing of review checkpoints under time pressure.',
            ],
            'explanation': 'Compliance and service quality are better preserved when officers handling national events rely on credible official sources and confirm facts before drawing conclusions.',
        },
        'ca_national_events_gen_055': {
            'options': [
                'Use of credible official sources with confirmation of facts before conclusions.',
                'Discretionary shortcuts despite control safeguards.',
                'Preference for convenience over approved process requirements.',
                'Bypassing of review checkpoints under time pressure.',
            ],
            'explanation': 'Control and consistency improve when supervisors insist on credible official sources and verified facts before decisions are made.',
        },
        'ca_national_events_gen_065': {
            'options': [
                'Takeover of the claim by the Accountant-General.',
                'Automatic write-off of the claim.',
                'Liability of the neglecting officer for the resulting prejudice.',
                'Exclusive loss borne by the private party.',
            ],
            'explanation': 'Where an officer neglects to press for claims from private parties and prejudice results, the neglecting officer is held in charge because official neglect should not prejudice the private party.',
        },
        'ca_national_events_gen_076': {
            'options': [
                'Delegation to any senior officer.',
                'Discretion left entirely to the Accounting Officer.',
                'Non-delegation of the authority to notify the bank of signatory changes.',
                'Delegation only with ministerial approval.',
            ],
            'explanation': 'The authority to notify the bank of changes in empowered signatories must not be delegated under the applicable financial regulation.',
        },
        'ca_national_events_gen_077': {
            'options': [
                'Automatic closure of the account.',
                'Refund of any bank charges incurred by the accountable officer.',
                'Reporting alone to the Minister of Finance.',
                'Absorption of the overdraft by the bank without consequence.',
            ],
            'explanation': 'If a government bank account is overdrawn, the accountable officer must refund any bank charges incurred because of the overdraft.',
        },
        'ca_national_events_gen_081': {
            'options': [
                'Endorsement to a third party for urgent payments.',
                'Absolute prohibition of endorsement or assignment to a third party.',
                'Endorsement to another government entity only.',
                'Endorsement with special authorisation.',
            ],
            'explanation': 'Cheques received by a Sub-Accounting Officer must not be endorsed or assigned to a third party under any circumstances.',
        },
        'ca_national_governance_gen_015': {
            'options': [
                'Approved workflow checks before a matter is closed.',
                'Skipped workflow checks under pressure.',
                'Personal preference in workflow steps.',
                'Repeated non-compliance after feedback.',
            ],
            'explanation': 'Operational discipline in national governance work depends on completing approved workflow checks before a matter is closed or advanced.',
        },
        'ca_national_governance_gen_026': {
            'options': [
                'Discretionary shortcuts to accelerate closure.',
                'Preference for convenience over approved process requirements.',
                'Use of credible official sources with confirmation of facts before conclusions.',
                'Bypassing of review checkpoints where timelines are tight.',
            ],
            'explanation': 'Compliance and service quality are protected when officers use credible official sources and confirm facts before reaching conclusions under pressure.',
        },
        'ca_national_governance_gen_028': {
            'options': [
                'Use of credible official sources with confirmation of facts before conclusions.',
                'Bypassing of review checkpoints where timelines are tight.',
                'Preference for convenience over approved process requirements.',
                'Inconsistent criteria across similar cases in the same period.',
            ],
            'explanation': 'Control and consistency improve when officers rely on credible official sources and verify facts before reaching conclusions.',
        },
        'ca_public_service_reforms_gen_027': {
            'options': [
                'Discretionary shortcuts under pressure.',
                'Use of credible official sources with confirmation of facts before conclusions.',
                'Preference for convenience over approved process.',
                'Bypassing of review checkpoints.',
            ],
            'explanation': 'Compliance and service quality are better preserved in reform work when officers rely on credible official sources and confirm facts before drawing conclusions.',
        },
        'ca_public_service_reforms_gen_029': {
            'options': [
                'Discretionary shortcuts under pressure.',
                'Preference for convenience over approved process.',
                'Bypassing of review checkpoints.',
                'Use of credible official sources with confirmation of facts before conclusions.',
            ],
            'explanation': 'Control and consistency improve when supervisors require the use of credible official sources and verification of facts before conclusions are reached.',
        },
        'ca_public_service_reforms_gen_030': {
            'options': [
                'Discretionary shortcuts under pressure.',
                'Preference for convenience over approved process.',
                'Use of credible official sources with confirmation of facts before conclusions.',
                'Bypassing of review checkpoints.',
            ],
            'explanation': 'A sound first step in a compliance review is to check credible official sources and confirm facts before conclusions are reached or acted upon.',
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
