from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.database import get_db
from app import crud, schemas, models
from app.routers.auth import get_current_active_funcionario # Assuming only funcionarios manage exemplares

router = APIRouter(
    prefix="/exemplares",
    tags=["Exemplares"],
    dependencies=[Depends(get_current_active_funcionario)] # Protect all exemplar routes
)
logger = logging.getLogger(__name__)

@router.post("/", response_model=schemas.ExemplarRead, status_code=status.HTTP_201_CREATED)
def criar_exemplar_endpoint(
    exemplar: schemas.ExemplarCreate,
    db: Session = Depends(get_db),
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario) # Redundant due to router dependency, but explicit
):
    logger.info(f"Funcionário '{current_funcionario.matricula_funcional}' tentando criar exemplar: {exemplar.codigo_identificacao}")
    try:
        novo_exemplar = crud.create_exemplar(db=db, exemplar=exemplar)
        logger.info(f"Exemplar '{novo_exemplar.codigo_identificacao}' (ID: {novo_exemplar.id_exemplar}) criado com sucesso.")
        return novo_exemplar
    except HTTPException as e:
        logger.error(f"Erro ao criar exemplar '{exemplar.codigo_identificacao}': {e.detail}")
        raise e
    except Exception as e:
        logger.exception(f"Erro inesperado ao criar exemplar '{exemplar.codigo_identificacao}': {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao criar exemplar.")

@router.get("/{exemplar_id}", response_model=schemas.ExemplarRead)
def obter_exemplar_endpoint(
    exemplar_id: int,
    db: Session = Depends(get_db)
    # current_funcionario: models.Funcionario = Depends(get_current_active_funcionario) # Already handled by router dependency
):
    logger.info(f"Buscando exemplar com ID: {exemplar_id}")
    db_exemplar = crud.get_exemplar(db, exemplar_id=exemplar_id)
    if db_exemplar is None:
        logger.warning(f"Exemplar com ID {exemplar_id} não encontrado.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exemplar não encontrado")
    logger.debug(f"Exemplar ID {exemplar_id} encontrado: {db_exemplar.codigo_identificacao}")
    return db_exemplar

@router.get("/", response_model=List[schemas.ExemplarReadBasic]) # Using Basic read for lists
def listar_exemplares_endpoint(
    skip: int = 0,
    limit: int = 100,
    livro_id: Optional[int] = None, # Optional filter by livro_id
    db: Session = Depends(get_db)
    # current_funcionario: models.Funcionario = Depends(get_current_active_funcionario)
):
    logger.info(f"Listando exemplares com skip={skip}, limit={limit}, livro_id={livro_id}")
    if livro_id is not None:
        exemplares = crud.get_exemplares_por_livro(db, livro_id=livro_id, skip=skip, limit=limit)
    else:
        exemplares = crud.get_exemplares(db, skip=skip, limit=limit)
    logger.debug(f"Encontrados {len(exemplares)} exemplares.")
    return exemplares

@router.put("/{exemplar_id}", response_model=schemas.ExemplarRead)
def atualizar_exemplar_endpoint(
    exemplar_id: int,
    exemplar_update: schemas.ExemplarUpdate,
    db: Session = Depends(get_db),
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario)
):
    logger.info(f"Funcionário '{current_funcionario.matricula_funcional}' tentando atualizar exemplar ID: {exemplar_id}")
    updated_exemplar = crud.update_exemplar(db, exemplar_id, exemplar_update)
    if not updated_exemplar:
        logger.warning(f"Exemplar com ID {exemplar_id} não encontrado para atualização.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exemplar não encontrado")
    logger.info(f"Exemplar ID {exemplar_id} atualizado com sucesso.")
    return updated_exemplar

@router.delete("/{exemplar_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_exemplar_endpoint(
    exemplar_id: int,
    db: Session = Depends(get_db),
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario)
):
    logger.info(f"Funcionário '{current_funcionario.matricula_funcional}' tentando excluir exemplar ID: {exemplar_id}")
    
    # crud.delete_exemplar should handle HTTPException for not found or business rule violations
    # If crud.delete_exemplar returns the deleted object or None, and raises on error:
    crud.delete_exemplar(db, exemplar_id)
    
    logger.info(f"Exemplar ID {exemplar_id} excluído (ou tentativa de exclusão processada).")
    return None # FastAPI handles 204 No Content response automatically
