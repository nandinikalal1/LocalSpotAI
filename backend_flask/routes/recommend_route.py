
from flask import Blueprint, request, jsonify
from services.places_client import get_nearby_places

recommend_bp = Blueprint("recommend", __name__, url_prefix="/recommend")

# In-memory "user feedback" cache (acts as pseudo-database)
user_feedback = {
    "liked": set(),
    "disliked": set(),
    "saved": set(),
    "last_category": None
}

# RECOMMENDATION ENDPOINT

@recommend_bp.route("", methods=["POST"])
def recommend_places():
    """
    Returns personalized recommended places based on feedback and recent category.
    Expected JSON:
    {
        "lat": 32.7767,
        "lng": -96.7970,
        "recent_category": "parks"  (optional)
    }
    """
    try:
        data = request.get_json()
        lat = data.get("lat")
        lng = data.get("lng")
        recent_category = data.get("recent_category") or user_feedback.get("last_category")

        if recent_category:
            user_feedback["last_category"] = recent_category

        # If user liked something, prioritize that type
        included_types = []
        if user_feedback["liked"]:
            included_types.extend(list(user_feedback["liked"]))
        elif recent_category:
            included_types.append(recent_category)
        else:
            included_types = ["parks", "cafes", "restaurants", "gyms", "salons"]

        places = get_nearby_places(lat, lng, 3000, included_types, max_results=15)
        return jsonify({"recommendations": places}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



# FEEDBACK ENDPOINTS (like / dislike / save)

@recommend_bp.route("/feedback", methods=["POST"])
def feedback():
    """
    Stores user feedback to adjust recommendations.
    Expected JSON:
    {
        "place_name": "Café Momentum",
        "action": "like" | "dislike" | "save",
        "category": "restaurant"
    }
    """
    try:
        data = request.get_json()
        place_name = data.get("place_name")
        action = data.get("action")
        category = data.get("category")

        if not place_name or not action:
            return jsonify({"error": "Missing parameters"}), 400

        if action == "like":
            user_feedback["liked"].add(category)
            user_feedback["disliked"].discard(category)
        elif action == "dislike":
            user_feedback["disliked"].add(category)
            user_feedback["liked"].discard(category)
        elif action == "save":
            user_feedback["saved"].add(place_name)

        print("Feedback updated:", user_feedback)
        return jsonify({"message": "Feedback stored", "feedback": user_feedback}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



# SAVED PLACES ENDPOINT

@recommend_bp.route("/saved", methods=["GET"])
def saved_places():
    """
    Returns list of saved places for the user.
    """
    try:
        saved = list(user_feedback["saved"])
        return jsonify({"saved_places": saved}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
