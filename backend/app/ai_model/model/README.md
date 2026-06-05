# AI Model Assets

Place local trained poultry droppings image classification model assets in this
directory.

Expected real model path:

```text
backend/app/ai_model/model/chicken_disease_model.keras/
```

Expected labels path:

```text
backend/app/ai_model/model/labels.json
```

The `.keras` model is an unzipped Keras directory:

```text
chicken_disease_model.keras/
├── config.json
├── metadata.json
└── model.weights.h5
```

Model files and the local `labels.json` are intentionally ignored by git. They
can be large, environment-specific, or replaced as training improves. The repo
tracks only this README, `.gitkeep`, and `labels.example.json` so the expected
structure stays clear.

If the model directory or `labels.json` is missing, the backend uses the mock
droppings analysis fallback and continues running for development.

To install the model locally:

```bash
cd backend/app/ai_model/model
unzip /path/to/chicken_disease_model.keras.zip -d chicken_disease_model.keras
cp labels.example.json labels.json
```

If your zip already contains the `chicken_disease_model.keras/` folder, extract
it directly into this directory. If it contains `config.json`, `metadata.json`,
and `model.weights.h5` at the archive root, extract it into
`chicken_disease_model.keras/` as shown above.
