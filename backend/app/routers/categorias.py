from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session # Import Session
import logging # Import logging

from app.database import get_db
from app import crud, schemas, models # Import models
from app.routers.auth import get_current_active_funcionario # Import auth dependency

router = APIRouter(prefix="/categorias", tags=["Categorias"])
logger = logging.getLogger(__name__) # Logger para este módulo

@router.get("/", response_model=List[schemas.CategoriaRead])
def listar_categorias(db: Session = Depends(get_db), skip: int = 0, limit: int = 100): # Added skip and limit, typed db
    logger.info(f"Listando categorias com skip={skip}, limit={limit}")
    categorias = crud.get_categorias(db, skip=skip, limit=limit)
    logger.debug(f"Encontradas {len(categorias)} categorias.")
    return categorias

@router.get("/{categoria_id}", response_model=schemas.CategoriaRead)
def obter_categoria(categoria_id: int, db: Session = Depends(get_db)): # Typed db
    logger.info(f"Buscando categoria com ID: {categoria_id}")
    cat = crud.get_categoria(db, categoria_id)
    if not cat:
        logger.warning(f"Categoria com ID {categoria_id} não encontrada.")
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    logger.debug(f"Categoria ID {categoria_id} encontrada: {cat.nome}")
    return cat

@router.post("/", response_model=schemas.CategoriaRead, status_code=status.HTTP_201_CREATED)
def criar_categoria(
    cat: schemas.CategoriaCreate, 
    db: Session = Depends(get_db), 
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario) # Protected
):
    logger.info(f"Funcionário '{current_funcionario.matricula_funcional}' tentando criar categoria: {cat.nome}")
    try:
        nova_categoria = crud.create_categoria(db=db, categoria=cat)
        logger.info(f"Categoria '{nova_categoria.nome}' (ID: {nova_categoria.id_categoria}) criada com sucesso por '{current_funcionario.matricula_funcional}'.")
        return nova_categoria
    except HTTPException as e:
        logger.error(f"Erro ao criar categoria '{cat.nome}' por '{current_funcionario.matricula_funcional}': {e.detail}")
        raise e
    except Exception as e:
        logger.exception(f"Erro inesperado ao criar categoria '{cat.nome}' por '{current_funcionario.matricula_funcional}': {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao criar categoria.")


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT) # Changed to 204
def excluir_categoria(
    categoria_id: int, 
    db: Session = Depends(get_db),
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario) # Protected
):
    logger.info(f"Funcionário '{current_funcionario.matricula_funcional}' tentando excluir categoria ID: {categoria_id}")
    # crud.delete_categoria já verifica se a categoria existe e se tem livros associados,
    # e levanta HTTPException apropriada.
    deleted_categoria = crud.delete_categoria(db, categoria_id)
    if not deleted_categoria: # Should not happen if crud raises HTTPException for not found
        logger.error(f"crud.delete_categoria retornou None para ID {categoria_id}, mas deveria ter levantado exceção se não encontrada.")
        raise HTTPException(status_code=404, detail="Categoria não encontrada para exclusão (ou erro interno no CRUD).")
    logger.info(f"Categoria ID {categoria_id} excluída com sucesso por '{current_funcionario.matricula_funcional}'.")
    return None # Return None for 204 No Content
