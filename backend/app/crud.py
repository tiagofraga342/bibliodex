from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Optional
from . import models, schemas # Use . for relative imports within the same package

# --- Livro CRUD ---
def get_livro(db: Session, livro_id: int) -> Optional[models.Livro]:
    return db.query(models.Livro).options(
        joinedload(models.Livro.categoria),
        selectinload(models.Livro.autores) # Use selectinload for many-to-many or one-to-many
    ).filter(models.Livro.id_livro == livro_id).first()

def get_livros(db: Session, skip: int = 0, limit: int = 100) -> List[models.Livro]:
    return db.query(models.Livro).options(
        joinedload(models.Livro.categoria),
        selectinload(models.Livro.autores)
    ).offset(skip).limit(limit).all()

def create_livro(db: Session, livro: schemas.LivroCreate) -> models.Livro:
    db_livro = models.Livro(
        titulo=livro.titulo,
        ano_publicacao=livro.ano_publicacao,
        status_geral=livro.status_geral,
        id_categoria=livro.id_categoria
    )
    db.add(db_livro)
    db.commit() # Commit to get db_livro.id_livro

    if livro.ids_autores:
        autores = db.query(models.Autor).filter(models.Autor.id_autor.in_(livro.ids_autores)).all()
        db_livro.autores.extend(autores)
        db.commit() # Commit again to save author associations

    db.refresh(db_livro)
    return db_livro

def delete_livro(db: Session, livro_id: int) -> Optional[models.Livro]:
    db_livro = db.query(models.Livro).filter(models.Livro.id_livro == livro_id).first()
    if db_livro:
        # Handle related exemplares, emprestimos, reservas before deleting if necessary
        # For simplicity, direct delete here. Add cascading deletes in DB or manual cleanup.
        db.delete(db_livro)
        db.commit()
    return db_livro

# --- Categoria CRUD ---
def get_categoria(db: Session, categoria_id: int) -> Optional[models.Categoria]:
    return db.query(models.Categoria).options(
        selectinload(models.Categoria.livros) # Load related books
    ).filter(models.Categoria.id_categoria == categoria_id).first()

def get_categorias(db: Session, skip: int = 0, limit: int = 100) -> List[models.Categoria]:
    return db.query(models.Categoria).options(
        selectinload(models.Categoria.livros)
    ).offset(skip).limit(limit).all()

def create_categoria(db: Session, categoria: schemas.CategoriaCreate) -> models.Categoria:
    db_categoria = models.Categoria(nome=categoria.nome)
    db.add(db_categoria)
    db.commit()
    db.refresh(db_categoria)
    return db_categoria

def delete_categoria(db: Session, categoria_id: int) -> Optional[models.Categoria]:
    db_categoria = db.query(models.Categoria).filter(models.Categoria.id_categoria == categoria_id).first()
    if db_categoria:
        # Ensure no livros are associated or handle them (e.g., set to a default category or prevent deletion)
        if db_categoria.livros:
            # Raise an error or handle as per application logic
            # For now, we'll just delete. Consider foreign key constraints.
            pass
        db.delete(db_categoria)
        db.commit()
    return db_categoria


# --- Autor CRUD ---
def get_autor(db: Session, autor_id: int) -> Optional[models.Autor]:
    return db.query(models.Autor).options(
        selectinload(models.Autor.livros)
    ).filter(models.Autor.id_autor == autor_id).first()

def get_autores(db: Session, skip: int = 0, limit: int = 100) -> List[models.Autor]:
    return db.query(models.Autor).options(
        selectinload(models.Autor.livros)
    ).offset(skip).limit(limit).all()

def create_autor(db: Session, autor: schemas.AutorCreate) -> models.Autor:
    db_autor = models.Autor(**autor.model_dump())
    db.add(db_autor)
    db.commit()
    db.refresh(db_autor)
    return db_autor

# --- Usuario CRUD ---
def get_usuario(db: Session, usuario_id: int) -> Optional[models.Usuario]:
    return db.query(models.Usuario).options(
        joinedload(models.Usuario.curso) # Eager load curso
        # selectinload(models.Usuario.emprestimos), # Load if needed for response
        # selectinload(models.Usuario.reservas),
        # selectinload(models.Usuario.penalidades),
    ).filter(models.Usuario.id_usuario == usuario_id).first()

def get_usuarios(db: Session, skip: int = 0, limit: int = 100) -> List[models.Usuario]:
    return db.query(models.Usuario).options(
        joinedload(models.Usuario.curso)
    ).offset(skip).limit(limit).all()

def create_usuario(db: Session, usuario: schemas.UsuarioCreate) -> models.Usuario:
    db_usuario = models.Usuario(**usuario.model_dump())
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

# --- Exemplar CRUD ---
def get_exemplar(db: Session, exemplar_id: int) -> Optional[models.Exemplar]:
    return db.query(models.Exemplar).options(
        joinedload(models.Exemplar.livro).joinedload(models.Livro.categoria), # Load livro and its category
        joinedload(models.Exemplar.livro).selectinload(models.Livro.autores) # Load livro's authors
    ).filter(models.Exemplar.id_exemplar == exemplar_id).first()

def get_exemplares_por_livro(db: Session, livro_id: int, skip: int = 0, limit: int = 100) -> List[models.Exemplar]:
    return db.query(models.Exemplar)\
        .filter(models.Exemplar.id_livro == livro_id)\
        .offset(skip).limit(limit).all()

def get_exemplares(db: Session, skip: int = 0, limit: int = 100) -> List[models.Exemplar]:
    return db.query(models.Exemplar).options(
        joinedload(models.Exemplar.livro) # Load basic book info
    ).offset(skip).limit(limit).all()


