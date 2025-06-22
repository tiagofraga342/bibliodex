from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from app.database import get_db
from app import crud, schemas, models
from app.routers.auth import get_current_active_funcionario

router = APIRouter(prefix="/devolucoes", tags=["Devoluções"])
logger = logging.getLogger(__name__)

@router.post("", response_model=schemas.DevolucaoRead, status_code=status.HTTP_201_CREATED)
def registrar_devolucao(
    devolucao: schemas.DevolucaoCreate,
    db: Session = Depends(get_db),
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario)
):
    logger.info(f"Funcionário '{current_funcionario.matricula_funcional}' registrando devolução para empréstimo ID {devolucao.id_emprestimo}")
    devolucao_data = devolucao.model_copy(update={"id_funcionario_registro": current_funcionario.id_funcionario})
    try:
        nova_devolucao = crud.create_devolucao(db, devolucao_data)
        # Atualiza status do empréstimo e exemplar
        crud.marcar_emprestimo_como_devolvido(db, devolucao.id_emprestimo)
        logger.info(f"Devolução ID {nova_devolucao.id_devolucao} registrada com sucesso para empréstimo ID {devolucao.id_emprestimo}.")
        return nova_devolucao
    except HTTPException as e:
        logger.error(f"Erro ao registrar devolução: {e.detail}")
        raise e
    except Exception as e:
        logger.exception(f"Erro inesperado ao registrar devolução: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao registrar devolução.")

@router.get("/", response_model=List[schemas.DevolucaoRead])
def listar_devolucoes(
    db: Session = Depends(get_db),
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario)
):
    logger.info(f"Funcionário '{current_funcionario.matricula_funcional}' listando devoluções.")
    return crud.get_devolucoes(db)

@router.get("/{devolucao_id}", response_model=schemas.DevolucaoRead)
def obter_devolucao(
    devolucao_id: int,
    db: Session = Depends(get_db),
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario)
):
    devolucao = crud.get_devolucao(db, devolucao_id)
    if not devolucao:
        logger.warning(f"Devolução ID {devolucao_id} não encontrada.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Devolução não encontrada")
    logger.info(f"Devolução ID {devolucao_id} acessada por '{current_funcionario.matricula_funcional}'.")
    return devolucao

@router.delete("/{devolucao_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_devolucao(
    devolucao_id: int,
    db: Session = Depends(get_db),
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario)
):
    devolucao = crud.get_devolucao(db, devolucao_id)
    if not devolucao:
        logger.warning(f"Devolução ID {devolucao_id} não encontrada para exclusão.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Devolução não encontrada")
    crud.delete_devolucao(db, devolucao_id)
    logger.info(f"Devolução ID {devolucao_id} excluída por '{current_funcionario.matricula_funcional}'.")
    return None
