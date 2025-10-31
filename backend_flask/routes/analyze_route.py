from flask import Blueprint, request, jsonify
from models.sentiment_model import analyze_sentiment

#Define the Flask Blueprint object that app.py tries to import
analyze_bp = Blueprint("analyze", __name__, url_prefix="/analyze")

#ROUTE: /analyze
@analyze_bp.route("", methods=["POST"])
def analyze_text():
    """
    Analyze sentiment of a given text.
    Example input JSON:
    {
        "text": "Amazing coffee and cozy atmosphere!"
    }
    """
    try:
        data = request.get_json()
        text = data.get("text", "")

        if not text:
            return jsonify({"error": "Text is required"}), 400

        result = analyze_sentiment(text)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
