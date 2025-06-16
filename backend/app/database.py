from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session as SQLAlchemySession # Alias to avoid confusion
from app.models import Base # Import Base from your models.py
import os

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", # Prioritizes the environment variable
    "postgresql://bibliodex:bibliodex@localhost:5432/bibliodex_db" # Default if not set
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)

# ATENÇÃO:
# Em produção, recomenda-se usar Alembic para migrações de banco de dados.
# Para desenvolvimento rápido/local, você pode descomentar a linha abaixo para criar as tabelas automaticamente.
# Base.metadata.create_all(bind=engine) # Descomente para criar tabelas automaticamente em dev

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get DB session
def get_db():
    db: SQLAlchemySession = SessionLocal()
    try:
        yield db
    finally:
        db.close()
