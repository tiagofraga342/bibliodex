from sqlalchemy.orm import Session, joinedload, selectinload
from fastapi import HTTPException, status
from .. import models, schemas
import logging

logger = logging.getLogger(__name__)

def get_emprestimo(db: Session, emprestimo_id: int):
    logger.debug(f"Buscando empréstimo com id: {emprestimo_id}")
    emprestimo = db.query(models.Emprestimo).options(
        joinedload(models.Emprestimo.usuario),
        joinedload(models.Emprestimo.exemplar).joinedload(models.Exemplar.livro),
        joinedload(models.Emprestimo.funcionario_registro_emprestimo)
    ).filter(models.Emprestimo.id_emprestimo == emprestimo_id).first()
    if not emprestimo:
        logger.warning(f"Empréstimo com id {emprestimo_id} não encontrado.")
    return emprestimo

def get_emprestimos(db: Session, skip: int = 0, limit: int = 100):
    logger.debug(f"Buscando empréstimos com skip: {skip}, limit: {limit}")
    return db.query(models.Emprestimo).options(
        joinedload(models.Emprestimo.usuario),
        joinedload(models.Emprestimo.exemplar).joinedload(models.Exemplar.livro),
        joinedload(models.Emprestimo.funcionario_registro_emprestimo)
    ).order_by(models.Emprestimo.data_retirada.desc()).offset(skip).limit(limit).all()

def create_emprestimo(db: Session, emprestimo: schemas.EmprestimoCreate):
    logger.info(f"Tentando criar empréstimo para exemplar numero_tombo {emprestimo.numero_tombo} por usuário ID {emprestimo.id_usuario}")
    db_exemplar = db.query(models.Exemplar).filter(models.Exemplar.numero_tombo == emprestimo.numero_tombo).first()
    if not db_exemplar:
        logger.error(f"Exemplar com numero_tombo {emprestimo.numero_tombo} não encontrado ao criar empréstimo.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Exemplar com numero_tombo {emprestimo.numero_tombo} não encontrado.")
    if db_exemplar.livro and db_exemplar.livro.status_geral == "descatalogado":
        logger.warning(f"Tentativa de empréstimo de exemplar {emprestimo.numero_tombo} de livro descatalogado.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não é permitido emprestar exemplares de livros descatalogados.")
    # Permitir empréstimo se status for 'disponivel' OU (status 'reservado' e reserva ativa para este usuário)
    if db_exemplar.status == "reservado":
        reserva_ativa = db.query(models.Reserva).filter(
            models.Reserva.numero_tombo == emprestimo.numero_tombo,
            models.Reserva.id_usuario == emprestimo.id_usuario,
            models.Reserva.status == "ativa"
        ).first()
        if not reserva_ativa:
            logger.warning(f"Exemplar {emprestimo.numero_tombo} está reservado, mas não para este usuário.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Exemplar {emprestimo.numero_tombo} está reservado para outro usuário.")
        # Atualiza reserva para atendida
        reserva_ativa.status = "atendida"
        db.add(reserva_ativa)
    elif db_exemplar.status != "disponivel":
        logger.warning(f"Exemplar {emprestimo.numero_tombo} não está disponível (status: {db_exemplar.status}).")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Exemplar {emprestimo.numero_tombo} não está disponível para empréstimo.")
    db_usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == emprestimo.id_usuario).first()
    if not db_usuario:
        logger.error(f"Usuário com id {emprestimo.id_usuario} não encontrado ao criar empréstimo.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Usuário com id {emprestimo.id_usuario} não encontrado.")
    if not db_usuario.is_active:
        logger.warning(f"Usuário com id {emprestimo.id_usuario} está inativo.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Usuário com id {emprestimo.id_usuario} está inativo.")
    db_funcionario = db.query(models.Funcionario).filter(models.Funcionario.id_funcionario == emprestimo.id_funcionario_registro).first()
    if not db_funcionario:
        logger.error(f"Funcionário de registro com id {emprestimo.id_funcionario_registro} não encontrado ao criar empréstimo.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Funcionário de registro com id {emprestimo.id_funcionario_registro} não encontrado.")
    if not db_funcionario.is_active:
        logger.warning(f"Funcionário de registro com id {emprestimo.id_funcionario_registro} está inativo.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Funcionário de registro com id {emprestimo.id_funcionario_registro} está inativo.")
    db_emprestimo = models.Emprestimo(**emprestimo.model_dump())
    db_exemplar.status = "emprestado"
    db.add(db_emprestimo)
    db.add(db_exemplar)
    db.commit()
    db.refresh(db_emprestimo)
    db.refresh(db_exemplar)
    logger.info(f"Empréstimo ID {db_emprestimo.id_emprestimo} criado com sucesso. Exemplar Nº Tombo {db_exemplar.numero_tombo} status atualizado para 'emprestado'.")
    return db_emprestimo

def get_emprestimos_by_usuario_id(db: Session, usuario_id: int, skip: int = 0, limit: int = 100):
    logger.debug(f"Buscando empréstimos para o usuário ID {usuario_id}, skip: {skip}, limit: {limit}")
    return db.query(models.Emprestimo).filter(models.Emprestimo.id_usuario == usuario_id).options(
        joinedload(models.Emprestimo.usuario),
        joinedload(models.Emprestimo.exemplar).joinedload(models.Exemplar.livro),
        joinedload(models.Emprestimo.funcionario_registro_emprestimo)
    ).order_by(models.Emprestimo.data_retirada.desc()).offset(skip).limit(limit).all()

def delete_emprestimo(db: Session, emprestimo_id: int):
    logger.info(f"Tentando excluir empréstimo com id: {emprestimo_id}")
    db_emprestimo = db.query(models.Emprestimo).options(
        selectinload(models.Emprestimo.penalidades_associadas)
    ).filter(models.Emprestimo.id_emprestimo == emprestimo_id).first()
    if not db_emprestimo:
        logger.warning(f"Empréstimo com id {emprestimo_id} não encontrado para exclusão.")
        return None
    if db_emprestimo.status_emprestimo == "ativo":
        logger.warning(f"Empréstimo ID {emprestimo_id} está ativo. Exclusão não permitida.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empréstimo ativo não pode ser excluído. Registre a devolução primeiro.")
    if db_emprestimo.penalidades_associadas:
        logger.warning(f"Empréstimo ID {emprestimo_id} possui penalidades associadas. Exclusão não permitida.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empréstimo possui penalidades associadas e não pode ser excluído.")
    db.delete(db_emprestimo)
    db.commit()
    logger.info(f"Empréstimo com id {emprestimo_id} excluído com sucesso.")
    return db_emprestimo
