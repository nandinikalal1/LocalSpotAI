from flask import Flask, jsonify
from flask_cors import CORS
from config import settings


from routes.places_route import places_bp
from routes.analyze_route import analyze_bp
from routes.recommend_route import recommend_bp


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"}), 200

    # Register routes
    app.register_blueprint(places_bp)
    app.register_blueprint(analyze_bp)
    app.register_blueprint(recommend_bp)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host=settings.HOST, port=settings.PORT, debug=settings.DEBUG)
