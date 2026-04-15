from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / "data" / "constitutional_foi.json": {
        "clg_legal_compliance_gen_064": {
            "question": "What direction should the chairman give on producing and circulating meeting minutes?",
            "options": [
                "Direct the Secretariat on the timing for production and circulation.",
                "Leave the minutes entirely to chance.",
                "Keep the minutes secret from participants.",
                "Write the minutes personally."
            ],
            "correct": 0,
            "explanation": "The chairman's role is to direct the Secretariat on when the minutes should be produced and circulated so the record is timely and properly managed.",
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
