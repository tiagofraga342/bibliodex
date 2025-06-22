from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException, status
from .. import models, schemas
import logging

logger = logging.getLogger(__name__)

def get_autor(db: Session, autor_id: int):
    logger.debug(f"Buscando autor com id: {autor_id}")
    autor = db.query(models.Autor).options(
        selectinload(models.Autor.livros)
    ).filter(models.Autor.id_autor == autor_id).first()
    if not autor:
        logger.warning(f"Autor com id {autor_id} não encontrado.")
    return autor

def get_autores(db: Session, skip: int = 0, limit: int = 100):
    logger.debug(f"Buscando autores com skip: {skip}, limit: {limit}")
    return db.query(models.Autor).options(
        selectinload(models.Autor.livros)
    ).offset(skip).limit(limit).all()

def create_autor(db: Session, autor: schemas.AutorCreate):
    logger.info(f"Tentando criar autor: {autor.nome}")
    db_autor_check = db.query(models.Autor).filter(models.Autor.nome == autor.nome).first()
    if db_autor_check:
        logger.warning(f"Autor com nome '{autor.nome}' já existe.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Autor com este nome já existe.")
    db_autor = models.Autor(**autor.model_dump())
    db.add(db_autor)
    db.commit()
    db.refresh(db_autor)
    logger.info(f"Autor '{db_autor.nome}' (ID: {db_autor.id_autor}) criado com sucesso.")
    return db_autor
