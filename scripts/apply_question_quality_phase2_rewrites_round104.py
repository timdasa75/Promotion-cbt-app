#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'leadership_negotiation.json'
SUBS = {'lead_management_performance', 'lead_principles_styles', 'lead_strategic_management'}
UPDATES = {}


def opts(i, good, bad):
    out = list(bad)
    out.insert(i, good)
    return out


def add(qid, q, i, good, bad, exp, kw):
    UPDATES[qid] = {
        'question': q,
        'options': opts(i, good, bad),
        'explanation': exp,
        'keywords': kw,
    }


def add_many(specs, good, bad, exp, kw):
    for qid, i, q in specs:
        add(qid, q, i, good, bad, exp, kw)


BAD_PROCEDURE = [
    'Personal preference in procedure use.',
    'Bypassed review checkpoints.',
    'Convenience ahead of legal requirements.',
]
BAD_ACCOUNTABILITY = [
    'Unrecorded decisions under pressure.',
    'Convenience ahead of review duty.',
    'Inconsistent criteria across similar cases.',
]
BAD_RISK = [
    'Unreported exceptions in routine work.',
    'Convenience ahead of risk review.',
    'Personal preference in risk handling.',
]
BAD_WORKFLOW = [
    'Skipped workflow checks under pressure.',
    'Personal preference in workflow steps.',
    'Repeated non-compliance after feedback.',
]
BAD_ENGAGEMENT = [
    'Unrecorded commitments in sensitive matters.',
    'Convenience ahead of fair engagement.',
    'Personal preference in stakeholder handling.',
]
BAD_CHANGE = [
    'Abrupt reform without communication.',
    'Personal preference in implementation timing.',
    'Repeated non-compliance after feedback.',
]
BAD_ALIGNMENT = [
    'Activity without strategic priorities.',
    'Convenience ahead of planning discipline.',
    'Untracked work outside approved objectives.',
]
BAD_LEADERSHIP = [
    'Late reaction after avoidable escalation.',
    'Unclear expectations across similar cases.',
    'Convenience ahead of supervisory duty.',
]

# lead_management_performance generated tail
add_many([
    ('lead_management_performance_gen_001', 0, 'Which practice best strengthens governance in management and performance work?'),
    ('lead_management_performance_gen_025', 0, 'Which action best demonstrates governance discipline in management and performance work?'),
    ('lead_management_performance_gen_032', 0, 'A management-and-performance case requires formal governance handling. What should be done first?'),
    ('lead_management_performance_gen_039', 1, 'A compliance reviewer handling management and performance work must choose the first sound step. What is it?'),
],
'Approved procedure with complete records.', BAD_PROCEDURE,
'Governance in management and performance work is strongest when officers follow the approved procedure and keep the full record needed for review and accountability.',
['management_performance', 'governance', 'approved_procedure', 'complete_records'])
add_many([
    ('lead_management_performance_gen_003', 0, 'Which practice best supports risk management in management and performance work?'),
    ('lead_management_performance_gen_034', 0, 'When a supervisor reviews gaps in management and performance work, which step most directly strengthens risk management?'),
],
'Early escalation of material exceptions.', BAD_RISK,
'Risk management improves when material exceptions are identified early, escalated promptly, and tracked for follow-up.',
['management_performance', 'risk_management', 'material_exceptions', 'escalation'])
add('lead_management_performance_gen_015', 'Which practice best supports documented procedure in management and performance work?', 0,
    'Complete records under the approved procedure.', BAD_PROCEDURE,
    'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
    ['management_performance', 'documented_procedure', 'approved_process', 'complete_records'])
add('lead_management_performance_gen_017', 'Which action best demonstrates public accountability in management and performance work?', 0,
    'Traceable decisions with recorded reasons.', BAD_ACCOUNTABILITY,
    'Public accountability depends on decisions that can be traced to recorded reasons and supporting evidence.',
    ['management_performance', 'public_accountability', 'traceable_decisions', 'recorded_reasons'])
