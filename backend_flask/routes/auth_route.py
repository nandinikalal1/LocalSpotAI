from flask import Blueprint, request, jsonify
from passlib.hash import bcrypt
import jwt, time
from bson import ObjectId
from db import db
import os

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")
JWT_SECRET = os.getenv("JWT_SECRET", "secret_key")

@auth_bp.post("/signup")
def signup():
    data = request.get_json()
    if db.users.find_one({"email": data["email"]}):
        return jsonify({"error": "Email already registered"}), 400

    hashed_pw = bcrypt.hash(data["password"])
    user_doc = {
        "email": data["email"],
        "password_hash": hashed_pw,
        "name": data.get("name", ""),
        "phone": data.get("phone", ""),
        "address": data.get("address", ""),
        "saved_places": [],
        "likes": [],
        "dislikes": [],
        "createdAt": int(time.time())
    }
    db.users.insert_one(user_doc)
    return jsonify({"message": "User registered successfully!"})

@auth_bp.post("/login")
def login():
    data = request.get_json()
    user = db.users.find_one({"email": data["email"]})
    if not user or not bcrypt.verify(data["password"], user["password_hash"]):
        return jsonify({"error": "Invalid credentials"}), 401

    payload = {"uid": str(user["_id"]), "exp": int(time.time()) + 3600 * 24 * 7}
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return jsonify({"token": token, "user": {"email": user["email"], "name": user.get("name", "")}})
