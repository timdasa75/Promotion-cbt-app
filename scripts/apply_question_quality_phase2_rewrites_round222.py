from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REWRITES = {
    ROOT / 'data' / 'ict_digital.json': {
        'ict_li_089': {
            'options': [
                'Careful verification of the facts, figures, and data provided.',
                'Treatment of the papers as routine and unimportant.',
                'Assumption of unnecessary close review.',
                'Disregard of the papers unless personally addressed to the officer.',
            ],
        },
        'ict_literacy_innovation_gen_004': {
            'options': [
                'Least-privilege access, timely patching, and incident reporting.',
                'Routine treatment of exceptions without documentation.',
                'Case closure before completion of required checks.',
                'Reliance on informal instructions instead of documented procedures.',
            ],
        },
        'ict_sec_095': {
            'options': [
                'Presence of authorised key holders throughout the period the safe remains open.',
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
                'Absence of locks despite guard presence.',
            ],
        },
    },
    ROOT / 'data' / 'policy_analysis.json': {
        'policy_psr_041': {
            'options': [
                'Confirmation without examination on the strength of a satisfactory service record.',
                'Confirmation based on promotion alone.',
                'Confirmation based on excellent service record alone.',
                'Compulsory passing of the prescribed examination before confirmation.',
            ],
        },
        'policy_psr_045': {
            'options': [
                'Mandatory monthly checking of contents in strong-rooms or safes.',
                'Optional checking except upon suspicion of discrepancy.',
                'Checking required only once each year.',
                'Checking carried out only after an audit query.',
            ],
        },
    },
    ROOT / 'data' / 'public_procurement.json': {
        'ppa_elb_017': {
            'options': [
                'Use only for price comparison.',
                'Initial grading to confirm competence before opening financial proposals.',
                'Automatic acceptance on the basis of prior familiarity with the firm.',
                'Discarding on the ground of high price alone.',
            ],
        },
        'ppa_ims_053': {
            'options': [
                'Short-term deposit only under regulatory permission and fulfilled conditions.',
                'Automatic deposit of all idle mission funds.',
                'Deposit only upon availability of a substantial amount.',
                'Deposit without reference to treasury approval requirements.',
            ],
        },
        'proc_transparency_ethics_gen_026': {
            'options': [
                'Consistent application of published criteria with complete evaluation records.',
                'Bypassing of review checkpoints under tight timelines.',
                'Preference for convenience over approved process requirements.',
                'Application of discretionary shortcuts regardless of safeguards.',
            ],
        },
    },
    ROOT / 'data' / 'psr_rules.json': {
        'psr_docx_021': {
            'options': [
                'Minimum score required for initial employment.',
                'Average score recorded in the examination.',
                'Score below the passing threshold for the promotion examination, currently 60 percent.',
                'Highest score obtained in the examination.',
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
