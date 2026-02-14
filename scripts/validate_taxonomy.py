#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
from collections import Counter, defaultdict

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
TOPICS_FILE = DATA_DIR / "topics.json"


def load_json(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def collect_subcategories(data):
    if isinstance(data, dict):
        if isinstance(data.get("subcategories"), list):
            return [s for s in data["subcategories"] if isinstance(s, dict)]
        if isinstance(data.get("domains"), list):
            out = []
            for d in data["domains"]:
                if isinstance(d, dict) and isinstance(d.get("topics"), list):
                    out.extend([s for s in d["topics"] if isinstance(s, dict)])
            return out
    elif isinstance(data, list):
        return [s for s in data if isinstance(s, dict)]
    return []


def main():
    parser = argparse.ArgumentParser(description="Validate 10-topic taxonomy integrity")
    parser.add_argument("--strict-duplicates", action="store_true", help="Fail when duplicate question IDs are found")
    args = parser.parse_args()

    topics_doc = load_json(TOPICS_FILE)
    topics = topics_doc.get("topics", [])

    errors = []
    warnings = []
    summary = []

    topic_ids = [t.get("id") for t in topics if isinstance(t, dict)]
    dup_topic_ids = [k for k, c in Counter(topic_ids).items() if c > 1 and k]
    if dup_topic_ids:
        errors.append(f"Duplicate topic ids: {dup_topic_ids}")

    qid_occurrences = defaultdict(list)

    for topic in topics:
        tid = topic.get("id", "<missing>")
        file_path = topic.get("file")
        if not file_path:
            errors.append(f"Topic '{tid}' has no data file configured")
            continue

        files = [file_path]
        source_subcats = {}
        qcount = 0

        for rel in files:
            path = ROOT / rel
            if not path.exists():
                errors.append(f"Topic '{tid}' references missing file: {rel}")
                continue
            try:
                data = load_json(path)
            except Exception as e:
                errors.append(f"Failed parsing '{rel}': {e}")
                continue

            for sub in collect_subcategories(data):
                sid = sub.get("id")
                if sid:
                    source_subcats[sid] = sub
                for q in sub.get("questions", []) if isinstance(sub.get("questions"), list) else []:
                    if isinstance(q, dict) and q.get("id"):
                        qid_occurrences[q["id"]].append(f"{rel}:{sid}")
                qcount += len(sub.get("questions", [])) if isinstance(sub.get("questions"), list) else 0

        topic_subs = topic.get("subcategories", [])
        topic_sub_ids = [s.get("id") for s in topic_subs if isinstance(s, dict)]
        dup_subs = [k for k, c in Counter(topic_sub_ids).items() if c > 1 and k]
        if dup_subs:
            errors.append(f"Topic '{tid}' has duplicate subcategory ids: {dup_subs}")

        missing = [sid for sid in topic_sub_ids if sid and sid not in source_subcats]
        if missing:
            errors.append(f"Topic '{tid}' references unknown subcategory ids: {missing}")

        empty = [sid for sid in topic_sub_ids if sid in source_subcats and not source_subcats[sid].get("questions")]
        if empty:
            warnings.append(f"Topic '{tid}' has subcategories with zero questions: {empty}")

        summary.append((tid, len(topic_sub_ids), qcount, files))

    duplicate_qids = {qid: refs for qid, refs in qid_occurrences.items() if len(refs) > 1}
    if duplicate_qids:
        msg = f"Found {len(duplicate_qids)} duplicate question IDs across source files"
        if args.strict_duplicates:
            errors.append(msg)
        else:
            warnings.append(msg)

    print("Validation summary")
    for tid, sub_count, qcount, files in summary:
        print(f"- {tid}: subcategories={sub_count}, questions={qcount}, files={files}")

    if warnings:
        print("\nWarnings:")
        for w in warnings:
            print(f"- {w}")

    if errors:
        print("\nErrors:")
        for e in errors:
            print(f"- {e}")
        raise SystemExit(1)

    print("\nTaxonomy validation passed")


if __name__ == "__main__":
    main()
