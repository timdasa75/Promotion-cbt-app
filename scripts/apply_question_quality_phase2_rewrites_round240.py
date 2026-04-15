from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POLICY_PATH = ROOT / 'data' / 'policy_analysis.json'
ADMIN_PATH = ROOT / 'data' / 'civil_service_ethics.json'

MOVE_ID = 'policy_psr_034'
NEW_ADMIN_ID = 'csh_ap_229'
DUPLICATE_ID = 'pol_public_sector_planning_gen_086'


def load_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def find_subcategory(data: dict, sub_id: str) -> dict:
    for sub in data.get('subcategories', []):
        if str(sub.get('id') or '').strip() == sub_id:
            return sub
    raise KeyError(sub_id)


def pop_question(subcategory: dict, question_id: str) -> dict:
    questions = subcategory.get('questions', [])
    for index, question in enumerate(questions):
        if isinstance(question, dict) and str(question.get('id') or '').strip() == question_id:
            return questions.pop(index)
    raise KeyError(question_id)


def find_question(subcategory: dict, question_id: str) -> dict:
    for question in subcategory.get('questions', []):
        if isinstance(question, dict) and str(question.get('id') or '').strip() == question_id:
            return question
    raise KeyError(question_id)


def main() -> None:
    policy = load_json(POLICY_PATH)
    admin = load_json(ADMIN_PATH)

    policy_impl = find_subcategory(policy, 'pol_implementation_evaluation')
    moved = pop_question(policy_impl, MOVE_ID)

    moved['id'] = NEW_ADMIN_ID
    moved['question'] = 'Which detail is not normally included in minutes of a meeting?'
    moved['explanation'] = 'Minutes summarize attendance, decisions, and action points; they do not normally reproduce casual comments word for word.'
    moved['chapter'] = 'Administrative Procedures - Expansion Set'
    moved['keywords'] = ['minutes_of_meeting', 'minute_writing', 'meeting_records', 'administrative_procedure']
    moved['tags'] = ['civil_service_admin', 'csh_administrative_procedures', 'minutes_of_meeting', 'minute_writing', 'meeting_records']
    moved['source'] = 'moved_from_policy_analysis'
    moved['sourceDocument'] = 'Public Policy and Governance Framework'
    moved['sourceSection'] = 'Administrative Procedures'
    moved['sourceTopicId'] = 'civil_service_admin'
    moved['sourceSubcategoryId'] = 'csh_administrative_procedures'
    moved['sourceSubcategoryName'] = 'Administrative Procedures'
    moved['legacyQuestionIds'] = [MOVE_ID]
    moved.pop('topic', None)

    admin_sub = find_subcategory(admin, 'csh_administrative_procedures')
    admin_sub.setdefault('questions', []).append(moved)

    planning_sub = find_subcategory(policy, 'pol_public_sector_planning')
    duplicate = find_question(planning_sub, DUPLICATE_ID)
    duplicate['question'] = 'Which practice best validates assumptions before planning evidence is used?'
    duplicate['explanation'] = 'Planning evidence is more dependable when officers validate the assumptions behind it before relying on the advice or recommendation.'
    duplicate['keywords'] = ['public_sector_planning', 'assumption_validation', 'evidence_quality', 'credible_sources']
    duplicate['tags'] = ['policy_analysis', 'pol_public_sector_planning', 'assumption_validation', 'evidence_quality', 'credible_sources']

    write_json(POLICY_PATH, policy)
    write_json(ADMIN_PATH, admin)
    print('Moved policy_psr_034 to civil_service_admin and split pol_public_sector_planning_gen_086')


if __name__ == '__main__':
    main()