def create_exemplar(db: Session, exemplar: schemas.ExemplarCreate) -> models.Exemplar:
    db_exemplar = models.Exemplar(**exemplar.model_dump())
    db.add(db_exemplar)
    db.commit()
    db.refresh(db_exemplar)
    return db_exemplar

# --- Emprestimo CRUD ---
def get_emprestimo(db: Session, emprestimo_id: int) -> Optional[models.Emprestimo]:
    return db.query(models.Emprestimo).options(
        joinedload(models.Emprestimo.usuario),
        joinedload(models.Emprestimo.exemplar).joinedload(models.Exemplar.livro), # Load exemplar and its book
        joinedload(models.Emprestimo.funcionario_registro_emprestimo)
    ).filter(models.Emprestimo.id_emprestimo == emprestimo_id).first()

def get_emprestimos(db: Session, skip: int = 0, limit: int = 100) -> List[models.Emprestimo]:
    return db.query(models.Emprestimo).options(
        joinedload(models.Emprestimo.usuario),
        joinedload(models.Emprestimo.exemplar).joinedload(models.Exemplar.livro),
        joinedload(models.Emprestimo.funcionario_registro_emprestimo)
    ).order_by(models.Emprestimo.data_retirada.desc()).offset(skip).limit(limit).all() # Example ordering

def create_emprestimo(db: Session, emprestimo: schemas.EmprestimoCreate) -> models.Emprestimo:
    # Add logic here: check if exemplar is available, etc.
    db_exemplar = db.query(models.Exemplar).filter(models.Exemplar.id_exemplar == emprestimo.id_exemplar).first()
    if not db_exemplar or db_exemplar.status != "disponivel":
        raise ValueError(f"Exemplar {emprestimo.id_exemplar} não está disponível para empréstimo.")

    db_emprestimo = models.Emprestimo(**emprestimo.model_dump())
    db_exemplar.status = "emprestado" # Update exemplar status
    db.add(db_emprestimo)
    db.add(db_exemplar) # Add to session to save status change
    db.commit()
    db.refresh(db_emprestimo)
    db.refresh(db_exemplar)
    return db_emprestimo

# --- Reserva CRUD ---
def get_reserva(db: Session, reserva_id: int) -> Optional[models.Reserva]:
    return db.query(models.Reserva).options(
        joinedload(models.Reserva.usuario),
        joinedload(models.Reserva.exemplar).joinedload(models.Exemplar.livro), # If specific exemplar reserved
        joinedload(models.Reserva.livro_solicitado), # If general title reserved
        joinedload(models.Reserva.funcionario_registro_reserva)
    ).filter(models.Reserva.id_reserva == reserva_id).first()

def get_reservas(db: Session, skip: int = 0, limit: int = 100) -> List[models.Reserva]:
    return db.query(models.Reserva).options(
        joinedload(models.Reserva.usuario),
        joinedload(models.Reserva.exemplar).joinedload(models.Exemplar.livro),
        joinedload(models.Reserva.livro_solicitado),
        joinedload(models.Reserva.funcionario_registro_reserva)
    ).order_by(models.Reserva.data_reserva.desc()).offset(skip).limit(limit).all()

def create_reserva(db: Session, reserva: schemas.ReservaCreate) -> models.Reserva:
    # Add logic: check if exemplar can be reserved, or if livro has available exemplars
    # For simplicity, direct creation here.
    if reserva.id_exemplar:
        db_exemplar = db.query(models.Exemplar).filter(models.Exemplar.id_exemplar == reserva.id_exemplar).first()
        if not db_exemplar or db_exemplar.status not in ["disponivel", "reservado"]: # Allow reserving already reserved for a queue?
             raise ValueError(f"Exemplar {reserva.id_exemplar} não pode ser reservado.")
        # Potentially change exemplar status if your logic requires it upon reservation
        # db_exemplar.status = "reservado" 
        # db.add(db_exemplar)

    db_reserva = models.Reserva(**reserva.model_dump())
    db.add(db_reserva)
    db.commit()
    db.refresh(db_reserva)
    return db_reserva

# Add CRUD functions for Devolucao, Penalidade, Curso as needed, following similar patterns.
# Example for Devolucao:
def create_devolucao(db: Session, devolucao: schemas.DevolucaoCreate) -> models.Devolucao:
    db_emprestimo = db.query(models.Emprestimo).filter(models.Emprestimo.id_emprestimo == devolucao.id_emprestimo).first()
    if not db_emprestimo:
        raise ValueError(f"Empréstimo com ID {devolucao.id_emprestimo} não encontrado.")
    if db_emprestimo.data_efetiva_devolucao is not None:
        raise ValueError(f"Empréstimo {devolucao.id_emprestimo} já foi devolvido.")

    db_devolucao = models.Devolucao(**devolucao.model_dump())
    
    # Update Emprestimo status
    db_emprestimo.data_efetiva_devolucao = devolucao.data_devolucao
    db_emprestimo.status_emprestimo = "devolvido"
    
    # Update Exemplar status
    db_exemplar = db_emprestimo.exemplar
    if db_exemplar:
        db_exemplar.status = "disponivel" # Or "em_quarentena", "para_higienizacao" etc.
        db.add(db_exemplar)

    db.add(db_devolucao)
    db.add(db_emprestimo)
    db.commit()
    db.refresh(db_devolucao)
    db.refresh(db_emprestimo)
    if db_exemplar:
        db.refresh(db_exemplar)
    return db_devolucao

