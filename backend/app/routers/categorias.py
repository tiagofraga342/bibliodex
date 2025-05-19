from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/categorias", tags=["Categorias"])

@router.get("/", response_model=List[schemas.CategoriaRead])
def listar_categorias(db = Depends(get_db)):
    return crud.get_categorias(db)

@router.get("/{categoria_id}", response_model=schemas.CategoriaRead)
def obter_categoria(categoria_id: int, db = Depends(get_db)):
    cat = crud.get_categoria(db, categoria_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return cat

@router.post("/", response_model=schemas.CategoriaRead, status_code=status.HTTP_201_CREATED)
def criar_categoria(cat: schemas.CategoriaCreate, db = Depends(get_db)):
    return crud.create_categoria(db, cat.dict())

@router.delete("/{categoria_id}", response_model=schemas.CategoriaRead)
def excluir_categoria(categoria_id: int, db = Depends(get_db)):
    cat = crud.delete_categoria(db, categoria_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return cat
