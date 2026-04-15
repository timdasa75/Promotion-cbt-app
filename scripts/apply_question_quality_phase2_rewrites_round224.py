from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REWRITES = {
    ROOT / 'data' / 'civil_service_ethics.json': {
        'csh_ap_051': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'acting_appointment', 'fcsc_notification'], 'topic': 'Administrative Procedures'},
        'csh_ap_053': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'pension_accounting', 'financial_accountability'], 'topic': 'Administrative Procedures'},
        'csh_ap_054': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'schemes_of_service', 'cadre_requirements'], 'topic': 'Administrative Procedures'},
        'csh_ap_057': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'acting_appointment', 'effective_date'], 'topic': 'Administrative Procedures'},
        'csh_ap_058': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'acting_appointment', 'casual_or_special_leave'], 'topic': 'Administrative Procedures'},
        'csh_ap_060': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'financial_regulations', 'public_funds_control'], 'topic': 'Administrative Procedures'},
        'csh_ap_061': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'handover', 'relieving_officer'], 'topic': 'Administrative Procedures'},
        'csh_ap_063': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'pension_unit', 'specialization_and_accountability'], 'topic': 'Administrative Procedures'},
        'csh_ap_064': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'executive_arm', 'government_management'], 'topic': 'Administrative Procedures'},
        'csh_ap_066': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'good_governance', 'rule_of_law'], 'topic': 'Administrative Procedures'},
        'csh_ap_067': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'non_tax_revenue', 'parastatals'], 'topic': 'Administrative Procedures'},
        'csh_ap_069': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'due_process_policy', 'procurement_and_budgeting'], 'topic': 'Administrative Procedures'},
        'csh_ap_070': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'parastatal_board', 'staff_appointment_and_promotion'], 'topic': 'Administrative Procedures'},
        'csh_ap_074': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'principle_of_accountability', 'public_officers'], 'topic': 'Administrative Procedures'},
        'csh_ap_075': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'e_governance', 'service_delivery'], 'topic': 'Administrative Procedures'},
        'csh_ap_079': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'negotiation_file', 'audit_trail'], 'topic': 'Administrative Procedures'},
        'csh_ap_080': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'official_file', 'planning_discipline'], 'topic': 'Administrative Procedures'},
        'csh_ap_085': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'file_minute', 'matter_at_issue'], 'topic': 'Administrative Procedures'},
        'csh_ap_105': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'handing_over_note', 'continuity_of_work'], 'topic': 'Administrative Procedures'},
        'csh_ap_106': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'handing_over_note', 'officer_taking_over'], 'topic': 'Administrative Procedures'},
        'csh_ap_107': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'handing_over_note', 'post_transition'], 'topic': 'Administrative Procedures'},
        'csh_ap_117': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'handing_over_note', 'transition_of_responsibilities'], 'topic': 'Administrative Procedures'},
        'csh_ap_118': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'handing_over_note', 'successor_briefing'], 'topic': 'Administrative Procedures'},
        'csh_ap_120': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'official_letter', 'enclosures'], 'topic': 'Administrative Procedures'},
        'csh_ap_121': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'official_letter', 'enclosure_abbreviation'], 'topic': 'Administrative Procedures'},
        'csh_ap_123': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'file_structure', 'minutes_and_correspondence'], 'topic': 'Administrative Procedures'},
        'csh_ap_124': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'handing_over_note', 'responsibility_transfer'], 'topic': 'Administrative Procedures'},
        'csh_ap_125': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'handing_over_note', 'successor_information'], 'topic': 'Administrative Procedures'},
        'csh_ap_126': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'file_structure', 'official_notes_and_correspondence'], 'topic': 'Administrative Procedures'},
        'csh_ap_128': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'registry_procedure', 'classified_material'], 'topic': 'Administrative Procedures'},
        'csh_ap_153': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'vehicle_logbook', 'transport_records'], 'topic': 'Administrative Procedures'},
        'csh_ap_155': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'case_file_review', 'movement_entries'], 'topic': 'Administrative Procedures'},
        'csh_ap_226': {'tags': ['civil_service_admin', 'csh_administrative_procedures', 'planning_file', 'distribution_control'], 'topic': 'Administrative Procedures'},
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
