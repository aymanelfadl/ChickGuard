from app.ai_model import predict_poultry_disease


def run_prediction(image_path: str) -> tuple[dict | None, str | None]:
    """
    Call the AI adapter and convert model failures into a safe API outcome.

    The route talks to this stable service instead of importing model internals.
    When the real model is ready, keep predict_poultry_disease(image_path: str)
    as the adapter boundary and replace only the implementation below it.
    """
    try:
        return predict_poultry_disease(image_path), None
    except Exception as error:
        return None, str(error)
