HEALTHY_LABELS = {"healty", "pcrhealthy"}

LABEL_DISPLAY_NAMES = {
    "cocci": "Coccidiosis",
    "healty": "Healthy",
    "ncd": "Newcastle Disease",
    "pcrcocci": "Coccidiosis",
    "pcrhealthy": "Healthy",
    "pcrncd": "Newcastle Disease",
    "pcrsalmo": "Salmonella",
    "salmo": "Salmonella",
}

# Used only by the development fallback when the real Keras model is missing.
MOCK_FILENAME_LABELS = {
    "healthy": "healty",
    "healty": "healty",
    "pcrhealthy": "pcrhealthy",
    "coccidiosis": "cocci",
    "cocci": "cocci",
    "pcrcocci": "pcrcocci",
    "newcastle": "ncd",
    "newcastle_disease": "ncd",
    "ncd": "ncd",
    "pcrncd": "pcrncd",
    "salmonella": "salmo",
    "salmo": "salmo",
    "pcrsalmo": "pcrsalmo",
}
