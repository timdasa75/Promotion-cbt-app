#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'ict_digital.json'
SUB = 'ict_literacy_innovation'
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


BAD_DOC = [
    'Personal preference in procedure use.',
    'Bypassed review checkpoints.',
    'Convenience ahead of legal requirements.',
]
BAD_RISK = [
    'Unreported exceptions in routine work.',
    'Convenience ahead of risk review.',
    'Personal preference in risk handling.',
]
BAD_ADOPT = [
    'Uncontrolled rollout without user support.',
    'Informal deployment outside approved process.',
    'Convenience ahead of support and review controls.',
]
BAD_BCP = [
    'Single-point dependence without recovery planning.',
    'Undocumented exceptions left unresolved.',
    'Convenience ahead of resilience controls.',
]

# Glossary / factual ICT items
add(
    'ict_li_022',
    'What does digital problem solving involve?',
    1,
    'Using digital tools to identify and solve work or policy problems.',
    [
        'Fixing hardware faults only.',
        'Typing documents without solving underlying problems.',
        'Browsing the internet without a defined work purpose.',
    ],
    'Digital problem solving means applying digital tools and technologies to identify, analyze, and solve administrative or policy problems.',
    ['digital_problem_solving', 'digital_tools', 'problem_solving', 'digital_literacy'],
)
add(
    'ict_li_027',
    'What is the main benefit of an electronic monitoring and evaluation system in public service?',
    1,
    'Real-time tracking of programme progress and performance data.',
    [
        'Elimination of all paper records in every case.',
        'Direct management of staff salaries.',
        'Routine processing of public payments.',
    ],
    'An electronic monitoring and evaluation system helps government track programme progress and performance data in real time for review and decision-making.',
    ['e_m_e_system', 'real_time_tracking', 'programme_monitoring', 'performance_data'],
)
add(
    'ict_li_032',
    'What dress standard applies to a participant joining an official virtual meeting from a non-work environment under Rule 090205?',
    1,
    'Formal attire is required.',
    [
        'Casual wear is acceptable.',
        'Any attire approved by the host is sufficient.',
        'Sportswear is the standard requirement.',
    ],
    'Rule 090205 requires participants joining official virtual meetings from a non-work environment to appear in formal attire.',
    ['virtual_meetings', 'rule_090205', 'formal_attire', 'official_appearance'],
)
add(
    'ict_li_035',
    'Which communication method allows simultaneous real-time exchange of information?',
    1,
    'Synchronous communication such as a video conference.',
    [
        'Email exchanges sent at different times.',
        'Postal mail delivery.',
        'Circular letters routed through normal office dispatch.',
    ],
    'Synchronous communication involves participants exchanging information in real time, such as through phone or video conference.',
    ['synchronous_communication', 'real_time_exchange', 'video_conference', 'digital_communication'],
)
add(
    'ict_li_038',
    'What is digital content?',
    1,
    'Information stored in digital form such as text, images, audio, or video.',
    [
        'Printed books and newspapers only.',
        'Handwritten notes kept in physical files.',
        'Traditional mail handled through paper workflow.',
    ],
    'Digital content is information created, stored, or shared in digital form, including text, images, audio, and video.',
    ['digital_content', 'digital_format', 'information_types', 'digital_literacy'],
)
add(
    'ict_li_040',
    'Why were virtual meetings incorporated into the Public Service Rules?',
    1,
    'To support continuity of official work during emergencies and remote operations.',
    [
        'To align public officers with party politics.',
        'To increase ministerial control over routine workflow.',
        'To make official travel reduction the only meeting policy.',
    ],
    'Virtual-meeting provisions were introduced to preserve continuity of government work during emergencies and remote-work conditions while maintaining productivity.',
    ['virtual_meetings', 'psr', 'work_continuity', 'remote_operations'],
)
add(
    'ict_li_046',
    'Which option best describes digital content?',
    1,
    'Information in digital form such as text, images, audio, or video.',
    [
        'Physical books and newspapers only.',
        'Handwritten notes stored in paper files.',
        'Traditional mail in manual workflow.',
    ],
    'Digital content refers to information stored and shared in digital form rather than solely through physical media.',
    ['digital_content', 'digital_information', 'text_images_audio_video', 'digital_literacy'],
)
add(
    'ict_li_051',
    'What technology is recommended to reduce noise interference during official virtual meetings?',
    1,
    'Mute controls used according to the group agreement.',
    [
        'Loudspeaker output throughout the meeting.',
        'Satellite-phone use as the standard control.',
        'Open microphones for every participant at all times.',
    ],
    'Virtual-meeting participants are expected to use mute controls as agreed so that extraneous noise does not disrupt the meeting.',
    ['virtual_meetings', 'mute_control', 'noise_reduction', 'rule_090204'],
)
add(
    'ict_li_056',
    'What is the main purpose of digital dashboards in government systems?',
    1,
    'Providing a visual view of real-time data for decision-making.',
    [
        'Encrypting all external communications automatically.',
        'Storing physical files in paper archives.',
        'Managing hardware inventory as their only function.',
    ],
    'Digital dashboards give decision-makers a visual interface for real-time data so they can monitor performance and act quickly.',
    ['digital_dashboards', 'real_time_data', 'decision_making', 'government_systems'],
)
add(
    'ict_li_067',
    'Who approves staff training programmes so they align with an MDA\'s strategic mandate?',
    1,
    'The Permanent Secretary or Head of Extra-Ministerial Office.',
    [
        'The minister and the Federal Civil Service Commission jointly in every case.',
        'The staff union alone.',
        'The Accountant-General as routine approver.',
    ],
    'Training linked to an MDA\'s strategic mandate is subject to approval by the Permanent Secretary or Head of Extra-Ministerial Office under the relevant rule framework.',
    ['staff_training', 'mda_mandate', 'permanent_secretary', 'approval'],
)
add(
    'ict_li_069',
    'What does the E-Government Master Plan seek to ensure alongside service automation?',
    1,
    'Secure cloud-infrastructure deployment for government services.',
    [
        'Exclusive dependence on manual records.',
        'Priority for political appointments.',
        'Maximization of foreign aid as the main objective.',
    ],
    'The E-Government Master Plan guides service automation together with secure infrastructure deployment so digital public services can operate reliably.',
    ['e_government_master_plan', 'service_automation', 'secure_cloud_infrastructure', 'digital_governance'],
)
add(
    'ict_li_070',
    'Which action is not a best practice when submitting a digital application or report?',
    2,
    'Ignoring mandatory attachments.',
    [
        'Completing required fields accurately.',
        'Using approved government templates.',
        'Submitting before the deadline.',
    ],
    'Ignoring mandatory attachments is poor practice because it makes the submission incomplete and may lead to rejection or delay.',
    ['digital_submission', 'mandatory_attachments', 'best_practice', 'official_templates'],
)
add(
    'ict_li_072',
    'What is the rule for an officer on approved training who is receiving salary from an overseas employer?',
    1,
    'Federal Government emoluments or allowances are not payable unless specifically approved.',
    [
        'Both Nigerian and overseas salaries are payable automatically.',
        'The overseas salary must always be remitted to the Treasury.',
        'All Nigerian emoluments cease immediately without exception.',
    ],
    'Where an officer on approved training is being paid by an overseas employer, Federal Government emoluments or allowances are not payable unless specific approval is granted.',
    ['overseas_salary', 'approved_training', 'federal_emoluments', 'specific_approval'],
)
add(
    'ict_li_082',
    'What should officers do when preparing Executive Council papers?',
    1,
    'Verify the facts, figures, and data very carefully.',
    [
        'Ignore the papers unless directly addressed to them.',
        'Treat the papers as unimportant.',
        'Assume the data need no careful review.',
    ],
    'Executive Council papers inform policy decisions, so officers must verify the facts, figures, and data in them with particular care.',
    ['executive_council_papers', 'data_verification', 'policy_decisions', 'official_accuracy'],
)
add(
    'ict_li_089',
    'Which practice is required when officers handle Executive Council papers?',
    2,
    'Careful verification of the facts, figures, and data provided.',
    [
        'Treating the papers as unimportant.',
        'Assuming no close review is necessary.',
        'Ignoring them unless specifically addressed.',
    ],
    'Because Executive Council papers are used for policy decisions, officers must handle them with careful verification of the facts, figures, and data provided.',
    ['executive_council_papers', 'careful_verification', 'facts_figures_data', 'policy_support'],
)

