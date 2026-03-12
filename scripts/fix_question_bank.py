#!/usr/bin/env python3
"""
Sweep question bank JSON files for:
  - Mojibake/encoding issues (e.g., â‚¦ -> ₦, emoji)
  - Zero-based option references in explanations
  - Explanation option-letter/index mismatches vs. correct index
  - Correct index out-of-range
  - Basic arithmetic validation (flag mismatches)

Writes updated JSON back with UTF-8 encoding.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Iterable, Tuple


ROOT = Path(__file__).resolve().parents[1]
SCAN_DIRS = [ROOT / "data", ROOT / "docs"]
EXCLUDE_DIRS = {"node_modules", ".git", "test-results"}

MOJIBAKE_MARKERS = ("â", "Ã", "ðŸ")
REPLACEMENT_CHAR = "�"

REPLACEMENTS = {
    "\u00e2\u20ac\u201c": "\u2013",  # â€“ -> –
    "\u00e2\u20ac\u201d": "\u2014",  # â€” -> —
    "\u00e2\u20ac\u2122": "\u2019",  # â€™ -> ’
    "\u00e2\u20ac\u02dc": "\u2018",  # â€˜ -> ‘
    "\u00e2\u20ac\u0153": "\u201c",  # â€œ -> “
    "\u00e2\u20ac\u009d": "\u201d",  # â€ -> ”
    "\u00e2\u20ac\u00a6": "\u2026",  # â€¦ -> …
    "\u00e2\u20ac\u00a2": "\u2022",  # â€¢ -> •
    "\u00e2\u201a\u00a6": "\u20a6",  # â‚¦ -> ₦
    "\u00c3\u2014": "\u00d7",       # Ã— -> ×
    "\u00c3\u00b7": "\u00f7",       # Ã· -> ÷
    "\u00c3\u00a2\u00e2\u20ac\u0161\u00c2\u00a6": "\u20a6",  # Ã¢â€šÂ¦ -> ₦
    "\u00c2": "",                    # stray Â
}

ARITH_EXPR_RE = re.compile(
    r"(?P<expr>(?:[\d,]+(?:\.\d+)?\s*[*xX\u00d7\u00f7/\-\+\u2212]\s*)+[\d,]+(?:\.\d+)?)\s*=\s*(?P<result>[\d,]+(?:\.\d+)?)(?!\s*[/xX\u00d7\u00f7*\+\-\u2212])"
)
PERCENT_RE = re.compile(
    r"(?P<pct>\d+(?:\.\d+)?)%\s*(?:of\s*)?(?P<base>[\d,]+(?:\.\d+)?)\s*=\s*(?P<result>[\d,]+(?:\.\d+)?)(?!\s*[/xX\u00d7\u00f7*\+\-\u2212])",
    re.IGNORECASE,
)


def iter_json_files() -> Iterable[Path]:
    for base in SCAN_DIRS:
        if not base.exists():
            continue
        for path in base.rglob("*.json"):
            if any(part in EXCLUDE_DIRS for part in path.parts):
                continue
            yield path


def count_markers(text: str) -> int:
    return sum(text.count(m) for m in MOJIBAKE_MARKERS)


def can_encode_cp1252(ch: str) -> bool:
    try:
        ch.encode("cp1252")
        return True
    except UnicodeEncodeError:
        return False


def protect_non_cp1252(text: str) -> Tuple[str, dict[str, str]]:
    mapping: dict[str, str] = {}
    out: list[str] = []

    for ch in text:
        if can_encode_cp1252(ch):
            out.append(ch)
        else:
            token = f"[[U{len(mapping):04d}]]"
            mapping[token] = ch
            out.append(token)

    return "".join(out), mapping


def restore_non_cp1252(text: str, mapping: dict[str, str]) -> str:
    restored = text
    for token, ch in mapping.items():
        restored = restored.replace(token, ch)
    return restored


def apply_replacements(text: str) -> Tuple[str, bool]:
    changed = False
    for _ in range(2):
        before = text
        for bad, good in REPLACEMENTS.items():
            text = text.replace(bad, good)
        if text != before:
            changed = True
        else:
            break
    return text, changed


def fix_emoji_mojibake(text: str) -> Tuple[str, bool]:
    changed = False
    out: list[str] = []
    i = 0
    while i < len(text):
        if text[i] == "\u00f0" and i + 3 < len(text):
            chunk = text[i : i + 4]
            if all(can_encode_cp1252(ch) for ch in chunk):
                try:
                    out.append(chunk.encode("cp1252").decode("utf-8"))
                    i += 4
                    changed = True
                    continue
                except (UnicodeEncodeError, UnicodeDecodeError):
                    pass
        out.append(text[i])
        i += 1
    return "".join(out), changed


def fix_mojibake(text: str) -> Tuple[str, bool]:
    changed = False

    for _ in range(2):
        if not any(m in text for m in MOJIBAKE_MARKERS):
            break
        protected, mapping = protect_non_cp1252(text)
        try:
            candidate = protected.encode("cp1252").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            break
        candidate = restore_non_cp1252(candidate, mapping)
        if count_markers(candidate) < count_markers(text):
            text = candidate
            changed = True
        else:
            break

    replaced, rep_changed = apply_replacements(text)
    if rep_changed:
        text = replaced
        changed = True

    emoji_fixed, emoji_changed = fix_emoji_mojibake(text)
    if emoji_changed:
        text = emoji_fixed
        changed = True

    return text, changed


def is_question(obj: Any) -> bool:
    return (
        isinstance(obj, dict)
        and "question" in obj
        and "options" in obj
        and "correct" in obj
        and isinstance(obj.get("options"), list)
    )


def find_questions(obj: Any) -> Iterable[dict]:
    if is_question(obj):
        yield obj
        return
    if isinstance(obj, dict):
        for value in obj.values():
            yield from find_questions(value)
    elif isinstance(obj, list):
        for item in obj:
            yield from find_questions(item)


def extract_option_letter(expl: str | None) -> str | None:
    if not isinstance(expl, str):
        return None
    patterns = [
        r"(?:Correct\s*option|Option)\s*[:\-]?\s*([A-D])\b",
        r"(?:Answer|Correct)\s*[:\-]?\s*([A-D])\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, expl, re.IGNORECASE)
        if match:
            return match.group(1).upper()
    return None


def extract_option_index(expl: str | None) -> int | None:
    if not isinstance(expl, str):
        return None
    match = re.search(r"(?:Correct\s*option|Option|correct\s*index)\s*[:\-]?\s*(\d)\b", expl, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None


def fix_zero_based(expl: str, option_text: str) -> str:
    updated = re.sub(r"\s*\(\s*Option\s*0\s*corresponds.*?\)\.?\s*$", "", expl)
    updated = re.sub(r"\s*Option\s*0\s*corresponds.*$", "", updated)
    updated = updated.rstrip()
    if not updated.endswith("."):
        updated += "."
    if "Correct option:" not in updated:
        updated += f" Correct option: A ({option_text})."
    return updated


def parse_number(raw: str) -> float | None:
    if not raw:
        return None
    cleaned = raw.replace(",", "").replace("\u20a6", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None


def safe_eval_expr(expr: str) -> float | None:
    cleaned = (
        expr.replace(",", "")
        .replace("\u00d7", "*")
        .replace("x", "*")
        .replace("X", "*")
        .replace("\u00f7", "/")
        .replace("\u2212", "-")
    )
    if not re.fullmatch(r"[0-9\s\.+\-*/]+", cleaned):
        return None
    try:
        return float(eval(cleaned, {"__builtins__": {}}, {}))
    except Exception:
        return None


def approx_equal(a: float, b: float) -> bool:
    tol = max(0.01, abs(a) * 0.001)
    return abs(a - b) <= tol


def should_skip_following(text: str, end: int) -> bool:
    i = end
    while i < len(text) and text[i].isspace():
        i += 1
    if i >= len(text):
        return False
    ch = text[i]
    if ch.isdigit():
        return True
    if ch in "+-*/=xX\u00d7\u00f7\u2212":
        return True
    return False


def check_arithmetic(explanation: str) -> list[str]:
    issues: list[str] = []

    for match in PERCENT_RE.finditer(explanation):
        pct = parse_number(match.group("pct"))
        base = parse_number(match.group("base"))
        result = parse_number(match.group("result"))
        if should_skip_following(explanation, match.end("result")):
            continue
        if pct is None or base is None or result is None:
            continue
        expected = base * (pct / 100.0)
        if not approx_equal(expected, result):
            issues.append(
                f"Percent mismatch: {pct}% of {base} = {result} (expected {expected:.2f})"
            )

    for match in ARITH_EXPR_RE.finditer(explanation):
        expr = match.group("expr")
        expr_start = match.start("expr")
        if expr_start > 0 and explanation[expr_start - 1].isdigit():
            continue
        result = parse_number(match.group("result"))
        if should_skip_following(explanation, match.end("result")):
            continue
        if result is None:
            continue
        expected = safe_eval_expr(expr)
        if expected is None:
            continue
        if not approx_equal(expected, result):
            issues.append(
                f"Arithmetic mismatch: {expr.strip()} = {result} (expected {expected:.2f})"
            )

    return issues
def read_text(path: Path) -> Tuple[str, str]:
    raw_bytes = path.read_bytes()
    try:
        return raw_bytes.decode("utf-8-sig"), "utf-8-sig"
    except UnicodeDecodeError:
        return raw_bytes.decode("latin-1"), "latin-1"


def main() -> int:
    changed_files: list[str] = []
    issues: list[str] = []
    encoding_flags: list[str] = []

    for path in iter_json_files():
        raw, encoding = read_text(path)
        file_changed = False

        if REPLACEMENT_CHAR in raw:
            encoding_flags.append(str(path))

        fixed_raw, fixed = fix_mojibake(raw)
        if fixed:
            raw = fixed_raw
            file_changed = True

        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            issues.append(f"{path}: invalid JSON")
            continue

        for q in find_questions(data):
            options = q.get("options") or []
            correct = q.get("correct")
            explanation = q.get("explanation", "")

            if isinstance(explanation, str) and re.search(r"Option\s*0\s*corresponds", explanation):
                if options:
                    q["correct"] = 0
                    q["explanation"] = fix_zero_based(explanation, str(options[0]).strip())
                    file_changed = True

            letter = extract_option_letter(q.get("explanation"))
            if letter:
                idx = ord(letter) - 65
                if idx < len(options) and correct != idx:
                    q["correct"] = idx
                    file_changed = True

            idx = extract_option_index(q.get("explanation"))
            if idx is not None and idx < len(options) and correct != idx:
                q["correct"] = idx
                file_changed = True

            if isinstance(q.get("correct"), int):
                if q["correct"] < 0 or q["correct"] >= len(options):
                    issues.append(
                        f"{path}: {q.get('id','(no id)')} correct index {q['correct']} out of range {len(options)}"
                    )
            else:
                issues.append(f"{path}: {q.get('id','(no id)')} missing/invalid correct index")

            if isinstance(explanation, str) and explanation:
                for arith_issue in check_arithmetic(explanation):
                    issues.append(f"{path}: {q.get('id','(no id)')} - {arith_issue}")

        if file_changed:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            changed_files.append(str(path))

        if encoding == "latin-1":
            issues.append(f"{path}: decoded as latin-1; consider resaving as UTF-8")

    print(f"Scanned: {len(list(iter_json_files()))} JSON files")
    print(f"Updated: {len(changed_files)}")
    for item in changed_files:
        print(f"  - {item}")

    if encoding_flags:
        print("Found replacement character (�) in:")
        for item in encoding_flags:
            print(f"  - {item}")

    if issues:
        print("Issues:")
        for item in issues:
            print(f"  - {item}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())







