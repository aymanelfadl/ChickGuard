# Model Validation

Use `scripts/validate_model_predictions.py` to run the existing droppings
image-only poultry disease predictor against a local folder of test droppings
images.

This tool is for integration validation: it confirms that the backend predictor
can load the fecal image classification model, preprocess droppings images, map
labels, and produce stable outputs. It is not a full scientific model
evaluation. A proper evaluation should use a held-out dataset, class-level
metrics, confusion matrices, and documented data splits.

## Local Validation

From the project root:

```bash
python -m pip install -r backend/requirements.txt
python scripts/validate_model_predictions.py
```

By default, the script reads:

```text
simulator/sample_images/
```

Use a custom droppings image folder:

```bash
python scripts/validate_model_predictions.py --image-dir path/to/droppings-images
```

If TensorFlow is not installed in the active local Python environment, the
predictor will use mock fallback mode. In that case, prefer Docker validation.

## Docker Validation

The backend Docker image installs backend dependencies, including
`tensorflow-cpu`, so this is the preferred validation path when TensorFlow is
not installed on the host.

Start the stack:

```bash
docker compose up -d --build
```

Run validation inside the backend container:

```bash
docker compose exec backend python /app/scripts/validate_model_predictions.py --image-dir /app/simulator/sample_images
```

Or use the Makefile shortcut:

```bash
make validate-model
```

Docker Compose mounts these local folders into the backend container:

```text
./scripts                  -> /app/scripts
./reports                  -> /app/reports
./simulator/sample_images  -> /app/simulator/sample_images
./backend/app/ai_model/model -> /app/app/ai_model/model
```

With TensorFlow and the local model assets present, Docker validation should use
the real Keras model. If the model directory or `labels.json` is missing, the
same backend predictor falls back to mock mode and prints a warning.

The message `Keras rejected the .keras directory path; retrying through a
directory alias` is not mock fallback. It is the existing compatibility path for
loading the unzipped `.keras` model directory.

Supported droppings image extensions:

```text
.jpg, .jpeg, .png
```

## Expected Filename Labels

The script detects expected labels from filenames when possible. The expected
label is compared directly with the predictor's `raw_label`.

The model classifies poultry droppings images into disease-related classes:
Coccidiosis, Newcastle Disease, Salmonella, and Healthy.

Examples:

```text
cocci_01.jpg       -> cocci
ncd_01.jpg         -> ncd
salmo_01.jpg       -> salmo
healty_01.jpg      -> healty
healthy_01.jpg     -> healty
pcrcocci_01.jpg    -> pcrcocci
pcrhealthy_01.jpg  -> pcrhealthy
pcrncd_01.jpg      -> pcrncd
pcrsalmo_01.jpg    -> pcrsalmo
```

If no expected label can be detected, `expected_label` and `is_correct` are
reported as `null`.

## Report Output

The console output includes:

- filename
- expected label
- predicted raw label
- prediction status from droppings analysis
- confidence
- correctness
- summary accuracy when expected labels are available
- average confidence

The CSV report is saved to:

```text
reports/model_validation_report.csv
```

When validation runs inside Docker, `/app/reports/model_validation_report.csv`
is mounted back to the same host path:

```text
reports/model_validation_report.csv
```

CSV columns:

```text
filename, expected_label, raw_label, disease_type, prediction_status, confidence, is_correct
```

## Confidence

`confidence` is the selected class probability returned by the droppings image
predictor. Higher values indicate the model assigned more probability to the
selected class, but this number should not be treated as calibrated clinical
certainty without separate calibration and evaluation.

## Mock Fallback

The validation script imports and calls the same backend predictor used by the
API:

```python
from backend.app.ai_model.predictor import predict_poultry_disease
```

If the local Keras model directory or `labels.json` is missing, the predictor
uses its deterministic mock fallback and the script prints a warning. Place the
real model assets under:

```text
backend/app/ai_model/model/chicken_disease_model.keras/
backend/app/ai_model/model/labels.json
```
