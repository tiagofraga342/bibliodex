from sqlalchemy.orm import Session, joinedload, selectinload
from fastapi import HTTPException, status
from .. import models, schemas
import logging

logger = logging.getLogger(__name__)

def get_livro(db: Session, livro_id: int):
    logger.debug(f"Buscando livro com id: {livro_id}")
    livro = db.query(models.Livro).options(
        joinedload(models.Livro.categoria),
        selectinload(models.Livro.autores)
    ).filter(models.Livro.id_livro == livro_id).first()
    if not livro:
        logger.warning(f"Livro com id {livro_id} não encontrado.")
    return livro

def get_livros(db: Session, skip: int = 0, limit: int = 20, titulo: str = None, autor: str = None, categoria_id: int = None, sort_by: str = "titulo", sort_dir: str = "asc"):
    query = db.query(models.Livro).options(
        joinedload(models.Livro.categoria),
        selectinload(models.Livro.autores)
    )
    if titulo:
        query = query.filter(models.Livro.titulo.ilike(f"%{titulo}%"))
    if categoria_id:
        query = query.filter(models.Livro.id_categoria == categoria_id)
    if autor:
        query = query.join(models.Livro.autores).filter(models.Autor.nome.ilike(f"%{autor}%"))
    sort_col = getattr(models.Livro, sort_by, models.Livro.titulo)
    if sort_dir == "desc":
        sort_col = sort_col.desc()
    else:
        sort_col = sort_col.asc()
    query = query.order_by(sort_col)
    return query.offset(skip).limit(limit).all()

def create_livro(db: Session, livro: schemas.LivroCreate):
    logger.info(f"Tentando criar livro: {livro.titulo}")
    db_categoria = db.query(models.Categoria).filter(models.Categoria.id_categoria == livro.id_categoria).first()
    if not db_categoria:
        logger.error(f"Categoria com id {livro.id_categoria} não encontrada ao tentar criar livro {livro.titulo}.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Categoria com id {livro.id_categoria} não encontrada.")
    db_livro = models.Livro(
        titulo=livro.titulo,
        ano_publicacao=livro.ano_publicacao,
        status_geral=livro.status_geral,
        id_categoria=livro.id_categoria
    )
    db.add(db_livro)
    db.commit()
    logger.info(f"Livro '{db_livro.titulo}' (ID: {db_livro.id_livro}) criado parcialmente, antes de associar autores.")
    if livro.ids_autores:
        autores = db.query(models.Autor).filter(models.Autor.id_autor.in_(livro.ids_autores)).all()
        if len(autores) != len(livro.ids_autores):
            found_ids = {a.id_autor for a in autores}
            missing_ids = set(livro.ids_autores) - found_ids
            logger.warning(f"Alguns autores não encontrados para o livro '{db_livro.titulo}': IDs {missing_ids}")
        db_livro.autores.extend(autores)
        db.commit()
        logger.info(f"Autores associados ao livro '{db_livro.titulo}'.")
    db.refresh(db_livro)
    logger.info(f"Livro '{db_livro.titulo}' (ID: {db_livro.id_livro}) criado com sucesso.")
    return db_livro

def delete_livro(db: Session, livro_id: int):
    logger.info(f"Tentando excluir livro com id: {livro_id}")
    db_livro = db.query(models.Livro).options(selectinload(models.Livro.exemplares)).filter(models.Livro.id_livro == livro_id).first()
    if db_livro:
        if db_livro.exemplares:
            logger.warning(f"Não é possível excluir o livro ID {livro_id} pois existem {len(db_livro.exemplares)} exemplares associados.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não é possível excluir o livro pois existem exemplares associados.")
        if db_livro.autores:
            db_livro.autores.clear()
            db.commit()
            logger.info(f"Associações de autores removidas para o livro ID {livro_id}.")
        db.delete(db_livro)
        db.commit()
        logger.info(f"Livro com id {livro_id} excluído com sucesso.")
    else:
        logger.warning(f"Livro com id {livro_id} não encontrado para exclusão.")
    return db_livro

def get_livros_paginados(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    titulo: str = None,
    autor: str = None,
    categoria_id: int = None,
    isbn: str = None,
    editora: str = None,
    ano_publicacao: int = None,
    sort_by: str = "titulo",
    sort_dir: str = "asc"
):
    """
    Retorna um dicionário com total de livros e os livros da página atual, incluindo contagem de exemplares.
    """
    query = db.query(models.Livro)
    if titulo:
        query = query.filter(models.Livro.titulo.ilike(f"%{titulo}%"))
    if categoria_id:
        query = query.filter(models.Livro.id_categoria == categoria_id)
    if autor:
        query = query.join(models.Livro.autores).filter(models.Autor.nome.ilike(f"%{autor}%"))
    if isbn:
        query = query.filter(models.Livro.isbn == isbn)
    if editora:
        query = query.filter(models.Livro.editora.ilike(f"%{editora}%"))
    if ano_publicacao:
        query = query.filter(models.Livro.ano_publicacao == ano_publicacao)
    total = query.count()
    query = query.options(
        joinedload(models.Livro.categoria),
        selectinload(models.Livro.autores),
        selectinload(models.Livro.exemplares)
    )
    sort_col = getattr(models.Livro, sort_by, models.Livro.titulo)
    if sort_dir == "desc":
        sort_col = sort_col.desc()
    else:
        sort_col = sort_col.asc()
    query = query.order_by(sort_col)
    items = query.offset(skip).limit(limit).all()
    livros_result = []
    for livro in items:
        total_exemplares = len(livro.exemplares)
        exemplares_disponiveis = sum(1 for ex in livro.exemplares if ex.status == "disponivel")
        livro_dict = schemas.LivroRead.model_validate(livro).model_dump()
        livro_dict["total_exemplares"] = total_exemplares
        livro_dict["exemplares_disponiveis"] = exemplares_disponiveis
        livros_result.append(livro_dict)
    return {"total": total, "items": livros_result}
