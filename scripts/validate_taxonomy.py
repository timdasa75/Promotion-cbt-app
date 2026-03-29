#!/usr/bin/env python3
import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
TOPICS_FILE = DATA_DIR / "topics.json"
TEMPLATES_FILE = DATA_DIR / "exam_templates.json"
GL_BAND_WEIGHTS_FILE = DATA_DIR / "gl_band_weights.json"
SUPPORTED_GL_BANDS = {"general", "GL14_15", "GL15_16", "GL16_17"}
REQUIRED_METADATA_FIELDS = ("difficulty", "sourceDocument", "sourceSection", "year", "lastReviewed")
ALLOWED_DIFFICULTIES = {"easy", "medium", "hard"}
ALLOWED_REVIEW_STATUSES = {"draft", "reviewed", "approved"}
ALLOWED_QUESTION_TYPES = {"single_best_answer", "multiple_choice", "scenario", "judgement"}


def load_json(path: Path):
    """
    Load and parse a JSON document from the given file path.
    
    Parameters:
        path (Path): Filesystem path to the JSON file to read.
    
    Returns:
        The parsed JSON content (typically a dict or list) from the file.
    """
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def collect_subcategories(data):
    """
    Extract subcategory objects from a JSON-decoded structure.
    
    Accepts either a dict or a list and returns a flat list of subcategory dicts. Supported input shapes:
    - dict with a "subcategories" key containing a list of dicts → returns those dicts
    - dict with a "domains" key containing a list of dicts each with a "topics" list → returns all dict items from each domain's "topics"
    - list of dicts → returns the dict items from the list
    For any other shape or missing expected keys, returns an empty list.
    
    Parameters:
        data (dict | list): Parsed JSON value representing topics/domains/subcategories.
    
    Returns:
        list[dict]: A list of subcategory dictionaries extracted from the input.
    """
    if isinstance(data, dict):
        if isinstance(data.get("subcategories"), list):
            return [item for item in data["subcategories"] if isinstance(item, dict)]
        if isinstance(data.get("domains"), list):
            out = []
            for domain in data["domains"]:
                if isinstance(domain, dict) and isinstance(domain.get("topics"), list):
                    out.extend([item for item in domain["topics"] if isinstance(item, dict)])
            return out
    elif isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    return []


def iterate_subcategory_questions(subcategory):
    """
    Extracts the question objects from a subcategory JSON object, handling the two expected shapes used in the dataset.
    
    Parameters:
        subcategory (dict): Subcategory dictionary that may contain a "questions" list and an "id" key.
    
    Returns:
        list[dict]: A list of question dictionaries found in the subcategory, or an empty list if no valid questions are present.
    """
    questions = subcategory.get("questions")
    if not isinstance(questions, list):
        return []

    sub_id = subcategory.get("id")
    if (
        questions
        and isinstance(questions[0], dict)
        and sub_id
        and isinstance(questions[0].get(sub_id), list)
    ):
        return [item for item in questions[0][sub_id] if isinstance(item, dict)]

    return [item for item in questions if isinstance(item, dict)]


def add_error(errors, message):
    """
    Append an error message to the provided error collection.
    
    Parameters:
        errors (list): Mutable list used to collect error message strings.
        message (str): Error message to append.
    """
    errors.append(message)


def add_warning(warnings, message):
    """
    Record a non-fatal validation message.
    
    Parameters:
        warnings (list): List that will receive the warning message.
        message (str): Warning text to append.
    """
    warnings.append(message)


