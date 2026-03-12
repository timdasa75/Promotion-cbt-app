#!/usr/bin/env python3
"""
Extract questions from the consolidated .docx and compare against the app's JSON bank.
Outputs:
  - docs/docx_missing_questions.json
  - docs/docx_missing_questions.txt
  - docs/docx_missing_questions_deduped.json
  - docs/docx_missing_questions_deduped.txt
  - docs/docx_near_duplicates.json
"""

from __future__ import annotations

import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
DOCX_PATH = ROOT / "CONSOLIDATED QUESTION BANK REPORT.docx"
DATA_DIR = ROOT / "data"
OUT_JSON = ROOT / "docs" / "docx_missing_questions.json"
OUT_TXT = ROOT / "docs" / "docx_missing_questions.txt"
OUT_JSON_DEDUP = ROOT / "docs" / "docx_missing_questions_deduped.json"
OUT_TXT_DEDUP = ROOT / "docs" / "docx_missing_questions_deduped.txt"
OUT_NEAR = ROOT / "docs" / "docx_near_duplicates.json"

SIMILARITY_THRESHOLD = 0.85

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def tokenize(text: str) -> list[str]:
    norm = normalize(text)
    return [t for t in norm.split() if t]


def extract_paragraphs(docx_path: Path) -> list[str]:
    with zipfile.ZipFile(docx_path) as z:
        xml = z.read("word/document.xml")
    root = ET.fromstring(xml)
    paragraphs: list[str] = []
    for p in root.findall(".//w:p", NS):
        texts = [t.text for t in p.findall(".//w:t", NS) if t.text]
        if texts:
            paragraph = "".join(texts).strip()
            if paragraph:
                paragraphs.append(paragraph)
    return paragraphs


def parse_docx_questions(paragraphs: Iterable[str]) -> list[str]:
    questions: list[str] = []
    q_re = re.compile(r"^question\s*\d+\s*[:.)-]\s*(.+)$", re.IGNORECASE)
    for p in paragraphs:
        m = q_re.match(p)
        if not m:
            continue
        body = m.group(1).strip()
        # Split off options (a) b) c) d) or a. b. etc.)
        stem = re.split(r"\b[a-dA-D]\)\s*", body, maxsplit=1)[0].strip()
        if stem == body:
            stem = re.split(r"\b[a-dA-D]\.\s*", body, maxsplit=1)[0].strip()
        if stem:
            questions.append(stem)
    return questions


def iter_question_texts(obj: Any, acc: list[str]) -> None:
    if isinstance(obj, dict):
        q = obj.get("question")
        if isinstance(q, str) and q.strip():
            acc.append(q.strip())
        for value in obj.values():
            iter_question_texts(value, acc)
    elif isinstance(obj, list):
        for item in obj:
            iter_question_texts(item, acc)


def load_app_questions() -> list[str]:
    questions: list[str] = []
    for path in DATA_DIR.glob("*.json"):
        if path.name == "topics.json":
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        iter_question_texts(data, questions)
    return questions


def jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    inter = a.intersection(b)
    if not inter:
        return 0.0
    return len(inter) / len(a.union(b))


def main() -> int:
    if not DOCX_PATH.exists():
        print(f"Missing docx file: {DOCX_PATH}")
        return 1

    paragraphs = extract_paragraphs(DOCX_PATH)
    docx_questions = parse_docx_questions(paragraphs)

    app_questions = load_app_questions()
    app_norm = [normalize(q) for q in app_questions if q]
    app_norm_set = set(app_norm)
    app_tokens = [set(tokenize(q)) for q in app_questions]

    inverted: dict[str, set[int]] = {}
    for idx, tokens in enumerate(app_tokens):
        for t in tokens:
            inverted.setdefault(t, set()).add(idx)

    missing: list[dict[str, str]] = []
    missing_dedup: list[dict[str, str]] = []
    near_duplicates: list[dict[str, str]] = []

    for q in docx_questions:
        norm = normalize(q)
        if not norm:
            continue
        if norm in app_norm_set:
            continue
        missing.append({"question": q})

        q_tokens = set(tokenize(q))
        candidates: set[int] = set()
        for t in q_tokens:
            candidates.update(inverted.get(t, set()))

        best_score = 0.0
        best_match = ""
        for idx in candidates:
            score = jaccard(q_tokens, app_tokens[idx])
            if score > best_score:
                best_score = score
                best_match = app_questions[idx]
        if best_score >= SIMILARITY_THRESHOLD:
            near_duplicates.append(
                {
                    "question": q,
                    "closest_match": best_match,
                    "similarity": round(best_score, 4),
                }
            )
        else:
            missing_dedup.append({"question": q})

    OUT_JSON.write_text(json.dumps({"missing": missing}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUT_TXT.write_text("\n".join([m["question"] for m in missing]) + "\n", encoding="utf-8")

    OUT_JSON_DEDUP.write_text(
        json.dumps({"missing": missing_dedup}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    OUT_TXT_DEDUP.write_text("\n".join([m["question"] for m in missing_dedup]) + "\n", encoding="utf-8")
    OUT_NEAR.write_text(json.dumps({"near_duplicates": near_duplicates}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Docx questions: {len(docx_questions)}")
    print(f"Missing from app (exact): {len(missing)}")
    print(f"Near-duplicates (>= {SIMILARITY_THRESHOLD}): {len(near_duplicates)}")
    print(f"Missing after dedupe: {len(missing_dedup)}")
    print(f"Wrote: {OUT_JSON}")
    print(f"Wrote: {OUT_TXT}")
    print(f"Wrote: {OUT_JSON_DEDUP}")
    print(f"Wrote: {OUT_TXT_DEDUP}")
    print(f"Wrote: {OUT_NEAR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
