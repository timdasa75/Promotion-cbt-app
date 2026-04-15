#!/usr/bin/env python3
"""
Build a decision-oriented question quality assessment for the question bank.

This complements the duplicate/relevance audit by classifying weak framing,
option-quality problems, topic fit issues, and recommended actions.

Outputs:
  - docs/question_quality_assessment.json
  - docs/question_quality_assessment.md
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List

from audit_question_quality import QEntry, TOPIC_HINTS, build_audit, normalize_text, safe_get_questions, tokenize


DEFAULT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TOPICS_FILE = DEFAULT_ROOT / "data" / "topics.json"
DEFAULT_JSON_OUT = DEFAULT_ROOT / "docs" / "question_quality_assessment.json"
DEFAULT_MD_OUT = DEFAULT_ROOT / "docs" / "question_quality_assessment.md"

MOJIBAKE_MARKERS = ("\\u00e2", "\\u00c3", "\\U0001f", "\\ufffd")
FILLER_PREFIXES = (
    "according to established rules",
    "within government administration",
    "in official practice",
    "in the public service context",
)
VAGUE_AUTHORITY_PHRASES = (
    "according to established rules",
    "in official practice",
    "within government administration",
    "in the public service context",
)
FILLER_METADATA_TOKENS = {
    "according",
    "established",
    "rules",
    "within",
    "administration",
    "select",
    "option",
    "best",
    "official",
    "practice",
    "context",
}
DEFINITION_MARKERS = (
    "define",
    "defines",
    "definition",
    "meaning of",
    "statement that correctly defines",
    "best describes",
    "aligns with the meaning",
)
DEFINITION_VERBS = {
    "is",
    "are",
    "means",
    "refers",
    "describes",
    "includes",
    "involves",
    "entails",
    "denotes",
}
OPTION_CLAUSE_VERBS = DEFINITION_VERBS | {
    "uses",
    "utilizes",
    "handles",
    "controls",
    "provides",
    "ensures",
    "requires",
    "indicates",
    "shows",
}
SOURCE_MARKERS = (
    "section",
    "rule",
    "reference",
    "act",
    "framework",
    "circular",
    "handbook",
    "psr",
    "fr",
    "foi",
    "chapter",
    "constitution",
)
REGISTRY_TERMS = {
    "letter",
    "letters",
    "enclosure",
    "enclosures",
    "file",
    "files",
    "registry",
    "open",
    "subject",
    "despatch",
    "dispatch",
    "minute",
    "minutes",
    "handing",
    "over",
    "correspondence",
    "records",
    "record",
}
STRONG_REGISTRY_PHRASES = (
    "book file",
    "subject file",
    "open registry",
    "filing",
    "letter",
    "letters",
    "enclosure",
    "enclosures",
    "despatch",
    "dispatch",
    "correspondence",
    "handing over",
)
DIGITAL_CONTEXT_TERMS = {
    "digital",
    "electronic",
    "ecm",
    "hrmis",
    "platform",
    "portal",
    "software",
    "database",
    "online",
    "automation",
    "biometric",
    "bvas",
    "cyber",
}
LEGAL_DOMAIN_TERMS = {
    "constitutional_law": {"foi", "constitution", "statutory", "disclosure", "institution"},
    "procurement_act": {"procurement", "procuring", "entity", "bpp", "bid", "bidding", "contract"},
    "financial_regulations": {"financial", "regulation", "accounts", "accountant", "auditor", "treasury", "ministry"},
}
ICT_TERMS = set(TOPIC_HINTS.get("ict_management", set())) | {
    "platform",
    "system",
    "systems",
    "digital",
    "data",
    "database",
    "electronic",
    "online",
    "portal",
    "software",
    "network",
    "biometric",
    "bimodal",
    "bvas",
    "automation",
    "service",
}
ELECTION_TERMS = {
    "election",
    "elections",
    "voter",
    "voters",
    "accreditation",
    "polling",
    "ballot",
    "electoral",
    "inec",
    "campaign",
    "party",
}
NOISE_PATTERNS = (
    re.compile(r"\.[A-Za-z]\.$"),
    re.compile(r"\*{3,}"),
    re.compile(r",,"),
    re.compile(r"'{2,}"),
    re.compile(r"[_]{1,}$"),
)

REPEATED_WORD_PATTERNS = (
    re.compile(r"\b([A-Za-z]{3,})\s+\1\b", re.IGNORECASE),
    re.compile(r"\b([A-Za-z]{3,})\s+and\s+\1\b", re.IGNORECASE),
)

CORRUPTED_TOKEN_PATTERN = re.compile(r"[A-Za-z]*([A-Za-z])\1\1[A-Za-z]*")
WRITING_ISSUES = {
    "filler_stem_prefix",
    "vague_authority_reference",
    "definition_option_mismatch",
    "non_parallel_options",
    "option_formatting_noise",
    "text_corruption_noise",
    "thin_explanation",
    "metadata_pollution_from_stem",
}
NEAR_DUP_ISSUES = {
    "same_subcategory_near_duplicate",
    "same_topic_near_duplicate",
    "cross_topic_near_duplicate",
}

MOVE_TARGET_RULES = {
    ("civil_service_admin", "administrative_procedure_in_wrong_topic"): {
        "subcategory_id": "csh_administrative_procedures",
        "prefix": "csh_ap_",
    },
    ("psr", "administrative_procedure_in_wrong_topic"): {
        "subcategory_id": "psr_general_admin",
        "prefix": "psr_admin_",
    },
}


@dataclass
class QuestionItem:
    topic_id: str
    topic_name: str
    subcategory_id: str
    subcategory_name: str
    question_id: str
    question: str
    options: List[str]
    correct: int | None
    explanation: str
    keywords: List[str]
    tags: List[str]
    chapter: str
    source_file: str
    source_document: str
    year: int | str | None
    norm_question: str
    tokens: List[str]


def load_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def resolve_path(root: Path, raw_path: str | Path) -> Path:
    path = Path(raw_path)
    if path.is_absolute():
        return path
    return (root / path).resolve()


def collect_question_items(root: Path, topics_file: Path) -> list[QuestionItem]:
    topics_doc = load_json(topics_file)
    topics = topics_doc.get("topics", [])
    items: list[QuestionItem] = []

    for topic in topics:
        if not isinstance(topic, dict):
            continue
        topic_id = str(topic.get("id") or "").strip()
        topic_name = str(topic.get("name") or topic_id).strip()
        rel_file = str(topic.get("file") or "").strip()
        if not rel_file:
            continue
        path = resolve_path(root, rel_file)
        if not path.exists():
            continue
        payload = load_json(path)
        for sub in payload.get("subcategories", []) if isinstance(payload, dict) else []:
            if not isinstance(sub, dict):
                continue
            sub_id = str(sub.get("id") or "").strip()
            sub_name = str(sub.get("name") or sub_id).strip()
            for question in safe_get_questions(sub):
                question_text = str(question.get("question") or "").strip()
                options = [str(option).strip() for option in (question.get("options") or []) if isinstance(option, (str, int, float))]
                items.append(
                    QuestionItem(
                        topic_id=topic_id,
                        topic_name=topic_name,
                        subcategory_id=sub_id,
                        subcategory_name=sub_name,
                        question_id=str(question.get("id") or "").strip(),
                        question=question_text,
                        options=options,
                        correct=question.get("correct") if isinstance(question.get("correct"), int) else None,
                        explanation=str(question.get("explanation") or "").strip(),
                        keywords=[str(k).strip() for k in (question.get("keywords") or []) if isinstance(k, (str, int, float))],
                        tags=[str(tag).strip() for tag in (question.get("tags") or []) if isinstance(tag, (str, int, float))],
                        chapter=str(question.get("chapter") or "").strip(),
                        source_file=str(path.relative_to(root)).replace("\\", "/"),
                        source_document=str(question.get("sourceDocument") or "").strip(),
                        year=question.get("year"),
                        norm_question=normalize_text(question_text),
                        tokens=tokenize(question_text),
                    )
                )
    return items


def build_entries(items: list[QuestionItem]) -> list[QEntry]:
    return [
        QEntry(
            topic_id=item.topic_id,
            topic_name=item.topic_name,
            subcategory_id=item.subcategory_id,
            subcategory_name=item.subcategory_name,
            question_id=item.question_id,
            question=item.question,
            keywords=item.keywords,
            chapter=item.chapter,
            source_file=item.source_file,
            norm_question=item.norm_question,
            tokens=item.tokens,
        )
        for item in items
    ]


def option_has_noise(option: str) -> bool:
    if any(marker in option for marker in MOJIBAKE_MARKERS):
        return True
    return any(pattern.search(option) for pattern in NOISE_PATTERNS)


def is_roman_numeral_token(token: str) -> bool:
    lowered = token.lower()
    if not lowered:
        return False
    return bool(re.fullmatch(r"[ivxlcdm]+", lowered))


def text_has_corruption_noise(text: str) -> bool:
    if not text:
        return False
    if any(marker in text for marker in MOJIBAKE_MARKERS):
        return True
    if any(pattern.search(text) for pattern in NOISE_PATTERNS):
        return True
    if any(pattern.search(text) for pattern in REPEATED_WORD_PATTERNS):
        return True
    tokens = re.findall(r"[A-Za-z]+", text)
    for token in tokens:
        lowered = token.lower()
        if lowered in {"committee", "commissioner", "crossriver"}:
            continue
        if is_roman_numeral_token(token):
            continue
        if CORRUPTED_TOKEN_PATTERN.search(token):
            return True
    return False


def parts_have_corruption_noise(parts: Iterable[str]) -> bool:
    for part in parts:
        if text_has_corruption_noise(str(part or "").strip()):
            return True
    return False


def classify_option(option: str) -> str:
    tokens = normalize_text(option).split()
    if not tokens:
        return "empty"
    if any(token in OPTION_CLAUSE_VERBS for token in tokens):
        return "clause"
    if len(tokens) <= 3:
        return "label"
    if tokens[0] in {"the", "a", "an"}:
        return "noun_phrase"
    return "phrase"


def explanation_has_source_signal(text: str) -> bool:
    lowered = text.lower()
    return any(marker in lowered for marker in SOURCE_MARKERS)


def build_combined_text(item: QuestionItem) -> str:
    return " ".join([item.question, *item.options, item.explanation, " ".join(item.keywords), " ".join(item.tags)])


def has_statutory_domain_anchor(item: QuestionItem) -> bool:
    combined_text = build_combined_text(item).lower()
    combined_tokens = set(tokenize(combined_text))
    domain_terms = LEGAL_DOMAIN_TERMS.get(item.topic_id)
    if not domain_terms:
        return False
    domain_hits = len(combined_tokens.intersection(domain_terms))
    has_section_anchor = "section" in combined_text or "act" in combined_text
    has_procurement_records_anchor = "procurement" in combined_tokens and ({"audit", "inspection", "retention"} & combined_tokens)

    if item.topic_id == "constitutional_law":
        return (
            ("foi" in combined_tokens and has_section_anchor)
            or has_procurement_records_anchor
            or (domain_hits >= 2 and has_section_anchor)
        )
    if item.topic_id == "procurement_act":
        return has_procurement_records_anchor or (domain_hits >= 2 and has_section_anchor)
    if item.topic_id == "financial_regulations":
        return (
            has_procurement_records_anchor
            or "financial regulation" in combined_text
            or "accountant-general" in combined_text
            or "auditor-general" in combined_text
            or (domain_hits >= 3 and ("regulation" in combined_text or "fr" in combined_tokens))
        )
    return False


def should_suppress_relevance_move(item: QuestionItem, relevance: dict | None) -> bool:
    if not relevance or not relevance.get("high_confidence_move"):
        return False
    suggested = str(relevance.get("best_other_topic") or "").strip()
    normalized_question = normalize_text(item.question)
    combined_tokens = set(tokenize(" ".join([item.question, " ".join(item.keywords), " ".join(item.tags)])))
    registry_hits = len(combined_tokens.intersection(REGISTRY_TERMS))
    has_strong_registry_phrase = any(phrase in normalized_question for phrase in STRONG_REGISTRY_PHRASES)

    if (
        item.topic_id == "civil_service_admin"
        and item.subcategory_id == "csh_administrative_procedures"
        and suggested in {"constitutional_law", "policy_analysis", "leadership_management"}
        and (registry_hits >= 2 or has_strong_registry_phrase)
    ):
        return True

    if suggested == "civil_service_admin" and has_statutory_domain_anchor(item):
        return True

    return False


def detect_filler_prefix(question: str) -> str | None:
    lowered = question.lower().strip()
    for prefix in FILLER_PREFIXES:
        if lowered.startswith(prefix):
            return prefix
    return None


def has_vague_authority_phrase(question: str) -> bool:
    lowered = question.lower()
    return any(phrase in lowered for phrase in VAGUE_AUTHORITY_PHRASES)


def is_definition_option_mismatch(item: QuestionItem) -> bool:
    lowered = item.question.lower()
    if not any(marker in lowered for marker in DEFINITION_MARKERS):
        return False
    option_tokens = [normalize_text(option).split() for option in item.options if str(option).strip()]
    if not option_tokens:
        return False
    has_definition_language = any(any(token in DEFINITION_VERBS for token in tokens) for tokens in option_tokens)
    avg_len = sum(len(tokens) for tokens in option_tokens) / len(option_tokens)
    return not has_definition_language and avg_len <= 5.5


def has_non_parallel_options(item: QuestionItem) -> bool:
    categories = {classify_option(option) for option in item.options if str(option).strip()}
    if len(categories) <= 1:
        return False
    if categories <= {"label", "noun_phrase", "phrase"}:
        return False
    return True


def is_thin_explanation(item: QuestionItem) -> bool:
    explanation = item.explanation.strip()
    if not explanation:
        return True
    tokens = tokenize(explanation)
    if len(tokens) <= 8:
        return True
    lowered = explanation.lower()
    if lowered.startswith("correct option:") and len(tokens) < 18 and not explanation_has_source_signal(explanation):
        return True
    if lowered.startswith("correct option:") and len(tokens) < 24 and "because" not in lowered and not explanation_has_source_signal(explanation):
        return True
    return False


def has_metadata_pollution(item: QuestionItem) -> bool:
    values = [str(value).lower() for value in item.keywords + item.tags]
    polluted = {value for value in values if value in FILLER_METADATA_TOKENS}
    return len(polluted) >= 2


def detect_registry_topic_drift(item: QuestionItem) -> tuple[bool, str | None]:
    normalized_question = normalize_text(item.question)
    combined_tokens = set(tokenize(" ".join([item.question, " ".join(item.keywords), " ".join(item.tags)])))
    registry_hits = len(combined_tokens.intersection(REGISTRY_TERMS))
    digital_context_hits = len(combined_tokens.intersection(DIGITAL_CONTEXT_TERMS))
    has_strong_registry_phrase = any(phrase in normalized_question for phrase in STRONG_REGISTRY_PHRASES)
    if item.topic_id in {"civil_service_admin", "psr"}:
        return False, None
    if has_statutory_domain_anchor(item):
        return False, None
    if item.topic_id == "ict_management" and (registry_hits >= 2 or has_strong_registry_phrase) and digital_context_hits == 0:
        return True, "civil_service_admin"
    if item.topic_id not in {"ict_management", "civil_service_admin", "psr"} and registry_hits >= 2:
        return True, "civil_service_admin"
    return False, None


def detect_borderline_current_affairs_in_ict(item: QuestionItem) -> bool:
    if item.topic_id != "ict_management":
        return False
    combined_tokens = set(tokenize(" ".join([item.question, " ".join(item.keywords), " ".join(item.tags)])))
    election_hits = len(combined_tokens.intersection(ELECTION_TERMS))
    ict_hits = len(combined_tokens.intersection(DIGITAL_CONTEXT_TERMS))
    return election_hits >= 2 and ict_hits <= 2


def build_relevance_lookup(report: dict) -> dict[str, dict]:
    lookup: dict[str, dict] = {}
    for item in report.get("relevance_flags", []):
        question = item.get("question", {})
        question_id = str(question.get("question_id") or "").strip()
        if not question_id:
            continue
        reasons = item.get("reasons", [])
        lookup[question_id] = {
            "best_other_topic": item.get("best_other_topic"),
            "best_other_score": item.get("best_other_score", 0),
            "own_topic_score": item.get("own_topic_score", 0),
            "own_subcategory_score": item.get("own_subcategory_score", 0),
            "reasons": reasons,
            "high_confidence_move": (
                item.get("own_topic_score", 0) == 0
                and item.get("own_subcategory_score", 0) == 0
                and item.get("best_other_score", 0) >= 4
                and any(str(reason).startswith("looks_closer_to:") for reason in reasons)
            ),
        }
    return lookup


def build_near_duplicate_lookup(report: dict) -> dict[str, list[dict]]:
    lookup: dict[str, list[dict]] = defaultdict(list)
    for item in report.get("near_duplicates", []):
        a = item.get("a", {})
        b = item.get("b", {})
        similarity = item.get("similarity", 0)
        a_id = str(a.get("question_id") or "").strip()
        b_id = str(b.get("question_id") or "").strip()
        if not a_id or not b_id:
            continue
        a_context = {
            "peer": b,
            "similarity": similarity,
            "same_topic": a.get("topic_id") == b.get("topic_id"),
            "same_subcategory": a.get("subcategory_id") == b.get("subcategory_id"),
        }
        b_context = {
            "peer": a,
            "similarity": similarity,
            "same_topic": a.get("topic_id") == b.get("topic_id"),
            "same_subcategory": a.get("subcategory_id") == b.get("subcategory_id"),
        }
        lookup[a_id].append(a_context)
        lookup[b_id].append(b_context)
    return lookup


def summarize_issue(issue: str, item: QuestionItem, suggested_target_topic: str | None) -> str:
    messages = {
        "filler_stem_prefix": "Stem opens with generic filler rather than a direct test prompt.",
        "vague_authority_reference": "Stem appeals to vague authority language instead of naming a governing source.",
        "definition_option_mismatch": "Stem asks for a definition or meaning, but the options read like labels rather than definitions.",
        "non_parallel_options": "Answer options are not parallel in type or grammatical shape.",
        "option_formatting_noise": "One or more options contain formatting noise or corrupted punctuation.",
        "text_corruption_noise": "Question text or options show corrupted wording, mojibake, or obvious spelling damage.",
        "thin_explanation": "Explanation is too thin to justify the answer confidently.",
        "metadata_pollution_from_stem": "Keywords or tags appear to be derived from filler phrasing rather than the real concept.",
        "administrative_procedure_in_wrong_topic": "Question looks like office procedure or registry practice but sits outside the service-administration topics.",
        "borderline_current_affairs_in_ict": "Question reads more like current affairs or electoral recall than a strong ICT/e-governance concept.",
        "topic_relevance_mismatch": f"Question appears closer to {suggested_target_topic or 'another topic'} than its current home.",
        "same_subcategory_near_duplicate": "Question is extremely similar to another item in the same subcategory.",
        "same_topic_near_duplicate": "Question is extremely similar to another item in the same topic.",
        "cross_topic_near_duplicate": "Question is extremely similar to another item in a different topic.",
        "rewrite_candidate": "Question can likely be salvaged by rewriting the stem, explanation, or option wording.",
        "move_candidate": f"Question is a strong move candidate for {suggested_target_topic or 'another topic'}.",
        "delete_candidate": "Question is weak enough that deletion is safer than trying to preserve it.",
    }
    return messages.get(issue, issue.replace("_", " "))


def build_rewrite_note(item: QuestionItem, issues: list[str], suggested_target_topic: str | None) -> str | None:
    notes: list[str] = []
    if "filler_stem_prefix" in issues:
        notes.append("Rewrite the stem as a direct question without prefatory filler.")
    if "definition_option_mismatch" in issues:
        notes.append("Align the stem with the option type by either asking for a label or rewriting the options as definitions.")
    if "option_formatting_noise" in issues:
        notes.append("Clean the affected option text before review.")
    if "text_corruption_noise" in issues:
        notes.append("Repair duplicated wording, spelling corruption, and mojibake before deciding on final wording.")
    if "thin_explanation" in issues:
        notes.append("Add a source-anchored explanation that gives the reason, not just the answer key.")
    if "administrative_procedure_in_wrong_topic" in issues and suggested_target_topic:
        notes.append(f"If retained, rewrite after moving to {suggested_target_topic}.")
    if "borderline_current_affairs_in_ict" in issues:
        notes.append("If retained in ICT, anchor the stem to the digital system or e-governance use case rather than generic recall.")
    if not notes:
        return None
    return " ".join(notes)


def infer_move_target_details(issues: list[str], suggested_target_topic: str | None) -> tuple[str | None, str | None]:
    if not suggested_target_topic:
        return None, None
    for issue in issues:
        rule = MOVE_TARGET_RULES.get((suggested_target_topic, issue))
        if rule:
            return rule["subcategory_id"], rule["prefix"]
    return None, None


def assess_item(item: QuestionItem, relevance_lookup: dict[str, dict], near_dup_lookup: dict[str, list[dict]]) -> dict | None:
    issues: list[str] = []
    suggested_target_topic: str | None = None
    suggested_target_subcategory: str | None = None
    suggested_target_prefix: str | None = None
    severe_writing_count = 0

    if detect_filler_prefix(item.question):
        issues.append("filler_stem_prefix")
    if has_vague_authority_phrase(item.question):
        issues.append("vague_authority_reference")
    if is_definition_option_mismatch(item):
        issues.append("definition_option_mismatch")
        severe_writing_count += 1
    if has_non_parallel_options(item):
        issues.append("non_parallel_options")
        severe_writing_count += 1
    if any(option_has_noise(option) for option in item.options):
        issues.append("option_formatting_noise")
        severe_writing_count += 1
    if parts_have_corruption_noise([item.question, *item.options, item.explanation]):
        issues.append("text_corruption_noise")
        severe_writing_count += 1
    if is_thin_explanation(item):
        issues.append("thin_explanation")
        severe_writing_count += 1
    if has_metadata_pollution(item):
        issues.append("metadata_pollution_from_stem")

    registry_drift, registry_target = detect_registry_topic_drift(item)
    if registry_drift:
        issues.append("administrative_procedure_in_wrong_topic")
        suggested_target_topic = registry_target or suggested_target_topic
    if detect_borderline_current_affairs_in_ict(item):
        issues.append("borderline_current_affairs_in_ict")

    relevance = relevance_lookup.get(item.question_id)
    if relevance and relevance.get("high_confidence_move") and not should_suppress_relevance_move(item, relevance):
        issues.append("topic_relevance_mismatch")
        suggested_target_topic = str(relevance.get("best_other_topic") or suggested_target_topic or "").strip() or suggested_target_topic

    for near_dup in near_dup_lookup.get(item.question_id, []):
        similarity = near_dup.get("similarity", 0)
        if similarity < 0.95:
            continue
        if near_dup.get("same_subcategory"):
            issues.append("same_subcategory_near_duplicate")
        elif near_dup.get("same_topic"):
            issues.append("same_topic_near_duplicate")
        else:
            issues.append("cross_topic_near_duplicate")
        break

    issues = list(dict.fromkeys(issues))
    if not issues:
        return None

    action = "rewrite"
    if "topic_relevance_mismatch" in issues or "administrative_procedure_in_wrong_topic" in issues:
        action = "move"
    if "borderline_current_affairs_in_ict" in issues and action == "rewrite":
        action = "rewrite"
    if not suggested_target_topic and action == "move":
        if item.topic_id == "ict_management" and "administrative_procedure_in_wrong_topic" in issues:
            suggested_target_topic = "civil_service_admin"
        elif relevance and relevance.get("best_other_topic"):
            suggested_target_topic = str(relevance.get("best_other_topic") or "").strip() or None

    if severe_writing_count >= 3 and action == "move" and not suggested_target_topic:
        action = "delete"
    elif severe_writing_count >= 3 and "borderline_current_affairs_in_ict" in issues and not explanation_has_source_signal(item.explanation):
        action = "delete"
    elif severe_writing_count >= 4:
        action = "delete"
    elif (
        action == "rewrite"
        and severe_writing_count >= 3
        and "filler_stem_prefix" in issues
        and "vague_authority_reference" in issues
        and "metadata_pollution_from_stem" in issues
        and not explanation_has_source_signal(item.explanation)
        and (
            "definition_option_mismatch" in issues
            or "non_parallel_options" in issues
            or "borderline_current_affairs_in_ict" in issues
        )
    ):
        action = "delete"

    if action == "move":
        issues.append("move_candidate")
    elif action == "delete":
        issues.append("delete_candidate")
    else:
        issues.append("rewrite_candidate")

    if action == "move":
        suggested_target_subcategory, suggested_target_prefix = infer_move_target_details(issues, suggested_target_topic)

    confidence = 0.45
    if action == "move":
        confidence += 0.18
    if action == "delete":
        confidence += 0.25
    if "topic_relevance_mismatch" in issues:
        confidence += 0.17
    if "administrative_procedure_in_wrong_topic" in issues:
        confidence += 0.12
    if "borderline_current_affairs_in_ict" in issues:
        confidence += 0.08
    confidence += min(0.15, severe_writing_count * 0.05)
    if any(issue in issues for issue in NEAR_DUP_ISSUES):
        confidence += 0.05
    confidence = round(min(confidence, 0.98), 2)

    rationales = [summarize_issue(issue, item, suggested_target_topic) for issue in issues if not issue.endswith("_candidate")]

    return {
        "question_id": item.question_id,
        "source_topic": item.topic_id,
        "source_subcategory": item.subcategory_id,
        "source_file": item.source_file,
        "question": item.question,
        "issue_types": issues,
        "confidence": confidence,
        "recommended_action": action,
        "suggested_target_topic": suggested_target_topic,
        "suggested_target_subcategory": suggested_target_subcategory,
        "suggested_target_prefix": suggested_target_prefix,
        "rationale": rationales,
        "rewrite_note": build_rewrite_note(item, issues, suggested_target_topic),
    }


def build_assessment(root: Path, topics_file: Path, near_threshold: float) -> dict:
    items = collect_question_items(root, topics_file)
    entries = build_entries(items)
    audit_report = build_audit(entries, near_dup_threshold=near_threshold)
    relevance_lookup = build_relevance_lookup(audit_report)
    near_dup_lookup = build_near_duplicate_lookup(audit_report)

    assessed = []
    issue_counts: Counter[str] = Counter()
    topic_counts: Counter[str] = Counter()
    action_counts: Counter[str] = Counter()

    for item in items:
        result = assess_item(item, relevance_lookup, near_dup_lookup)
        if not result:
            continue
        assessed.append(result)
        action_counts[result["recommended_action"]] += 1
        topic_counts[result["source_topic"]] += 1
        for issue in result["issue_types"]:
            issue_counts[issue] += 1

    assessed.sort(
        key=lambda entry: (
            {"delete": 0, "move": 1, "rewrite": 2, "keep": 3}.get(entry["recommended_action"], 9),
            -entry["confidence"],
            entry["source_topic"],
            entry["question_id"],
        )
    )

    return {
        "summary": {
            "total_questions": len(items),
            "flagged_questions": len(assessed),
            "recommended_actions": dict(action_counts.most_common()),
            "top_issues": dict(issue_counts.most_common(20)),
            "top_topics": dict(topic_counts.most_common(12)),
            "baseline_audit": audit_report.get("summary", {}),
        },
        "items": assessed,
    }


def write_markdown(report: dict, path: Path):
    summary = report.get("summary", {})
    items = report.get("items", [])
    grouped_by_action: dict[str, list[dict]] = defaultdict(list)
    for item in items:
        grouped_by_action[item["recommended_action"]].append(item)

    lines = ["# Question Quality Assessment", ""]
    lines.append("## Summary")
    lines.append(f"- Total questions scanned: **{summary.get('total_questions', 0)}**")
    lines.append(f"- Flagged questions: **{summary.get('flagged_questions', 0)}**")
    lines.append("")
    lines.append("## Recommended Actions")
    for action, count in (summary.get("recommended_actions") or {}).items():
        lines.append(f"- `{action}`: **{count}**")
    lines.append("")
    lines.append("## Top Issue Counts")
    for issue, count in (summary.get("top_issues") or {}).items():
        lines.append(f"- `{issue}`: **{count}**")
    lines.append("")
    lines.append("## Top Topics With Flagged Questions")
    for topic, count in (summary.get("top_topics") or {}).items():
        lines.append(f"- `{topic}`: **{count}**")
    lines.append("")

    for action in ("delete", "move", "rewrite"):
        action_items = grouped_by_action.get(action, [])
        lines.append(f"## Top `{action}` Candidates")
        if not action_items:
            lines.append("- None")
            lines.append("")
            continue
        for item in action_items[:40]:
            lines.append(
                f"- `{item['question_id']}` [{item['source_topic']}/{item['source_subcategory']}] "
                f"confidence={item['confidence']}"
            )
            if item.get("suggested_target_topic"):
                lines.append(f"  - suggested target: `{item['suggested_target_topic']}`")
            if item.get("suggested_target_subcategory"):
                lines.append(f"  - suggested subcategory: `{item['suggested_target_subcategory']}`")
            if item.get("suggested_target_prefix"):
                lines.append(f"  - target id prefix: `{item['suggested_target_prefix']}`")
            lines.append(f"  - issues: {', '.join(item['issue_types'])}")
            lines.append(f"  - {item['question'][:180]}{'...' if len(item['question']) > 180 else ''}")
        lines.append("")

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Build a decision-oriented question quality assessment")
    parser.add_argument("--root", default=str(DEFAULT_ROOT), help="Workspace root containing data/ and docs/")
    parser.add_argument("--topics-file", default=str(DEFAULT_TOPICS_FILE), help="Path to topics.json")
    parser.add_argument("--json-out", default=str(DEFAULT_JSON_OUT), help="Path to JSON output report")
    parser.add_argument("--md-out", default=str(DEFAULT_MD_OUT), help="Path to Markdown output report")
    parser.add_argument("--near-threshold", type=float, default=0.92, help="Near-duplicate similarity threshold")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    topics_file = resolve_path(root, args.topics_file)
    report = build_assessment(root, topics_file, args.near_threshold)

    json_out = resolve_path(root, args.json_out)
    md_out = resolve_path(root, args.md_out)
    json_out.parent.mkdir(parents=True, exist_ok=True)
    md_out.parent.mkdir(parents=True, exist_ok=True)
    json_out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    write_markdown(report, md_out)

    print("Question quality assessment complete")
    print(json.dumps(report["summary"], indent=2))
    print(f"JSON report: {json_out}")
    print(f"Markdown report: {md_out}")


if __name__ == "__main__":
    main()






