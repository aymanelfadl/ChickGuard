from pathlib import Path

from app.ai_model.labels import FILENAME_LABEL_ALIASES


def predict_poultry_disease(image_path: str) -> dict:
    """
    Deterministic mock predictor with the same interface as the future model.

    Replace this function body later with model loading, preprocessing,
    inference, and label decoding without changing the API route.
    """
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image file not found: {image_path}")

    filename = path.name.lower()

    if "healthy" in filename:
        return {
            "prediction_status": "healthy",
            "disease_type": None,
            "confidence": 0.94,
        }

    for filename_token, disease_label in FILENAME_LABEL_ALIASES.items():
        if filename_token in filename:
            return {
                "prediction_status": "sick",
                "disease_type": disease_label,
                "confidence": _confidence_for_filename(filename, base=0.84, spread=0.12),
            }

    return {
        "prediction_status": "healthy",
        "disease_type": None,
        "confidence": 0.75,
    }


def _confidence_for_filename(filename: str, base: float, spread: float) -> float:
    normalized_score = sum(filename.encode("utf-8")) % 100 / 100
    return round(min(base + normalized_score * spread, 0.99), 2)
