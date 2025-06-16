from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Union
from app.database import get_db
from app import crud, schemas, models
from app.routers.auth import get_current_active_funcionario, get_current_active_usuario_cliente
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[schemas.EmprestimoRead])
def listar_emprestimos(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario)
):
    logger.info(f"Funcionário '{current_funcionario.matricula_funcional}' listando empréstimos.")
    emprestimos = crud.get_emprestimos(db, skip=skip, limit=limit)
    return emprestimos

@router.get("/me", response_model=List[schemas.EmprestimoRead])
def listar_meus_emprestimos(
    db: Session = Depends(get_db),
    current_usuario: models.Usuario = Depends(get_current_active_usuario_cliente)
):
    logger.info(f"Usuário '{current_usuario.matricula}' listando seus empréstimos.")
    return crud.get_emprestimos_by_usuario_id(db, current_usuario.id_usuario)

@router.get("/{emprestimo_id}", response_model=schemas.EmprestimoRead)
def obter_emprestimo(
    emprestimo_id: int,
    db: Session = Depends(get_db),
    current_user: Union[models.Funcionario, models.Usuario] = Depends(
        lambda db=Depends(get_db), token=Depends(get_current_active_funcionario): token
    )
):
    emprestimo = crud.get_emprestimo(db, emprestimo_id)
    if not emprestimo:
        logger.warning(f"Empréstimo ID {emprestimo_id} não encontrado.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empréstimo não encontrado")
    # Se for usuário cliente, só pode ver o próprio empréstimo
    if isinstance(current_user, models.Usuario):
        if emprestimo.id_usuario != current_user.id_usuario:
            logger.warning(f"Usuário '{current_user.matricula}' tentou acessar empréstimo de outro usuário.")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado")
    logger.info(f"Empréstimo ID {emprestimo_id} acessado por '{getattr(current_user, 'matricula_funcional', getattr(current_user, 'matricula', ''))}'.")
    return emprestimo

@router.post("/", response_model=schemas.EmprestimoRead, status_code=status.HTTP_201_CREATED)
def criar_emprestimo(
    emprestimo: schemas.EmprestimoCreate, 
    db: Session = Depends(get_db),
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario) # Apenas funcionários podem criar
):
    logger.info(f"Funcionário '{current_funcionario.matricula_funcional}' tentando criar empréstimo para exemplar ID {emprestimo.id_exemplar}, usuário ID {emprestimo.id_usuario}")
    # Garante que o id_funcionario_registro é o do funcionário logado, se não for especificado ou para sobrescrever
    if emprestimo.id_funcionario_registro != current_funcionario.id_funcionario:
        logger.warning(f"Funcionário '{current_funcionario.matricula_funcional}' tentou registrar empréstimo com ID de funcionário diferente ({emprestimo.id_funcionario_registro}). Usando ID do funcionário logado.")
    emprestimo_data_com_funcionario_correto = emprestimo.model_copy(update={"id_funcionario_registro": current_funcionario.id_funcionario})

    try:
        novo_emprestimo = crud.create_emprestimo(db, emprestimo_data_com_funcionario_correto)
        logger.info(f"Empréstimo ID {novo_emprestimo.id_emprestimo} criado com sucesso por '{current_funcionario.matricula_funcional}'.")
        return novo_emprestimo
    except HTTPException as e:
        logger.error(f"Erro ao criar empréstimo por '{current_funcionario.matricula_funcional}': {e.detail}")
        raise e
    except Exception as e:
        logger.exception(f"Erro inesperado ao criar empréstimo por '{current_funcionario.matricula_funcional}': {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao criar empréstimo.")


@router.delete("/{emprestimo_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_emprestimo(
    emprestimo_id: int,
    db: Session = Depends(get_db),
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario)
):
    # Política: marcar como "cancelado" se ainda não devolvido, não deletar fisicamente
    emprestimo = crud.get_emprestimo(db, emprestimo_id)
    if not emprestimo:
        logger.warning(f"Empréstimo ID {emprestimo_id} não encontrado para exclusão.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empréstimo não encontrado")
    if emprestimo.status_emprestimo == "devolvido":
        logger.warning(f"Tentativa de excluir empréstimo já devolvido (ID {emprestimo_id}).")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não é possível excluir empréstimo já devolvido.")
    # Marcar como cancelado (ou implementar lógica específica)
    crud.cancelar_emprestimo(db, emprestimo_id)
    logger.info(f"Empréstimo ID {emprestimo_id} marcado como cancelado por '{current_funcionario.matricula_funcional}'.")
    return None
