from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from .. import models, schemas
import logging

logger = logging.getLogger(__name__)

def _validar_emprestimo_para_devolucao(db, devolucao):
    db_emprestimo = db.query(models.Emprestimo).filter(models.Emprestimo.id_emprestimo == devolucao.id_emprestimo).first()
    if not db_emprestimo:
        logger.error(f"Empréstimo com ID {devolucao.id_emprestimo} não encontrado ao registrar devolução.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Empréstimo com ID {devolucao.id_emprestimo} não encontrado.")
    if db_emprestimo.data_efetiva_devolucao is not None or db_emprestimo.status_emprestimo == "devolvido":
        logger.warning(f"Empréstimo {devolucao.id_emprestimo} já foi devolvido.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Empréstimo {devolucao.id_emprestimo} já foi devolvido.")
    return db_emprestimo

def _validar_funcionario_para_devolucao(db, devolucao):
    db_funcionario = db.query(models.Funcionario).filter(models.Funcionario.id_funcionario == devolucao.id_funcionario_registro).first()
    if not db_funcionario:
        logger.error(f"Funcionário de registro com id {devolucao.id_funcionario_registro} não encontrado ao registrar devolução.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Funcionário de registro com id {devolucao.id_funcionario_registro} não encontrado.")
    if not db_funcionario.is_active:
        logger.warning(f"Funcionário de registro com id {devolucao.id_funcionario_registro} está inativo.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Funcionário de registro com id {devolucao.id_funcionario_registro} está inativo.")
    return db_funcionario

def create_devolucao(db: Session, devolucao: schemas.DevolucaoCreate):
    logger.info(f"Tentando registrar devolução para empréstimo ID {devolucao.id_emprestimo}")
    db_emprestimo = _validar_emprestimo_para_devolucao(db, devolucao)
    _validar_funcionario_para_devolucao(db, devolucao)
    db_devolucao = models.Devolucao(**devolucao.model_dump())
    db_emprestimo.data_efetiva_devolucao = devolucao.data_devolucao
    db_emprestimo.status_emprestimo = "devolvido"
    db_exemplar = db_emprestimo.exemplar
    if db_exemplar:
        # Só permite devolução se status for 'emprestado' ou 'reservado'
        if db_exemplar.status not in ["emprestado", "reservado"]:
            logger.error(f"Tentativa de devolução de exemplar {db_exemplar.numero_tombo} com status inválido: {db_exemplar.status}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Exemplar {db_exemplar.numero_tombo} não está emprestado nem reservado.")
        # Removido: db_exemplar.status = "disponivel" e atualizações manuais
        # O status será refletido automaticamente pela property dinâmica
    db.add(db_devolucao)
    db.add(db_emprestimo)
    db.commit()
    db.refresh(db_devolucao)
    db.refresh(db_emprestimo)
    if db_exemplar:
        db.refresh(db_exemplar)
    logger.info(f"Devolução ID {db_devolucao.id_devolucao} registrada para empréstimo ID {db_emprestimo.id_emprestimo}. Exemplar Nº Tombo {db_exemplar.numero_tombo if db_exemplar else 'N/A'} status atualizado.")
    return db_devolucao
