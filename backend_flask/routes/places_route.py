# backend_flask/routes/places_route.py
from flask import Blueprint, request, jsonify
from services.places_client import get_nearby_places

places_bp = Blueprint("places", __name__, url_prefix="/places")

@places_bp.route("/nearby", methods=["POST"])
def nearby_places():
    try:
        data = request.get_json(force=True)
        lat = float(data.get("lat"))
        lng = float(data.get("lng"))
        radius_m = int(data.get("radius_m", 5000))
        included = data.get("included_types", [])
        max_results = int(data.get("max_results", 20))

        print(f"🔍 /places/nearby lat={lat} lng={lng} r={radius_m} types={included}")

        places = get_nearby_places(lat, lng, radius_m, included, max_results)
        return jsonify({"places": places}), 200
    except Exception as e:
        print("error in /places/nearby:", e)
        return jsonify({"error": str(e)}), 500
