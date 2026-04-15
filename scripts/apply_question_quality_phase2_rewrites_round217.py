from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / 'data' / 'constitutional_foi.json': {
        'clg_general_competency_gen_042': {
            'options': [
                'Verification of legal authority with documented basis.',
                'Delay of documentation until after action.',
                'Use of inconsistent criteria across similar cases.',
                'Bypassing of review controls to save time.',
            ],
        },
        'clg_general_competency_gen_057': {
            'options': [
                'Application of controls with documented mitigation.',
                'Preference for convenience over control requirements.',
                'Continuation of non-compliance after feedback.',
                'Reliance on personal preference in control use.',
            ],
        },
        'clg_general_competency_gen_067': {
            'options': [
                'Delay of documentation until after action.',
                'Verification of legal authority with documented basis.',
                'Use of inconsistent criteria across similar cases.',
                'Bypassing of review controls to save time.',
            ],
        },
        'clg_general_competency_gen_077': {
            'options': [
                'Application of controls with documented mitigation.',
                'Preference for convenience over control requirements.',
                'Continuation of non-compliance after feedback.',
                'Reliance on personal preference in control use.',
            ],
        },
        'clg_general_competency_gen_085': {
            'options': [
                'Application of controls with documented mitigation.',
                'Preference for convenience over control requirements.',
                'Continuation of non-compliance after feedback.',
                'Reliance on personal preference in control use.',
            ],
        },
        'clg_legal_compliance_gen_013': {
            'options': [
                'Application of controls with documented mitigation.',
                'Preference for convenience over control requirements.',
                'Continuation of non-compliance after feedback.',
                'Reliance on personal preference in control use.',
            ],
        },
        'clg_legal_compliance_gen_036': {
            'options': [
                'Verification of legal authority with documented basis.',
                'Delay of documentation until after action.',
                'Use of inconsistent criteria across similar cases.',
                'Bypassing of review controls to save time.',
            ],
        },
        'clg_legal_compliance_gen_051': {
            'options': [
                'Application of controls with documented mitigation.',
                'Preference for convenience over control requirements.',
                'Continuation of non-compliance after feedback.',
                'Reliance on personal preference in control use.',
            ],
        },
        'clg_legal_compliance_gen_067': {
            'options': [
                'Delay of documentation until after action.',
                'Use of inconsistent criteria across similar cases.',
                'Verification of legal authority with documented basis.',
                'Bypassing of review controls to save time.',
            ],
        },
        'clg_legal_compliance_gen_079': {
            'options': [
                'Preference for convenience over control requirements.',
                'Application of controls with documented mitigation.',
                'Continuation of non-compliance after feedback.',
                'Reliance on personal preference in control use.',
            ],
        },
        'foi_access_obligations_gen_023': {
            'options': [
                'Verification of legal authority with documented basis.',
                'Delay of documentation until after action.',
                'Use of inconsistent criteria across similar cases.',
                'Bypassing of review controls to save time.',
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
    for path, rewrites in FILES.items():
        updated = update_file(path, rewrites)
        print(f'Updated {len(updated)} questions in {path.name}')
        for qid in updated:
            print(qid)
        total += len(updated)
    print(f'Total updated: {total}')


if __name__ == '__main__':
    main()
