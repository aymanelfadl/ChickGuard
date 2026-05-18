#!/usr/bin/env python3
"""Validate the poultry droppings image predictor against local droppings images."""

from __future__ import annotations

import argparse
import csv
import logging
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = REPO_ROOT / "backend"
DEFAULT_IMAGE_DIR = REPO_ROOT / "simulator" / "sample_images"
DEFAULT_REPORT_PATH = REPO_ROOT / "reports" / "model_validation_report.csv"
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png"}

# The host repo uses backend.app..., while the backend Docker container keeps
# the FastAPI package at /app/app. Support both layouts before importing the
# production predictor.
for import_path in (REPO_ROOT, BACKEND_DIR):
    path_value = str(import_path)
    if path_value not in sys.path:
        sys.path.insert(0, path_value)

try:
    from backend.app.ai_model.predictor import (  # type: ignore  # noqa: E402
        LABELS_PATH,
        MODEL_PATH,
        predict_poultry_disease,
    )
except ModuleNotFoundError:
    from app.ai_model.predictor import (  # type: ignore  # noqa: E402
        LABELS_PATH,
        MODEL_PATH,
        predict_poultry_disease,
    )


logging.basicConfig(
    level=logging.WARNING,
    format="%(levelname)s: %(message)s",
    stream=sys.stdout,
)


EXPECTED_LABEL_ALIASES = (
    ("pcrhealthy", "pcrhealthy"),
    ("pcrcocci", "pcrcocci"),
    ("pcrsalmo", "pcrsalmo"),
    ("pcrncd", "pcrncd"),
    ("coccidiosis", "cocci"),
    ("cocci", "cocci"),
    ("newcastle", "ncd"),
    ("ncd", "ncd"),
    ("salmonella", "salmo"),
    ("salmo", "salmo"),
    ("healthy", "healty"),
    ("healty", "healty"),
)


