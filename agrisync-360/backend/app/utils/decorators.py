from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt_identity

from app.models.user import User


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        identity = get_jwt_identity()
        user = User.query.get(identity)
        if not user or user.role != "admin":
            return jsonify({"success": False, "error": "forbidden", "message": "Admin access required"}), 403
        return fn(*args, **kwargs)

    return wrapper
