from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from app.database import get_db
from app.crud import *
import app.schemas as schemas # Adicionado import de schemas
from app.routers.auth import get_current_active_funcionario # Proteção
from app import models # Para current_funcionario type hint
from app import crud
from app.schemas_extra import ExemplarWithDevolucao
import logging # Import logging

router = APIRouter()
logger = logging.getLogger(__name__) # Logger para este módulo

@router.get("", response_model=schemas.PaginatedLivros)
def listar_livros(
    db: Session = Depends(get_db),
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
    Listar livros com paginação, filtro e ordenação, retornando total e items.
    """
    logger.info(f"Listando livros com skip={skip}, limit={limit}, titulo={titulo}, autor={autor}, categoria_id={categoria_id}, isbn={isbn}, editora={editora}, ano_publicacao={ano_publicacao}, sort_by={sort_by}, sort_dir={sort_dir}")
    result = crud.get_livros_paginados(
        db,
        skip=skip,
        limit=limit,
        titulo=titulo,
        autor=autor,
        categoria_id=categoria_id,
        isbn=isbn,
        editora=editora,
        ano_publicacao=ano_publicacao,
        sort_by=sort_by,
        sort_dir=sort_dir
    )
    logger.debug(f"Encontrados {result['total']} livros (página atual: {len(result['items'])}).")
    return result

@router.get("/{livro_id}", response_model=schemas.LivroRead)
def obter_livro(livro_id: int, db: Session = Depends(get_db)):
    logger.info(f"Buscando livro com ID: {livro_id}")
    livro = crud.get_livro(db, livro_id)
    if not livro:
        logger.warning(f"Livro com ID {livro_id} não encontrado.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Livro não encontrado")
    logger.debug(f"Livro ID {livro_id} encontrado: {livro.titulo}")
    return livro

@router.post("", response_model=schemas.LivroRead, status_code=status.HTTP_201_CREATED)
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

@router.get("/{livro_id}/exemplares", response_model=List[ExemplarWithDevolucao])
def listar_exemplares_por_livro(
    livro_id: int,
    db: Session = Depends(get_db),
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario)
):
    """
    Retorna todos os exemplares de um livro específico, incluindo data prevista de devolução se emprestado.
    """
    logger.info(f"Listando exemplares para livro ID {livro_id}")
    exemplares = db.query(models.Exemplar).filter(models.Exemplar.id_livro == livro_id).all()
    exemplares_with_devolucao = []
    for ex in exemplares:
        data_prevista_devolucao = None
        if ex.status == "emprestado":
            emprestimo_ativo = db.query(models.Emprestimo).filter(
                models.Emprestimo.numero_tombo == ex.numero_tombo,
                models.Emprestimo.status_emprestimo == "ativo"
            ).order_by(models.Emprestimo.data_prevista_devolucao.desc()).first()
            if emprestimo_ativo:
                data_prevista_devolucao = emprestimo_ativo.data_prevista_devolucao
        ex_dict = ExemplarWithDevolucao.model_validate(ex).model_dump()
        ex_dict["data_prevista_devolucao"] = data_prevista_devolucao
        exemplares_with_devolucao.append(ex_dict)
    logger.debug(f"Encontrados {len(exemplares_with_devolucao)} exemplares para o livro ID {livro_id}")
    return exemplares_with_devolucao

@router.put("/{livro_id}", response_model=schemas.LivroRead)
def atualizar_livro(
    livro_id: int,
    livro_update: schemas.LivroUpdate,
    db: Session = Depends(get_db),
    current_funcionario: models.Funcionario = Depends(get_current_active_funcionario)
):
    logger.info(f"Funcionário '{current_funcionario.matricula_funcional}' tentando atualizar livro ID: {livro_id}")
    livro = crud.update_livro(db, livro_id, livro_update)
    if not livro:
        logger.warning(f"Livro ID {livro_id} não encontrado para atualização.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Livro não encontrado")
    logger.info(f"Livro ID {livro_id} atualizado com sucesso.")
    return livro
