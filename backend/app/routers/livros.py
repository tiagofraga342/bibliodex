from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from app.database import get_db
import app.crud as crud
import app.schemas as schemas # Adicionado import de schemas
from app.routers.auth import get_current_active_funcionario # Proteção
from app import models # Para current_funcionario type hint
import logging # Import logging

router = APIRouter()
logger = logging.getLogger(__name__) # Logger para este módulo

@router.get("", response_model=List[schemas.LivroRead]) # Aceita somente requisições sem / no final
def listar_livros(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
    titulo: str = None,
    autor: str = None,
    categoria_id: int = None,
    sort_by: str = "titulo",
    sort_dir: str = "asc"
):
    """
    Listar livros com paginação, filtro e ordenação.
    """
    logger.info(f"Listando livros com skip={skip}, limit={limit}, titulo={titulo}, autor={autor}, categoria_id={categoria_id}, sort_by={sort_by}, sort_dir={sort_dir}")
    livros = crud.get_livros(
        db,
        skip=skip,
        limit=limit,
        titulo=titulo,
        autor=autor,
        categoria_id=categoria_id,
        sort_by=sort_by,
        sort_dir=sort_dir
    )
    logger.debug(f"Encontrados {len(livros)} livros.")
    return livros

@router.get("/{livro_id}", response_model=schemas.LivroRead)
def obter_livro(livro_id: int, db: Session = Depends(get_db)):
    logger.info(f"Buscando livro com ID: {livro_id}")
    livro = crud.get_livro(db, livro_id)
    if not livro:
        logger.warning(f"Livro com ID {livro_id} não encontrado.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Livro não encontrado")
    logger.debug(f"Livro ID {livro_id} encontrado: {livro.titulo}")
    return livro

@router.post("/", response_model=schemas.LivroRead, status_code=status.HTTP_201_CREATED)
def criar_livro(
    livro: schemas.LivroCreate, 
    db: Session = Depends(get_db),
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario)
):
    logger.info(f"Funcionário '{current_funcionario.matricula_funcional}' tentando criar livro: {livro.titulo}")
    try:
        novo_livro = crud.create_livro(db=db, livro=livro)
        logger.info(f"Livro '{novo_livro.titulo}' (ID: {novo_livro.id_livro}) criado com sucesso por '{current_funcionario.matricula_funcional}'.")
        return novo_livro
    except HTTPException as e:
        logger.error(f"Erro ao criar livro '{livro.titulo}' por '{current_funcionario.matricula_funcional}': {e.detail}")
        raise e
    except Exception as e:
        logger.exception(f"Erro inesperado ao criar livro '{livro.titulo}' por '{current_funcionario.matricula_funcional}': {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao criar livro.")


@router.delete("/{livro_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_livro(
    livro_id: int, 
    db: Session = Depends(get_db),
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario)
):
    logger.info(f"Funcionário '{current_funcionario.matricula_funcional}' tentando excluir livro ID: {livro_id}")
    # crud.delete_livro agora lida com a verificação de exemplares e levanta HTTPException
    deleted_livro = crud.delete_livro(db, livro_id)
    if deleted_livro is None and not crud.get_livro(db, livro_id): # Checa se realmente não existe mais
         logger.warning(f"Livro ID {livro_id} não encontrado para exclusão por '{current_funcionario.matricula_funcional}'.")
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Livro não encontrado")

    logger.info(f"Livro ID {livro_id} excluído (ou tentativa de exclusão processada) por '{current_funcionario.matricula_funcional}'.")
    return None

@router.get("/{livro_id}/exemplares", response_model=List[schemas.ExemplarReadBasic])
def listar_exemplares_por_livro(
    livro_id: int,
    db: Session = Depends(get_db),
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario)
):
    """
    Retorna todos os exemplares de um livro específico.
    """
    logger.info(f"Listando exemplares para livro ID {livro_id}")
    exemplares = db.query(models.Exemplar).filter(models.Exemplar.id_livro == livro_id).all()
    logger.debug(f"Encontrados {len(exemplares)} exemplares para o livro ID {livro_id}")
    return exemplares
