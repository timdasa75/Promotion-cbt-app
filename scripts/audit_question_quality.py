#!/usr/bin/env python3
"""
Audit question quality across topic files.

Outputs:
  - docs/question_quality_audit.md
  - docs/question_quality_audit.json

The script flags:
  1) Duplicate question IDs
  2) Exact duplicate question text
  3) Near duplicate question text
  4) Likely topic/subcategory relevance mismatches
"""

from __future__ import annotations

import argparse
import json
import math
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Dict, Iterable, List, Tuple


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
TOPICS_FILE = DATA_DIR / "topics.json"
DEFAULT_JSON_OUT = ROOT / "docs" / "question_quality_audit.json"
DEFAULT_MD_OUT = ROOT / "docs" / "question_quality_audit.md"


STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "to",
    "was",
    "were",
    "what",
    "which",
    "who",
    "with",
}


TOPIC_HINTS = {
    "psr": {"psr", "probation", "promotion", "leave", "misconduct", "officer", "gl", "appointment"},
    "financial_regulations": {"budget", "virement", "treasury", "vote", "expenditure", "imprest", "warrant", "fr"},
    "procurement_act": {"procurement", "bid", "tender", "contract", "bpp", "vendor", "evaluation", "award"},
    "constitutional_law": {"constitution", "foi", "court", "legal", "statutory", "rights", "law"},
    "civil_service_admin": {"ethics", "integrity", "grievance", "conduct", "discipline", "service", "administration"},
    "leadership_management": {"leadership", "strategic", "management", "negotiation", "dispute", "union"},
    "ict_management": {"ict", "digital", "cyber", "e-governance", "security", "technology"},
    "policy_analysis": {"policy", "formulation", "implementation", "evaluation", "planning"},
    "general_current_affairs": {"current", "recent", "today", "year", "affairs", "news", "international"},
    "competency_framework": {"numerical", "verbal", "reasoning", "analytical", "logic", "comprehension"},
}


