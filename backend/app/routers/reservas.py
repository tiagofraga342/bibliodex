from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging
from typing import List # Add this import

from app.database import get_db
from app import crud, schemas, models
from app.routers.auth import get_current_active_funcionario, get_current_active_usuario_cliente, get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("", response_model=List[schemas.ReservaRead]) # Updated response_model
def listar_reservas(
    db: Session = Depends(get_db), 
    skip: int = 0, 
    limit: int = 100,
    current_user: models.Funcionario = Depends(get_current_active_funcionario) # Protegido para funcionários
):
    logger.info(f"Funcionário '{current_user.matricula_funcional}' listando reservas com skip={skip}, limit={limit}")
    try:
        reservas = crud.get_reservas(db, skip=skip, limit=limit)
        if not isinstance(reservas, list): # Should not happen with Pydantic conversion
            logger.error(f"Resposta inesperada de get_reservas: {type(reservas)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao processar lista de reservas.")
        logger.debug(f"Encontradas {len(reservas)} reservas.")
        return reservas
    except Exception as e:
        logger.exception(f"Erro ao listar reservas por '{current_user.matricula_funcional}': {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao listar reservas.")

@router.get("/me", response_model=List[schemas.ReservaRead])
def listar_minhas_reservas(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.Usuario = Depends(get_current_active_usuario_cliente)
):
    logger.info(f"Usuário '{current_user.matricula}' listando suas reservas com skip={skip}, limit={limit}")
    reservas = crud.get_reservas_by_usuario_id(db, usuario_id=current_user.id_usuario, skip=skip, limit=limit)
    logger.debug(f"Encontradas {len(reservas)} reservas para o usuário ID {current_user.id_usuario}.")
    return reservas

@router.get("/{reserva_id}", response_model=schemas.ReservaRead) # Updated response_model
def obter_reserva(
    reserva_id: int, 
    db: Session = Depends(get_db),
    current_user: models.Funcionario = Depends(get_current_active_funcionario) # Ou lógica mais complexa
):
    logger.info(f"Usuário '{current_user.matricula_funcional if hasattr(current_user, 'matricula_funcional') else current_user.matricula}' buscando reserva ID: {reserva_id}")
    reserva = crud.get_reserva(db, reserva_id)
    if not reserva:
        logger.warning(f"Reserva ID {reserva_id} não encontrada.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva não encontrada")
    
    # Adicionar verificação se o usuário cliente está tentando acessar reserva de outro (se não for funcionário)
    # if isinstance(current_user, models.Usuario) and reserva.id_usuario != current_user.id_usuario:
    #     logger.warning(f"Usuário cliente '{current_user.matricula}' tentou acessar reserva ID {reserva_id} de outro usuário.")
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado")

    logger.debug(f"Reserva ID {reserva_id} encontrada.")
    return reserva

@router.post("", response_model=schemas.ReservaRead, status_code=status.HTTP_201_CREATED)
def criar_reserva(
    reserva: schemas.ReservaCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario | models.Funcionario = Depends(get_current_user) # Permite cliente OU funcionário
):
    # Se funcionário, pode criar para qualquer usuário; se cliente, só para si
    user_making_request_id = getattr(current_user, 'id_usuario', None)
    user_making_request_role = getattr(current_user, 'role', None) or (
        'funcionario' if hasattr(current_user, 'matricula_funcional') else 'usuario_cliente'
    )
    if user_making_request_role == "usuario_cliente" and reserva.id_usuario != user_making_request_id:
        logger.error(f"Usuário cliente '{getattr(current_user, 'matricula', None)}' tentou criar reserva para outro usuário ID {reserva.id_usuario}.")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Não autorizado a criar reserva para outro usuário.")
    if user_making_request_role == "funcionario":
        # Garante que o id_funcionario_registro seja do funcionário logado
        reserva_data = reserva.model_copy(update={"id_funcionario_registro": getattr(current_user, 'id_funcionario', None)})
        logger.info(f"Funcionário '{getattr(current_user, 'matricula_funcional', None)}' criando reserva para usuário ID {reserva_data.id_usuario}.")
    else:
        reserva_data = reserva.model_copy()
        logger.info(f"Usuário '{getattr(current_user, 'matricula', None)}' criando reserva para si mesmo.")
    try:
        nova_reserva = crud.create_reserva(db, reserva_data)
        logger.info(f"Reserva ID {nova_reserva.id_reserva} criada com sucesso (solicitante: {user_making_request_role} ID {user_making_request_id}).")
        return nova_reserva
    except HTTPException as e:
        logger.error(f"Erro ao criar reserva (solicitante: {user_making_request_role} ID {user_making_request_id}): {e.detail}")
        raise e
    except Exception as e:
        logger.exception(f"Erro inesperado ao criar reserva (solicitante: {user_making_request_role} ID {user_making_request_id}): {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao criar reserva.")

