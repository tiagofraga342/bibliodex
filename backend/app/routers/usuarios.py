from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from sqlalchemy.orm import Session
from app.database import get_db
from app.crud import *
import app.schemas as schemas
import app.models as models
from app.routers.auth import get_current_active_funcionario, get_current_active_usuario_cliente # Adicionado get_current_active_usuario_cliente
import logging # Import logging


router = APIRouter()
logger = logging.getLogger(__name__) # Logger para este módulo

@router.get("", response_model=List[schemas.UsuarioRead])
def listar_usuarios(
    db: Session = Depends(get_db), 
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario),
    skip: int = 0, # Adicionado skip
    limit: int = 100, # Adicionado limit
    nome_like: str = Query(None, description="Busca por nome (autocomplete)"),
    matricula: str = Query(None, description="Busca exata por matrícula"),
    sort_by: str = "nome",
    sort_dir: str = "asc"
):
    logger.info(f"Funcionário '{current_funcionario.matricula_funcional}' listando usuários com skip={skip}, limit={limit}, matricula={matricula}")
    if matricula:
        usuario = get_usuario_by_matricula(db, matricula=matricula)
        return [usuario] if usuario else []
    usuarios = get_usuarios(
        db,
        skip=skip,
        limit=limit,
        nome_like=nome_like,
        sort_by=sort_by,
        sort_dir=sort_dir
    )
    logger.debug(f"Encontrados {len(usuarios)} usuários.")
    return usuarios

@router.get("/me", response_model=schemas.UsuarioRead) # Endpoint para o usuário obter seus próprios dados
async def read_users_me(current_user: models.Usuario = Depends(get_current_active_usuario_cliente)):
    logger.info(f"Usuário '{current_user.matricula}' acessando seus próprios dados (/me).")
    return current_user

@router.get("/{usuario_id}", response_model=schemas.UsuarioRead)
def obter_usuario(
    usuario_id: int, 
    db: Session = Depends(get_db), 
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario)
):
    logger.info(f"Funcionário '{current_funcionario.matricula_funcional}' buscando usuário ID: {usuario_id}")
    usuario = get_usuario(db, usuario_id)
    if not usuario:
        logger.warning(f"Usuário com ID {usuario_id} não encontrado.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    logger.debug(f"Usuário ID {usuario_id} encontrado: {usuario.matricula}")
    return usuario

@router.post("/", response_model=schemas.UsuarioRead, status_code=status.HTTP_201_CREATED)
def criar_usuario(
    usuario: schemas.UsuarioCreate, 
    db: Session = Depends(get_db),
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario)
):
    logger.info(f"Funcionário '{current_funcionario.matricula_funcional}' tentando criar usuário: {usuario.matricula}")
    try:
        # A verificação de matrícula duplicada e de curso_id é feita no crud.create_usuario
        novo_usuario = create_usuario(db=db, usuario=usuario)
        logger.info(f"Usuário '{novo_usuario.matricula}' (ID: {novo_usuario.id_usuario}) criado com sucesso por '{current_funcionario.matricula_funcional}'.")
        return novo_usuario
    except HTTPException as e:
        logger.error(f"Erro ao criar usuário '{usuario.matricula}' por '{current_funcionario.matricula_funcional}': {e.detail}")
        raise e
    except Exception as e:
        logger.exception(f"Erro inesperado ao criar usuário '{usuario.matricula}' por '{current_funcionario.matricula_funcional}': {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao criar usuário.")


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_usuario(
    usuario_id: int, 
    db: Session = Depends(get_db), 
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario)
):
    logger.info(f"Funcionário '{current_funcionario.matricula_funcional}' tentando excluir usuário ID: {usuario_id}")
    # crud.delete_usuario agora lida com as verificações e levanta HTTPExceptions
    deleted_usuario = delete_usuario(db, usuario_id)
    
    if deleted_usuario is None and not get_usuario(db, usuario_id): # Checa se realmente não existe mais
         logger.warning(f"Usuário ID {usuario_id} não encontrado para exclusão por '{current_funcionario.matricula_funcional}'.")
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

    logger.info(f"Usuário ID {usuario_id} excluído (ou tentativa de exclusão processada) por '{current_funcionario.matricula_funcional}'.")
    return None
