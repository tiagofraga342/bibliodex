from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.database import get_db
from app import crud, schemas, models
from app.routers.auth import get_current_active_funcionario # Assuming only funcionarios manage exemplares
from app.schemas_extra import ExemplarWithDevolucao
from sqlalchemy.orm import joinedload

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
        logger.info(f"Exemplar '{novo_exemplar.codigo_identificacao}' (numero_tombo: {novo_exemplar.numero_tombo}) criado com sucesso.")
        return novo_exemplar
    except HTTPException as e:
        logger.error(f"Erro ao criar exemplar '{exemplar.codigo_identificacao}': {e.detail}")
        raise e
    except Exception as e:
        logger.exception(f"Erro inesperado ao criar exemplar '{exemplar.codigo_identificacao}': {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao criar exemplar.")

@router.get("/{numero_tombo}", response_model=schemas.ExemplarRead)
def obter_exemplar_endpoint(
    numero_tombo: int,
    db: Session = Depends(get_db)
):
    logger.info(f"Buscando exemplar com numero_tombo: {numero_tombo}")
    db_exemplar = crud.get_exemplar(db, numero_tombo=numero_tombo)
    if db_exemplar is None:
        logger.warning(f"Exemplar com numero_tombo {numero_tombo} não encontrado.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exemplar não encontrado")
    logger.debug(f"Exemplar numero_tombo {numero_tombo} encontrado: {db_exemplar.codigo_identificacao}")
    return db_exemplar

@router.get("/", response_model=List[ExemplarWithDevolucao])
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
    exemplares_with_devolucao = []
    for ex in exemplares:
        data_prevista_devolucao = None
        if ex.status == "emprestado":
            emprestimo_ativo = db.query(models.Emprestimo).filter(
                models.Emprestimo.numero_tombo == ex.numero_tombo,
                models.Emprestimo.status_emprestimo == "ativo"
            ).order_by(models.Emprestimo.data_prevista_devolucao.desc()).first()
            if emprestimo_ativo:
                data_prevista_devolucao = emprestimo_ativo.data_prevista_devolucao
        ex_dict = ExemplarWithDevolucao.model_validate(ex).model_dump()
        ex_dict["data_prevista_devolucao"] = data_prevista_devolucao
        exemplares_with_devolucao.append(ex_dict)
    logger.debug(f"Encontrados {len(exemplares_with_devolucao)} exemplares.")
    return exemplares_with_devolucao

@router.put("/{numero_tombo}", response_model=schemas.ExemplarRead)
def atualizar_exemplar_endpoint(
    numero_tombo: int,
    exemplar_update: schemas.ExemplarUpdate,
    db: Session = Depends(get_db),
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario)
):
    logger.info(f"Funcionário '{current_funcionario.matricula_funcional}' tentando atualizar exemplar numero_tombo: {numero_tombo}")
    updated_exemplar = crud.update_exemplar(db, numero_tombo, exemplar_update)
    if not updated_exemplar:
        logger.warning(f"Exemplar com numero_tombo {numero_tombo} não encontrado para atualização.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exemplar não encontrado")
    logger.info(f"Exemplar numero_tombo {numero_tombo} atualizado com sucesso.")
    return updated_exemplar

@router.delete("/{numero_tombo}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_exemplar_endpoint(
    numero_tombo: int,
    db: Session = Depends(get_db),
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario)
):
    logger.info(f"Funcionário '{current_funcionario.matricula_funcional}' tentando excluir exemplar numero_tombo: {numero_tombo}")
    crud.delete_exemplar(db, numero_tombo)
    logger.info(f"Exemplar numero_tombo {numero_tombo} excluído (ou tentativa de exclusão processada).")
    return None
