#!/usr/bin/env python3
"""
Extract raw questions from PDF into JSON.
Outputs:
  - docs/pdf_questions_raw.json
"""

from __future__ import annotations

import json
import re
from pathlib import Path
import PyPDF2

ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "Promotion  Exams CBT Questions.pdf"
OUT_JSON = ROOT / "docs" / "pdf_questions_raw.json"

HEADER_PATTERNS = [
    re.compile(r"New Track Publication", re.IGNORECASE),
]


def clean_text(text: str) -> str:
    text = text.replace("\r", "\n")
    for pat in HEADER_PATTERNS:
        text = pat.sub("", text)
    text = re.sub(r"\n{2,}", "\n", text)
    return text


def split_blocks(text: str) -> list[str]:
    # Ensure question numbers start on new lines
    text = re.sub(r"\s+(\d{1,3})\.\s", r"\n\1. ", text)
    matches = list(re.finditer(r"(?:^|\n)(\d{1,3})\.\s", text))
    blocks = []
    for i, m in enumerate(matches):
        start = m.start(1)
        end = matches[i + 1].start(1) if i + 1 < len(matches) else len(text)
        block = text[start:end].strip()
        if block:
            blocks.append(block)
    return blocks


def parse_block(block: str):
    # Remove leading number
    block = re.sub(r"^\d{1,3}\.\s*", "", block).strip()

    # Extract Correct Answer
    correct_letter = None
    m = re.search(r"Correct Answer\s*[:\-]?\s*([A-D])", block, re.IGNORECASE)
    if m:
        correct_letter = m.group(1).upper()
        block = block[: m.start()].strip() + " " + block[m.end() :].strip()

    # Extract Explanation if present
    explanation = ""
    m = re.search(r"Explanation\s*[:\-]?\s*(.*)$", block, re.IGNORECASE | re.DOTALL)
    if m:
        explanation = m.group(1).strip()
        block = block[: m.start()].strip()

    # Options
    opt_matches = list(re.finditer(r"\b([A-D])\.\s", block))
    if len(opt_matches) < 2:
        return None

    stem = block[: opt_matches[0].start()].strip()
    options = []
    labels = []
    for i, om in enumerate(opt_matches):
        label = om.group(1)
        start = om.end()
        end = opt_matches[i + 1].start() if i + 1 < len(opt_matches) else len(block)
        opt_text = block[start:end].strip()
        options.append(opt_text)
        labels.append(label)

    if not stem or len(options) < 2:
        return None

    return {
        "question": stem,
        "options": options,
        "labels": labels,
        "correct_letter": correct_letter,
        "explanation": explanation,
    }


def main() -> int:
    if not PDF_PATH.exists():
        print(f"Missing PDF: {PDF_PATH}")
        return 1

    reader = PyPDF2.PdfReader(str(PDF_PATH))
    raw_text = ""
    for page in reader.pages:
        raw_text += "\n" + (page.extract_text() or "")

    raw_text = clean_text(raw_text)
    blocks = split_blocks(raw_text)

    items = []
    for block in blocks:
        parsed = parse_block(block)
        if parsed:
            items.append(parsed)

    OUT_JSON.write_text(json.dumps({"items": items}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Extracted: {len(items)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
