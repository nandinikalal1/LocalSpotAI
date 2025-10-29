from flask import Blueprint, jsonify, request
from models.recommendation_engine import get_recommendations

recommend_bp = Blueprint("recommend", __name__, url_prefix="/recommend")

@recommend_bp.route("", methods=["POST"])
def recommend_places():
    """
    Recommend nearby places based on the last explored category or user profile.
    Example input:
    {
        "recent_category": "parks",
        "lat": 32.7767,
        "lng": -96.7970
    }
    """
    data = request.get_json()
    lat = data.get("lat")
    lng = data.get("lng")
    category = data.get("recent_category", None)

    try:
        recommendations = get_recommendations(lat, lng, category)
        return jsonify({"recommendations": recommendations}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
