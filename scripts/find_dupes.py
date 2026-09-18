#!/usr/bin/env python3
"""
Find near-duplicate questions across all topic banks.

Group questions by normalized stem, then within each group flag pairs whose
option sets overlap heavily (heuristic for "same question, different packaging").
"""

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent
SKIP = {"topics.json", "exam_templates.json", "gl_band_weights.json"}


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9 ]", " ", str(s or "").lower()).split()


def iter_questions(obj):
    """Yield (question_text, id, bank, subcategory) for every question."""
    # Top-level questions array (most banks)
    q = obj.get("questions")
    if isinstance(q, list) and q and isinstance(q[0], dict) and q[0].get("question"):
        for item in q:
            if isinstance(item, dict) and item.get("question"):
                yield (str(item.get("question", "")).strip(),
                       str(item.get("id", "")),
                       "top", "")
        return

    # Nested wrapper (ca_general style): questions[0] is an object whose values are lists
    if isinstance(q, list) and q and isinstance(q[0], dict):
        first = q[0]
        if not first.get("question") and any(isinstance(v, list) for v in first.values()):
            for lst in first.values():
                if isinstance(lst, list):
                    for sub in lst:
                        if isinstance(sub, dict) and sub.get("question"):
                            yield (str(sub.get("question", "")).strip(),
                                   str(sub.get("id", "")),
                                   "nested", "")

    # Subcategories
    for sub in obj.get("subcategories", []) or []:
        if not isinstance(sub, dict):
            continue
        name = str(sub.get("name", sub.get("id", "")))
        for qq in (sub.get("questions") or []):
            if isinstance(qq, dict) and qq.get("question"):
                yield (str(qq.get("question", "")).strip(),
                       str(qq.get("id", "")),
                       "subcategory", name)

    # Domains -> subcategories
    for domain in obj.get("domains", []) or []:
        if not isinstance(domain, dict):
            continue
        dname = str(domain.get("name", domain.get("id", "")))
        subs = domain.get("subcategories") or domain.get("topics") or []
        if not isinstance(subs, list):
            continue
        for sub in subs:
            if not isinstance(sub, dict):
                continue
            sname = str(sub.get("name", sub.get("id", "")))
            for qq in (sub.get("questions") or []):
                if isinstance(qq, dict) and qq.get("question"):
                    yield (str(qq.get("question", "")).strip(),
                           str(qq.get("id", "")),
                           "domain_sub", f"{dname} > {sname}")


def option_tokens(options):
    if not options:
        return set()
    return {t for o in options for t in norm(o)}


def jaccard(a, b):
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def main():
    questions = []
    for f in sorted(DATA_DIR.glob("*.json")):
        if f.name in SKIP:
            continue
        try:
            d = json.load(open(f, encoding="utf-8"))
        except Exception as e:
            print(f"SKIP {f.name}: parse error ({e})", file=sys.stderr)
            continue
        for text, qid, loc, sub in iter_questions(d):
            questions.append((text, qid, f.name, loc, sub))

    print(f"Total questions indexed: {len(questions)}", file=sys.stderr)

    # Group by normalized stem
    groups = defaultdict(list)
    for text, qid, bank, loc, sub in questions:
        key = " ".join(sorted(set(norm(text))))  # bag-of-words normalized
        groups[key].append((text, qid, bank, loc, sub))

    dupes = []
    for key, items in groups.items():
        if len(items) < 2:
            continue

        opt_cache = {}
        def get_options(bank, qid):
            if (bank, qid) in opt_cache:
                return opt_cache[(bank, qid)]
            for f in sorted(DATA_DIR.glob("*.json")):
                if f.name in SKIP:
                    continue
                try:
                    d = json.load(open(f, encoding="utf-8"))
                except Exception:
                    continue
                for text, qqid, loc, sub in iter_questions(d):
                    if qqid == qid:
                        opt = None
                        if isinstance(d.get("questions"), list) and d["questions"] and isinstance(d["questions"][0], dict) and d["questions"][0].get("question"):
                            for item in d["questions"]:
                                if isinstance(item, dict) and item.get("id") == qid:
                                    opt = item.get("options")
                                    break
                        elif isinstance(d.get("questions"), list) and d["questions"] and isinstance(d["questions"][0], dict) and not d["questions"][0].get("question"):
                            for item in d["questions"]:
                                if isinstance(item, dict):
                                    for lst in item.values():
                                        if isinstance(lst, list):
                                            for sub in lst:
                                                if isinstance(sub, dict) and sub.get("id") == qid:
                                                    opt = sub.get("options")
                                                    break
                        for sub in d.get("subcategories", []) or []:
                            if not isinstance(sub, dict):
                                continue
                            for qq in (sub.get("questions") or []):
                                if isinstance(qq, dict) and qq.get("id") == qid:
                                    opt = qq.get("options")
                                    break
                        for domain in d.get("domains", []) or []:
                            if not isinstance(domain, dict):
                                continue
                            for s in (domain.get("subcategories") or domain.get("topics") or []) if isinstance(domain.get("subcategories"), list) or isinstance(domain.get("topics"), list) else []:
                                if not isinstance(s, dict):
                                    continue
                                for qq in (s.get("questions") or []):
                                    if isinstance(qq, dict) and qq.get("id") == qid:
                                        opt = qq.get("options")
                                        break
                        opt_cache[(bank, qid)] = opt
                        return opt
            opt_cache[(bank, qid)] = None
            return None

        seen_pairs = set()
        for i, (text1, qid1, bank1, loc1, sub1) in enumerate(items):
            for j, (text2, qid2, bank2, loc2, sub2) in enumerate(items):
                if i >= j:
                    continue
                pair_key = tuple(sorted([(bank1, qid1), (bank2, qid2)]))
                if pair_key in seen_pairs:
                    continue
                seen_pairs.add(pair_key)
                opts1 = get_options(bank1, qid1)
                opts2 = get_options(bank2, qid2)
                toks1 = option_tokens(opts1)
                toks2 = option_tokens(opts2)
                jc = jaccard(toks1, toks2)
                if jc >= 0.4 or (opts1 and opts2 and len(set(opts1) & set(opts2)) >= 2):
                    dupes.append({
                        "bank1": bank1, "qid1": qid1, "text1": text1,
                        "bank2": bank2, "qid2": qid2, "text2": text2,
                        "jaccard": round(jc, 3),
                        "shared_options": sorted(set(opts1 or []) & set(opts2 or [])),
                        "options1": opts1,
                        "options2": opts2,
                        "sub1": sub1, "sub2": sub2,
                    })

    dupes.sort(key=lambda d: (-d["jaccard"], d["bank1"], d["qid1"]))

    print(f"\n=== NEAR-DUPLICATE PAIRS FOUND: {len(dupes)} ===\n", file=sys.stderr)
    for d in dupes:
        print(f"[{d['bank1']}] {d['qid1']}: {d['text1']}")
        print(f"   options: {d['options1']}")
        print(f"[{d['bank2']}] {d['qid2']}: {d['text2']}")
        print(f"   options: {d['options2']}")
        print(f"   Jaccard(option tokens): {d['jaccard']}")
        print(f"   shared options: {d['shared_options']}")
        print(f"   sub1={d['sub1']!r}  sub2={d['sub2']!r}")
        print("---")

    print(f"\nTotal pairs: {len(dupes)}", file=sys.stderr)


if __name__ == "__main__":
    main()
