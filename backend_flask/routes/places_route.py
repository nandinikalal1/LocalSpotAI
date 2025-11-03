# backend_flask/routes/places_route.py
from flask import Blueprint, request, jsonify
from services.places_client import get_nearby_places
import traceback

# Create blueprint
places_bp = Blueprint("places", __name__, url_prefix="/places")

@places_bp.route("/nearby", methods=["POST"])
def nearby_places():
    
    #Fetch nearby places using OpenStreetMap (Overpass API)
    
    try:
        data = request.get_json(force=True)
        lat = float(data.get("lat"))
        lng = float(data.get("lng"))
        radius_m = int(data.get("radius_m", 2000))
        included_types = data.get("included_types", [])
        max_results = int(data.get("max_results", 20))

        print(f"🔍 [places_route] lat={lat}, lng={lng}, radius={radius_m}, filters={included_types}")

        places = get_nearby_places(lat, lng, radius_m, included_types, max_results)
        print(f"Found {len(places)} nearby places")

        return jsonify({"places": places}), 200

    except Exception as e:
        print("❌ Error in /places/nearby:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