@router.delete("/{reserva_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_reserva(
    reserva_id: int,
    db: Session = Depends(get_db),
    current_user: models.Funcionario = Depends(get_current_active_funcionario) # Apenas funcionários podem excluir diretamente
                                                                            # Usuários deveriam "cancelar"
):
    logger.info(f"Funcionário '{current_user.matricula_funcional}' tentando excluir reserva ID: {reserva_id}")
    # crud.delete_reserva agora lida com a lógica de não encontrar ou não poder excluir
    deleted_reserva = crud.delete_reserva(db, reserva_id)
    if deleted_reserva is None and not crud.get_reserva(db, reserva_id): # Checa se realmente não existe mais
         logger.warning(f"Reserva ID {reserva_id} não encontrada para exclusão por '{current_user.matricula_funcional}'.")
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva não encontrada")

    logger.info(f"Reserva ID {reserva_id} excluída (ou tentativa de exclusão processada) por '{current_user.matricula_funcional}'.")
    return None

@router.put("/{reserva_id}/cancelar", response_model=schemas.ReservaRead)
def cancelar_reserva_usuario(
    reserva_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_active_usuario_cliente)
):
    """
    Permite que um usuário autenticado cancele sua própria reserva (status deve ser 'ativa').
    """
    logger.info(f"Usuário '{current_user.matricula}' tentando cancelar reserva ID {reserva_id}")
    reserva = crud.get_reserva(db, reserva_id)
    if not reserva:
        logger.warning(f"Reserva ID {reserva_id} não encontrada para cancelamento por usuário '{current_user.matricula}'.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva não encontrada")
    if reserva.id_usuario != current_user.id_usuario:
        logger.warning(f"Usuário '{current_user.matricula}' tentou cancelar reserva ID {reserva_id} de outro usuário.")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Você só pode cancelar suas próprias reservas")
    if reserva.status != "ativa":
        logger.warning(f"Reserva ID {reserva_id} não está ativa e não pode ser cancelada pelo usuário '{current_user.matricula}'.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Só é possível cancelar reservas ativas")
    reserva.status = "cancelada"
    db.add(reserva)
    db.commit()  # Commita imediatamente para garantir que a reserva não é mais "ativa"
    # Libera exemplar se não houver outra reserva ativa para ele
    if reserva.numero_tombo:
        exemplar = db.query(models.Exemplar).filter(models.Exemplar.numero_tombo == reserva.numero_tombo).first()
        if exemplar and exemplar.status == "reservado":
            reserva_ativa = db.query(models.Reserva).filter(
                models.Reserva.numero_tombo == exemplar.numero_tombo,
                models.Reserva.status == "ativa"
            ).first()
            if not reserva_ativa:
                exemplar.status = "disponivel"
                db.add(exemplar)
                db.commit()
                db.refresh(exemplar)
                logger.info(f"Status do exemplar {exemplar.numero_tombo} após cancelamento: {exemplar.status}")
    db.refresh(reserva)
    logger.info(f"Reserva ID {reserva_id} cancelada pelo usuário '{current_user.matricula}'.")
    return reserva

# TODO: Adicionar endpoint para funcionário efetivar uma reserva (transformar em empréstimo)
