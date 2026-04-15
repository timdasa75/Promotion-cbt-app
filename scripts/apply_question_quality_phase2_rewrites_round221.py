from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REWRITES = {
    ROOT / 'data' / 'financial_regulations.json': {
        'fin_aud_058': {
            'options': [
                'Permanent Secretary or equivalent head with full resource responsibility.',
                'Internal-audit officer serving alone as accounting head.',
                'Voucher-signing officer responsible for disbursement processing.',
                'Any officer responsible for public money handling.',
            ],
        },
        'fin_budgeting_gen_004': {
            'options': [
                'Budget confirmation before commitment raising.',
                'Commitments raised without budget checks.',
                'Informal instructions treated as authority.',
                'Required records skipped before commitment.',
            ],
        },
        'fin_budgeting_gen_022': {
            'options': [
                'Budget confirmation before commitment raising.',
                'Commitments raised without budget checks.',
                'Informal instructions treated as authority.',
                'Required records skipped before commitment.',
            ],
        },
        'fin_gen_011': {
            'options': [
                'Capital-project account only.',
                'Main account for government revenue lodgement.',
                'External-loan account.',
                'Emergency-fund account only.',
            ],
        },
        'fin_general_gen_004': {
            'options': [
                'Budget confirmation before commitment raising.',
                'Commitments raised without budget checks.',
                'Informal instructions treated as authority.',
                'Required records skipped before commitment.',
            ],
        },
        'fin_general_gen_022': {
            'options': [
                'Budget confirmation before commitment raising.',
                'Commitments raised without budget checks.',
                'Informal instructions treated as authority.',
                'Required records skipped before commitment.',
            ],
        },
        'fin_pro_074': {
            'options': [
                "Unlimited authority at the Accounting Officer's discretion.",
                'Authority limited to the approved amounts under each sub-head.',
                'Authority limited to personal emoluments only.',
                'Unlimited authority where cash remains available.',
            ],
        },
        'fin_procurement_gen_004': {
            'options': [
                'Budget confirmation before commitment raising.',
                'Commitments raised without budget checks.',
                'Informal instructions treated as authority.',
                'Required records skipped before commitment.',
            ],
        },
        'fin_procurement_gen_026': {
            'options': [
                'Budget confirmation before commitment raising.',
                'Commitments raised without budget checks.',
                'Informal instructions treated as authority.',
                'Required records skipped before commitment.',
            ],
        },
        'fin_procurement_gen_033': {
            'options': [
                'Commitments raised without budget checks.',
                'Budget confirmation before commitment raising.',
                'Informal instructions treated as authority.',
                'Required records skipped before commitment.',
            ],
        },
    },
    ROOT / 'data' / 'general_current_affairs.json': {
        'IRA_155': {
            'options': [
                'Immediate reporting of the loss to the Accountant-General and the Auditor-General.',
                "No official action on the ground of the book's age.",
                'Notification only to the Head of Department.',
                'Replacement of the book without formal reporting.',
            ],
        },
        'NGPD_052': {
            'options': [
                'Automatic withdrawal of self-accounting status.',
                'Disciplinary action and surcharge.',
                'A verbal warning only.',
                'No consequence on the ground of self-accounting status.',
            ],
        },
        'PSIR_078': {
            'options': [
                'Recall limited to weekends only.',
                'Return before the approved leave period ends when official need arises.',
                'Recall restricted to officers abroad.',
                'Recall restricted to officers on GL 07 and above.',
            ],
        },
        'PSIR_103': {
            'options': [
                'Prevention of pilferage and extravagance only.',
                'Assessment of economy, efficiency, and effectiveness in government projects.',
                'Certification of faithful account keeping only.',
                'Confirmation of expenditure conformity with appropriation only.',
            ],
        },
        'PSIR_125': {
            'options': [
                'Expiry upon full spending of the available funds.',
                'Expiry at the end of the relevant financial year.',
                'Expiry at the end of the calendar year.',
                'Expiry after a period of three months.',
            ],
        },
        'ca_national_governance_gen_015': {
            'options': [
                'Approved workflow checks before matter closure.',
                'Skipped workflow checks under pressure.',
                'Personal preference in workflow steps.',
                'Repeated non-compliance after feedback.',
            ],
        },
        'ca_national_governance_gen_026': {
            'options': [
                'Discretionary shortcuts to accelerate closure.',
                'Preference for convenience over approved process requirements.',
                'Use of credible official sources with confirmation of facts before conclusions.',
                'Bypassing of review checkpoints under tight timelines.',
            ],
        },
        'ca_national_governance_gen_028': {
            'options': [
                'Use of credible official sources with confirmation of facts before conclusions.',
                'Bypassing of review checkpoints under tight timelines.',
                'Preference for convenience over approved process requirements.',
                'Inconsistent criteria across similar cases in the same period.',
            ],
        },
    },
    ROOT / 'data' / 'ict_digital.json': {
        'ict_eg_062': {
            'options': [
                'IPPIS for personnel and payroll, with GIFMIS for budget execution and financial reporting.',
                'IPPIS for government assets, with GIFMIS for public debt only.',
                'IPPIS for revenue collection, with GIFMIS for tax policy only.',
                'Exact functional identity between IPPIS and GIFMIS.',
            ],
        },
        'ict_eg_083': {
            'options': [
                'Administration in line with good-governance principles.',
                'Formulation of all government policies alone.',
                'Opposition-party action against government.',
                'Direct management of every social conflict.',
            ],
        },
        'ict_f_003': {
            'options': [
                'Permanent storage for files and programs.',
                'Temporary storage for data during computer operation.',
                'Image output to the display screen.',
                'Internet connectivity for the device.',
            ],
        },
        'ict_li_072': {
            'options': [
                'Automatic payment of both Nigerian and overseas salaries.',
                'Non-payment of Federal Government emoluments or allowances unless specifically approved.',
                'Mandatory remittance of the overseas salary to the Treasury.',
                'Immediate cessation of all Nigerian emoluments in every case.',
            ],
        },
        'ict_li_089': {
            'options': [
                'Careful verification of the facts, figures, and data provided.',
                'Treatment of the papers as routine and unimportant.',
                'Assumption that close review is unnecessary.',
                'Disregard of the papers unless personally addressed to the officer.',
            ],
        },
        'ict_sec_079': {
            'options': [
                'At least two locks with different officers holding the keys.',
                'One lock held by the cashier alone.',
                'A simple padlock only.',
                'No lock despite guard presence.',
            ],
        },
        'ict_sec_095': {
            'options': [
                'Authorised key holders remaining present while the safe is open.',
                'Any officer who happens to be on duty.',
                'The cashier acting alone.',
                'Security staff without the authorised key holders.',
            ],
        },
        'ict_sec_099': {
            'options': [
                'Not less than two locks with keys held by different officers.',
                'One lock held only by the cashier.',
                'A simple padlock as the sole safeguard.',
                'No lock where a guard is on duty.',
            ],
        },
    },
    ROOT / 'data' / 'leadership_negotiation.json': {
        'leadership_lsm_048': {
            'options': [
                'Immediate high-standard performance demands.',
                'Continuous pressure for faster output.',
                'Delayed action pending universal consensus.',
                'Strict correction of weak performers by the leader.',
            ],
        },
        'leadership_lsm_066': {
            'options': [
                'Removal under written authority for official use.',
                'Removal with register entry and prompt return.',
                'Removal for photocopying under approved procedure.',
                'Removal on the ground of an officer being in a hurry.',
            ],
        },
        'leadership_mpf_052': {
            'options': [
                "Training outside the MDA's central mandate.",
                "Automatic funding on the ground of centrality to the mandate.",
                'Developmental training linked to broad service needs.',
                'Specialised training for a clearly identified institutional gap.',
            ],
        },
        'leadership_mpf_067': {
            'options': [
                'Withholding upon unsatisfactory conduct or inefficiency.',
                'Withholding during a pending disciplinary action.',
                'Withholding for automatic budgetary savings.',
                'Withholding during an officer\'s secondment.',
            ],
        },
        'leadership_smp_061': {
            'options': [
                'Pursuit of clearances and recovery action.',
                'Avoidance of responsibility for dishonoured cheques.',
                'Suspension of all cheque transactions.',
                'Replacement of bank reconciliation duties.',
            ],
        },
        'leadership_smp_075': {
            'options': [
                'Clarity, accuracy, and readiness for approval.',
                'Use of complex vocabulary.',
                'Excessive length.',
                'Very rapid preparation.',
            ],
        },
        'neg_dispute_law_gen_025': {
            'options': [
                'Scheduled monitoring of compliance with agreed steps.',
                'Documented assignment of implementation responsibilities.',
                'Delayed follow-up pending the filing of a complaint.',
                'Use of review meetings to confirm progress and gaps.',
            ],
        },
    },
    ROOT / 'data' / 'policy_analysis.json': {
        'pol_analysis_methods_gen_044': {
            'options': [
                'Accelerated clearance before definition of the problem.',
                'Problem definition before solution design.',
                'Evidence review before recommendation drafting.',
                'Stakeholder analysis before option selection.',
            ],
        },
        'pol_formulation_cycle_gen_003': {
            'options': [
                'Early escalation of material risks with documented mitigation.',
                'Delay of reporting until case closure.',
                'Review skipping during tight timelines.',
                'Convenience ahead of approved process requirements.',
            ],
        },
        'pol_formulation_cycle_gen_012': {
            'options': [
                'Use of credible evidence with documented approval steps.',
                'Assignment of responsibilities before implementation.',
                'Scheduling of review points before rollout.',
                'Case closure before evidence checking.',
            ],
        },
        'pol_formulation_cycle_gen_014': {
            'options': [
                'Use of agreed criteria across similar cases.',
                'Recording of review findings for follow-up action.',
                'Escalation of major gaps through approved channels.',
                'Approval of shortcuts during tight timelines.',
            ],
        },
        'pol_formulation_cycle_gen_016': {
            'options': [
                'Sequenced review of each option against agreed criteria before approval.',
                'Convenience ahead of documented procedure.',
                'Criteria skipping in complex cases.',
                'Untracked exceptions after review.',
            ],
        },
        'pol_formulation_cycle_gen_018': {
            'options': [
                'Clear assignment of roles before rollout.',
                'Launch before responsibility assignment.',
                'Monitoring skipped on the ground of urgency.',
                'Evidence review after implementation.',
            ],
        },
        'policy_constitution_035': {
            'options': [
                'Open and clear processes allowing public visibility of decisions.',
                'Secretive handling of official decisions.',
                'Selective disclosure to a small inner circle.',
                'Restriction of information without lawful basis.',
            ],
        },
        'policy_psr_015': {
            'options': [
                'Point of permanent promotion blockage.',
                'Point on the salary scale where increment stops pending proof of efficiency.',
                'Point of compulsory transfer to another cadre.',
                'Point of automatic conversion to another grade level.',
            ],
        },
        'policy_psr_041': {
            'options': [
                'Confirmation without examination where service record is satisfactory.',
                'Confirmation based on promotion alone.',
                'Confirmation based on excellent service record alone.',
                'Compulsory passing of the prescribed examination before confirmation.',
            ],
        },
        'policy_psr_042': {
            'options': [
                'Meetings only during major policy change.',
                'Annual meetings as part of the council calendar.',
                'Meetings at intervals fixed by the council rules.',
                'Meetings whenever summoned under the council\'s procedures.',
            ],
        },
        'policy_psr_045': {
            'options': [
                'Mandatory monthly checking of contents in strong-rooms or safes.',
                'Optional checking unless a discrepancy is suspected.',
                'Checking required only once each year.',
                'Checking carried out only after an audit query.',
            ],
        },
        'policy_psr_058': {
            'options': [
                'Witnessing of the payee\'s mark by a responsible officer.',
                'Replacement of the mark with a verbal declaration.',
                'Absence of any mark requirement.',
                'Substitution of the mark with a typed signature.',
            ],
        },
        'policy_psr_063': {
            'options': [
                'Ignoring of the defect on the ground of its minor nature.',
                'Prompt entry of the defect in the vehicle record and report for attention.',
                'Immediate use of the vehicle without notation.',
                'Repair by the driver without authorisation or record.',
            ],
        },
    },
    ROOT / 'data' / 'public_procurement.json': {
        'ppa_bid_045': {
            'options': [
                'Forfeiture of contract award for failure to provide the bond.',
                'Doubling of the mobilization fee.',
                'Automatic extension of the submission period.',
                'Conversion of the bond requirement into an undertaking.',
            ],
        },
        'ppa_elb_007': {
            'options': [
                'Eligibility for small contracts despite debarment.',
                'Exclusion from all tenders while the sanction remains in force.',
                'Readmission after ministerial recommendation alone.',
                'Exclusion limited to works contracts.',
            ],
        },
        'ppa_elb_009': {
            'options': [
                'Contract cancellation or other sanction for failure to provide the bond.',
                'Extension of the bond period without consequence.',
                'Immediate release of mobilization fee.',
                'Transfer of the project to another MDA.',
            ],
        },
        'ppa_elb_017': {
            'options': [
                'Use only for price comparison.',
                'Initial grading to confirm competence before opening financial proposals.',
                'Automatic acceptance where the firm is already known.',
                'Discarding on the ground of high price alone.',
            ],
        },
        'ppa_elb_042': {
            'options': [
                'Payment after fulfilment of lawful conditions tied to the guarantee or bond.',
                'Payment to avoid bid evaluation.',
                'Payment before preparation of contract documentation.',
                'Payment on consultant request alone.',
            ],
        },
        'ppa_elb_060': {
            'options': [
                'Exclusion limited to works contracts.',
                'Exclusion from all tenders while the sanction remains in force.',
                'Readmission by internal memo only.',
                'Eligibility for restricted tenders despite debarment.',
            ],
        },
        'ppa_elb_066': {
            'options': [
                'Opening together with financial proposals.',
                'Initial grading to confirm competence before opening financial proposals.',
                'Use only for price comparison.',
                'Discarding on the ground of high price alone.',
            ],
        },
        'ppa_ethic_010': {
            'options': [
                'Designation as the Chief Accounting Officer for the MDA.',
                'Personal authorship of all procurement documents.',
                'Chairmanship of every evaluation committee.',
                'Exclusive signing of all payment vouchers.',
            ],
        },
        'ppa_ethic_059': {
            'options': [
                'Moment of meeting announcement.',
                'Commencement of venue preparation only.',
                'Period from designation of the Secretary to completion of follow-up actions after the meeting rises.',
                'Moment of minutes circulation.',
            ],
        },
        'ppa_ethic_061': {
            'options': [
                'Faster recollection of decisions and action points while the meeting remains fresh.',
                'Avoidance of all need for record review.',
                'Proof of the secretary\'s writing speed.',
                'Substitution for formal meeting approval.',
            ],
        },
        'ppa_ethic_068': {
            'options': [
                'Typing only for senior officers.',
                'Typing where handwriting lacks sufficient legibility.',
                'Typing only after circulation of the final version.',
                'Typing only for long reports rather than short drafts.',
            ],
        },
        'ppa_ims_003': {
            'options': [
                'Contract cancellation or other sanction for failure to provide the bond.',
                'Extension of time without consequence.',
                'Immediate release of mobilization fee.',
                'Transfer of the project to another MDA.',
            ],
        },
        'ppa_ims_053': {
            'options': [
                'Short-term deposit only where the regulation permits it and the conditions are satisfied.',
                'Automatic deposit of all idle mission funds.',
                'Deposit only where the amount is substantial.',
                'Deposit without reference to treasury approval requirements.',
            ],
        },
        'ppa_objectives_021': {
            'options': [
                'Availability from only a few qualified suppliers.',
                'International sourcing of the item.',
                'Need for FEC approval.',
                'Preference of the Accounting Officer for a smaller field.',
            ],
        },
        'ppa_objectives_062': {
            'options': [
                'Continuing treatment as a breach of the Code.',
                'Automatic absolution of the principal offender.',
                'Disregard of the act because it was not done personally.',
                'Treatment of the act as official duty.',
            ],
        },
    },
    ROOT / 'data' / 'psr_rules.json': {
        'psr_admin_068': {
            'options': [
                "Necessary information on the unit's acts and procedures.",
                'Only information requested in person.',
                'No information on the ground of universal classification.',
                'Only information already published in newspapers.',
            ],
        },
        'psr_allow_014': {
            'options': [
                'Automatic cessation after three months.',
                'Cessation when the officer resumes the substantive post.',
                'Automatic cessation after one year of acting service.',
                'Cessation only upon substantive promotion approval.',
            ],
        },
        'psr_allow_041': {
            'options': [
                'Cessation upon any transfer of the officer.',
                'Cessation whenever the officer proceeds on leave.',
                'Cessation when the officer no longer holds the additional responsibility.',
                'Automatic cessation only on retirement.',
            ],
        },
        'psr_allow_049': {
            'options': [
                'Advance payment whenever an officer proceeds on leave.',
                'Advance payment whenever an officer retires from service.',
                'Advance payment where the Accounting Officer has specifically approved it.',
                'Advance payment whenever an officer makes a personal request.',
            ],
        },
        'psr_app_012': {
            'options': [
                'Automatic reduction for good behaviour.',
                'Reduction by counting prior satisfactory public service in cognate posts.',
                "Reduction on the officer's personal request alone.",
                'Reduction on the ground of the officer being under thirty years of age.',
            ],
        },
        'psr_app_030': {
            'options': [
                'Absence of secondment effect on the ground of training-grade status.',
                'Secondment treatment for the duration of the training period.',
                'Secondment treatment only with written consent.',
                'Secondment treatment only for foreign training.',
            ],
        },
        'psr_app_047': {
            'options': [
                'Reduction by the Permanent Secretary acting alone in every case.',
                'Reduction by the Head of Service acting without reference to appointing authority.',
                'Reduction by the appointing authority subject to PSR conditions.',
                'No reduction on the ground of fixed probation in all cases.',
            ],
        },
        'psr_discipline_gen_011': {
            'options': [
                'Opportunity for officer response before decision.',
                'Bypassing of review and approval checkpoints.',
                'Preference for convenience over compliance requirements.',
                'Disregard of feedback after review.',
            ],
        },
        'psr_docx_021': {
            'options': [
                'Minimum score required for initial employment.',
                'Average score recorded in the examination.',
                'Score below which a candidate is deemed to have failed the promotion examination, with the current threshold at 60 percent.',
                'Highest score obtained in the examination.',
            ],
        },
        'psr_docx_088': {
            'options': [
                'Reasons for leaving the present job.',
                'Statement on any obligation to remain in the present employment.',
                'Current job title only.',
                'Name of employer only.',
            ],
        },
        'psr_docx_089': {
            'options': [
                'A full list of assets and liabilities.',
                'Declaration of freedom from financial embarrassment.',
                'The applicant\'s current credit score.',
                'Recent income tax returns.',
            ],
        },
        'psr_eth_029': {
            'options': [
                'Operation of the account with personal presidential approval.',
                'Operation of the account during official posting abroad.',
                'Operation of the account after retirement.',
                'Operation of the account on the basis of dual citizenship.',
            ],
        },
        'psr_leave_056': {
            'options': [
                'Exposure to a minor fine only.',
                'Prohibition on reproduction without express approval because of copyright protection.',
                'Requirement for verbal notification only.',
                'Encouragement for wider dissemination.',
            ],
        },
        'psr_leave_063': {
            'options': [
                'Refund at the end of the financial year.',
                'Refund as soon as due after completion of the necessary checks.',
                'Refund only with explicit approval of the Minister of Finance.',
                'Refund only when the deposit account has a sufficient balance.',
            ],
        },
        'psr_leave_073': {
            'options': [
                'Appointment upon mere consideration for promotion.',
                'Appointment where a duty post of not less than SGL 14 remains unattended because of the substantive holder\'s absence.',
                'Appointment only when a substantive post becomes permanently vacant.',
                'Appointment only for a very short period without reference to post level.',
            ],
        },
        'psr_med_040': {
            'options': [
                'Injury sustained during official duty or as its direct consequence.',
                'Injury sustained at home in any circumstance.',
                'Injury sustained while off duty.',
                'Injury to which negligence contributed.',
            ],
        },
        'psr_med_049': {
            'options': [
                'Treatment whenever the officer prefers foreign care.',
                'Treatment only where adequate facilities remain unavailable in Nigeria.',
                'Treatment whenever the officer can afford foreign hospitals.',
                'Treatment whenever a superior officer requests it.',
            ],
        },
        'psr_med_054': {
            'options': [
                'Officer familiarity with service rules, regulations, and laws.',
                'Testing of physical fitness only.',
                'Assessment of academic prowess alone.',
                'Identification of promotion candidates only.',
            ],
        },
        'psr_med_057': {
            'options': [
                'Transfer with the consent of the Accounting Officer or in special emergencies with reporting.',
                'Transfer never permitted.',
                'Transfer restricted to unused books only.',
                'Transfer at any time without approval.',
            ],
        },
        'psr_ret_051': {
            'options': [
                'Exemption because the examination applies to pensionable probationary appointments.',
                'Requirement triggered by a wish to convert to a pensionable appointment.',
                'Requirement triggered only where the contract makes provision for it.',
                'Requirement applying to all officers without exception.',
            ],
        },
        'psr_ret_053': {
            'options': [
                'Officers on pensionable appointment during probation.',
                'Only officers on GL 07 and above.',
                'Only officers on GL 06 and below.',
                'All officers in the Public Service.',
            ],
        },
        'psr_ret_057': {
            'options': [
                'Date of assumption of duty.',
                'Date of the offer of appointment.',
                'Date the officer signs the contract.',
                'Date of contract approval.',
            ],
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
    for path, rewrites in REWRITES.items():
        updated = update_file(path, rewrites)
        print(f'Updated {len(updated)} questions in {path.name}')
        for qid in updated:
            print(qid)
        total += len(updated)
    print(f'Total updated: {total}')


if __name__ == '__main__':
    main()
