from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.database import get_db
import app.crud as crud

router = APIRouter()

@router.get("/", response_model=List[dict])
def listar_emprestimos(db = Depends(get_db)):
    return crud.get_emprestimos(db)

@router.get("/{emprestimo_id}", response_model=dict)
def obter_emprestimo(emprestimo_id: int, db = Depends(get_db)):
    emprestimo = crud.get_emprestimo(db, emprestimo_id)
    if not emprestimo:
        raise HTTPException(404, "Empréstimo não encontrado")
    return emprestimo

@router.post("/", response_model=dict, status_code=201)
def criar_emprestimo(emprestimo: dict, db = Depends(get_db)):
    return crud.create_emprestimo(db, emprestimo)

@router.delete("/{emprestimo_id}", status_code=204)
def excluir_emprestimo(emprestimo_id: int, db = Depends(get_db)):
    if not crud.get_emprestimo(db, emprestimo_id):
        raise HTTPException(404, "Empréstimo não encontrado")
    crud.delete_emprestimo(db, emprestimo_id)