add('lead_management_performance_gen_019', 'Which practice best supports risk control in management and performance work?', 0,
    'Documented mitigation for identified risks.', BAD_RISK,
    'Risk control is stronger when identified risks are matched with documented mitigation and follow-up action.',
    ['management_performance', 'risk_control', 'documented_mitigation', 'follow_up'])
add('lead_management_performance_gen_021', 'Which practice best sustains operational discipline in management and performance work?', 0,
    'Approved workflow checks before closure.', BAD_WORKFLOW,
    'Operational discipline depends on completing approved workflow checks before a case is closed or advanced.',
    ['management_performance', 'operational_discipline', 'workflow_checks', 'case_closure'])
add('lead_management_performance_gen_029', 'Which practice best supports stakeholder engagement in management and performance work?', 0,
    'Principled engagement with documented commitments.', BAD_ENGAGEMENT,
    'Stakeholder engagement is stronger when discussions follow principled negotiation and the commitments reached are documented clearly.',
    ['management_performance', 'stakeholder_engagement', 'principled_engagement', 'documented_commitments'])
add('lead_management_performance_gen_031', 'Which practice best supports change management in management and performance work?', 0,
    'Sequenced reform with communication, training, and monitoring.', BAD_CHANGE,
    'Change management is strongest when reforms are sequenced and supported by communication, training, and monitoring.',
    ['management_performance', 'change_management', 'sequenced_reform', 'monitoring'])
add('lead_management_performance_gen_038', 'When management and performance work faces competing priorities, which action best preserves compliance and service quality?', 1,
    'Clear expectations with monitored outcomes and prompt correction.',
    ['Discretionary shortcuts under pressure.', 'Convenience ahead of approved process.', 'Bypassed review checkpoints.'],
    'Compliance and service quality are preserved when leaders set clear expectations, monitor outcomes, and correct deviations promptly.',
    ['management_performance', 'service_quality', 'monitored_outcomes', 'corrective_action'])

# lead_management_performance factual tail
add('leadership_mpf_009', 'In decision-making, what does bounded rationality describe?', 1,
    'Limits created by finite information and human judgment.',
    ['Perfect information and unlimited analysis.', 'Emotional decision-making without evidence.', 'Automatic compliance with every available option.'],
    'Bounded rationality means decision-makers work with limited information, limited time, and limited cognitive capacity rather than perfect conditions.',
    ['bounded_rationality', 'decision_making', 'limited_information', 'human_judgment'])
add('leadership_mpf_013', 'When an officer is seconded to another MDA, who should furnish the required performance reports?', 1,
    'The receiving MDA or office head.',
    ['The releasing MDA only.', 'The Head of the Civil Service of the Federation.', 'The Federal Civil Service Commission.'],
    'The receiving MDA or office, which supervises the officer during secondment, is responsible for furnishing the required performance reports.',
    ['secondment', 'performance_reports', 'receiving_mda', 'supervision'])
add('leadership_mpf_033', 'Under the PSR, an officer on an incremental grade level may be denied the normal increment when what condition exists?', 1,
    'A pending disciplinary action.',
    ['Completion of annual leave.', 'An application for retirement.', 'Service on secondment.'],
    'The normal increment may be withheld where a disciplinary action is pending, because the officer is no longer in the ordinary good-standing position for automatic progression.',
    ['psr', 'increment', 'disciplinary_action', 'grade_level'])
add('leadership_mpf_051', 'In file management, what is the purpose of ending a file note with "B.U."?', 3,
    'A future follow-up date on the matter.',
    ['A final decision on the matter.', 'Closure of the file permanently.', 'Authority to destroy the file.'],
    'A B.U. note signals that the matter should be brought up again on a specified future date for follow-up.',
    ['file_management', 'bring_up', 'follow_up_date', 'administrative_procedure'])
