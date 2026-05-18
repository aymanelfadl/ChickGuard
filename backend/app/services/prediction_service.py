from app.ai_model import predict_poultry_disease


def run_prediction(image_path: str) -> tuple[dict | None, str | None]:
    """
    Call the droppings analysis adapter and convert model failures into a safe
    API outcome.

    The route talks to this stable service instead of importing model internals.
    Keep predict_poultry_disease(image_path: str) as the adapter boundary while
    the implementation evolves from mock fallback to real fecal image
    classification models.
    """
    try:
        return predict_poultry_disease(image_path), None
    except Exception as error:
        return None, str(error)
