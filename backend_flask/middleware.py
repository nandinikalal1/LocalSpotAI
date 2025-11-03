import jwt
from flask import request
from db import db
from bson import ObjectId
import os

JWT_SECRET = os.getenv("JWT_SECRET", "secret_key")

def get_current_user():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return db.users.find_one({"_id": ObjectId(payload["uid"])})
    except Exception:
        return None
