import logging

from flask import Flask, jsonify

from app.config import config
from app.extensions import celery, cors, db, jwt, limiter, migrate, redis_client


def create_app(config_name="development"):
    app = Flask(__name__)
    app.config.from_object(config.get(config_name, config["default"]))

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    limiter.init_app(app)
    redis_client.from_url(app.config["REDIS_URL"])

    celery.conf.update(
        broker_url=app.config["CELERY_BROKER_URL"],
        result_backend=app.config["CELERY_RESULT_BACKEND"],
        timezone="Africa/Nairobi",
        enable_utc=True,
    )

    logging.basicConfig(level=logging.INFO)

    from app.routes import ALL_BLUEPRINTS

    for bp in ALL_BLUEPRINTS:
        app.register_blueprint(bp)

    @app.get("/api/health")
    def health():
        return jsonify({"success": True, "message": "AgriSync 360 API running"}), 200

    @app.errorhandler(400)
    def handle_400(error):
        return jsonify({"success": False, "error": "bad_request", "message": str(error)}), 400

    @app.errorhandler(401)
    def handle_401(error):
        return jsonify({"success": False, "error": "unauthorized", "message": str(error)}), 401

    @app.errorhandler(403)
    def handle_403(error):
        return jsonify({"success": False, "error": "forbidden", "message": str(error)}), 403

    @app.errorhandler(404)
    def handle_404(error):
        return jsonify({"success": False, "error": "not_found", "message": "Resource not found"}), 404

    @app.errorhandler(500)
    def handle_500(error):
        app.logger.exception("Unhandled error: %s", error)
        return jsonify({"success": False, "error": "server_error", "message": "An unexpected error occurred"}), 500

    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return jsonify({"success": False, "error": "invalid_token", "message": reason}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(reason):
        return jsonify({"success": False, "error": "Missing Authorization Header", "message": reason}), 401

    @jwt.expired_token_loader
    def expired_token_callback(_jwt_header, _jwt_payload):
        return jsonify({"success": False, "error": "token_expired", "message": "Token has expired"}), 401

    return app