add('leadership_mpf_052', 'How is Category B training described in relation to an MDA\'s mandate?', 2,
    'Beneficial to the officer but not essential to the MDA\'s core mandate.',
    ['Compulsory for every promotion to GL 17.', 'Always funded because it is central to the mandate.', 'A requirement for political appointment.'],
    'Category B training benefits the officer but is not treated as crucial to the core mandate of the MDA in the way Category A training is.',
    ['training', 'category_b', 'mda_mandate', 'staff_development'])
add('leadership_mpf_053', 'When a management-and-performance matter requires formal documentation, which practice is best?', 1,
    'Follow the approved procedure and keep complete records.',
    ['Bypass review checkpoints to save time.', 'Convenience ahead of legal requirements.', 'Personal preference in procedure use.'],
    'Formal management-and-performance work should follow the approved procedure and leave a complete record for supervision and review.',
    ['management_performance', 'documented_procedure', 'complete_records', 'formal_documentation'])
add('leadership_mpf_054', 'Which approach best supports change management in performance-focused public-service work?', 1,
    'Sequenced reform with communication, training, and monitoring.',
    ['Repeated non-compliance after feedback.', 'Bypassed review checkpoints under pressure.', 'Personal preference in implementation timing.'],
    'Change management is stronger when reform is sequenced and supported by communication, training, and monitoring rather than abrupt improvisation.',
    ['management_performance', 'change_management', 'sequenced_reform', 'monitoring'])
add('leadership_mpf_067', 'Under the PSR, when may the normal increment of an officer on an incremental grade level be withheld?', 1,
    'When a disciplinary action is pending.',
    ['When annual leave has been completed.', 'When retirement has been requested.', 'When the officer is on secondment.'],
    'A pending disciplinary action is the relevant ground because the officer is not then in the ordinary position for automatic increment.',
    ['psr', 'increment', 'disciplinary_case', 'withholding_increment'])
add('leadership_mpf_069', 'When management and performance work requires formal governance handling, what should be done first?', 3,
    'Apply the approved procedure and keep complete records.',
    ['Convenience ahead of legal requirements.', 'Personal preference in procedure use.', 'Bypassed review checkpoints.'],
    'Formal governance handling should begin with the approved procedure and a complete record of each material step.',
    ['management_performance', 'governance', 'approved_procedure', 'complete_records'])
add('leadership_mpf_071', 'Which practice best reflects sound risk control in management and performance work?', 3,
    'Documented mitigation for identified risks.',
    ['Convenience ahead of risk review.', 'Repeated non-compliance after feedback.', 'Personal preference in risk handling.'],
    'Risk control is stronger when identified risks are matched with documented mitigation and follow-up action.',
    ['management_performance', 'risk_control', 'documented_mitigation', 'follow_up'])
add('leadership_mpf_073', 'Which practice best supports stakeholder engagement in management and performance work?', 3,
    'Principled engagement with documented commitments.',
    ['Convenience ahead of fair engagement.', 'Unrecorded commitments in sensitive matters.', 'Personal preference in stakeholder handling.'],
    'Stakeholder engagement is stronger when discussions are principled and the commitments reached are documented clearly.',
    ['management_performance', 'stakeholder_engagement', 'documented_commitments', 'principled_engagement'])
add('leadership_mpf_074', 'Which practice best sustains governance standards in management and performance work?', 3,
    'Approved procedure with complete records.',
    ['Convenience ahead of legal requirements.', 'Repeated non-compliance after feedback.', 'Bypassed review checkpoints.'],
    'Governance standards are sustained when officers apply the approved procedure and maintain the complete record needed for supervision and review.',
    ['management_performance', 'governance', 'approved_procedure', 'complete_records'])

