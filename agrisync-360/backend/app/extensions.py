from celery import Celery
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from redis import Redis


db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS(supports_credentials=True)
limiter = Limiter(key_func=get_remote_address)
redis_client = Redis(decode_responses=True)
celery = Celery(__name__)