def load_json(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def normalize_text(text: str) -> str:
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def tokenize(text: str) -> List[str]:
    norm = normalize_text(text)
    return [tok for tok in norm.split() if tok and tok not in STOPWORDS]


def safe_get_questions(subcategory: dict) -> List[dict]:
    questions = subcategory.get("questions")
    if not isinstance(questions, list):
        return []
    if (
        questions
        and isinstance(questions[0], dict)
        and subcategory.get("id")
        and isinstance(questions[0].get(subcategory["id"]), list)
    ):
        nested = questions[0].get(subcategory["id"], [])
        return [q for q in nested if isinstance(q, dict)]
    return [q for q in questions if isinstance(q, dict)]


@dataclass
class QEntry:
    topic_id: str
    topic_name: str
    subcategory_id: str
    subcategory_name: str
    question_id: str
    question: str
    keywords: List[str]
    chapter: str
    source_file: str
    norm_question: str
    tokens: List[str]


def collect_entries() -> List[QEntry]:
    topics_doc = load_json(TOPICS_FILE)
    topics = topics_doc.get("topics", [])
    entries: List[QEntry] = []

    for topic in topics:
        if not isinstance(topic, dict):
            continue
        topic_id = topic.get("id", "")
        topic_name = topic.get("name", topic_id)
        rel_file = topic.get("file")
        if not rel_file:
            continue
        path = ROOT / rel_file
        if not path.exists():
            continue
        data = load_json(path)
        subcategories = data.get("subcategories", []) if isinstance(data, dict) else []
        for sub in subcategories:
            if not isinstance(sub, dict):
                continue
            sub_id = sub.get("id", "")
            sub_name = sub.get("name", sub_id)
            for q in safe_get_questions(sub):
                question_text = str(q.get("question", "")).strip()
                entries.append(
                    QEntry(
                        topic_id=topic_id,
                        topic_name=topic_name,
                        subcategory_id=sub_id,
                        subcategory_name=sub_name,
                        question_id=str(q.get("id", "")).strip(),
                        question=question_text,
                        keywords=[str(k) for k in (q.get("keywords") or []) if isinstance(k, (str, int, float))],
                        chapter=str(q.get("chapter", "")).strip(),
                        source_file=rel_file,
                        norm_question=normalize_text(question_text),
                        tokens=tokenize(question_text),
                    )
                )
    return entries


def topic_profile_tokens(entries: List[QEntry]) -> Dict[str, set]:
    by_topic = defaultdict(set)
    for entry in entries:
        by_topic[entry.topic_id].update(tokenize(entry.topic_name))
        by_topic[entry.topic_id].update(tokenize(entry.subcategory_name))
        by_topic[entry.topic_id].update(TOPIC_HINTS.get(entry.topic_id, set()))
    return by_topic


def subcategory_profile_tokens(entries: List[QEntry]) -> Dict[Tuple[str, str], set]:
    by_subcat = defaultdict(set)
    for entry in entries:
        key = (entry.topic_id, entry.subcategory_id)
        by_subcat[key].update(tokenize(entry.subcategory_name))
    return by_subcat


def overlap_score(question_tokens: Iterable[str], profile_tokens: set) -> int:
    return len(set(question_tokens).intersection(profile_tokens))


def build_audit(entries: List[QEntry], near_dup_threshold: float = 0.92):
    duplicate_ids = defaultdict(list)
    duplicate_text = defaultdict(list)

    for e in entries:
        if e.question_id:
            duplicate_ids[e.question_id].append(e)
        if e.norm_question:
            duplicate_text[e.norm_question].append(e)

    duplicate_ids = {qid: items for qid, items in duplicate_ids.items() if len(items) > 1}
    exact_duplicate_text = {txt: items for txt, items in duplicate_text.items() if len(items) > 1}

    # Near duplicates: compare only within coarse buckets to avoid O(n^2) global.
    buckets = defaultdict(list)
    for idx, e in enumerate(entries):
        sig_tokens = e.tokens[:4]
        sig = " ".join(sig_tokens)
        length_bucket = int(math.floor(len(e.tokens) / 4))
        buckets[(sig, length_bucket)].append((idx, e))

    near_duplicates = []
    seen_pairs = set()
    for _, bucket in buckets.items():
        if len(bucket) < 2:
            continue
        for i in range(len(bucket)):
            idx_a, a = bucket[i]
            for j in range(i + 1, len(bucket)):
                idx_b, b = bucket[j]
                if (idx_a, idx_b) in seen_pairs:
                    continue
                if not a.norm_question or not b.norm_question:
                    continue
                ratio = SequenceMatcher(None, a.norm_question, b.norm_question).ratio()
                if ratio >= near_dup_threshold and a.norm_question != b.norm_question:
                    near_duplicates.append(
                        {
                            "similarity": round(ratio, 4),
                            "a": summarize_entry(a),
                            "b": summarize_entry(b),
                        }
                    )
                    seen_pairs.add((idx_a, idx_b))

    profiles_by_topic = topic_profile_tokens(entries)
    profiles_by_subcat = subcategory_profile_tokens(entries)

    relevance_flags = []
    for e in entries:
        if not e.tokens:
            continue
        own_topic_profile = profiles_by_topic.get(e.topic_id, set())
        own_subcat_profile = profiles_by_subcat.get((e.topic_id, e.subcategory_id), set())

        q_tokens = set(e.tokens + tokenize(" ".join(e.keywords)) + tokenize(e.chapter))
        own_topic_score = overlap_score(q_tokens, own_topic_profile)
        own_subcat_score = overlap_score(q_tokens, own_subcat_profile)

        other_scores = []
        for topic_id, profile in profiles_by_topic.items():
            if topic_id == e.topic_id:
                continue
            score = overlap_score(q_tokens, profile)
            if score > 0:
                other_scores.append((topic_id, score))
        other_scores.sort(key=lambda x: x[1], reverse=True)
        best_other_topic, best_other_score = other_scores[0] if other_scores else ("", 0)

        reasons = []
        if own_subcat_score == 0 and own_topic_score <= 1:
            reasons.append("low_own_topic_subcategory_overlap")
        if best_other_score >= 3 and best_other_score >= own_topic_score + 2:
            reasons.append(f"looks_closer_to:{best_other_topic}")

        if reasons:
            relevance_flags.append(
                {
                    "question": summarize_entry(e),
                    "own_topic_score": own_topic_score,
                    "own_subcategory_score": own_subcat_score,
                    "best_other_topic": best_other_topic or None,
                    "best_other_score": best_other_score,
                    "reasons": reasons,
                }
            )

    return {
        "summary": {
            "total_questions": len(entries),
            "duplicate_ids": len(duplicate_ids),
            "exact_duplicate_text_groups": len(exact_duplicate_text),
            "near_duplicate_pairs": len(near_duplicates),
            "relevance_flags": len(relevance_flags),
        },
        "duplicate_ids": {qid: [summarize_entry(e) for e in items] for qid, items in sorted(duplicate_ids.items())},
        "exact_duplicate_text": {
            txt: [summarize_entry(e) for e in items] for txt, items in sorted(exact_duplicate_text.items())
        },
        "near_duplicates": sorted(near_duplicates, key=lambda x: x["similarity"], reverse=True),
        "relevance_flags": sorted(
            relevance_flags,
            key=lambda x: (
                x["own_subcategory_score"],
                x["own_topic_score"],
                -x["best_other_score"],
            ),
        ),
    }


def summarize_entry(e: QEntry) -> dict:
    return {
        "topic_id": e.topic_id,
        "subcategory_id": e.subcategory_id,
        "question_id": e.question_id,
        "source_file": e.source_file,
        "question": e.question,
    }


def write_markdown(report: dict, path: Path):
    s = report["summary"]
    lines = []
    lines.append("# Question Quality Audit")
    lines.append("")
    lines.append("## Summary")
    lines.append(f"- Total questions scanned: **{s['total_questions']}**")
    lines.append(f"- Duplicate question IDs: **{s['duplicate_ids']}**")
    lines.append(f"- Exact duplicate text groups: **{s['exact_duplicate_text_groups']}**")
    lines.append(f"- Near duplicate pairs: **{s['near_duplicate_pairs']}**")
    lines.append(f"- Relevance flags: **{s['relevance_flags']}**")
    lines.append("")

    lines.append("## Top Duplicate ID Findings")
    if not report["duplicate_ids"]:
        lines.append("- None")
    else:
        for qid, items in list(report["duplicate_ids"].items())[:25]:
            refs = [f"{i['topic_id']}/{i['subcategory_id']} ({i['source_file']})" for i in items]
            lines.append(f"- `{qid}` -> {', '.join(refs)}")
    lines.append("")

    lines.append("## Top Exact Duplicate Question Text Findings")
    if not report["exact_duplicate_text"]:
        lines.append("- None")
    else:
        for text, items in list(report["exact_duplicate_text"].items())[:25]:
            refs = [f"{i['question_id']} [{i['topic_id']}/{i['subcategory_id']}]" for i in items]
            lines.append(f"- \"{text[:140]}{'...' if len(text) > 140 else ''}\" -> {', '.join(refs)}")
    lines.append("")

    lines.append("## Top Near Duplicate Pairs")
    if not report["near_duplicates"]:
        lines.append("- None")
    else:
        for item in report["near_duplicates"][:40]:
            a = item["a"]
            b = item["b"]
            lines.append(
                f"- sim={item['similarity']} :: `{a['question_id']}` ({a['topic_id']}/{a['subcategory_id']})"
                f" <-> `{b['question_id']}` ({b['topic_id']}/{b['subcategory_id']})"
            )
    lines.append("")

    lines.append("## Top Relevance Flags")
    if not report["relevance_flags"]:
        lines.append("- None")
    else:
        for item in report["relevance_flags"][:80]:
            q = item["question"]
            reason = ", ".join(item["reasons"])
            lines.append(
                f"- `{q['question_id']}` [{q['topic_id']}/{q['subcategory_id']}] "
                f"(own_topic={item['own_topic_score']}, own_sub={item['own_subcategory_score']}, "
                f"best_other={item['best_other_topic']}:{item['best_other_score']}) -> {reason}"
            )
            lines.append(f"  - {q['question'][:180]}{'...' if len(q['question']) > 180 else ''}")

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Audit question quality and relevance")
    parser.add_argument("--json-out", default=str(DEFAULT_JSON_OUT))
    parser.add_argument("--md-out", default=str(DEFAULT_MD_OUT))
    parser.add_argument("--near-threshold", type=float, default=0.92)
    args = parser.parse_args()

    entries = collect_entries()
    report = build_audit(entries, near_dup_threshold=args.near_threshold)

    json_out = Path(args.json_out)
    md_out = Path(args.md_out)
    json_out.parent.mkdir(parents=True, exist_ok=True)
    json_out.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    write_markdown(report, md_out)

    print("Question quality audit complete")
    print(json.dumps(report["summary"], indent=2))
    print(f"JSON report: {json_out}")
    print(f"Markdown report: {md_out}")


if __name__ == "__main__":
    main()