# lead_principles_styles generated tail
add_many([
    ('lead_principles_styles_gen_001', 0, 'Which practice best strengthens governance in leadership practice?'),
    ('lead_principles_styles_gen_020', 0, 'Which action best demonstrates governance discipline in leadership practice?'),
    ('lead_principles_styles_gen_027', 1, 'A leadership-practice case requires formal governance handling. What should be done first?'),
],
'Approved leadership procedure with complete records.', BAD_PROCEDURE,
'Governance in leadership practice is stronger when the approved procedure is followed and the record needed for oversight is maintained.',
['leadership_practice', 'governance', 'approved_procedure', 'complete_records'])
add('lead_principles_styles_gen_004', 'Which practice best supports risk management in leadership practice?', 0,
    'Early escalation of material exceptions.', BAD_RISK,
    'Risk management in leadership practice improves when material exceptions are identified early and escalated promptly.',
    ['leadership_practice', 'risk_management', 'material_exceptions', 'escalation'])
add('lead_principles_styles_gen_010', 'Which practice best supports documented procedure in leadership practice?', 0,
    'Complete records under the approved procedure.', BAD_PROCEDURE,
    'Documented procedure in leadership practice depends on the approved process and a complete record of each material step.',
    ['leadership_practice', 'documented_procedure', 'approved_process', 'complete_records'])
add('lead_principles_styles_gen_012', 'Which action best demonstrates public accountability in leadership practice?', 0,
    'Traceable decisions with recorded reasons.', BAD_ACCOUNTABILITY,
    'Public accountability in leadership practice depends on decisions that can be traced to recorded reasons and supporting evidence.',
    ['leadership_practice', 'public_accountability', 'traceable_decisions', 'recorded_reasons'])
add('lead_principles_styles_gen_014', 'Which practice best supports risk control in leadership practice?', 0,
    'Documented mitigation for identified risks.', BAD_RISK,
    'Risk control is stronger when identified risks are matched with documented mitigation and follow-up action.',
    ['leadership_practice', 'risk_control', 'documented_mitigation', 'follow_up'])
add('lead_principles_styles_gen_016', 'Which practice best sustains operational discipline in leadership practice?', 0,
    'Approved workflow checks before closure.', BAD_WORKFLOW,
    'Operational discipline in leadership practice depends on completing approved workflow checks before a matter is closed or advanced.',
    ['leadership_practice', 'operational_discipline', 'workflow_checks', 'case_closure'])
add('lead_principles_styles_gen_024', 'Which practice best supports stakeholder engagement in leadership practice?', 0,
    'Principled engagement with documented commitments.', BAD_ENGAGEMENT,
    'Stakeholder engagement is stronger when leaders use principled engagement and document the commitments reached.',
    ['leadership_practice', 'stakeholder_engagement', 'documented_commitments', 'principled_engagement'])
add('lead_principles_styles_gen_026', 'Which practice best supports change management in leadership practice?', 0,
    'Sequenced reform with communication, training, and monitoring.', BAD_CHANGE,
    'Change management in leadership practice is strongest when reforms are sequenced and supported by communication, training, and monitoring.',
    ['leadership_practice', 'change_management', 'sequenced_reform', 'monitoring'])
add('lead_principles_styles_gen_028', 'When a leadership unit faces competing priorities, which action best preserves compliance and service quality?', 3,
    'Clear expectations with monitored outcomes and prompt correction.',
    ['Discretionary shortcuts under pressure.', 'Convenience ahead of approved process.', 'Bypassed review checkpoints.'],
    'Compliance and service quality are preserved when expectations are clear, outcomes are monitored, and deviations are corrected promptly.',
    ['leadership_practice', 'service_quality', 'monitored_outcomes', 'corrective_action'])

# lead_principles_styles factual tail
add('leadership_lsm_030', 'Why is succession planning important within an MDA?', 1,
    'Leadership continuity and development of a talent pipeline.',
    ['Mandatory retirement at age sixty.', 'Reduction in staff strength.', 'Compulsory promotion interviews.'],
    'Succession planning is intended to preserve leadership continuity and prepare capable successors for future responsibilities.',
    ['succession_planning', 'mda', 'leadership_continuity', 'talent_pipeline'])
