from flask import Blueprint, request, jsonify
from middleware import get_current_user
from db import db
from bson import ObjectId

user_bp = Blueprint("user", __name__, url_prefix="/user")

@user_bp.get("/profile")
def get_profile():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    user["_id"] = str(user["_id"])
    return jsonify(user)

@user_bp.post("/save")
def save_place():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    place = request.get_json()

    # Save place in a cache collection (places)
    existing = db.places.find_one({"name": place.get("name"), "lat": place.get("lat"), "lng": place.get("lng")})
    if not existing:
        place_id = db.places.insert_one(place).inserted_id
    else:
        place_id = existing["_id"]

    db.users.update_one({"_id": user["_id"]}, {"$addToSet": {"saved_places": str(place_id)}})
    return jsonify({"message": "Place saved"})

@user_bp.post("/like")
def like_place():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    pid = request.get_json().get("place_id")
    db.users.update_one({"_id": user["_id"]}, {"$addToSet": {"likes": pid}})
    return jsonify({"message": "Liked!"})

@user_bp.post("/dislike")
def dislike_place():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    pid = request.get_json().get("place_id")
    db.users.update_one({"_id": user["_id"]}, {"$addToSet": {"dislikes": pid}})
    return jsonify({"message": "Disliked!"})
