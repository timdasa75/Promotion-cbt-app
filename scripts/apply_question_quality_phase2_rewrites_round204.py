from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / "data" / "leadership_negotiation.json": {
        "NLR_L_031": {
            "question": "Which official is primarily empowered to declare and mediate a trade dispute under Nigerian labour law?",
            "explanation": "Under Nigerian labour law, the Minister of Labour and Employment plays the central statutory role in declaring trade disputes and initiating mediation steps to resolve them.",
        },
        "NLR_L_035": {
            "question": "What function was the Industrial Arbitration Panel (IAP) established to perform?",
            "explanation": "The Industrial Arbitration Panel exists to arbitrate or adjudicate trade disputes that the Minister refers to it, rather than to register unions or supervise elections.",
        },
        "NLR_L_038": {
            "explanation": "Tripartism in industrial relations means structured cooperation among government, employers, and workers, which is the standard ILO model for labour dialogue.",
        },
        "NLR_L_039": {
            "question": "Which principle underpins fair labour practices under the ILO framework?",
            "explanation": "Freedom of association is foundational because it allows workers to organize and bargain collectively, which is central to fair labour relations under the ILO framework.",
        },
        "NLR_P_003": {
            "explanation": "Successful industrial negotiation aims at industrial harmony because both sides leave with workable terms that reduce conflict and support continued cooperation.",
        },
        "NLR_P_005": {
            "explanation": "An MoU is used to capture and formalize the terms reached during negotiation so the parties have a written reference for implementation and follow-up.",
        },
        "NLR_P_008": {
            "question": "Which of the following is a non-monetary issue commonly negotiated in the civil service?",
            "explanation": "Promotion criteria are non-monetary because they concern career progression and standards, unlike salary review or allowances, which are financial issues.",
        },
        "NLR_P_010": {
            "explanation": "Labour-Management Cooperation is about partnership and constructive dialogue, helping both sides solve problems without escalating conflict unnecessarily.",
        },
        "NLR_P_012": {
            "question": "Effective labour relations contribute directly to which organizational outcome?",
            "explanation": "Healthy labour relations improve morale and productivity because staff and management can work through issues cooperatively instead of drifting into distrust or unrest.",
        },
        "NLR_S_020": {
            "question": "Which official typically leads the Government Side delegation during National Council negotiations?",
            "explanation": "The Head of the Civil Service of the Federation typically leads the Government Side because that office coordinates senior civil-service policy and representation at that level.",
        },
        "NLR_S_025": {
            "question": "Which level of the NPSNC structure ensures nationally agreed terms are implemented in individual ministries?",
            "explanation": "Departmental Councils handle implementation on the ground in ministries, translating national agreements into actual workplace practice.",
        },
        "leadership_lsm_015": {
            "question": "Integrity and accountability are emphasized as essential for which civil-service cadre?",
            "explanation": "The handbook stresses integrity and accountability especially for leadership cadres because senior officers set standards, make decisions, and control resources on behalf of the service.",
        },
        "leadership_lsm_059": {
            "question": "Which statement correctly defines the role of a minute or memo?",
            "explanation": "A minute or memo is a written submission used to present a view, recommendation, or position on an issue within official administrative communication.",
        },
        "leadership_mpf_063": {
            "question": "What is the maximum duration of study leave with pay that may be granted to a confirmed officer?",
            "explanation": "The maximum duration is two years, which sets the outer limit for study leave with pay granted to a confirmed officer under the applicable service rules.",
        },
        "leadership_smp_010": {
            "question": "What does a mission statement primarily describe?",
            "explanation": "A mission statement explains the organization's current purpose, core operations, and scope, whereas a vision statement focuses on future aspiration.",
        },
        "leadership_smp_012": {
            "explanation": "Strategic foresight helps leaders anticipate future scenarios and risks early enough to plan for them instead of reacting only after problems have matured.",
        },
        "leadership_smp_019": {
            "question": "Which strategic approach helps ensure continuous service delivery during staff transfers?",
            "explanation": "Proper handover and record-keeping preserve continuity because incoming officers can pick up responsibilities with an accurate account of pending work and decisions.",
        },
        "leadership_smp_020": {
            "explanation": "An MDA's mission statement defines its present purpose and operational scope, which is why it serves as a foundation for day-to-day strategic decisions.",
        },
        "leadership_smp_040": {
            "explanation": "The Contingencies Fund exists to cover urgent and unforeseen government expenditure, not routine overheads or ordinary planned spending.",
        },
        "leadership_smp_043": {
            "question": "Which ICT platform primarily facilitates TSA implementation for consolidating government revenue?",
            "explanation": "GIFMIS provides the government-wide financial management platform that supports Treasury Single Account operations and consolidated revenue control.",
        },
        "neg_dispute_law_gen_063": {
            "question": "During routine dispute-resolution and labour-law operations, which approach most strongly supports accountable implementation?",
            "explanation": "Accountable implementation requires leaders to set clear expectations, monitor outcomes, and correct deviations promptly so the process stays reviewable and fair.",
        },
        "neg_dispute_law_gen_065": {
            "question": "When decisions are made in dispute-resolution and labour-law work, which step most directly improves traceability and fairness?",
            "explanation": "Traceability and fairness improve when leaders define expectations, monitor outcomes, and respond to deviations instead of letting cases drift without supervision.",
        },
        "neg_dispute_law_gen_066": {
            "question": "Which practice should an officer prioritize to sustain stakeholder negotiation in dispute-resolution and labour-law work?",
            "explanation": "Principled negotiation with documented commitments supports stakeholder negotiation because it keeps the process fair, transparent, and easier to implement afterward.",
        },
        "neg_dispute_law_gen_071": {
            "question": "During routine dispute-resolution and labour-law operations, which approach most strongly supports accountable implementation?",
            "explanation": "The accountable approach is to set clear expectations, monitor outcomes, and correct deviations promptly so performance can be checked against agreed standards.",
        },
        "neg_dispute_law_gen_073": {
            "question": "What is the procedure in which a neutral third party helps disputing parties reach a voluntary agreement?",
            "explanation": "Mediation fits because the neutral third party helps the parties reach their own voluntary agreement rather than imposing a binding decision.",
        },
        "neg_dispute_law_gen_074": {
            "question": "Which option most strongly aligns with good public-service practice on performance standards within dispute-resolution and labour-law work?",
            "explanation": "Performance standards are strongest when officers set measurable targets, monitor progress, and correct deviations instead of waiting for failure or avoiding records.",
        },
        "neg_dispute_law_gen_087": {
            "question": "When handling dispute-resolution and labour-law work, which choice reflects proper decision-transparency standards?",
            "explanation": "Decision transparency depends on using clear criteria and communicating decisions promptly so affected parties can understand the basis of the outcome.",
        },
        "neg_principles_outcomes_gen_068": {
            "question": "Effective labour relations contribute directly to which organizational outcome?",
            "explanation": "Enhanced productivity and morale are the direct result because stable labour relations reduce friction and improve cooperation across the organization.",
        },
        "neg_principles_outcomes_gen_079": {
            "question": "Which choice reflects proper public-accountability standards in negotiation principles and outcomes work?",
            "explanation": "Public accountability is strengthened when decisions are traceable and backed by evidence, allowing others to review both the process and the justification.",
        },
        "neg_principles_outcomes_gen_083": {
            "question": "Which choice reflects proper decision-transparency standards in negotiation principles and outcomes work?",
            "explanation": "Decision transparency requires clear criteria and prompt communication so the parties can see how and why the decision was reached.",
        },
        "neg_structure_bodies_gen_070": {
            "question": "Which option best aligns with negotiating-structures compliance standards while preserving records for audit and oversight?",
            "explanation": "Compliance is strongest when lawful criteria are used and each decision step is documented transparently, leaving a record that audit and oversight bodies can review.",
        },
        "neg_structure_bodies_gen_071": {
            "question": "For effective negotiating structures and bodies, what approach best secures compliance?",
            "explanation": "Using lawful criteria and documenting each decision step transparently keeps the process compliant and defensible instead of leaving it to improvisation.",
        },
        "neg_structure_bodies_gen_078": {
            "question": "For effective negotiating structures and bodies, what approach best secures governance?",
            "explanation": "Governance is strongest when approved procedures are followed and complete records are kept, because those records support oversight and consistency.",
        },
        "neg_structure_bodies_gen_081": {
            "question": "During routine negotiating-structures operations, which approach best secures performance standards while maintaining fairness and legal compliance?",
            "explanation": "Setting measurable targets, monitoring progress, and correcting deviations is the strongest performance-standard approach because it creates a fair basis for review and improvement.",
        },
        "neg_structure_bodies_gen_083": {
            "question": "Which official typically leads the Government Side delegation during National Council negotiations?",
            "explanation": "The Head of the Civil Service of the Federation normally leads the Government Side because that office coordinates senior civil-service representation in that forum.",
        },
        "neg_structure_bodies_gen_086": {
            "question": "Which option most strongly aligns with good public-service practice on negotiating-structures compliance?",
            "explanation": "Good compliance practice requires lawful criteria and transparent documentation at each step so the process can be defended and audited.",
        },
        "neg_structure_bodies_gen_087": {
            "question": "To improve accountability in negotiating structures and bodies, which practice best supports risk management while maintaining fairness and legal compliance?",
            "explanation": "Risk management improves when control gaps are identified early and material exceptions are escalated promptly instead of being allowed to accumulate.",
        },
    },
    ROOT / "data" / "policy_analysis.json": {
        "pol_analysis_methods_gen_057": {
            "question": "In a time-sensitive matter under policy analysis methods, which action best aligns with lawful administrative standards?",
            "explanation": "Using validated data sources and documenting assumptions supports lawful administrative standards because it makes the recommendation evidence-based and reviewable.",
        },
        "pol_analysis_methods_gen_078": {
            "question": "What aspect of a parastatal is the Chief Executive accountable for?",
            "options": [
                "Approval of the parastatal's budget.",
                "Day-to-day management and administration.",
                "Appointment of all senior staff.",
                "Policy formulation and approval.",
            ],
            "explanation": "The Chief Executive is accountable for the day-to-day management and administration of the parastatal, while broader policy or budget powers may rest elsewhere.",
        },
        "pol_analysis_methods_gen_081": {
            "question": "What should always be included with file notes?",
            "options": [
                "The writer's initials and date.",
                "A full signature.",
                "A detailed analysis.",
                "A list of all attendees.",
            ],
            "explanation": "File notes should be initialed and dated so the record shows who made the note and when it was entered.",
        },
        "pol_analysis_methods_gen_082": {
            "question": "When decisions are made in policy analysis methods, which step most directly improves traceability and fairness?",
            "explanation": "Traceability and fairness improve when the problem, options, and measurable criteria are defined before choosing a policy path, because the decision can then be checked against stated standards.",
        },
        "pol_analysis_methods_gen_090": {
            "question": "When decisions are made in policy analysis methods, which step most directly improves implementation realism?",
            "explanation": "Implementation realism improves when roles, timelines, resources, and monitoring checkpoints are defined before rollout, because the policy can then be executed and assessed in a practical way.",
        },
        "pol_analysis_methods_gen_092": {
            "question": "What aspect of a parastatal is the Chief Executive accountable for?",
            "options": [
                "Appointment of all senior staff.",
                "Day-to-day management and administration.",
                "Policy formulation and approval.",
                "Approval of the parastatal's budget.",
            ],
            "explanation": "The Chief Executive is responsible for day-to-day management and administration, which is the operational side of running the parastatal.",
        },
        "pol_formulation_cycle_gen_011": {
            "explanation": "Public accountability in policy formulation requires decisions to be traceable and justified with evidence so the basis of the policy can be examined later.",
        },
        "pol_formulation_cycle_gen_019": {
            "question": "During routine policy formulation and cycle operations, which approach most strongly supports accountable implementation?",
            "explanation": "Accountable implementation begins with assigning roles, timelines, resources, and monitoring checkpoints before rollout so responsibility is clear from the start.",
        },
        "pol_public_sector_planning_gen_078": {
            "question": "In a time-sensitive public-sector-planning matter, which action best aligns with lawful administrative standards?",
            "explanation": "Lawful planning standards require the officer to define the problem, available options, and measurable decision criteria before choosing a policy direction.",
        },
        "pol_public_sector_planning_gen_089": {
            "question": "Which choice reflects proper impact-evaluation standards in public-sector planning?",
            "explanation": "Proper impact evaluation measures outcomes against the original baseline and policy objectives so the effect of the plan can be judged meaningfully.",
        },
        "pol_public_sector_planning_gen_092": {
            "question": "Which option best aligns with public-sector-planning compliance standards while preserving records for audit and oversight?",
            "explanation": "Public-sector-planning compliance is strongest when officers use lawful criteria and document each decision step transparently for audit and oversight review.",
        },
        "pol_public_sector_planning_gen_097": {
            "question": "Which choice reflects proper public-sector-planning standards?",
            "explanation": "Plans are strongest when they align with budget limits, legal mandate, and service priorities rather than drifting away from the institution's approved purpose.",
        },
        "policy_constitution_001": {
            "question": "What is the supreme law of Nigeria?",
            "explanation": "The Constitution of the Federal Republic of Nigeria is the supreme law, so every other law or regulation derives validity from it and must conform to it.",
        },
        "policy_constitution_013": {
            "question": "Which is the highest court in Nigeria?",
            "explanation": "The Supreme Court is the highest court in Nigeria and serves as the final judicial authority on appeals and constitutional interpretation.",
        },
        "policy_constitution_015": {
            "question": "Which document contains the fundamental rights of Nigerian citizens?",
            "explanation": "The 1999 Constitution contains the fundamental rights provisions, making it the correct source rather than the Public Service Rules or administrative handbooks.",
        },
        "policy_constitution_023": {
            "question": "What is the currency of Nigeria?",
            "explanation": "Nigeria's official currency is the Naira, which is the legal tender used for public and private transactions across the country.",
        },
        "policy_constitution_024": {
            "question": "What is the capital city of Nigeria?",
            "explanation": "Abuja is the capital because it serves as the Federal Capital Territory and seat of the national government.",
        },
        "policy_constitution_040": {
            "question": "Which abbreviation denotes the head office or principal place of administration?",
            "explanation": "HQ stands for Headquarters, the common abbreviation for the main office or principal place of administration.",
        },
        "policy_constitution_050": {
            "question": "What is the common purpose of an acknowledgement slip?",
            "explanation": "An acknowledgement slip confirms receipt of a document or parcel, creating a basic record that the item was delivered and received.",
        },
        "policy_constitution_084": {
            "question": "What should always be included with file notes?",
            "options": [
                "The writer's initials and date.",
                "A list of all attendees.",
                "A full signature.",
                "A detailed analysis.",
            ],
            "explanation": "File notes should carry the writer's initials and date so the record can be traced to the officer and the time it was made.",
        },
        "policy_constitution_087": {
            "question": "How many members are in the House of Representatives?",
            "options": [
                "109.",
                "36.",
                "774.",
                "360.",
            ],
            "explanation": "The House of Representatives consists of 360 members, which distinguishes it from the Senate's 109 members.",
        },
        "policy_psr_022": {
            "question": "Which body appoints Permanent Secretaries in the Federal Civil Service?",
            "explanation": "Permanent Secretaries are appointed by the President, acting within the constitutional and civil-service appointment framework.",
        },
        "policy_psr_028": {
            "question": "In civil-service memos, what does 'PS' commonly denote?",
            "explanation": "In internal civil-service usage, 'PS' commonly denotes Permanent Secretary rather than postscript or personal secretary.",
        },
        "policy_psr_035": {
            "question": "Which term refers to the routine checking and verification of financial and administrative records within an organization?",
            "explanation": "Internal audit is the routine independent checking and verification of organizational records and controls to ensure compliance and sound administration.",
        },
        "policy_psr_038": {
            "question": "Which abbreviation commonly appears on file covers to indicate urgency?",
            "explanation": "UFS is used on file covers to signal urgency, drawing attention to matters that require prompt handling or signature.",
        },
        "policy_states_033": {
            "question": "Which Nigerian state is nicknamed the 'Pace Setter State'?",
            "explanation": "Oyo State is known as the 'Pace Setter State,' a widely recognized state nickname in Nigerian civic knowledge.",
        },
        "policy_states_034": {
            "question": "What is the capital of Bayelsa State?",
            "explanation": "Yenagoa is the capital of Bayelsa State, making it the correct administrative center among the options given.",
        },
        "policy_states_035": {
            "question": "Which Nigerian state is nicknamed the 'Land of Unity'?",
            "explanation": "Kwara State is associated with the 'Land of Unity' identity, reflecting its reputation for coexistence across diverse groups.",
        },
        "policy_states_036": {
            "question": "Which Nigerian state is called the 'Fountain of Knowledge'?",
            "explanation": "Ekiti State is known as the 'Fountain of Knowledge,' a nickname that reflects its educational reputation.",
        },
        "policy_states_037": {
            "question": "Which Nigerian state is nicknamed the 'Coal City State'?",
            "explanation": "Enugu is called the 'Coal City State' because of its historic association with coal production.",
        },
        "policy_states_038": {
            "question": "Which Nigerian city is the capital of Adamawa State?",
            "explanation": "Yola is the capital of Adamawa State, making it the correct administrative city among the options listed.",
        },
        "policy_states_040": {
            "question": "Which Nigerian state is nicknamed the 'Land of Hospitality'?",
            "explanation": "Benue State is associated with the nickname 'Land of Hospitality,' in addition to its better-known 'Food Basket of the Nation' identity.",
        },
    },
}


def update_file(path: Path, rewrites: dict[str, dict[str, object]]) -> list[str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    updated: list[str] = []

    def walk(node):
        if isinstance(node, dict):
            qid = node.get("id")
            if qid in rewrites:
                node.update(rewrites[qid])
                updated.append(qid)
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)

    walk(data)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return updated


def main() -> None:
    total = 0
    for path, rewrites in FILES.items():
        updated = update_file(path, rewrites)
        print(f"Updated {len(updated)} questions in {path.name}")
        for qid in updated:
            print(qid)
        total += len(updated)
    print(f"Total updated: {total}")


if __name__ == "__main__":
    main()