add('leadership_lsm_034', 'What most clearly characterizes the charismatic leadership style?', 1,
    'Personal influence reinforced by an inspiring vision.',
    ['Strict rule enforcement as the only leadership tool.', 'Financial incentives as the main source of motivation.', 'Complex hierarchy as the main source of authority.'],
    'Charismatic leadership depends heavily on the leader\'s personal influence and the power of an inspiring vision to motivate followers.',
    ['charismatic_leadership', 'inspiring_vision', 'personal_influence', 'leadership_style'])
add('leadership_lsm_036', 'How does delegation of authority improve efficiency in the Civil Service Handbook sense?', 1,
    'Subordinate development with final responsibility retained above.',
    ['Complete transfer of responsibility to subordinates.', 'Full centralization of decision-making.', 'Removal of hierarchical supervision.'],
    'Delegation improves efficiency by developing subordinates and distributing work, while the higher officer still retains ultimate responsibility.',
    ['delegation_of_authority', 'civil_service_handbook', 'efficiency', 'ultimate_responsibility'])
add('leadership_lsm_039', 'What is the main role of the Head of the Civil Service of the Federation in HR and institutional reform?', 1,
    'Leadership of HR reform, capacity building, and service-wide policy.',
    ['Collection of non-oil revenue.', 'Management of defence strategy.', 'Approval of all capital projects.'],
    'The OHCSF provides leadership on HR reform, capacity building, and service-wide policy direction for improved service delivery.',
    ['ohcsf', 'hr_reform', 'capacity_building', 'service_policy'])
add('leadership_lsm_041', 'Under Rule 100201, what is the first disciplinary step for general inefficiency?', 1,
    'A query with warning and instruction to improve.',
    ['Immediate dismissal recommendation.', 'Transfer to a remote station.', 'Indefinite deferment of promotion.'],
    'The initial response is a query accompanied by warning and instruction, giving the officer an opportunity to improve usefulness.',
    ['general_inefficiency', 'rule_100201', 'query', 'disciplinary_step'])
add('leadership_lsm_048', 'What most clearly defines the pacesetting leadership style?', 0,
    'Very high performance standards with rapid delivery expectations.',
    ['Exclusive focus on relationship building.', 'Delayed action until consensus is universal.', 'Indifference to measurable targets.'],
    'Pacesetting leaders set very high standards and expect quick, disciplined performance from capable teams.',
    ['pacesetting', 'leadership_style', 'high_standards', 'rapid_delivery'])
add('leadership_lsm_050', 'Why is leadership resilience important during reform or resource pressure?', 1,
    'Stable guidance through prolonged stress or crisis.',
    ['Blaming external factors for failure.', 'Immediate resignation from office.', 'Routine transfer of work to consultants.'],
    'Leadership resilience helps a public institution remain stable and functional during prolonged stress, reform, or crisis.',
    ['leadership_resilience', 'reform', 'resource_constraints', 'stability'])
add('leadership_lsm_060', 'In file management, what does a "B.U." note indicate?', 1,
    'A specified date for future follow-up.',
    ['Authority to destroy the file.', 'Closure of the file permanently.', 'A final decision already taken.'],
    'A B.U. note means the matter should be brought up again on a specified date for follow-up.',
    ['file_management', 'bring_up', 'follow_up_date', 'administrative_procedure'])
add('leadership_lsm_061', 'Why should minutes be written and circulated soon after a meeting?', 1,
    'Accurate recall while the decisions are still fresh.',
    ['To make the meeting look more important.', 'To show the secretary writes quickly.', 'To stop members forgetting discussion details only.'],
    'Minutes should be circulated promptly so that the decisions and agreed actions are still fresh in members\' minds and can be confirmed accurately.',
    ['meeting_minutes', 'prompt_circulation', 'accurate_recall', 'administrative_procedure'])
