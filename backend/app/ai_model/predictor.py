import json
import logging
import os
import shutil
import tempfile
from pathlib import Path
from typing import Any

from app.ai_model.labels import HEALTHY_LABELS, LABEL_DISPLAY_NAMES, MOCK_FILENAME_LABELS


logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).resolve().parent / "model"
MODEL_PATH = MODEL_DIR / "chicken_disease_model.keras"
LABELS_PATH = MODEL_DIR / "labels.json"
IMAGE_SIZE = (224, 224)

_model: Any | None = None
_labels: list[str] | None = None


class ModelUnavailableError(RuntimeError):
    """Raised when the real model files or runtime dependencies are unavailable."""


def predict_poultry_disease(image_path: str) -> dict:
    """
    Predict poultry disease indicators from a saved droppings image path.

    The backend calls this stable image-only interface whether droppings
    analysis uses the real Keras model or the development mock fallback.
    """
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image file not found: {image_path}")

    try:
        return _predict_with_real_model(path)
    except ModelUnavailableError as error:
        logger.warning("Real poultry model unavailable; using mock fallback: %s", error)
        return _predict_with_mock(path)
    except Exception:
        logger.exception("Real poultry model prediction failed; using mock fallback")
        return _predict_with_mock(path)


def get_model() -> Any:
    """Load and cache the Keras model once, then reuse it for later requests."""
    global _model
    if _model is not None:
        return _model

    if not MODEL_PATH.exists():
        raise ModelUnavailableError(f"model directory not found: {MODEL_PATH}")

    try:
        import tensorflow as tf
    except ImportError as error:
        raise ModelUnavailableError("tensorflow is not installed") from error

    try:
        _model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    except IsADirectoryError:
        logger.warning(
            "Keras rejected the .keras directory path; retrying through a directory alias"
        )
        _model = tf.keras.models.load_model(_keras_directory_alias_path(), compile=False)
    except Exception as error:
        raise ModelUnavailableError(f"failed to load Keras model: {error}") from error

    logger.info("Loaded poultry disease model from %s", MODEL_PATH)
    return _model


def _keras_directory_alias_path() -> Path:
    """
    Return a directory alias that Keras can load as an unzipped model.

    Keras 3 can load unzipped model directories, but some versions treat paths
    ending in `.keras` as files. This keeps the real model directory unchanged
    and avoids loading model.weights.h5 directly.
    """
    alias_path = Path(tempfile.gettempdir()) / "chicken_disease_model_keras_dir"
    if alias_path.exists():
        return alias_path

    try:
        os.symlink(MODEL_PATH, alias_path, target_is_directory=True)
    except OSError:
        shutil.copytree(MODEL_PATH, alias_path)

    return alias_path


def get_labels() -> list[str]:
    """
    Load labels in the exact order saved by training.

    Do not sort or rename these labels; each index must match the model output
    index from the final classification layer.
    """
    global _labels
    if _labels is not None:
        return _labels

    if not LABELS_PATH.exists():
        raise ModelUnavailableError(f"labels file not found: {LABELS_PATH}")

    with LABELS_PATH.open("r", encoding="utf-8") as label_file:
        labels = json.load(label_file)

    if not isinstance(labels, list) or not all(isinstance(label, str) for label in labels):
        raise ModelUnavailableError("labels.json must contain a JSON list of strings")

    _labels = labels
    return _labels


def _predict_with_real_model(path: Path) -> dict:
    model = get_model()
    labels = get_labels()
    image_array = _preprocess_image(path, model)
    predictions = model.predict(image_array, verbose=0)
    probabilities = _first_prediction_row(predictions)

    if len(probabilities) != len(labels):
        raise ValueError(
            f"model returned {len(probabilities)} outputs, but labels.json has {len(labels)} labels"
        )

    class_index = max(range(len(probabilities)), key=lambda index: probabilities[index])
    raw_label = labels[class_index]
    confidence = float(probabilities[class_index])

    return _result_from_raw_label(raw_label, confidence)


def _preprocess_image(path: Path, model: Any):
    import tensorflow as tf

    image = tf.keras.utils.load_img(path, color_mode="rgb", target_size=IMAGE_SIZE)
    image_array = tf.keras.utils.img_to_array(image).astype("float32")
    image_array = image_array[None, ...]

    # The saved model currently includes a Rescaling layer. Only normalize here
    # for model versions that do not include preprocessing internally.
    if not _model_has_rescaling_layer(model):
        image_array = image_array / 255.0

    return image_array


def _model_has_rescaling_layer(model: Any) -> bool:
    for layer in _walk_layers(model):
        if layer.__class__.__name__ == "Rescaling":
            return True
    return False


def _walk_layers(model: Any):
    for layer in getattr(model, "layers", []):
        yield layer
        yield from _walk_layers(layer)


def _first_prediction_row(predictions: Any) -> list[float]:
    if isinstance(predictions, list):
        predictions = predictions[0]

    if hasattr(predictions, "tolist"):
        predictions = predictions.tolist()

    if predictions and isinstance(predictions[0], list):
        predictions = predictions[0]

    return [float(value) for value in predictions]


def _result_from_raw_label(raw_label: str, confidence: float) -> dict:
    display_name = LABEL_DISPLAY_NAMES.get(raw_label, raw_label)
    if raw_label in HEALTHY_LABELS:
        return {
            "prediction_status": "healthy",
            "disease_type": None,
            "raw_label": raw_label,
            "confidence": round(confidence, 4),
        }

    return {
        "prediction_status": "sick",
        "disease_type": display_name,
        "raw_label": raw_label,
        "confidence": round(confidence, 4),
    }


def _predict_with_mock(path: Path) -> dict:
    filename = path.name.lower()

    for filename_token, raw_label in MOCK_FILENAME_LABELS.items():
        if filename_token in filename:
            confidence = _confidence_for_filename(filename, base=0.84, spread=0.12)
            return _result_from_raw_label(raw_label, confidence)

    return _result_from_raw_label("healty", 0.75)


def _confidence_for_filename(filename: str, base: float, spread: float) -> float:
    normalized_score = sum(filename.encode("utf-8")) % 100 / 100
    return round(min(base + normalized_score * spread, 0.99), 2)
