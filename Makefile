up:
	docker compose up -d --build

down:
	docker compose down

validate-model:
	docker compose exec backend python /app/scripts/validate_model_predictions.py --image-dir /app/simulator/sample_images
