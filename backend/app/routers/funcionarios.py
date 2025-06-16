from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
import logging # Import logging

from app.database import get_db
from app import crud, schemas, models
from app.routers.auth import get_current_active_funcionario

router = APIRouter(
    prefix="/funcionarios",
    tags=["Funcionários"],
    dependencies=[Depends(get_current_active_funcionario)] # Protege todas as rotas neste router
)
logger = logging.getLogger(__name__) # Logger para este módulo

@router.post("/", response_model=schemas.FuncionarioRead, status_code=status.HTTP_201_CREATED)
def criar_funcionario(
    funcionario: schemas.FuncionarioCreate,
    db: Session = Depends(get_db),
    current_admin: models.Funcionario = Depends(get_current_active_funcionario) 
):
    # Apenas admin pode criar outros funcionários
    if current_admin.cargo.lower() != "admin":
        logger.warning(f"Funcionário '{current_admin.matricula_funcional}' sem permissão tentou criar funcionário.")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Não autorizado a criar funcionários")
    logger.info(f"Admin '{current_admin.matricula_funcional}' tentando criar funcionário: {funcionario.matricula_funcional}")
    try:
        novo_funcionario = crud.create_funcionario(db=db, funcionario=funcionario)
        logger.info(f"Funcionário '{novo_funcionario.matricula_funcional}' (ID: {novo_funcionario.id_funcionario}) criado com sucesso por '{current_admin.matricula_funcional}'.")
        return novo_funcionario
    except HTTPException as e:
        logger.error(f"Erro ao criar funcionário '{funcionario.matricula_funcional}' por '{current_admin.matricula_funcional}': {e.detail}")
        raise e
    except Exception as e:
        logger.exception(f"Erro inesperado ao criar funcionário '{funcionario.matricula_funcional}' por '{current_admin.matricula_funcional}': {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao criar funcionário.")


@router.get("/", response_model=List[schemas.FuncionarioRead])
def listar_funcionarios(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_admin: models.Funcionario = Depends(get_current_active_funcionario)
):
    logger.info(f"Admin '{current_admin.matricula_funcional}' listando funcionários com skip={skip}, limit={limit}")
    funcionarios = crud.get_funcionarios(db, skip=skip, limit=limit)
    logger.debug(f"Encontrados {len(funcionarios)} funcionários.")
    return funcionarios

@router.get("/{funcionario_id}", response_model=schemas.FuncionarioRead)
def obter_funcionario(
    funcionario_id: int,
    db: Session = Depends(get_db),
    current_admin: models.Funcionario = Depends(get_current_active_funcionario)
):
    logger.info(f"Admin '{current_admin.matricula_funcional}' buscando funcionário ID: {funcionario_id}")
    db_funcionario = crud.get_funcionario(db, funcionario_id=funcionario_id)
    if db_funcionario is None:
        logger.warning(f"Funcionário com ID {funcionario_id} não encontrado.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funcionário não encontrado")
    logger.debug(f"Funcionário ID {funcionario_id} encontrado: {db_funcionario.matricula_funcional}")
    return db_funcionario

@router.put("/{funcionario_id}", response_model=schemas.FuncionarioRead)
def atualizar_funcionario(
    funcionario_id: int,
    funcionario_update: schemas.FuncionarioUpdate,
    db: Session = Depends(get_db),
    current_admin: models.Funcionario = Depends(get_current_active_funcionario)
):
    logger.info(f"Admin '{current_admin.matricula_funcional}' tentando atualizar funcionário ID: {funcionario_id} com dados: {funcionario_update.model_dump(exclude_unset=True)}")
    # Impedir que o último admin perca o cargo ou seja desativado
    if current_admin.id_funcionario == funcionario_id:
        # Verifica se está tentando remover o próprio status de admin ou se desativar
        is_removendo_admin = funcionario_update.cargo and funcionario_update.cargo.lower() != "admin"
        is_desativando = funcionario_update.is_active is False
        if (is_removendo_admin or is_desativando) and crud.is_last_admin(db, current_admin.id_funcionario):
            logger.warning(f"Admin '{current_admin.matricula_funcional}' tentou remover seu próprio status de admin ou se desativar sendo o último admin.")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Não pode remover o próprio status de admin ou se desativar se for o último admin ativo.")
    updated_funcionario = crud.update_funcionario(db, funcionario_id, funcionario_update)
    if not updated_funcionario:
        logger.warning(f"Funcionário com ID {funcionario_id} não encontrado para atualização por '{current_admin.matricula_funcional}'.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funcionário não encontrado")
    logger.info(f"Funcionário ID {funcionario_id} atualizado com sucesso por '{current_admin.matricula_funcional}'.")
    return updated_funcionario

@router.delete("/{funcionario_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_funcionario(
    funcionario_id: int,
    db: Session = Depends(get_db),
    current_admin: models.Funcionario = Depends(get_current_active_funcionario)
):
    logger.info(f"Admin '{current_admin.matricula_funcional}' tentando excluir funcionário ID: {funcionario_id}")

    if current_admin.id_funcionario == funcionario_id:
        logger.warning(f"Admin '{current_admin.matricula_funcional}' tentou excluir a si mesmo.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não é possível excluir a si mesmo.")

    # Impedir exclusão do último admin
    funcionario = crud.get_funcionario(db, funcionario_id)
    if funcionario and funcionario.cargo.lower() == "admin" and crud.is_last_admin(db, funcionario_id):
        logger.warning(f"Tentativa de excluir o último admin (ID {funcionario_id}) por '{current_admin.matricula_funcional}'.")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Não é possível excluir o último administrador ativo.")

    deleted_funcionario = crud.delete_funcionario(db, funcionario_id)
    if deleted_funcionario is None and not crud.get_funcionario(db, funcionario_id):
         logger.warning(f"Funcionário ID {funcionario_id} não encontrado para exclusão por '{current_admin.matricula_funcional}'.")
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funcionário não encontrado")

    logger.info(f"Funcionário ID {funcionario_id} excluído (ou tentativa de exclusão processada) por '{current_admin.matricula_funcional}'.")
    return None
