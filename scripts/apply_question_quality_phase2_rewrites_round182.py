from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'civil_service_ethics.json': {
        'csh_ap_155': {
            'question': 'What best supports an official case file during review?',
            'options': [
                'Keeping movement entries current and traceable at each control point.',
                'Applying rules inconsistently.',
                'Bypassing review controls.',
                'Leaving updates until the case is closed.',
            ],
            'correct': 0,
            'explanation': 'An official case file should stay current and traceable at each control point so reviewers can follow every movement without gaps.',
        },
        'csh_ap_217': {
            'question': 'What practice best keeps an objectives-and-institutions file easy to review?',
            'options': [
                'Keeping the file indexed and current at each control point.',
                'Applying rules inconsistently.',
                'Bypassing review controls.',
                'Prioritizing convenience over compliance.',
            ],
            'correct': 0,
            'explanation': 'An objectives-and-institutions file is easiest to review when it stays indexed, current, and updated at each control point for quick tracing.',
        },
        'csh_ap_228': {
            'question': 'What does an audit trail establish in record keeping?',
            'options': [
                'Traceability and accountability.',
                'Automatic approval of all payments.',
                'Budget expansion without controls.',
                'Removal of all record-keeping duties.',
            ],
            'correct': 0,
            'explanation': 'An audit trail helps establish traceability and accountability by showing what was done, when it was done, and by whom.',
        },
        'csh_disc_062': {
            'question': 'What should be done when a file will need further action later?',
            'options': [
                'Place it on a bring-up pad and return it through registry channels.',
                'Discard it because it is not needed immediately.',
                'Keep it permanently in a desk drawer.',
                'Pass it to a colleague without recording the transfer.',
            ],
            'correct': 0,
            'explanation': 'A file that will require later action should be placed on a bring-up pad for the relevant date and returned through the proper registry process.',
        },
        'csh_discipline_conduct_gen_007': {
            'question': 'Which practice best sustains discipline and conduct standards in a public-service unit?',
            'options': [
                'Applying approved conduct controls consistently.',
                'Applying rules selectively for convenience.',
                'Bypassing known controls to save time.',
                'Using informal practice instead of approved process.',
            ],
            'correct': 0,
            'explanation': 'Discipline and conduct standards are sustained when officers apply approved controls consistently instead of relying on informal discretion.',
        },
        'csh_discipline_conduct_gen_015': {
            'question': 'Which routine best sustains operational discipline in a unit that handles sensitive official work?',
            'options': [
                'Completing approved workflow checks before closure.',
                'Skipping workflow checks under pressure.',
                'Using personal preference in workflow steps.',
                'Continuing non-compliance after feedback.',
            ],
            'correct': 0,
            'explanation': 'Operational discipline depends on completing approved workflow checks before a matter is closed or advanced.',
        },
        'csh_discipline_conduct_gen_025': {
            'question': 'Which practice best sustains discipline and conduct in daily official work?',
            'options': [
                'Complying consistently with approved conduct standards.',
                'Applying rules selectively for convenience.',
                'Bypassing known controls to save time.',
                'Using informal practice instead of approved process.',
            ],
            'correct': 0,
            'explanation': 'Daily discipline and conduct depend on consistent compliance with approved standards rather than convenience or informal shortcuts.',
        },
        'csh_duty_058': {
            'question': "What is the Chief Executive's key duty to the Board?",
            'options': [
                'Implementing Board decisions and policies.',
                'Reporting only to the supervising Minister.',
                'Refusing decisions that are personally disliked.',
                'Managing the Board\'s personal affairs.',
            ],
            'correct': 0,
            'explanation': 'The Chief Executive is accountable to the Board for implementing its approved decisions and policies.',
        },
        'csh_duty_064': {
            'question': 'What remains true after a Board of Survey finding for the officer in charge?',
            'options': [
                'The officer remains accountable for discrepancies until they are resolved.',
                'Automatic dismissal if a shortage is found.',
                'Immediate discharge of accountability once the finding is made.',
                'No consequence at all for the officer.',
            ],
            'correct': 0,
            'explanation': 'The officer in charge remains accountable for discrepancies disclosed by the Board of Survey until the matter is satisfactorily resolved.',
        },
        'csh_duty_068': {
            'question': 'What fiscal rule applies under the Fiscal Responsibility framework?',
            'options': [
                'Total expenditure must not exceed total revenue.',
                'Total revenue must always exceed expenditure by a fixed margin.',
                'Revenue is irrelevant to expenditure decisions.',
                'Expenditure may exceed revenue whenever grants are expected.',
            ],
            'correct': 0,
            'explanation': 'A core fiscal-responsibility rule is that total expenditure should not exceed total revenue.',
        },
        'csh_duty_070': {
            'question': 'What should a civil servant who has served for a very long time in one ministry avoid?',
            'options': [
                'Assuming personal experience alone is enough.',
                'Sharing institutional knowledge.',
                'Giving advice to the Minister.',
                'Offering useful suggestions for improvement.',
            ],
            'correct': 0,
            'explanation': 'Long service should not lead an officer to assume experience alone is sufficient, because institutional learning still requires openness and discipline.',
        },
        'csh_innovation_technology_gen_007': {
            'question': 'Which practice best sustains discipline in the use of public-service technology systems?',
            'options': [
                'Consistent compliance with approved use and review controls.',
                'Selective rule application for convenience.',
                'Bypassing known controls to save time.',
                'Informal practice instead of approved process.',
            ],
            'correct': 0,
            'explanation': 'Discipline in technology use depends on consistent compliance with approved controls instead of shortcuts or informal practice.',
        },
        'csh_innovation_technology_gen_025': {
            'question': 'Which practice best sustains conduct standards in the use of public-service technology systems?',
            'options': [
                'Consistent compliance with approved conduct controls.',
                'Selective rule application for convenience.',
                'Bypassing known controls to save time.',
                'Informal practice instead of approved process.',
            ],
            'correct': 0,
            'explanation': 'Conduct standards are sustained when officers apply the approved controls consistently instead of treating system use as an area for informal discretion.',
        },
        'csh_it_024': {
            'question': 'What is a zero-day vulnerability in cybersecurity?',
            'options': [
                'An unknown vulnerability for which no vendor fix is yet available.',
                'A fully patched and secured system.',
                'A routine software update released by the vendor.',
                'A scheduled penetration test for network security.',
            ],
            'correct': 0,
            'explanation': 'A zero-day vulnerability is an unknown security flaw for which no vendor patch is yet available, so it can be exploited before defenders can respond.',
        },
        'csh_it_057': {
            'question': 'Under Financial Regulation 125, what remains with a Revenue Collector after duty is delegated?',
            'options': [
                'Pecuniary responsibility for the delegated duty.',
                'Only the right to delegate the same task again.',
                'Freedom from accountability once the instruction is written.',
                'Responsibility only when the substitute is not also a collector.',
            ],
            'correct': 0,
            'explanation': 'Delegation does not remove a Revenue Collector\'s pecuniary responsibility; the officer remains accountable for the duty entrusted to another person.',
        },
        'csh_it_061': {
            'question': 'What may happen when an Accounting Officer fails to comply with the Financial Regulations?',
            'options': [
                'Disciplinary action and possible surcharge.',
                'A verbal warning only.',
                'Automatic loss of self-accounting status.',
                'No consequence because the unit is self-accounting.',
            ],
            'correct': 0,
            'explanation': 'Failure to comply with the Financial Regulations may attract disciplinary action and surcharge, even where the unit operates as self-accounting.',
        },
        'csh_it_068': {
            'question': 'What remains the chief accountability of federal employees even when union activities exist?',
            'options': [
                'Discharging assigned duties to the public efficiently and on time.',
                'Ensuring union executives are posted to preferred locations.',
                'Attending every union meeting as a condition of service.',
                'Reporting directly to the Head of Service on union affairs.',
            ],
            'correct': 0,
            'explanation': 'Whatever union activities exist, federal employees remain chiefly accountable for the timely and efficient discharge of their assigned public duties.',
        },
        'csh_it_073': {
            'question': 'Why is it dangerous for a civil servant to accept gifts from contractors or business people?',
            'options': [
                'It can compromise official integrity and create conflict of interest.',
                'It is simply an act of kindness in official business.',
                'It is a normal feature of contractor relations.',
                'It is a reliable way to build workplace relationships.',
            ],
            'correct': 0,
            'explanation': 'Accepting gifts from contractors or business people can compromise a civil servant\'s integrity and create a conflict between official duty and private influence.',
        },
        'csh_principle_024': {
            'question': 'How should public resources be used according to the Civil Service Handbook?',
            'options': [
                'Responsibly and strictly for official purposes.',
                'For personal benefit where rank permits.',
                'For family and private development projects.',
                'For informal sharing once duties are complete.',
            ],
            'correct': 0,
            'explanation': 'Public resources must be used responsibly and strictly for official purposes so accountability can be maintained.',
        },
        'csh_principle_064': {
            'question': 'What should a civil servant do after detecting financial abuse in the public service?',
            'options': [
                'Report it through the proper official reporting channel.',
                'Ignore it because it is not a personal duty.',
                'Wait for a superior to discover it first.',
                'Report it informally to a friend or colleague.',
            ],
            'correct': 0,
            'explanation': 'Financial abuse should be reported through the proper official channel so it can be investigated and addressed under the right procedure.',
        },
        'csh_principle_069': {
            'question': 'What should the secretary secure after a meeting closes?',
            'options': [
                'Minutes circulation and completion of agreed follow-up actions.',
                'Immediate closure of the record without further action.',
                'Transfer of all responsibility to meeting participants.',
                'No further attention once attendance is recorded.',
            ],
            'correct': 0,
            'explanation': 'After a meeting, the secretary should ensure that the minutes are written and circulated and that agreed follow-up actions are tracked to completion.',
        },
        'csh_principle_071': {
            'question': 'What is the Accountant-General chiefly accountable for regarding accounting systems?',
            'options': [
                'Providing adequate accounting systems and controls across government.',
                'Formulating national economic policy.',
                'Personally managing every public transaction.',
                'Auditing all public accounts personally each year.',
            ],
            'correct': 0,
            'explanation': 'The Accountant-General is chiefly accountable for ensuring that adequate accounting systems and controls exist across the arms of government.',
        },
        'csh_principle_072': {
            'question': 'Does delegation remove accountability?',
            'options': [
                'No, accountability remains with the delegating officer.',
                'Yes, once the delegation is in writing.',
                'Yes, where the subordinate accepts the task.',
                'Only where the delegated duty concerns revenue.',
            ],
            'correct': 0,
            'explanation': 'Delegation may transfer performance of the task, but it does not remove the delegating officer\'s accountability for the result.',
        },
        'csh_principle_075': {
            'question': 'What does delegation not remove from a Revenue Collector?',
            'options': [
                'Pecuniary responsibility for the delegated duty.',
                'The obligation to report only after loss occurs.',
                'The duty only when delegation is written.',
                'The role only where the delegate is also a collector.',
            ],
            'correct': 0,
            'explanation': 'Delegation does not remove the Revenue Collector\'s pecuniary responsibility for the duty entrusted to another person.',
        },
        'csh_principles_ethics_gen_014': {
            'question': 'Which risk-control practice best supports civil service principles and ethics administration?',
            'options': [
                'Applying controls and documenting the mitigation used.',
                'Preferring convenience over control requirements.',
                'Ignoring feedback after compliance gaps are found.',
                'Relying on personal preference in control use.',
            ],
            'correct': 0,
            'explanation': 'Risk control is stronger when controls are applied and the mitigation used is documented for later review.',
        },
        'csh_pt_051': {
            'question': 'What is the purpose of a handing-over note?',
            'options': [
                'Documenting the projects, files, and responsibilities for the successor.',
                'Explaining why an officer is leaving the Service.',
                'Recording the personal assets of the outgoing officer.',
                'Listing all money spent by the outgoing officer.',
            ],
            'correct': 0,
            'explanation': 'A handing-over note helps continuity by setting out the projects, files, and responsibilities that the successor needs to take over properly.',
        },
        'csh_pt_061': {
            'question': 'What does interdiction mean in disciplinary procedure?',
            'options': [
                'Temporary removal from normal duties while dismissal proceedings are pursued.',
                'A temporary promotion.',
                'A form of leave without payment only.',
                'A permanent dismissal from service.',
            ],
            'correct': 0,
            'explanation': 'Interdiction is the temporary removal of an officer from normal duties while disciplinary proceedings that may lead to dismissal are under way.',
        },
        'csh_pt_070': {
            'question': 'What should a civil servant do after detecting financial abuse?',
            'options': [
                'Report it through the proper official channel.',
                'Report it to a friend or colleague.',
                'Wait for a superior to discover it first.',
                'Ignore it because it is not a personal duty.',
            ],
            'correct': 0,
            'explanation': 'Financial abuse should be reported through the proper official channel so that it can be investigated and addressed under the right procedure.',
        },
        'ethics_050': {
            'question': 'Which type of misconduct involves deliberate misrepresentation of facts?',
            'options': [
                'Falsehood.',
                'Conflict of interest.',
                'Bribery.',
                'Favoritism.',
            ],
            'correct': 0,
            'explanation': 'Falsehood is deliberate misrepresentation of facts and is treated as misconduct.',
        },
    },
    ROOT / 'data' / 'psr_rules.json': {
        'circ_leave_welfare_allowances_gen_005': {
            'question': 'What is the best first step when an officer alleges an allowance overpayment?',
            'options': [
                'Open a documented case and verify the facts.',
                'Ignore the complaint until the next circular is issued.',
                'Close the matter as soon as it is reported.',
                'Handle it only through informal discussion.',
            ],
            'correct': 0,
            'explanation': 'An overpayment allegation should start with a documented case and fact verification.',
        },
        'circ_leave_welfare_allowances_gen_020': {
            'question': 'What control should come before approving a welfare or allowance payment?',
            'options': [
                'Confirm entitlement and supporting records.',
                'Approve first and verify later.',
                'Rely on a verbal instruction alone.',
                'Treat every claim as automatically valid.',
            ],
            'correct': 0,
            'explanation': 'Entitlement and supporting records should be confirmed before payment so allowances are not paid without authority.',
        },
        'circ_leave_welfare_allowances_gen_023': {
            'question': 'What should disciplinary review of a leave, welfare, or allowance case preserve?',
            'options': [
                'A clear appeal trail and independently checkable records.',
                'Only the final sanction notice.',
                'Private notes that cannot be checked later.',
                'A quick closure with no written trail.',
            ],
            'correct': 0,
            'explanation': 'Disciplinary review should preserve an appeal trail and independently checkable records.',
        },
        'circ_leave_welfare_allowances_gen_028': {
            'question': 'What should compliance review of recurring leave or allowance claims check first?',
            'options': [
                'Whether each claim matches the approved circulars and entitlement list.',
                'Whether the claimant is the loudest in the office.',
                'Whether the file can be closed immediately.',
                'Whether the claim can be paid before checking the rules.',
            ],
            'correct': 0,
            'explanation': 'Compliance review should first check the claim against approved circulars and the entitlement list.',
        },
    },
    ROOT / 'data' / 'public_procurement.json': {
        'proc_bidding_evaluation_gen_007': {
            'question': 'Which practice best supports procurement ethics in bidding, evaluation, and award?',
            'options': [
                'Guarding against collusion, favoritism, and conflicts of interest.',
                'Ignoring feedback.',
                'Inconsistent rule application.',
                'Bypassing review controls.',
            ],
            'correct': 0,
            'explanation': 'Ethical procurement depends on stopping collusion, favoritism, and conflicts of interest.',
        },
        'proc_bidding_evaluation_gen_011': {
            'question': 'Which action best demonstrates public accountability in bidding, evaluation, and award?',
            'options': [
                'Providing traceable decisions with evidence-based justification.',
                'Bypassing review controls.',
                'Convenience over compliance.',
                'Ignoring feedback.',
            ],
            'correct': 0,
            'explanation': 'Accountability depends on traceable decisions and reasons that can be checked later.',
        },
        'proc_bidding_evaluation_gen_019': {
            'question': 'Which action best demonstrates bidding, evaluation, and award governance?',
            'options': [
                'Maintaining an auditable trail for every decision.',
                'Bypassing review controls.',
                'Convenience over compliance.',
                'Ignoring feedback.',
            ],
            'correct': 0,
            'explanation': 'A governance trail shows how each decision was made and recorded.',
        },
        'proc_bidding_evaluation_gen_025': {
            'question': 'Which practice best sustains procurement ethics in bidding, evaluation, and award?',
            'options': [
                'Disclosing conflicts of interest and maintaining an impartial process.',
                'Inconsistent rule application.',
                'Bypassing review controls.',
                'Convenience over compliance.',
            ],
            'correct': 0,
            'explanation': 'Ethics are protected when conflicts are disclosed and the process remains impartial.',
        },
        'proc_objectives_institutions_gen_001': {
            'question': 'Which action best demonstrates sound objectives and institutions governance?',
            'options': [
                'Keeping approved procedures in force and maintaining complete records.',
                'Applying rules inconsistently.',
                'Bypassing review controls.',
                'Prioritizing convenience over compliance.',
            ],
            'correct': 0,
            'explanation': 'Sound governance depends on approved procedures and complete records.',
        },
        'proc_objectives_institutions_gen_007': {
            'question': 'Which practice best supports procurement ethics in objectives and institutions work?',
            'options': [
                'Preventing collusion, favoritism, and conflicts of interest in consultant selection.',
                'Ignoring feedback.',
                'Applying rules inconsistently.',
                'Bypassing review controls.',
            ],
            'correct': 0,
            'explanation': 'Ethical practice requires preventing collusion, favoritism, and conflicts of interest.',
        },
        'proc_objectives_institutions_gen_009': {
            'question': 'Which practice best supports documented procedure in objectives and institutions work?',
            'options': [
                'Recording each decision step and preserving file evidence.',
                'Applying rules inconsistently.',
                'Bypassing review controls.',
                'Prioritizing convenience over compliance.',
            ],
            'correct': 0,
            'explanation': 'Documented procedure requires each decision step to be recorded and preserved so the process can be checked later.',
        },
        'proc_objectives_institutions_gen_011': {
            'question': 'Which action best demonstrates public accountability in objectives and institutions work?',
            'options': [
                'Providing traceable decisions with evidence-based justification.',
                'Bypassing review controls.',
                'Prioritizing convenience over compliance.',
                'Ignoring feedback.',
            ],
            'correct': 0,
            'explanation': 'Accountability depends on traceable decisions and reasons that can be checked later.',
        },
        'proc_transparency_ethics_gen_026': {
            'question': 'A unit handling transparency, ethics, and accountability receives a case with competing priorities. Which action best preserves compliance and service quality?',
            'options': [
                'Applying published criteria consistently and keeping complete evaluation records.',
                'Bypassing review checkpoints where timelines are tight.',
                'Prioritizing convenience over approved process requirements.',
                'Applying discretionary shortcuts to accelerate closure regardless of controls.',
            ],
            'correct': 0,
            'explanation': 'Published criteria and complete records keep the process compliant, traceable, and serviceable.',
        },
        'ppa_elb_063': {
            'question': 'Which practice best protects procurement ethics in eligibility and consultant selection?',
            'options': [
                'Preventing collusion, favoritism, and conflicts of interest in consultant selection.',
                'Ignoring feedback and continuing non-compliant procedures.',
                'Applying rules inconsistently based on personal preference.',
                'Bypassing review and approval controls to save time.',
            ],
            'correct': 0,
            'explanation': 'Procurement ethics are protected when collusion, favoritism, and conflicts of interest are prevented during consultant selection.',
        },
        'ppa_ims_051': {
            'question': 'What is the objective of the Principle of Impartiality as it relates to members of the public?',
            'options': [
                'Ensuring everyone is treated equally and fairly, regardless of background.',
                'Giving officials priority over ordinary citizens.',
                'Letting civil servants treat people differently based on political views.',
                'Allowing arbitrary exceptions whenever discretion is convenient.',
            ],
            'correct': 0,
            'explanation': 'Impartiality means equal treatment and fairness for the public, without bias or special preference.',
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
