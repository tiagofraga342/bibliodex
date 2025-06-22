from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from .. import models, schemas
import logging

logger = logging.getLogger(__name__)

def get_reserva(db: Session, reserva_id: int):
    logger.debug(f"Buscando reserva com id: {reserva_id}")
    reserva = db.query(models.Reserva).options(
        joinedload(models.Reserva.usuario),
        joinedload(models.Reserva.exemplar).joinedload(models.Exemplar.livro),
        joinedload(models.Reserva.livro_solicitado),
        joinedload(models.Reserva.funcionario_registro_reserva)
    ).filter(models.Reserva.id_reserva == reserva_id).first()
    if not reserva:
        logger.warning(f"Reserva com id {reserva_id} não encontrada.")
    return reserva

def get_reservas(db: Session, skip: int = 0, limit: int = 100):
    logger.debug(f"Buscando reservas com skip: {skip}, limit: {limit}")
    return db.query(models.Reserva).options(
        joinedload(models.Reserva.usuario),
        joinedload(models.Reserva.exemplar).joinedload(models.Exemplar.livro),
        joinedload(models.Reserva.livro_solicitado),
        joinedload(models.Reserva.funcionario_registro_reserva)
    ).order_by(models.Reserva.data_reserva.desc()).offset(skip).limit(limit).all()

def create_reserva(db: Session, reserva: schemas.ReservaCreate):
    logger.info(f"Tentando criar reserva para usuário ID {reserva.id_usuario}, numero_tombo {getattr(reserva, 'numero_tombo', None)}, livro ID {getattr(reserva, 'id_livro_solicitado', None)}")
    db_usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == reserva.id_usuario).first()
    if not db_usuario:
        logger.error(f"Usuário com id {reserva.id_usuario} não encontrado ao criar reserva.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Usuário com id {reserva.id_usuario} não encontrado.")
    if not db_usuario.is_active:
        logger.warning(f"Usuário com id {reserva.id_usuario} está inativo.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Usuário com id {reserva.id_usuario} está inativo.")
    if reserva.id_funcionario_registro:
        db_funcionario = db.query(models.Funcionario).filter(models.Funcionario.id_funcionario == reserva.id_funcionario_registro).first()
        if not db_funcionario:
            logger.error(f"Funcionário de registro com id {reserva.id_funcionario_registro} não encontrado ao criar reserva.")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Funcionário de registro com id {reserva.id_funcionario_registro} não encontrado.")
        if not db_funcionario.is_active:
            logger.warning(f"Funcionário de registro com id {reserva.id_funcionario_registro} está inativo.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Funcionário de registro com id {reserva.id_funcionario_registro} está inativo.")
    numero_tombo = reserva.numero_tombo
    db_exemplar = None
    if not numero_tombo:
        if not reserva.id_livro_solicitado:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="É obrigatório informar o numero_tombo do exemplar ou o id_livro_solicitado.")
        db_exemplar = db.query(models.Exemplar).filter(
            models.Exemplar.id_livro == reserva.id_livro_solicitado,
            models.Exemplar.status.in_(["disponivel", "emprestado"])
        ).first()
        if not db_exemplar:
            logger.warning(f"Nenhum exemplar disponível ou emprestado para o livro {reserva.id_livro_solicitado}.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não há exemplares disponíveis ou emprestados para reserva deste livro.")
        numero_tombo = db_exemplar.numero_tombo
    else:
        db_exemplar = db.query(models.Exemplar).filter(models.Exemplar.numero_tombo == numero_tombo).first()
        if not db_exemplar:
            logger.error(f"Exemplar com numero_tombo {numero_tombo} não encontrado ao criar reserva.")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Exemplar com numero_tombo {numero_tombo} não encontrado.")
        if db_exemplar.status not in ["disponivel", "emprestado"]:
            logger.warning(f"Exemplar {numero_tombo} não está disponível nem emprestado para reserva (status: {db_exemplar.status}).")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Exemplar {numero_tombo} não está disponível nem emprestado para reserva.")
    existing_active_reserva_exemplar = db.query(models.Reserva).filter(
        models.Reserva.numero_tombo == numero_tombo,
        models.Reserva.status == "ativa"
    ).first()
    if existing_active_reserva_exemplar and existing_active_reserva_exemplar.id_usuario != reserva.id_usuario:
         logger.warning(f"Exemplar {numero_tombo} já possui uma reserva ativa por outro usuário.")
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Exemplar {numero_tombo} já está reservado ativamente por outro usuário.")
    db_exemplar.status = "reservado"
    db.add(db_exemplar)
    import datetime
    hoje = datetime.date.today()
    data_reserva = reserva.data_reserva or hoje
    data_validade_reserva = None
    data_prevista_devolucao_emprestimo = None
    if db_exemplar.status == "emprestado":
        emprestimo_ativo = db.query(models.Emprestimo).filter(
            models.Emprestimo.numero_tombo == db_exemplar.numero_tombo,
            models.Emprestimo.status_emprestimo == "ativo"
        ).order_by(models.Emprestimo.data_prevista_devolucao.desc()).first()
        if emprestimo_ativo:
            data_prevista_devolucao_emprestimo = emprestimo_ativo.data_prevista_devolucao
            data_validade_reserva = max(
                reserva.data_validade_reserva or (hoje + datetime.timedelta(days=3)),
                emprestimo_ativo.data_prevista_devolucao + datetime.timedelta(days=1)
            )
    if not data_validade_reserva:
        data_validade_reserva = reserva.data_validade_reserva or (hoje + datetime.timedelta(days=3))
    reserva_data = reserva.model_dump()
    reserva_data["numero_tombo"] = numero_tombo
    reserva_data["data_reserva"] = data_reserva
    reserva_data["data_validade_reserva"] = data_validade_reserva
    db_reserva = models.Reserva(**reserva_data)
    db.add(db_reserva)
    db.commit()
    db.refresh(db_reserva)
    # Adiciona info extra na resposta (data_prevista_devolucao_emprestimo)
    db_reserva.data_prevista_devolucao_emprestimo = data_prevista_devolucao_emprestimo
    logger.info(f"Reserva ID {db_reserva.id_reserva} criada com sucesso para exemplar {numero_tombo}.")
    return db_reserva

