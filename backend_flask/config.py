import os
from dotenv import load_dotenv

#Load environment variables from .env file
load_dotenv()

class Settings:
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "5001"))
    ENV = os.getenv("FLASK_ENV", "production")
    DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"

    PLACES_FIELD_MASK = os.getenv(
        "PLACES_FIELD_MASK",
        "places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.currentOpeningHours,places.id"
    )
    PLACES_MAX_RESULTS = int(os.getenv("PLACES_MAX_RESULTS", "20"))

#Create a single global instance
settings = Settings()
