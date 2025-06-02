from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session as SQLAlchemySession # Alias to avoid confusion
from app.models import Base # Import Base from your models.py
import os

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://bibliodex:bibliodex@localhost:5432/bibliodex_db"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)

# If you are using Alembic for migrations, Base.metadata.create_all(bind=engine)
# should not be called here directly in production.
# For development, you might call it to create tables if they don't exist.
# Consider where to best place this:
# Base.metadata.create_all(bind=engine) # Creates tables if they don't exist

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get DB session
def get_db():
    db: SQLAlchemySession = SessionLocal()
    try:
        yield db
    finally:
        db.close()