def get_reservas_by_usuario_id(db: Session, usuario_id: int, skip: int = 0, limit: int = 100):
    logger.debug(f"Buscando reservas para o usuário ID {usuario_id}, skip: {skip}, limit: {limit}")
    reservas = db.query(models.Reserva).options(
        joinedload(models.Reserva.usuario),
        joinedload(models.Reserva.exemplar).joinedload(models.Exemplar.livro).joinedload(models.Livro.autores),
        joinedload(models.Reserva.livro_solicitado),
        joinedload(models.Reserva.funcionario_registro_reserva)
    ).filter(models.Reserva.id_usuario == usuario_id).order_by(models.Reserva.data_reserva.desc()).offset(skip).limit(limit).all()
    reservas_read = []
    for r in reservas:
        livro = None
        if r.exemplar and r.exemplar.livro:
            livro = r.exemplar.livro
        elif r.livro_solicitado:
            livro = r.livro_solicitado
        reserva_dict = schemas.ReservaRead.model_validate(r).model_dump()
        if livro:
            reserva_dict["livro"] = schemas.LivroReadBasic.model_validate(livro).model_dump()
            if hasattr(livro, "autores"):
                reserva_dict["livro"]["autores"] = [schemas.AutorReadBasic.model_validate(a).model_dump() for a in livro.autores]
        reservas_read.append(reserva_dict)
    return reservas_read

def delete_reserva(db: Session, reserva_id: int):
    logger.info(f"Tentando excluir reserva com id: {reserva_id}")
    db_reserva = db.query(models.Reserva).filter(models.Reserva.id_reserva == reserva_id).first()
    if db_reserva:
        exemplar = None
        if db_reserva.numero_tombo:
            exemplar = db.query(models.Exemplar).filter(models.Exemplar.numero_tombo == db_reserva.numero_tombo).first()
        if db_reserva.status == "ativa":
            logger.warning(f"Reserva ID {reserva_id} está ativa ou atendida. Exclusão não permitida diretamente. Cancele primeiro.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reserva ativa ou atendida não pode ser excluída. Cancele-a ou marque como expirada primeiro.")
        db.delete(db_reserva)
        db.commit()
        logger.info(f"Reserva com id {reserva_id} (status: {db_reserva.status}) excluída com sucesso.")
        if exemplar and exemplar.status == "reservado":
            reserva_ativa = db.query(models.Reserva).filter(
                models.Reserva.numero_tombo == exemplar.numero_tombo,
                models.Reserva.status == "ativa"
            ).first()
            if not reserva_ativa:
                exemplar.status = "disponivel"
                db.add(exemplar)
                db.commit()
                logger.info(f"Exemplar {exemplar.numero_tombo} liberado (status 'disponivel') após exclusão/cancelamento de reserva.")
    else:
        logger.warning(f"Reserva com id {reserva_id} não encontrada para exclusão.")
    return db_reserva
