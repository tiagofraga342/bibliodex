from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.database import get_db
import app.crud as crud

router = APIRouter()

@router.get("/", response_model=List[dict])
def listar_livros(db = Depends(get_db)):
    try:
        livros = crud.get_livros(db)
        # Serializa caso venha como objetos do psycopg2 ou SQLAlchemy
        return [dict(l) for l in livros]
    except Exception as e:
        print(f"Erro ao listar livros: {e}")
        raise HTTPException(500, "Erro interno ao buscar livros")

@router.get("/{livro_id}", response_model=dict)
def obter_livro(livro_id: int, db = Depends(get_db)):
    livro = crud.get_livro(db, livro_id)
    if not livro:
        raise HTTPException(404, "Livro não encontrado")
    return livro

@router.post("/", response_model=dict, status_code=201)
def criar_livro(livro: dict, db = Depends(get_db)):
    return crud.create_livro(db, livro)

@router.delete("/{livro_id}", status_code=204)
def excluir_livro(livro_id: int, db = Depends(get_db)):
    if not crud.get_livro(db, livro_id):
        raise HTTPException(404, "Livro não encontrado")
    crud.delete_livro(db, livro_id)