def validate_question_metadata(question, location, errors):
    """
    Validate optional metadata fields on a question and record any violations into the provided errors list.
    
    Checks (only when each field is present):
    - difficulty: must match one of the allowed difficulty values (case-insensitive).
    - sourceDocument, sourceSection: must be non-empty strings.
    - year: must parse to an integer between 1900 and 2100 inclusive.
    - lastReviewed: must be an ISO-format date parseable by datetime.date.fromisoformat.
    - marks: must parse to a number greater than 0.
    - questionType: must match one of the allowed question types (case-insensitive).
    - reviewStatus: must match one of the allowed review statuses (case-insensitive).
    - tags: must be a list of non-empty strings.
    - glBands: must be a non-empty list whose entries are among SUPPORTED_GL_BANDS.
    
    Parameters:
        question (dict): The question object to validate.
        location (str): Context string used when reporting error messages (e.g., "file:subcat").
        errors (list): Mutable list to which validation error messages will be appended.
    """
    difficulty = question.get("difficulty")
    if difficulty is not None and str(difficulty).strip().lower() not in ALLOWED_DIFFICULTIES:
        add_error(errors, f"{location} has invalid difficulty '{difficulty}'")

    source_document = question.get("sourceDocument")
    if source_document is not None and not str(source_document).strip():
        add_error(errors, f"{location} has empty sourceDocument")

    source_section = question.get("sourceSection")
    if source_section is not None and not str(source_section).strip():
        add_error(errors, f"{location} has empty sourceSection")

    year = question.get("year")
    if year is not None:
        try:
            year_value = int(year)
            if year_value < 1900 or year_value > 2100:
                raise ValueError
        except Exception:
            add_error(errors, f"{location} has invalid year '{year}'")

    last_reviewed = question.get("lastReviewed")
    if last_reviewed is not None:
        try:
            import datetime

            datetime.date.fromisoformat(str(last_reviewed))
        except Exception:
            add_error(errors, f"{location} has invalid lastReviewed '{last_reviewed}'")

    marks = question.get("marks")
    if marks is not None:
        try:
            if float(marks) <= 0:
                raise ValueError
        except Exception:
            add_error(errors, f"{location} has invalid marks '{marks}'")

    question_type = question.get("questionType")
    if question_type is not None and str(question_type).strip().lower() not in ALLOWED_QUESTION_TYPES:
        add_error(errors, f"{location} has invalid questionType '{question_type}'")

    review_status = question.get("reviewStatus")
    if review_status is not None and str(review_status).strip().lower() not in ALLOWED_REVIEW_STATUSES:
        add_error(errors, f"{location} has invalid reviewStatus '{review_status}'")

    tags = question.get("tags")
    if tags is not None:
        if not isinstance(tags, list) or any(not str(tag).strip() for tag in tags):
            add_error(errors, f"{location} has invalid tags list")

    gl_bands = question.get("glBands")
    if gl_bands is not None:
        if not isinstance(gl_bands, list) or not gl_bands:
            add_error(errors, f"{location} has invalid glBands list")
        else:
            invalid_bands = [band for band in gl_bands if str(band).strip() not in SUPPORTED_GL_BANDS]
            if invalid_bands:
                add_error(errors, f"{location} references unsupported glBands {invalid_bands}")


def validate_templates(templates_doc, topic_ids, errors):
    """
    Validate the structure and internal consistency of an exam_templates.json document.
    
    Performs high-level validation of the top-level `templates` array and per-template checks: required `id` and `name`, supported `glBand`, numeric positive `totalQuestions` and `timeLimitMin`, optional `sections` shape and per-section `topicId` membership in `topic_ids` and positive integer `count`. Validation failures are recorded by appending human-readable messages to `errors`.
    
    Parameters:
        templates_doc (dict | any): Parsed JSON document for exam templates; expected to contain a top-level `"templates"` array when valid.
        topic_ids (Iterable[str]): Collection of known topic IDs used to validate section `topicId` references.
        errors (list): Mutable list used to collect validation error messages.
    
    Returns:
        list: The original `templates` list from `templates_doc` (possibly containing entries with validation errors). Returns an empty list if the `templates` array is missing or not a non-empty list.
    """
    templates = templates_doc.get("templates", []) if isinstance(templates_doc, dict) else []
    if not isinstance(templates, list) or not templates:
        add_error(errors, "exam_templates.json must contain a non-empty templates array")
        return []

    template_ids = [template.get("id") for template in templates if isinstance(template, dict)]
    duplicates = [key for key, count in Counter(template_ids).items() if key and count > 1]
    if duplicates:
        add_error(errors, f"Duplicate template ids: {duplicates}")

    validated = []
    for template in templates:
        if not isinstance(template, dict):
            add_error(errors, "Template entries must be objects")
            continue
        template_id = str(template.get("id") or "").strip()
        if not template_id:
            add_error(errors, "Template missing id")
            continue
        name = str(template.get("name") or "").strip()
        if not name:
            add_error(errors, f"Template '{template_id}' is missing name")
        gl_band = str(template.get("glBand") or "").strip()
        if gl_band not in SUPPORTED_GL_BANDS:
            add_error(errors, f"Template '{template_id}' has unsupported glBand '{gl_band}'")
        total_questions = template.get("totalQuestions")
        try:
            total_questions = int(total_questions)
            if total_questions <= 0:
                raise ValueError
        except Exception:
            add_error(errors, f"Template '{template_id}' has invalid totalQuestions '{template.get('totalQuestions')}'")
            total_questions = 0
        time_limit = template.get("timeLimitMin")
        try:
            time_limit = int(time_limit)
            if time_limit <= 0:
                raise ValueError
        except Exception:
            add_error(errors, f"Template '{template_id}' has invalid timeLimitMin '{template.get('timeLimitMin')}'")
        sections = template.get("sections")
        if sections is not None:
            if not isinstance(sections, list):
                add_error(errors, f"Template '{template_id}' sections must be an array")
            else:
                total = 0
                for entry in sections:
                    if not isinstance(entry, dict):
                        add_error(errors, f"Template '{template_id}' has a non-object section")
                        continue
                    topic_id = str(entry.get("topicId") or "").strip()
                    count = entry.get("count")
                    if topic_id not in topic_ids:
                        add_error(errors, f"Template '{template_id}' references unknown topic '{topic_id}'")
                    try:
                        count = int(count)
                        if count <= 0:
                            raise ValueError
                        total += count
                    except Exception:
                        add_error(errors, f"Template '{template_id}' has invalid section count '{entry.get('count')}'")
                if total_questions and total != total_questions:
                    add_error(errors, f"Template '{template_id}' sections total {total} does not match totalQuestions {total_questions}")
        validated.append(template)
    return validated


