from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException, status
from .. import models, schemas
import logging

logger = logging.getLogger(__name__)

def get_categoria(db: Session, categoria_id: int):
    logger.debug(f"Buscando categoria com id: {categoria_id}")
    categoria = db.query(models.Categoria).options(
        selectinload(models.Categoria.livros)
    ).filter(models.Categoria.id_categoria == categoria_id).first()
    if not categoria:
        logger.warning(f"Categoria com id {categoria_id} não encontrada.")
    return categoria

def get_categorias(db: Session, skip: int = 0, limit: int = 100):
    logger.debug(f"Buscando categorias com skip: {skip}, limit: {limit}")
    return db.query(models.Categoria).offset(skip).limit(limit).all()

def create_categoria(db: Session, categoria: schemas.CategoriaCreate):
    logger.info(f"Tentando criar categoria: {categoria.nome}")
    db_categoria_check = db.query(models.Categoria).filter(models.Categoria.nome == categoria.nome).first()
    if db_categoria_check:
        logger.warning(f"Categoria com nome '{categoria.nome}' já existe.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nome da categoria já existe")
    db_categoria = models.Categoria(nome=categoria.nome)
    db.add(db_categoria)
    db.commit()
    db.refresh(db_categoria)
    logger.info(f"Categoria '{db_categoria.nome}' (ID: {db_categoria.id_categoria}) criada com sucesso.")
    return db_categoria

def delete_categoria(db: Session, categoria_id: int):
    logger.info(f"Tentando excluir categoria com id: {categoria_id}")
    db_categoria = db.query(models.Categoria).options(selectinload(models.Categoria.livros)).filter(models.Categoria.id_categoria == categoria_id).first()
    if db_categoria:
        if db_categoria.livros:
            logger.warning(f"Não é possível excluir a categoria ID {categoria_id} pois existem {len(db_categoria.livros)} livros associados.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não é possível excluir categoria pois existem livros associados a ela.")
        db.delete(db_categoria)
        db.commit()
        logger.info(f"Categoria com id {categoria_id} excluída com sucesso.")
    else:
        logger.warning(f"Categoria com id {categoria_id} não encontrada para exclusão.")
    return db_categoria
