#!/usr/bin/env python3
"""
Import deduped docx questions into psr_rules.json under a dedicated subcategory.
Requires docs/docx_missing_questions_deduped.json to exist.
Outputs:
  - docs/docx_imported_questions.json
"""

from __future__ import annotations

import json
import re
import zipfile
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
DOCX_PATH = ROOT / "CONSOLIDATED QUESTION BANK REPORT.docx"
DEDUP_PATH = ROOT / "docs" / "docx_missing_questions_deduped.json"
PSR_PATH = ROOT / "data" / "psr_rules.json"
TOPICS_PATH = ROOT / "data" / "topics.json"
OUT_IMPORTED = ROOT / "docs" / "docx_imported_questions.json"

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

IMPORT_SUBCATEGORY_ID = "psr_docx_import"
IMPORT_SUBCATEGORY_NAME = "Docx Import (Unreviewed)"
IMPORT_SUBCATEGORY_DESC = "Consolidated PSR question bank import pending SME review."
IMPORT_SOURCE_DOC = "Public Service Rules (PSR 2021)"
IMPORT_SOURCE_SECTION = "Docx Import"
IMPORT_CHAPTER = "Docx Import"
IMPORT_DIFFICULTY = "medium"
IMPORT_YEAR = 2021
IMPORT_LAST_REVIEWED = date.today().isoformat()

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
    "does",
    "do",
    "shall",
    "not",
}


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def keywords_from(text: str, limit: int = 6) -> list[str]:
    tokens = [t for t in normalize(text).split() if t and t not in STOPWORDS]
    seen = []
    for t in tokens:
        if t not in seen:
            seen.append(t)
        if len(seen) >= limit:
            break
    return seen


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def dump_json(path: Path, payload):
    data = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    path.write_bytes(data.encode("utf-8", "surrogatepass"))


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


def parse_docx_questions(paragraphs: Iterable[str]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    q_re = re.compile(r"^Question\s*\d+\s*[:.)-]\s*(.+)$", re.IGNORECASE)
    for p in paragraphs:
        m = q_re.match(p)
        if not m:
            continue
        body = m.group(1).strip()
        if "Correct Answer:" not in body:
            continue
        main, rest = body.split("Correct Answer:", 1)
        explanation = ""
        if "Explanation/Citation:" in rest:
            ans_part, explanation = rest.split("Explanation/Citation:", 1)
        else:
            ans_part = rest
        main = main.strip()
        parts = re.split(r"\b([a-dA-D])\)\s*", main)
        stem = parts[0].strip()
        labels: list[str] = []
        options: list[str] = []
        for i in range(1, len(parts), 2):
            label = parts[i].lower()
            option_text = parts[i + 1].strip()
            labels.append(label)
            options.append(option_text)
        if not stem or len(options) < 2:
            continue
        ans = ans_part.strip()
        correct_idx = None
        m2 = re.match(r"([a-dA-D])\)\s*(.*)", ans)
        if m2:
            label = m2.group(1).lower()
            if label in labels:
                correct_idx = labels.index(label)
        else:
            # Fall back to matching answer text against options
            for i, opt in enumerate(options):
                if ans.strip().lower() == opt.strip().lower():
                    correct_idx = i
                    break
        if correct_idx is None:
            continue
        citation = explanation.strip()
        if citation:
            explanation_text = f"Correct option: {chr(65 + correct_idx)} ({options[correct_idx]}). Citation: {citation}"
        else:
            explanation_text = f"Correct option: {chr(65 + correct_idx)} ({options[correct_idx]})."
        items.append(
            {
                "question": stem,
                "options": options,
                "correct": correct_idx,
                "explanation": explanation_text,
            }
        )
    return items


def collect_existing_questions(payload: dict[str, Any]) -> set[str]:
    out = set()
    for sub in payload.get("subcategories", []):
        for q in sub.get("questions", []):
            if isinstance(q, dict) and isinstance(q.get("question"), str):
                out.add(normalize(q["question"]))
    return out


def next_id(existing_ids: set[str], prefix: str, start: int = 1) -> str:
    counter = start
    while True:
        candidate = f"{prefix}{counter:03d}"
        if candidate not in existing_ids:
            return candidate
        counter += 1


def ensure_subcategory(psr_payload: dict[str, Any]) -> dict[str, Any]:
    for sub in psr_payload.get("subcategories", []):
        if sub.get("id") == IMPORT_SUBCATEGORY_ID:
            return sub
    new_sub = {
        "id": IMPORT_SUBCATEGORY_ID,
        "name": IMPORT_SUBCATEGORY_NAME,
        "description": IMPORT_SUBCATEGORY_DESC,
        "questions": [],
    }
    psr_payload.setdefault("subcategories", []).append(new_sub)
    return new_sub


def ensure_topics_subcategory(topics_payload: dict[str, Any]) -> None:
    for topic in topics_payload.get("topics", []):
        if topic.get("id") == "psr":
            subcats = topic.get("subcategories", [])
            if not any(s.get("id") == IMPORT_SUBCATEGORY_ID for s in subcats):
                subcats.append(
                    {
                        "id": IMPORT_SUBCATEGORY_ID,
                        "name": IMPORT_SUBCATEGORY_NAME,
                        "description": IMPORT_SUBCATEGORY_DESC,
                        "icon": "\U0001F4D6",
                    }
                )
            topic["subcategories"] = subcats
            return


def main() -> int:
    if not DOCX_PATH.exists():
        print(f"Missing docx file: {DOCX_PATH}")
        return 1
    if not DEDUP_PATH.exists():
        print(f"Missing dedup list: {DEDUP_PATH}")
        return 1

    dedup_doc = load_json(DEDUP_PATH)
    dedup_questions = {normalize(item.get("question", "")) for item in dedup_doc.get("missing", []) if item.get("question")}

    paragraphs = extract_paragraphs(DOCX_PATH)
    docx_items = parse_docx_questions(paragraphs)

    psr_payload = load_json(PSR_PATH)
    existing_norm = collect_existing_questions(psr_payload)
    subcategory = ensure_subcategory(psr_payload)

    existing_ids = {q.get("id") for sub in psr_payload.get("subcategories", []) for q in sub.get("questions", []) if isinstance(q, dict)}

    imported = []
    for item in docx_items:
        norm = normalize(item["question"])
        if not norm or norm not in dedup_questions:
            continue
        if norm in existing_norm:
            continue
        qid = next_id(existing_ids, "psr_docx_")
        existing_ids.add(qid)
        question_obj = {
            "id": qid,
            "question": item["question"],
            "options": item["options"],
            "correct": item["correct"],
            "explanation": item["explanation"],
            "difficulty": IMPORT_DIFFICULTY,
            "chapter": IMPORT_CHAPTER,
            "keywords": keywords_from(item["question"]),
            "sourceDocument": IMPORT_SOURCE_DOC,
            "sourceSection": IMPORT_SOURCE_SECTION,
            "year": IMPORT_YEAR,
            "lastReviewed": IMPORT_LAST_REVIEWED,
        }
        subcategory.setdefault("questions", []).append(question_obj)
        imported.append(question_obj)

    dump_json(PSR_PATH, psr_payload)

    topics_payload = load_json(TOPICS_PATH)
    ensure_topics_subcategory(topics_payload)
    dump_json(TOPICS_PATH, topics_payload)

    OUT_IMPORTED.write_text(json.dumps({"imported": imported}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Imported questions: {len(imported)}")
    print(f"Updated: {PSR_PATH}")
    print(f"Updated: {TOPICS_PATH}")
    print(f"Wrote: {OUT_IMPORTED}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())



