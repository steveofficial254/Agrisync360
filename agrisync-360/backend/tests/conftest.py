# conftest.py - Pytest fixtures for AgriSync 360 backend tests
"""
Test fixtures for setting up Flask app, database, and authentication.

IMPORTANT: We reuse the development database (agrisync_db) for testing
since agrisync_user lacks CREATEDB privilege. Each test function rolls back
its transaction to avoid leaving dirty data.
"""
import os
import pytest
from app import create_app
from app.extensions import db as _db
from flask_jwt_extended import create_access_token

# Override TEST_DATABASE_URL to use the existing dev database
# (agrisync_user does not have CREATEDB rights to create agrisync_test)
os.environ["TEST_DATABASE_URL"] = os.environ.get(
    "DATABASE_URL",
    "postgresql://agrisync_user:agrisync_pass@localhost:5432/agrisync_db"
)


@pytest.fixture(scope="session")
def app():
    """Create and configure a new app instance for the entire test session."""
    flask_app = create_app("testing")
    ctx = flask_app.app_context()
    ctx.push()
    _db.create_all()
    yield flask_app
    _db.session.remove()
    ctx.pop()


@pytest.fixture(scope="function")
def client(app):
    """Flask test client for making requests."""
    return app.test_client()


@pytest.fixture(scope="function")
def db_session(app):
    """Provide a transactional database session rolled back after each test."""
    connection = _db.engine.connect()
    transaction = connection.begin()

    options = {"bind": connection, "binds": {}}
    sess = _db.create_scoped_session(options=options)
    _db.session = sess

    yield sess

    transaction.rollback()
    connection.close()
    sess.remove()


@pytest.fixture(scope="function")
def auth_header(client, db_session):
    """
    Create a test farmer user + profile and return a JWT Authorization header.
    Uses a unique phone number to prevent conflicts between test runs.
    """
    import uuid
    from app.models.user import User
    from app.models.farmer import Farmer

    unique_suffix = str(uuid.uuid4().int)[:8]
    phone = f"+2547{unique_suffix}"

    user = User(phone=phone, role="farmer", is_verified=True)
    user.set_password("Password123!")
    db_session.add(user)
    db_session.flush()

    farmer = Farmer(
        user_id=user.id,
        first_name="Test",
        last_name="Farmer",
        county="Nairobi"
    )
    db_session.add(farmer)
    db_session.commit()

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": "farmer"}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def admin_auth_header(client, db_session):
    """Create a test admin user and return a JWT Authorization header."""
    import uuid
    from app.models.user import User

    unique_suffix = str(uuid.uuid4().int)[:8]
    phone = f"+2541{unique_suffix}"

    user = User(phone=phone, role="admin", is_verified=True)
    user.set_password("AdminPass1!")
    db_session.add(user)
    db_session.commit()

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": "admin"}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def dealer_auth_header(client, db_session):
    """Create a test agro-dealer user and return a JWT Authorization header."""
    import uuid
    from app.models.user import User

    unique_suffix = str(uuid.uuid4().int)[:8]
    phone = f"+2542{unique_suffix}"

    user = User(phone=phone, role="agro_dealer", is_verified=True)
    user.set_password("DealerPass1!")
    db_session.add(user)
    db_session.commit()

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": "agro_dealer"}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def ngo_auth_header(client, db_session):
    """Create a test NGO user and return a JWT Authorization header."""
    import uuid
    from app.models.user import User

    unique_suffix = str(uuid.uuid4().int)[:8]
    phone = f"+2543{unique_suffix}"

    user = User(phone=phone, role="ngo_partner", is_verified=True)
    user.set_password("NGOPass1!")
    db_session.add(user)
    db_session.commit()

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": "ngo_partner"}
    )
    return {"Authorization": f"Bearer {token}"}
