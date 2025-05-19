from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.database import get_db
import app.crud as crud

router = APIRouter()

@router.get("/", response_model=List[dict])
def listar_usuarios(db = Depends(get_db)):
    try:
        usuarios = crud.get_usuarios(db)
        return [dict(u) for u in usuarios]
    except Exception as e:
        print(f"Erro ao listar usuários: {e}")
        raise HTTPException(500, "Erro interno ao buscar usuários")

@router.get("/{usuario_id}", response_model=dict)
def obter_usuario(usuario_id: int, db = Depends(get_db)):
    usuario = crud.get_usuario(db, usuario_id)
    if not usuario:
        raise HTTPException(404, "Usuário não encontrado")
    return usuario

@router.post("/", response_model=dict, status_code=201)
def criar_usuario(usuario: dict, db = Depends(get_db)):
    return crud.create_usuario(db, usuario)

@router.delete("/{usuario_id}", status_code=204)
def excluir_usuario(usuario_id: int, db = Depends(get_db)):
    if not crud.get_usuario(db, usuario_id):
        raise HTTPException(404, "Usuário não encontrado")
    crud.delete_usuario(db, usuario_id)