def validate_gl_band_weights(weights_doc, topic_ids, errors):
    """
    Validate the structure and per-topic numeric weights of a parsed gl_band_weights document.
    
    Parameters:
        weights_doc (dict|any): Parsed JSON document for GL band weights; expected to contain a top-level "bands" mapping.
        topic_ids (Iterable[str]): Collection of known topic IDs that weights may reference.
        errors (list): Mutable list to which human-readable validation error messages will be appended.
    
    Behavior:
        - Appends error messages to `errors` for any validation failures, including:
          missing or empty "bands"; unsupported GL band ids (excluding "general"); non-object band payloads;
          missing or empty `topicWeights`; references to unknown topic ids; and non-numeric or non-positive weights.
        - Continues validating other bands and topics after encountering errors (does not raise).
    
    Returns:
        dict: The `bands` mapping extracted from `weights_doc` when present and non-empty; otherwise an empty dict.
    """
    bands = weights_doc.get("bands", {}) if isinstance(weights_doc, dict) else {}
    if not isinstance(bands, dict) or not bands:
        add_error(errors, "gl_band_weights.json must contain a non-empty bands object")
        return {}

    for band_id, payload in bands.items():
        if band_id not in SUPPORTED_GL_BANDS - {"general"}:
            add_error(errors, f"Unsupported GL band weights entry '{band_id}'")
            continue
        if not isinstance(payload, dict):
            add_error(errors, f"GL band '{band_id}' must be an object")
            continue
        topic_weights = payload.get("topicWeights")
        if not isinstance(topic_weights, dict) or not topic_weights:
            add_error(errors, f"GL band '{band_id}' must define a non-empty topicWeights object")
            continue
        for topic_id, raw_weight in topic_weights.items():
            if topic_id not in topic_ids:
                add_error(errors, f"GL band '{band_id}' references unknown topic '{topic_id}'")
            try:
                if float(raw_weight) <= 0:
                    raise ValueError
            except Exception:
                add_error(errors, f"GL band '{band_id}' has invalid weight '{raw_weight}' for topic '{topic_id}'")
    return bands


