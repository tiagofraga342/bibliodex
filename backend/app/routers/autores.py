from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas
from typing import List

router = APIRouter()  # Sem prefixo, sem tags

@router.get("", response_model=List[schemas.AutorReadBasic])
def listar_autores(db: Session = Depends(get_db)):
    return crud.get_autores(db)