@dataclass
class ValidationResult:
    filename: str
    expected_label: str | None
    raw_label: str | None
    disease_type: str | None
    prediction_status: str | None
    confidence: float | None
    is_correct: bool | None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate poultry droppings disease predictions for a folder of droppings images."
    )
    parser.add_argument(
        "--image-dir",
        default=str(DEFAULT_IMAGE_DIR),
        help="Folder containing poultry droppings .jpg, .jpeg, or .png images.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    image_dir = Path(args.image_dir).expanduser()
    if not image_dir.is_absolute():
        image_dir = (Path.cwd() / image_dir).resolve()

    print("Model Validation Report")
    print(f"Droppings image directory: {display_path(image_dir)}")
    print()

    predictor_warning = get_predictor_mode_warning()
    if predictor_warning:
        print(f"WARNING: {predictor_warning}")
        print()

    if not image_dir.exists():
        print(f"ERROR: Droppings image directory does not exist: {image_dir}")
        return 1

    if not image_dir.is_dir():
        print(f"ERROR: Droppings image path is not a directory: {image_dir}")
        return 1

    image_paths = find_images(image_dir)
    if not image_paths:
        print(f"ERROR: No droppings images found. Supported extensions: {supported_extensions_text()}")
        return 1

    results = [validate_image(image_path) for image_path in image_paths]
    print_results_table(results)
    print_summary(results)
    write_csv_report(results, DEFAULT_REPORT_PATH)
    print()
    print(f"CSV report saved to: {display_path(DEFAULT_REPORT_PATH)}")
    return 0


def get_predictor_mode_warning() -> str | None:
    missing_paths = []
    if not MODEL_PATH.exists():
        missing_paths.append(str(MODEL_PATH))
    if not LABELS_PATH.exists():
        missing_paths.append(str(LABELS_PATH))

    if not missing_paths:
        return None

    missing_text = "; ".join(missing_paths)
    return (
        "real model assets are missing, so the backend predictor will use the "
        f"mock fallback. Missing: {missing_text}"
    )


def find_images(image_dir: Path) -> list[Path]:
    return sorted(
        path
        for path in image_dir.iterdir()
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    )


def validate_image(image_path: Path) -> ValidationResult:
    expected_label = detect_expected_label(image_path.name)

    if not is_readable_image(image_path):
        print(f"WARNING: Skipping invalid or corrupt droppings image: {display_path(image_path)}")
        return ValidationResult(
            filename=image_path.name,
            expected_label=expected_label,
            raw_label=None,
            disease_type=None,
            prediction_status=None,
            confidence=None,
            is_correct=None,
        )

    try:
        prediction = predict_poultry_disease(str(image_path))
    except Exception as error:
        print(f"WARNING: Prediction failed for {image_path.name}: {error}")
        return ValidationResult(
            filename=image_path.name,
            expected_label=expected_label,
            raw_label=None,
            disease_type=None,
            prediction_status=None,
            confidence=None,
            is_correct=None,
        )

    raw_label = value_or_none(prediction.get("raw_label"))
    is_correct = raw_label == expected_label if expected_label is not None else None

    return ValidationResult(
        filename=image_path.name,
        expected_label=expected_label,
        raw_label=raw_label,
        disease_type=value_or_none(prediction.get("disease_type")),
        prediction_status=value_or_none(prediction.get("prediction_status")),
        confidence=float(prediction["confidence"])
        if prediction.get("confidence") is not None
        else None,
        is_correct=is_correct,
    )


def is_readable_image(image_path: Path) -> bool:
    try:
        from PIL import Image
    except ImportError:
        # Pillow is installed with the backend. If someone runs the tool from a
        # partial environment, let the production predictor surface the issue.
        return True

    try:
        with Image.open(image_path) as image:
            image.verify()
        return True
    except Exception:
        return False


def detect_expected_label(filename: str) -> str | None:
    normalized_name = filename.lower().replace("-", "_")
    for token, expected_label in EXPECTED_LABEL_ALIASES:
        if token in normalized_name:
            return expected_label
    return None


def print_results_table(results: list[ValidationResult]) -> None:
    rows = [
        [
            result.filename,
            display_value(result.expected_label),
            display_value(result.raw_label),
            display_value(result.prediction_status),
            display_confidence(result.confidence),
            display_bool(result.is_correct),
        ]
        for result in results
    ]
    headers = ["filename", "expected", "predicted", "status", "confidence", "correct"]
    widths = column_widths(headers, rows)

    print(format_row(headers, widths))
    print(format_row(["-" * len(header) for header in headers], widths))
    for row in rows:
        print(format_row(row, widths))


def print_summary(results: list[ValidationResult]) -> None:
    total_images = len(results)
    with_expected = [result for result in results if result.expected_label is not None]
    correct = [result for result in with_expected if result.is_correct is True]
    confidence_values = [
        result.confidence for result in results if result.confidence is not None
    ]

    print()
    print("Summary:")
    print(f"Total images: {total_images}")
    print(f"With expected labels: {len(with_expected)}")
    print(f"Correct: {len(correct)}")

    if with_expected:
        accuracy = len(correct) / len(with_expected) * 100
        print(f"Accuracy: {accuracy:.2f}%")
    else:
        print("Accuracy: null")

    if confidence_values:
        average_confidence = sum(confidence_values) / len(confidence_values)
        print(f"Average confidence: {average_confidence:.2f}")
    else:
        print("Average confidence: null")


def write_csv_report(results: list[ValidationResult], report_path: Path) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with report_path.open("w", newline="", encoding="utf-8") as report_file:
        writer = csv.DictWriter(
            report_file,
            fieldnames=[
                "filename",
                "expected_label",
                "raw_label",
                "disease_type",
                "prediction_status",
                "confidence",
                "is_correct",
            ],
        )
        writer.writeheader()
        for result in results:
            writer.writerow(
                {
                    "filename": result.filename,
                    "expected_label": result.expected_label,
                    "raw_label": result.raw_label,
                    "disease_type": result.disease_type,
                    "prediction_status": result.prediction_status,
                    "confidence": result.confidence,
                    "is_correct": csv_bool(result.is_correct),
                }
            )


def column_widths(headers: list[str], rows: list[list[str]]) -> list[int]:
    return [
        max(len(headers[index]), *(len(row[index]) for row in rows))
        for index in range(len(headers))
    ]


def format_row(values: list[str], widths: list[int]) -> str:
    return "  ".join(
        value.ljust(widths[index]) for index, value in enumerate(values)
    )


def display_path(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def display_value(value: Any) -> str:
    return "null" if value is None else str(value)


def display_bool(value: bool | None) -> str:
    if value is None:
        return "null"
    return "true" if value else "false"


def csv_bool(value: bool | None) -> str | None:
    if value is None:
        return None
    return "true" if value else "false"


def display_confidence(value: float | None) -> str:
    return "null" if value is None else f"{value:.2f}"


def supported_extensions_text() -> str:
    return ", ".join(sorted(SUPPORTED_EXTENSIONS))


def value_or_none(value: Any) -> str | None:
    if value is None:
        return None
    return str(value)


if __name__ == "__main__":
    raise SystemExit(main())
