from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from .. import models, schemas
import logging

logger = logging.getLogger(__name__)

def get_exemplar(db: Session, numero_tombo: int):
    logger.debug(f"Buscando exemplar com numero_tombo: {numero_tombo}")
    exemplar = db.query(models.Exemplar).options(
        joinedload(models.Exemplar.livro).joinedload(models.Livro.categoria),
        joinedload(models.Exemplar.livro).selectinload(models.Livro.autores)
    ).filter(models.Exemplar.numero_tombo == numero_tombo).first()
    if not exemplar:
        logger.warning(f"Exemplar com numero_tombo {numero_tombo} não encontrado.")
    return exemplar

def get_exemplares_por_livro(db: Session, livro_id: int, skip: int = 0, limit: int = 100):
    logger.debug(f"Buscando exemplares para o livro ID {livro_id}, skip: {skip}, limit: {limit}")
    return db.query(models.Exemplar)\
        .filter(models.Exemplar.id_livro == livro_id)\
        .offset(skip).limit(limit).all()

def get_exemplares(db: Session, skip: int = 0, limit: int = 100):
    logger.debug(f"Buscando exemplares com skip: {skip}, limit: {limit}")
    return db.query(models.Exemplar).options(
        joinedload(models.Exemplar.livro)
    ).offset(skip).limit(limit).all()

def create_exemplar(db: Session, exemplar: schemas.ExemplarCreate):
    logger.info(f"Tentando criar exemplar com código: {exemplar.codigo_identificacao} para o livro ID: {exemplar.id_livro}")
    db_livro = db.query(models.Livro).filter(models.Livro.id_livro == exemplar.id_livro).first()
    if not db_livro:
        logger.error(f"Livro com id {exemplar.id_livro} não encontrado ao tentar criar exemplar {exemplar.codigo_identificacao}.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Livro com id {exemplar.id_livro} não encontrado.")
    if db_livro.status_geral == "descatalogado" and exemplar.status == "disponivel":
        logger.warning(f"Tentativa de criar exemplar disponível para livro descatalogado (ID: {exemplar.id_livro}).")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não é permitido criar exemplar disponível para livro descatalogado.")
    if db_livro.status_geral == "descatalogado":
        exemplar.status = "descartado"
    db_exemplar_check = db.query(models.Exemplar).filter(models.Exemplar.codigo_identificacao == exemplar.codigo_identificacao).first()
    if db_exemplar_check:
        logger.warning(f"Exemplar com código de identificação {exemplar.codigo_identificacao} já existe.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Exemplar com código de identificação {exemplar.codigo_identificacao} já existe.")
    db_exemplar = models.Exemplar(**exemplar.model_dump())
    db.add(db_exemplar)
    db.commit()
    db.refresh(db_exemplar)
    logger.info(f"Exemplar '{db_exemplar.codigo_identificacao}' (numero_tombo: {db_exemplar.numero_tombo}) criado com sucesso.")
    return db_exemplar
