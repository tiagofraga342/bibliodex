from sqlalchemy.orm import Session, joinedload, selectinload
from fastapi import HTTPException, status
from .. import models, schemas, security
import logging

logger = logging.getLogger(__name__)

def get_usuario_by_matricula(db: Session, matricula: str):
    return db.query(models.Usuario).filter(models.Usuario.matricula == matricula).first()

def get_usuario(db: Session, usuario_id: int):
    logger.debug(f"Buscando usuário com id: {usuario_id}")
    usuario = db.query(models.Usuario).options(
        joinedload(models.Usuario.curso)
    ).filter(models.Usuario.id_usuario == usuario_id).first()
    if not usuario:
        logger.warning(f"Usuário com id {usuario_id} não encontrado.")
    return usuario

def get_usuarios(db: Session, skip: int = 0, limit: int = 20, nome_like: str = None, sort_by: str = "nome", sort_dir: str = "asc"):
    query = db.query(models.Usuario).options(
        joinedload(models.Usuario.curso)
    )
    if nome_like:
        query = query.filter(models.Usuario.nome.ilike(f"%{nome_like}%"))
    sort_col = getattr(models.Usuario, sort_by, models.Usuario.nome)
    if sort_dir == "desc":
        sort_col = sort_col.desc()
    else:
        sort_col = sort_col.asc()
    query = query.order_by(sort_col)
    return query.offset(skip).limit(limit).all()

def create_usuario(db: Session, usuario: schemas.UsuarioCreate):
    logger.info(f"Tentando criar usuário com matrícula: {usuario.matricula}")
    db_usuario_check = get_usuario_by_matricula(db, matricula=usuario.matricula)
    if db_usuario_check:
        logger.warning(f"Usuário com matrícula {usuario.matricula} já existe.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Usuário com matrícula {usuario.matricula} já existe.")
    if usuario.id_curso:
        curso = db.query(models.Curso).filter(models.Curso.id_curso == usuario.id_curso).first()
        if not curso:
            logger.error(f"Curso com id {usuario.id_curso} não encontrado ao tentar criar usuário {usuario.matricula}.")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Curso com id {usuario.id_curso} não encontrado.")
    hashed_password = security.get_password_hash(usuario.password)
    db_usuario_data = usuario.model_dump(exclude={"password"})
    db_usuario = models.Usuario(**db_usuario_data, hashed_password=hashed_password, is_active=True)
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    logger.info(f"Usuário '{db_usuario.nome}' (ID: {db_usuario.id_usuario}, Matrícula: {db_usuario.matricula}) criado com sucesso.")
    return db_usuario

def delete_usuario(db: Session, usuario_id: int):
    logger.info(f"Tentando excluir usuário com id: {usuario_id}")
    db_usuario = db.query(models.Usuario).options(
        selectinload(models.Usuario.emprestimos),
        selectinload(models.Usuario.reservas)
    ).filter(models.Usuario.id_usuario == usuario_id).first()
    if not db_usuario:
        logger.warning(f"Usuário com id {usuario_id} não encontrado para exclusão.")
        return None
    active_emprestimos = [e for e in db_usuario.emprestimos if e.status_emprestimo == "ativo"]
    if active_emprestimos:
        logger.warning(f"Usuário ID {usuario_id} possui {len(active_emprestimos)} empréstimos ativos. Exclusão não permitida.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário possui empréstimos ativos e não pode ser excluído.")
    active_reservas = [r for r in db_usuario.reservas if r.status == "ativa"]
    if active_reservas:
        logger.warning(f"Usuário ID {usuario_id} possui {len(active_reservas)} reservas ativas. Exclusão não permitida.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário possui reservas ativas e não pode ser excluído.")
    db.delete(db_usuario)
    db.commit()
    logger.info(f"Usuário com id {usuario_id} excluído com sucesso.")
    return db_usuario