add('leadership_lsm_066', 'What is the approved exception to the rule against removing a document from a file?', 0,
    'Correction of a grave error with proper approval.',
    ['Removal of a personal document for convenience.', 'Removal of an unneeded document.', 'Removal because an officer is in a hurry.'],
    'Documents are not removed from a file except in the approved exceptional case of correcting a grave error with proper authority.',
    ['file_management', 'document_removal', 'grave_error', 'proper_approval'])

# lead_strategic_management generated tail
add_many([
    ('lead_strategic_management_gen_001', 0, 'Which practice best strengthens governance in strategic management and planning?'),
    ('lead_strategic_management_gen_021', 0, 'Which action best demonstrates governance discipline in strategic management and planning?'),
    ('lead_strategic_management_gen_028', 2, 'A strategic-planning case requires formal governance handling. What should be done first?'),
],
'Approved planning procedure with complete records.', BAD_PROCEDURE,
'Governance in strategic management and planning is stronger when the approved planning procedure is followed and the record needed for oversight is maintained.',
['strategic_management', 'planning_governance', 'approved_procedure', 'complete_records'])
add('lead_strategic_management_gen_005', 'Which practice best supports risk management in strategic management and planning?', 0,
    'Early escalation of material exceptions.', BAD_RISK,
    'Risk management in strategic planning improves when material exceptions are identified early and escalated promptly.',
    ['strategic_management', 'risk_management', 'material_exceptions', 'escalation'])
add('lead_strategic_management_gen_009', 'When a ministry begins implementing a new strategic plan, which step best supports change management?', 0,
    'Sequenced reform with communication, training, and monitoring.', BAD_CHANGE,
    'Strategic change is better managed when implementation is sequenced and supported by communication, training, and monitoring.',
    ['strategic_management', 'change_management', 'strategic_plan', 'monitoring'])
add('lead_strategic_management_gen_011', 'Which practice best supports documented procedure in strategic management and planning?', 0,
    'Complete records under the approved procedure.', BAD_PROCEDURE,
    'Documented procedure in strategic planning depends on the approved process and a complete record of the steps taken.',
    ['strategic_management', 'documented_procedure', 'approved_process', 'complete_records'])
add('lead_strategic_management_gen_013', 'Which action best demonstrates public accountability in strategic management and planning?', 0,
    'Traceable decisions with recorded reasons.', BAD_ACCOUNTABILITY,
    'Public accountability in strategic management and planning depends on decisions that can be traced to recorded reasons and supporting evidence.',
    ['strategic_management', 'public_accountability', 'traceable_decisions', 'recorded_reasons'])
add('lead_strategic_management_gen_015', 'Which practice best supports risk control in strategic management and planning?', 0,
    'Documented mitigation for identified risks.', BAD_RISK,
    'Risk control is stronger when identified risks are matched with documented mitigation and follow-up action.',
    ['strategic_management', 'risk_control', 'documented_mitigation', 'follow_up'])
add('lead_strategic_management_gen_017', 'Which practice best sustains operational discipline in strategic management and planning?', 0,
    'Approved workflow checks before closure.', BAD_WORKFLOW,
    'Operational discipline in strategic planning depends on completing approved workflow checks before a matter is closed or advanced.',
    ['strategic_management', 'operational_discipline', 'workflow_checks', 'case_closure'])
add('lead_strategic_management_gen_025', 'Which practice best supports stakeholder engagement in strategic management and planning?', 0,
    'Principled engagement with documented commitments.', BAD_ENGAGEMENT,
    'Stakeholder engagement is stronger when planning discussions are principled and the commitments reached are documented clearly.',
    ['strategic_management', 'stakeholder_engagement', 'documented_commitments', 'principled_engagement'])
add('lead_strategic_management_gen_027', 'Which practice best supports change management in strategic management and planning?', 0,
    'Sequenced reform with communication, training, and monitoring.', BAD_CHANGE,
    'Change management in strategic planning is strongest when reforms are sequenced and supported by communication, training, and monitoring.',
    ['strategic_management', 'change_management', 'sequenced_reform', 'monitoring'])

