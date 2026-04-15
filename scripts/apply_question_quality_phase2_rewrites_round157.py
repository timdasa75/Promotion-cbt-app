# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'psr_rules.json'

UPDATES = {
    'psr_docx_051': 'Junior staff appointments are handled through the appropriate committee structure, so the officer or committee with delegated appointments authority is the correct focus of this item.',
    'psr_docx_061': 'The PSR treats the date of birth recorded at appointment as a formal personnel record, so it is not casually changed after appointment.',
    'psr_docx_063': 'Recruitment means the process of bringing suitable persons into the public service to fill authorized posts.',
    'psr_docx_064': 'A probationary pensionable appointment is a recognized appointment category under the PSR, so the question asks you to identify that class correctly.',
    'psr_docx_068': 'A trainee or pupil appointment is used when a candidate needs additional experience before full deployment, so the correct option is the one describing that arrangement.',
    'psr_docx_071': 'After the trainee period, the officer normally moves on to the next applicable appointment status or confirmation step under the PSR.',
    'psr_docx_074': 'First appointments to pensionable posts are normally probationary rather than immediately permanent, which is why the probation-related option is correct.',
    'psr_docx_075': 'An officer confirmed in a lower post is not automatically on probation in a higher post merely because of conversion, so the PSR distinction matters here.',
    'psr_docx_081': 'The requisite qualifications for appointment are set out in the approved Scheme of Service, which is why that source is the correct answer.',
    'psr_docx_083': 'Prior specific approval is required where the PSR rules expressly reserve appointment authority or require clearance before the post can be filled.',
    'psr_docx_100': 'Officers on probation are required to serve the prescribed probationary period before confirmation unless the PSR allows a reduction in approved cases.',
    'psr_docx_103': 'An extension of probation can attract a penalty on increment, so the item tests the consequence tied to unsatisfactory progress.',
    'psr_docx_104': 'During probation, an officer must continue to show satisfactory conduct, performance, and compliance with the PSR so confirmation can be considered.',
    'psr_docx_107': 'If a clerical officer fails the prescribed examination during probation, the PSR treats that as a failure to satisfy the condition for confirmation.',
    'psr_docx_108': 'Failure of the clerical officer at the end of an extended probation means confirmation cannot follow, which is why the adverse outcome option is correct.',
    'psr_docx_112': 'The confirmation result is conveyed through the proper supervisory or administrative channel so the officer receives formal notice of the decision.',
    'psr_docx_113': 'Unsatisfactory service during probation can prevent confirmation, because the PSR requires both conduct and performance to be acceptable.',
    'psr_docx_114': 'Termination of an officer on probation must be approved by the authorized appointing or disciplinary authority, not by an individual officer acting alone.',
    'psr_docx_116': 'Promotion eligibility depends on meeting the PSR conditions for service length, performance, and any required examinations or assessments.',
    'psr_docx_120': 'Promotion examinations for GL.07 and above are conducted under the approved service processes for senior officers, which is why the designated PSR body is correct.',
    'psr_docx_122': 'A promotion normally takes effect from the date prescribed in the PSR or the date approved in the promotion process, not from an arbitrary later date.',
    'psr_docx_123': 'An officer cannot simply refuse a duly approved promotion without consequence, because promotion is part of the service structure and may carry obligations.',
    'psr_docx_124': 'If an officer refuses promotion, the PSR allows the service to treat that refusal as a matter requiring administrative consequences.',
    'psr_docx_125': 'An acting appointment is a temporary arrangement made to fill a post pending substantive appointment or confirmation.',
    'psr_docx_128': 'Acting beyond the approved period without approval is not permitted, so the PSR consequence is the key point being tested here.',
    'psr_docx_131': 'Transfers require approval by the proper authority, which is why the question focuses on who can lawfully approve the transfer.',
    'psr_docx_132': 'Transfer affects seniority according to the PSR rules governing the receiving and losing cadres, so the correct option is the one that reflects that rule.',
    'psr_docx_135': 'Secondment is a temporary placement of an officer in another post or organization while the original appointment remains in force.',
    'psr_docx_137': 'At the end of secondment, the officer normally returns to the parent service or office unless the PSR or approval conditions say otherwise.',
}


def update(node: object, updates: dict[str, str]) -> int:
    if isinstance(node, list):
        return sum(update(item, updates) for item in node)
    if isinstance(node, dict):
        qid = node.get('id')
        if qid in updates:
            node['explanation'] = updates[qid]
            return 1
        return sum(update(value, updates) for value in node.values())
    return 0


def main() -> int:
    data = json.loads(TARGET.read_text(encoding='utf-8'))
    changed = update(data, UPDATES)
    if changed != len(UPDATES):
        raise SystemExit(f'expected {len(UPDATES)} updates, applied {changed}')
    TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Applied round 157 updates to {changed} questions in {TARGET}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
