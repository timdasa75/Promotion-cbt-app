# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    (
        ROOT / 'data' / 'civil_service_ethics.json',
        {
            'csh_ap_140': {
                'explanation': 'The Civil Service Handbook expects the chair to start on time so the meeting stays orderly, the agenda is respected, and the objectives are treated seriously.',
            },
            'csh_ap_168': {
                'explanation': 'A chair needs the meeting objective and agenda before guiding the discussion so the session stays focused, orderly, and tied to its intended result.',
            },
            'csh_ap_169': {
                'explanation': 'A register of minutes is kept so the office can trace recorded minutes quickly, confirm decisions, and preserve an orderly record of meetings.',
            },
            'csh_ap_172': {
                'explanation': 'In official writing, style means the distinctive manner in which language and ideas are expressed for official readers and office records.',
            },
            'csh_ap_191': {
                'explanation': 'Style means the distinctive way official ideas are expressed in correspondence, reports, and other records, not the length or speed of writing.',
            },
            'csh_ap_205': {
                'explanation': 'A file copy preserves the circular with the related matter so the office record remains complete, traceable, and available for later reference.',
            },
            'csh_ap_137': {
                'explanation': 'Negotiation files stay useful when each control point is recorded, because the file must show the current status of the case as it develops.',
            },
            'csh_ap_139': {
                'explanation': 'Dispute-hearing records remain useful when every sitting is captured and the next action is noted, so continuity is not lost between sessions.',
            },
            'csh_ap_155': {
                'explanation': 'An official case file should stay current and traceable at each control point so reviewers can follow every movement without gaps.',
            },
            'csh_ap_217': {
                'explanation': 'An objectives-and-institutions file is easiest to review when it stays indexed, current, and updated at each control point for quick tracing.',
            },
            'csh_ap_219': {
                'explanation': 'An illiterate payee needs the mark witnessed by a literate official other than the paying officer so the payment record remains valid and accountable.',
            },
            'csh_ap_227': {
                'explanation': 'Log management in an office registry is stronger when the file is accurate and updated at each control point, because the record must remain traceable.',
            },
            'csh_disc_051': {
                'explanation': 'The attendance register uses a red line drawn at the prescribed time so late arrivals sign below it and the office can distinguish punctuality from lateness.',
            },
        },
    ),
    (
        ROOT / 'data' / 'psr_rules.json',
        {
            'psr_discipline_gen_001': {
                'explanation': 'Approved procedures and complete records show that discipline is being managed fairly, consistently, and under control, which is exactly what the PSR expects.',
            },
            'psr_general_admin_gen_009': {
                'explanation': 'General administration works best when PSR provisions are applied consistently and the record stays auditable, because compliance depends on traceable control.',
            },
            'psr_general_admin_gen_003': {
                'explanation': 'A public-service unit should identify control gaps early and escalate exceptions promptly so compliance, consistency, and accountability are maintained.',
            },
            'psr_general_admin_gen_007': {
                'explanation': 'Promotion standards are upheld when eligibility requirements are checked before advancement is recommended, so the process remains fair and compliant.',
            },
            'psr_admin_025': {
                'explanation': 'PSR 110118 bars personal use of government vehicles and equipment, so the correct rule is that they are reserved for official purposes only.',
            },
            'psr_admin_026': {
                'explanation': 'PSR 110119 makes the department head responsible for maintaining government property and official records, so the control duty sits at the departmental level.',
            },
            'psr_admin_068': {
                'explanation': 'Administrative units must make necessary information on acts and procedures available to the public so interested persons can assess how the unit is managed.',
            },
        },
    ),
]


def update(node: object, updates: dict[str, dict]) -> int:
    if isinstance(node, list):
        return sum(update(item, updates) for item in node)
    if isinstance(node, dict):
        qid = node.get('id')
        if qid in updates:
            payload = updates[qid]
            for key, value in payload.items():
                node[key] = value
            return 1
        return sum(update(value, updates) for value in node.values())
    return 0


def main() -> None:
    total_changed = 0
    for target, updates in TARGETS:
        data = json.loads(target.read_text(encoding='utf-8'))
        changed = update(data, updates)
        if changed != len(updates):
            raise SystemExit(f'{target.name}: expected {len(updates)} updates, applied {changed}')
        target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        total_changed += changed
        print(f'Applied round 144 updates to {changed} questions in {target}')
    print(f'Applied round 144 updates to {total_changed} questions across {len(TARGETS)} files')


if __name__ == '__main__':
    main()
