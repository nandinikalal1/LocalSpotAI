from flask import Blueprint, request, jsonify
from services.places_client import get_nearby_places
import math

recommend_bp = Blueprint("recommend", __name__, url_prefix="/recommend")


# Text Similarity Function

def text_similarity(a, b):
    """Simple token overlap similarity."""
    if not a or not b:
        return 0
    a, b = a.lower(), b.lower()
    a_tokens, b_tokens = set(a.split()), set(b.split())
    return len(a_tokens & b_tokens) / max(1, len(a_tokens | b_tokens))



# Hybrid AI-Style Scoring Engine

def compute_score(place, liked_places, disliked_places):
    """
    Combines multiple ranking signals to simulate ML-like personalization.
    """
    name = place.get("name", "")
    type_ = place.get("type", "")
    distance = place.get("distance", 0)

    # Base scores
    score = 0.0

    # (1) Text-based similarity (content signal)
    if any(text_similarity(name, liked) > 0.3 for liked in liked_places):
        score += 3.0
    if any(text_similarity(name, disliked) > 0.2 for disliked in disliked_places):
        score -= 2.0

    # (2) Category affinity (semantic signal)
    liked_categories = ["cafe", "gym", "park", "salon", "university", "mall", "hospital", "library"]
    for cat in liked_categories:
        if cat in type_.lower():
            score += 1.5
            break

    # (3) Distance weighting (contextual signal)
    # Closer places get higher weight (exponential decay)
    distance_weight = math.exp(-distance / 3) * 2
    score += distance_weight

    # (4) Popularity bias (simulated)
    # Assume places with longer names or known chains are more popular
    if any(kw in name.lower() for kw in ["starbucks", "target", "gym", "university", "library", "temple", "park"]):
        score += 0.8

    # (5) Diversity encouragement (optional)
    # Light randomization to avoid repetition
    import random
    score += random.uniform(0, 0.5)

    return round(score, 3)



# Main Recommendation Endpoint

@recommend_bp.route("/", methods=["POST"])
def recommend_places():
    """
    Personalized hybrid AI-style recommendation endpoint.
    Input JSON:
      {
        "lat": float,
        "lng": float,
        "liked": [names],
        "disliked": [names],
        "recent_category": "cafes"
      }
    Output: Ranked recommended places.
    """
    try:
        data = request.get_json(force=True)
        lat, lng = data.get("lat"), data.get("lng")
        liked_places = data.get("liked", [])
        disliked_places = data.get("disliked", [])
        recent_category = data.get("recent_category")

        # Step 1: Get nearby places from Overpass
        all_places = get_nearby_places(
            lat, lng,
            radius_m=2000,
            included_types=[recent_category] if recent_category else None,
            max_results=60
        )

        # Step 2: Compute scores
        for p in all_places:
            p["score"] = compute_score(p, liked_places, disliked_places)

        # Step 3: Sort by descending score
        ranked = sorted(all_places, key=lambda x: x["score"], reverse=True)

        # Step 4: Limit to top results
        return jsonify({
            "recommendations": ranked[:10],
            "total_found": len(all_places),
        }), 200

    except Exception as e:
        print("Error in /recommend:", e)
        return jsonify({"error": str(e)}), 500