def main():
    """
    Validate the taxonomy JSON files, print a per-topic summary, and report accumulated warnings and errors.
    
    This command-line entry point loads topics, exam templates, and GL band weights from the configured data files, performs structural and content validation across topic files and questions (including optional strict checks controlled by command-line flags), collects warnings and errors, and prints a summary of topics processed and any issues found. If any errors are present at the end of validation, the function terminates the process.
    
    Command-line flags:
      --strict-duplicates    Treat duplicate question IDs across source files as an error.
      --strict-metadata      Treat missing required question metadata fields as an error.
    
    Raises:
      SystemExit: If validation produced any errors, exits with status code 1.
    """
    parser = argparse.ArgumentParser(description="Validate 10-topic taxonomy integrity")
    parser.add_argument("--strict-duplicates", action="store_true", help="Fail when duplicate question IDs are found")
    parser.add_argument(
        "--strict-metadata",
        action="store_true",
        help="Fail when required question metadata fields are missing",
    )
    args = parser.parse_args()

    topics_doc = load_json(TOPICS_FILE)
    templates_doc = load_json(TEMPLATES_FILE)
    gl_band_weights_doc = load_json(GL_BAND_WEIGHTS_FILE)
    topics = topics_doc.get("topics", [])

    errors = []
    warnings = []
    summary = []
    metadata_missing = defaultdict(int)

    topic_ids = [topic.get("id") for topic in topics if isinstance(topic, dict)]
    dup_topic_ids = [key for key, count in Counter(topic_ids).items() if key and count > 1]
    if dup_topic_ids:
        add_error(errors, f"Duplicate topic ids: {dup_topic_ids}")

    validate_templates(templates_doc, set(topic_ids), errors)
    validate_gl_band_weights(gl_band_weights_doc, set(topic_ids), errors)

    qid_occurrences = defaultdict(list)

    for topic in topics:
        tid = topic.get("id", "<missing>")
        file_path = topic.get("file")
        if not file_path:
            add_error(errors, f"Topic '{tid}' has no data file configured")
            continue

        path = ROOT / file_path
        source_subcats = {}
        qcount = 0

        if not path.exists():
            add_error(errors, f"Topic '{tid}' references missing file: {file_path}")
            continue
        try:
            data = load_json(path)
        except Exception as exc:
            add_error(errors, f"Failed parsing '{file_path}': {exc}")
            continue

        for sub in collect_subcategories(data):
            sid = sub.get("id")
            if sid:
                source_subcats[sid] = sub
            questions = iterate_subcategory_questions(sub)
            for question in questions:
                if isinstance(question, dict) and question.get("id"):
                    qid_occurrences[question["id"]].append(f"{file_path}:{sid}")
                if args.strict_metadata:
                    for field in REQUIRED_METADATA_FIELDS:
                        value = question.get(field)
                        if value is None:
                            metadata_missing[field] += 1
                            continue
                        if isinstance(value, str) and not value.strip():
                            metadata_missing[field] += 1
                validate_question_metadata(question, f"{file_path}:{sid}:{question.get('id', '<missing>')}", errors)
            qcount += len(questions)

        topic_subs = topic.get("subcategories", [])
        topic_sub_ids = [sub.get("id") for sub in topic_subs if isinstance(sub, dict)]
        dup_subs = [key for key, count in Counter(topic_sub_ids).items() if key and count > 1]
        if dup_subs:
            add_error(errors, f"Topic '{tid}' has duplicate subcategory ids: {dup_subs}")

        missing = [sid for sid in topic_sub_ids if sid and sid not in source_subcats]
        if missing:
            add_error(errors, f"Topic '{tid}' references unknown subcategory ids: {missing}")

        empty = [sid for sid in topic_sub_ids if sid in source_subcats and not source_subcats[sid].get("questions")]
        if empty:
            add_warning(warnings, f"Topic '{tid}' has subcategories with zero questions: {empty}")

        summary.append((tid, len(topic_sub_ids), qcount, file_path))

    duplicate_qids = {qid: refs for qid, refs in qid_occurrences.items() if len(refs) > 1}
    if duplicate_qids:
        message = f"Found {len(duplicate_qids)} duplicate question IDs across source files"
        if args.strict_duplicates:
            add_error(errors, message)
        else:
            add_warning(warnings, message)

    metadata_gaps = {field: count for field, count in metadata_missing.items() if count > 0}
    if metadata_gaps:
        gap_text = ", ".join([f"{field}={count}" for field, count in metadata_gaps.items()])
        add_error(errors, f"Missing required question metadata: {gap_text}")

    print("Validation summary")
    for tid, sub_count, qcount, file_path in summary:
        print(f"- {tid}: subcategories={sub_count}, questions={qcount}, file={file_path}")

    if warnings:
        print("\nWarnings:")
        for warning in warnings:
            print(f"- {warning}")

    if errors:
        print("\nErrors:")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)

    print("\nTaxonomy validation passed")


if __name__ == "__main__":
    main()