# Generated shell
add(
    'ict_literacy_innovation_gen_001',
    'Which practice best strengthens governance in digital literacy and innovation work?',
    0,
    'Approved procedures with complete implementation records.',
    BAD_DOC,
    'Governance is stronger when digital-literacy and innovation work follows approved procedures and keeps the records needed for review and accountability.',
    ['ict_literacy_innovation', 'governance', 'approved_procedure', 'complete_records'],
)
add(
    'ict_literacy_innovation_gen_003',
    'Which practice best supports risk management in digital literacy and innovation work?',
    0,
    'Early escalation of material digital-control exceptions.',
    BAD_RISK,
    'Risk management improves when material digital-control exceptions are identified early, escalated promptly, and tracked for follow-up.',
    ['ict_literacy_innovation', 'risk_management', 'digital_control_exceptions', 'escalation'],
)
add(
    'ict_literacy_innovation_gen_004',
    'Which practice best supports cybersecurity hygiene in digital literacy and innovation work?',
    0,
    'Least-privilege access, patching, and incident-reporting controls.',
    [
        'Exceptions treated as routine without documentation.',
        'Case closure before required checks are completed.',
        'Informal instructions used instead of documented controls.',
    ],
    'Cybersecurity hygiene is strongest when access is controlled, systems are patched, and incidents are reported through the approved process.',
    ['ict_literacy_innovation', 'cybersecurity_hygiene', 'least_privilege', 'incident_reporting'],
)
add(
    'ict_literacy_innovation_gen_007',
    'Which practice best supports business continuity in digital literacy and innovation work?',
    0,
    'Backup, recovery, and resilience procedures kept ready for use.',
    BAD_BCP,
    'Business continuity depends on documented backup, recovery, and resilience measures rather than unmanaged dependence on a single path or system.',
    ['ict_literacy_innovation', 'business_continuity', 'backup', 'recovery'],
)
add(
    'ict_literacy_innovation_gen_008',
    'Which practice best supports responsible technology adoption in public service?',
    0,
    'Deployment with training, controls, and user support.',
    BAD_ADOPT,
    'Responsible technology adoption requires controlled deployment, user training, and support so the system can be used lawfully and effectively.',
    ['ict_literacy_innovation', 'technology_adoption', 'training', 'user_support'],
)
add(
    'ict_literacy_innovation_gen_009',
    'Which practice best supports documented procedure in digital literacy and innovation work?',
    0,
    'Complete records kept under the approved procedure.',
    BAD_DOC,
    'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
    ['ict_literacy_innovation', 'documented_procedure', 'approved_process', 'complete_records'],
)


def main():
    data = json.loads(TARGET.read_text(encoding='utf-8'))
    updated = 0
    found = set()
    for sub in data.get('subcategories', []):
        if sub.get('id') != SUB:
            continue
        for q in sub.get('questions', []):
            patch = UPDATES.get(q.get('id'))
            if not patch:
                continue
            q.update(patch)
            updated += 1
            found.add(q.get('id'))
        break
    else:
        raise RuntimeError(f'Missing subcategory: {SUB}')

    missing = sorted(set(UPDATES) - found)
    if missing:
        raise RuntimeError(f'Missing questions: {missing}')

    TARGET.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Applied round 110 rewrites to {updated} questions')


if __name__ == '__main__':
    main()