# lead_strategic_management factual tail
add('leadership_smp_008', 'What is the usual summary output of strategic analysis for high-level decision-makers?', 1,
    'A SWOT summary.',
    ['A performance report.', 'A budget forecast.', 'A job description.'],
    'Strategic analysis is commonly summarized as a SWOT statement highlighting strengths, weaknesses, opportunities, and threats for decision-makers.',
    ['strategic_analysis', 'swot', 'decision_support', 'planning'])
add('leadership_smp_018', 'What is the main strategic objective of the Treasury Single Account system?', 1,
    'Consolidated visibility and control of government cash flows.',
    ['Decentralized financial control for each office.', 'Faster processing of personal staff loans.', 'Replacement of IPPIS by a new payroll platform.'],
    'The TSA consolidates government revenues and expenditures into a single account structure so that public cash resources are visible and controlled.',
    ['tsa', 'cash_management', 'visibility', 'financial_control'])
add('leadership_smp_027', 'What is the strategic aim of linking staff records to NIN and biometrics?', 1,
    'Greater accuracy and integrity in personnel records.',
    ['Slower payroll processing for tighter scrutiny.', 'Simpler foreign-exchange transactions.', 'Fewer promotions across the service.'],
    'Digital identity integration strengthens the accuracy and integrity of personnel records and reduces identity-related error or abuse.',
    ['digital_identity', 'personnel_records', 'accuracy', 'integrity'])
add('leadership_smp_028', 'Why should leaders use big data analytics in strategic projects?', 1,
    'Evidence-based analysis of large public datasets.',
    ['Replacement of human judgment entirely.', 'Manual verification of payment vouchers.', 'Routine enforcement of disciplinary action.'],
    'Big data analytics helps leaders process large datasets and draw evidence-based insights for strategic decision-making.',
    ['big_data_analytics', 'strategic_projects', 'evidence_based_decision', 'public_data'])
add('leadership_smp_048', 'What is the National e-Government Master Plan mainly intended to guide MDAs on?', 1,
    'Automation of services, secure cloud use, and inter-agency data sharing.',
    ['Expansion of manual recordkeeping.', 'Reduction of staff training budgets.', 'Centralization of disciplinary authority.'],
    'The National e-Government Master Plan guides MDAs on digital service delivery, secure infrastructure, and coordinated data exchange.',
    ['e_government_master_plan', 'digital_services', 'secure_cloud', 'data_sharing'])
add('leadership_smp_061', 'Why should a departmental dishonoured-cheques register be maintained?', 0,
    'To ensure clearances are pursued and recoveries effected.',
    ['To log all incoming and outgoing cheques.', 'To track routine bank charges.', 'To summarise daily bank transactions.'],
    'The register exists so dishonoured cheques are followed up, clearances are pursued, and recoveries are effected where necessary.',
    ['dishonoured_cheques', 'clearance_follow_up', 'recoveries', 'financial_control'])
add('leadership_smp_075', 'When is a draft regarded as good and approved in official work?', 0,
    'When it serves the prescribed objective.',
    ['When it uses complex vocabulary.', 'When it is lengthy.', 'When it is written very quickly.'],
    'A draft is judged by whether it serves the purpose for which it is prepared, not by length, speed, or display of vocabulary.',
    ['official_draft', 'prescribed_objective', 'official_work', 'administrative_writing'])


data = json.loads(TARGET.read_text(encoding='utf-8'))
updated = 0
for sub in data.get('subcategories', []):
    if sub.get('id') not in SUBS:
        continue
    for q in sub.get('questions', []):
        payload = UPDATES.get(q.get('id'))
        if payload:
            q.update(payload)
            updated += 1

TARGET.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'Applied round 104 rewrites to {updated} questions')
