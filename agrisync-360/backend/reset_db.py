from app import create_app
from app.extensions import db
import app.models  # Ensures all models are imported

app = create_app()
with app.app_context():
    print("Dropping all tables...")
    db.drop_all()
    print("Recreating all tables...")
    db.create_all()
    print("Database reset successfully!")
