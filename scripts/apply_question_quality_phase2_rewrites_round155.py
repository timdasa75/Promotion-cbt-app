# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUEUE_PATH = ROOT / 'docs' / 'question_quality_phase2_queue.json'
TARGET_PATH = ROOT / 'data' / 'psr_rules.json'


def load_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def save_json(path: Path, payload: object) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def extract_psr_code(question: str) -> str:
    match = re.search(r'PSR\s*(\d{6})', question or '', re.IGNORECASE)
    if match:
        return match.group(1)
    return '000000'


def clean_option(option: str) -> str:
    text = (option or '').strip()
    text = re.sub(r'\s+', ' ', text)
    return text.rstrip('.').rstrip("'").strip()


def build_explanation(question: str, option: str) -> str:
    q_lower = (question or '').lower()
    code = extract_psr_code(question)
    answer = clean_option(option)

    if 'stands for' in q_lower or 'acronym' in q_lower:
        return f'PSR {code} expands the acronym as {answer}, so that option is correct.'
    if any(token in q_lower for token in ('means', 'meaning', 'refers to', 'refer to', 'includes', 'include')):
        return f'PSR {code} defines the term as {answer}, which is why that option is correct.'
    if q_lower.startswith(('according to psr', 'under psr')):
        return f'PSR {code} provides that {answer}, which is why that option is correct.'
    return f'PSR {code} states the correct interpretation as {answer}, so that option is correct.'


def update(node: object, updates: set[str]) -> int:
    if isinstance(node, list):
        return sum(update(item, updates) for item in node)
    if isinstance(node, dict):
        qid = node.get('id')
        if qid in updates:
            opts = node.get('options') or []
            correct = node.get('correct')
            if isinstance(opts, list) and isinstance(correct, int) and 0 <= correct < len(opts):
                node['explanation'] = build_explanation(str(node.get('question') or ''), str(opts[correct]))
                return 1
            raise SystemExit(f'invalid question shape for {qid}')
        return sum(update(value, updates) for value in node.values())
    return 0


def main() -> int:
    queue = load_json(QUEUE_PATH)
    ids = {
        item['question_id']
        for item in queue['groups']['thin_explanation_enrichment']['items']
        if item['source_subcategory'] == 'psr_interpretation'
    }
    if not ids:
        print('No psr_interpretation items found in queue; nothing to do.')
        return 0

    data = load_json(TARGET_PATH)
    changed = update(data, ids)
    if changed != len(ids):
        raise SystemExit(f'expected {len(ids)} updates, applied {changed}')
    save_json(TARGET_PATH, data)
    print(f'Applied round 155 updates to {changed} psr_interpretation questions in {TARGET_PATH}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
