from sqlalchemy.orm import Session
from app import models

def get_cursos(db: Session):
    return db.query(models.Curso).all()
