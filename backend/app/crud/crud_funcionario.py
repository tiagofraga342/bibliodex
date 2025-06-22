from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException, status
from .. import models, schemas, security
import logging

logger = logging.getLogger(__name__)

def get_funcionario_by_matricula_funcional(db: Session, matricula_funcional: str):
    return db.query(models.Funcionario).filter(models.Funcionario.matricula_funcional == matricula_funcional).first()

def get_funcionario(db: Session, funcionario_id: int):
    logger.debug(f"Buscando funcionário com id: {funcionario_id}")
    funcionario = db.query(models.Funcionario).filter(models.Funcionario.id_funcionario == funcionario_id).first()
    if not funcionario:
        logger.warning(f"Funcionário com id {funcionario_id} não encontrado.")
    return funcionario

def get_funcionarios(db: Session, skip: int = 0, limit: int = 100):
    logger.debug(f"Buscando funcionários com skip: {skip}, limit: {limit}")
    return db.query(models.Funcionario).offset(skip).limit(limit).all()

def create_funcionario(db: Session, funcionario: schemas.FuncionarioCreate):
    logger.info(f"Tentando criar funcionário com matrícula funcional: {funcionario.matricula_funcional}")
    db_funcionario_check = get_funcionario_by_matricula_funcional(db, matricula_funcional=funcionario.matricula_funcional)
    if db_funcionario_check:
        logger.warning(f"Funcionário com matrícula funcional {funcionario.matricula_funcional} já existe.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Funcionário com matrícula funcional {funcionario.matricula_funcional} já existe.")
    hashed_password = security.get_password_hash(funcionario.password)
    db_funcionario_data = funcionario.model_dump(exclude={"password"})
    db_funcionario = models.Funcionario(**db_funcionario_data, hashed_password=hashed_password, is_active=True)
    db.add(db_funcionario)
    db.commit()
    db.refresh(db_funcionario)
    logger.info(f"Funcionário '{db_funcionario.nome}' (ID: {db_funcionario.id_funcionario}, Matrícula: {db_funcionario.matricula_funcional}) criado com sucesso.")
    return db_funcionario

def update_funcionario(db: Session, funcionario_id: int, funcionario_update: schemas.FuncionarioUpdate):
    logger.info(f"Tentando atualizar funcionário com ID: {funcionario_id}")
    db_funcionario = get_funcionario(db, funcionario_id)
    if not db_funcionario:
        logger.warning(f"Funcionário com ID {funcionario_id} não encontrado para atualização.")
        return None
    update_data = funcionario_update.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        hashed_password = security.get_password_hash(update_data["password"])
        db_funcionario.hashed_password = hashed_password
        del update_data["password"]
        logger.info(f"Senha do funcionário ID {funcionario_id} atualizada.")
    for key, value in update_data.items():
        setattr(db_funcionario, key, value)
    db.commit()
    db.refresh(db_funcionario)
    logger.info(f"Funcionário ID {funcionario_id} atualizado com sucesso.")
    return db_funcionario

def delete_funcionario(db: Session, funcionario_id: int):
    logger.info(f"Tentando excluir funcionário com id: {funcionario_id}")
    db_funcionario = db.query(models.Funcionario).options(
        selectinload(models.Funcionario.emprestimos_registrados),
        selectinload(models.Funcionario.reservas_registradas),
        selectinload(models.Funcionario.devolucoes_registradas)
    ).filter(models.Funcionario.id_funcionario == funcionario_id).first()
    if not db_funcionario:
        logger.warning(f"Funcionário com id {funcionario_id} não encontrado para exclusão.")
        return None
    if db_funcionario.emprestimos_registrados:
        logger.warning(f"Funcionário ID {funcionario_id} registrou empréstimos. Exclusão não permitida.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Funcionário possui empréstimos registrados e não pode ser excluído.")
    if db_funcionario.reservas_registradas:
        logger.warning(f"Funcionário ID {funcionario_id} registrou reservas. Exclusão não permitida.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Funcionário possui reservas registradas e não pode ser excluído.")
    if db_funcionario.devolucoes_registradas:
        logger.warning(f"Funcionário ID {funcionario_id} registrou devoluções. Exclusão não permitida.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Funcionário possui devoluções registradas e não pode ser excluído.")
    db.delete(db_funcionario)
    db.commit()
    logger.info(f"Funcionário com id {funcionario_id} excluído com sucesso.")
    return db_funcionario
