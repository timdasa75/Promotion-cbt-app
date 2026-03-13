#!/usr/bin/env python3
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / 'data' / 'topics.json'
OUT_FILE = ROOT / 'docs' / 'spot_check_samples.md'
TODAY = '2026-03-13'
SAMPLE_SIZE = 5


def load_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def collect_subcategories(payload):
    if isinstance(payload, dict):
        if isinstance(payload.get('subcategories'), list):
            return [s for s in payload['subcategories'] if isinstance(s, dict)]
        if isinstance(payload.get('domains'), list):
            out = []
            for domain in payload['domains']:
                if isinstance(domain, dict) and isinstance(domain.get('topics'), list):
                    out.extend([s for s in domain['topics'] if isinstance(s, dict)])
            return out
    if isinstance(payload, list):
        return [s for s in payload if isinstance(s, dict)]
    return []


def get_questions_container(subcategory):
    questions = subcategory.get('questions')
    if not isinstance(questions, list):
        return []
    sub_id = subcategory.get('id')
    if questions and isinstance(questions[0], dict) and sub_id and isinstance(questions[0].get(sub_id), list):
        return questions[0][sub_id]
    return questions


def option_letter(idx):
    return chr(65 + idx)


def main():
    topics_doc = load_json(TOPICS_FILE)
    lines = [
        '# Spot-Check Sample Report',
        '',
        f'Sample size per subtopic: {SAMPLE_SIZE}',
        f'Preference: questions reviewed on {TODAY}',
        '',
    ]

    for topic in topics_doc.get('topics', []):
        rel = topic.get('file')
        if not rel:
            continue
        payload = load_json(ROOT / rel)
        for sub in collect_subcategories(payload):
            sub_id = sub.get('id')
            sub_name = sub.get('name', sub_id)
            q_list = get_questions_container(sub)
            if not isinstance(q_list, list) or not q_list:
                continue

            new_items = [q for q in q_list if q.get('lastReviewed') == TODAY]
            old_items = [q for q in q_list if q.get('lastReviewed') != TODAY]
            rng = random.Random(f"{topic.get('id')}-{sub_id}")
            rng.shuffle(new_items)
            rng.shuffle(old_items)

            sample = new_items[:SAMPLE_SIZE]
            if len(sample) < SAMPLE_SIZE:
                sample += old_items[: (SAMPLE_SIZE - len(sample))]

            lines.append(f"**{topic.get('name')} - {sub_name}**")
            lines.append(f"Sample size: {len(sample)} (new: {len([q for q in sample if q.get('lastReviewed') == TODAY])}, existing: {len([q for q in sample if q.get('lastReviewed') != TODAY])})")

            for idx, q in enumerate(sample, 1):
                qid = q.get('id', 'unknown')
                diff = q.get('difficulty', 'n/a')
                question = q.get('question', '').strip()
                options = q.get('options') or []
                correct = q.get('correct')
                explanation = q.get('explanation', '').strip()
                lines.append(f"{idx}. `{qid}` ({diff})")
                lines.append(f"Question: {question}")
                for opt_idx, opt in enumerate(options):
                    lines.append(f"{option_letter(opt_idx)}. {opt}")
                if isinstance(correct, int) and 0 <= correct < len(options):
                    lines.append(f"Correct: {option_letter(correct)}")
                else:
                    lines.append("Correct: n/a")
                lines.append(f"Explanation: {explanation}")
            lines.append("")

    OUT_FILE.write_text("\n".join(lines) + "\n", encoding='utf-8')
    print(f"Wrote {OUT_FILE}")


if __name__ == '__main__':
    main()
