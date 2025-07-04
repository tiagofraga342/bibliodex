from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Optional
from fastapi import HTTPException, status # Import HTTPException
from . import models, schemas, security # Use . para importações relativas dentro do mesmo pacote
import logging

logger = logging.getLogger(__name__)

# --- Funções CRUD para Autenticação (Novas) ---
def get_usuario_by_matricula(db: Session, matricula: str) -> Optional[models.Usuario]:
    """
    Busca um usuário pela sua matrícula.
    """
    return db.query(models.Usuario).filter(models.Usuario.matricula == matricula).first()

def get_funcionario_by_matricula_funcional(db: Session, matricula_funcional: str) -> Optional[models.Funcionario]:
    """
    Busca um funcionário pela sua matrícula funcional.
    """
    return db.query(models.Funcionario).filter(models.Funcionario.matricula_funcional == matricula_funcional).first()


# --- Livro CRUD (Existente) ---
def get_livro(db: Session, livro_id: int) -> Optional[models.Livro]:
    logger.debug(f"Buscando livro com id: {livro_id}")
    livro = db.query(models.Livro).options(
        joinedload(models.Livro.categoria),
        selectinload(models.Livro.autores) # Use selectinload para many-to-many ou one-to-many
    ).filter(models.Livro.id_livro == livro_id).first()

    if not livro:
        logger.warning(f"Livro com id {livro_id} não encontrado.")
    return livro

def get_livros(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    titulo: str = None,
    autor: str = None,
    categoria_id: int = None,
    sort_by: str = "titulo",
    sort_dir: str = "asc"
) -> List[models.Livro]:
    """
    Busca livros com filtros, paginação e ordenação.
    """
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
    # Ordenação
    sort_col = getattr(models.Livro, sort_by, models.Livro.titulo)
    if sort_dir == "desc":
        sort_col = sort_col.desc()
    else:
        sort_col = sort_col.asc()
    query = query.order_by(sort_col)
    # Paginação
    return query.offset(skip).limit(limit).all()

def create_livro(db: Session, livro: schemas.LivroCreate) -> models.Livro:
    logger.info(f"Tentando criar livro: {livro.titulo}")
    # Check if categoria exists
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
    db.commit() # Commit para obter db_livro.id_livro
    logger.info(f"Livro '{db_livro.titulo}' (ID: {db_livro.id_livro}) criado parcialmente, antes de associar autores.")

    if livro.ids_autores:
        autores = db.query(models.Autor).filter(models.Autor.id_autor.in_(livro.ids_autores)).all()
        if len(autores) != len(livro.ids_autores):
            found_ids = {a.id_autor for a in autores}
            missing_ids = set(livro.ids_autores) - found_ids
            logger.warning(f"Alguns autores não encontrados para o livro '{db_livro.titulo}': IDs {missing_ids}")
            # Decide if this is an error or just a warning. For now, proceed with found authors.
        db_livro.autores.extend(autores)
        db.commit() # Commit novamente para salvar associações de autores
        logger.info(f"Autores associados ao livro '{db_livro.titulo}'.")

    db.refresh(db_livro)
    logger.info(f"Livro '{db_livro.titulo}' (ID: {db_livro.id_livro}) criado com sucesso.")
    return db_livro

def delete_livro(db: Session, livro_id: int) -> Optional[models.Livro]:
    logger.info(f"Tentando excluir livro com id: {livro_id}")
    db_livro = db.query(models.Livro).options(selectinload(models.Livro.exemplares)).filter(models.Livro.id_livro == livro_id).first()
    if db_livro:
        if db_livro.exemplares:
            logger.warning(f"Não é possível excluir o livro ID {livro_id} pois existem {len(db_livro.exemplares)} exemplares associados.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não é possível excluir o livro pois existem exemplares associados.")
        
        # Limpar associações many-to-many (autores) se necessário, antes de deletar.
        # SQLAlchemy pode lidar com isso dependendo da configuração do relacionamento,
        # mas explícito é mais seguro para 'secondary' tables.
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

# --- Categoria CRUD (Existente) ---
def get_categoria(db: Session, categoria_id: int) -> Optional[models.Categoria]:
    logger.debug(f"Buscando categoria com id: {categoria_id}")
    categoria = db.query(models.Categoria).options(
        selectinload(models.Categoria.livros) # Carrega livros relacionados
    ).filter(models.Categoria.id_categoria == categoria_id).first()

    if not categoria:
        logger.warning(f"Categoria com id {categoria_id} não encontrada.")
    return categoria

def get_categorias(db: Session, skip: int = 0, limit: int = 100) -> List[models.Categoria]:
    logger.debug(f"Buscando categorias com skip: {skip}, limit: {limit}")
    return db.query(models.Categoria).options(
        selectinload(models.Categoria.livros)
    ).offset(skip).limit(limit).all()

def create_categoria(db: Session, categoria: schemas.CategoriaCreate) -> models.Categoria:
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

def delete_categoria(db: Session, categoria_id: int) -> Optional[models.Categoria]:
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


# --- Autor CRUD (Existente) ---
def get_autor(db: Session, autor_id: int) -> Optional[models.Autor]:
    logger.debug(f"Buscando autor com id: {autor_id}")
    autor = db.query(models.Autor).options(
        selectinload(models.Autor.livros)
    ).filter(models.Autor.id_autor == autor_id).first()

    if not autor:
        logger.warning(f"Autor com id {autor_id} não encontrado.")
    return autor

def get_autores(db: Session, skip: int = 0, limit: int = 100) -> List[models.Autor]:
    logger.debug(f"Buscando autores com skip: {skip}, limit: {limit}")
    return db.query(models.Autor).options(
        selectinload(models.Autor.livros)
    ).offset(skip).limit(limit).all()

def create_autor(db: Session, autor: schemas.AutorCreate) -> models.Autor:
    logger.info(f"Tentando criar autor: {autor.nome}")
    db_autor_check = db.query(models.Autor).filter(models.Autor.nome == autor.nome).first() # Basic check, consider more robust uniqueness
    if db_autor_check:
        logger.warning(f"Autor com nome '{autor.nome}' já existe.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Autor com este nome já existe.")
    db_autor = models.Autor(**autor.model_dump())
    db.add(db_autor)
    db.commit()
    db.refresh(db_autor)
    logger.info(f"Autor '{db_autor.nome}' (ID: {db_autor.id_autor}) criado com sucesso.")
    return db_autor

# --- Usuario CRUD (Existente, mas pode precisar de ajustes para senha) ---
def get_usuario(db: Session, usuario_id: int) -> Optional[models.Usuario]:
    logger.debug(f"Buscando usuário com id: {usuario_id}")
    usuario = db.query(models.Usuario).options(
        joinedload(models.Usuario.curso) # Eager load curso
    ).filter(models.Usuario.id_usuario == usuario_id).first()

    if not usuario:
        logger.warning(f"Usuário com id {usuario_id} não encontrado.")
    return usuario

def get_usuarios(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    nome_like: str = None,
    sort_by: str = "nome",
    sort_dir: str = "asc"
) -> List[models.Usuario]:
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

def create_usuario(db: Session, usuario: schemas.UsuarioCreate) -> models.Usuario:
    logger.info(f"Tentando criar usuário com matrícula: {usuario.matricula}")
    # Check if matricula already exists
    db_usuario_check = get_usuario_by_matricula(db, matricula=usuario.matricula)
    if db_usuario_check:
        logger.warning(f"Usuário com matrícula {usuario.matricula} já existe.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Usuário com matrícula {usuario.matricula} já existe.")

    # Check if curso_id is valid if provided
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

def delete_usuario(db: Session, usuario_id: int) -> Optional[models.Usuario]:
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
    
    # Considerar outras dependências como penalidades
    # if db_usuario.penalidades:
    #     logger.warning(f"Usuário ID {usuario_id} possui penalidades. Avaliar regra de negócio para exclusão.")
        # raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário possui penalidades e não pode ser excluído.")


    db.delete(db_usuario)
    db.commit()
    logger.info(f"Usuário com id {usuario_id} excluído com sucesso.")
    return db_usuario


# --- Funcionario CRUD (Similar ao Usuario, precisará de ajustes para senha) ---
def get_funcionario(db: Session, funcionario_id: int) -> Optional[models.Funcionario]:
    logger.debug(f"Buscando funcionário com id: {funcionario_id}")
    funcionario = db.query(models.Funcionario).filter(models.Funcionario.id_funcionario == funcionario_id).first()
    if not funcionario:
        logger.warning(f"Funcionário com id {funcionario_id} não encontrado.")
    return funcionario

def get_funcionarios(db: Session, skip: int = 0, limit: int = 100) -> List[models.Funcionario]:
    logger.debug(f"Buscando funcionários com skip: {skip}, limit: {limit}")
    return db.query(models.Funcionario).offset(skip).limit(limit).all()

def create_funcionario(db: Session, funcionario: schemas.FuncionarioCreate) -> models.Funcionario:
    logger.info(f"Tentando criar funcionário com matrícula funcional: {funcionario.matricula_funcional}")
    # Check if matricula_funcional already exists
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

def update_funcionario(db: Session, funcionario_id: int, funcionario_update: schemas.FuncionarioUpdate) -> Optional[models.Funcionario]:
    logger.info(f"Tentando atualizar funcionário com ID: {funcionario_id}")
    db_funcionario = get_funcionario(db, funcionario_id)
    if not db_funcionario:
        logger.warning(f"Funcionário com ID {funcionario_id} não encontrado para atualização.")
        return None

    update_data = funcionario_update.model_dump(exclude_unset=True)
    
    if "password" in update_data and update_data["password"]:
        hashed_password = security.get_password_hash(update_data["password"])
        db_funcionario.hashed_password = hashed_password
        del update_data["password"] # Remove to avoid setting it directly below
        logger.info(f"Senha do funcionário ID {funcionario_id} atualizada.")

    for key, value in update_data.items():
        setattr(db_funcionario, key, value)
    
    db.commit()
    db.refresh(db_funcionario)
    logger.info(f"Funcionário ID {funcionario_id} atualizado com sucesso.")
    return db_funcionario

def delete_funcionario(db: Session, funcionario_id: int) -> Optional[models.Funcionario]:
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
    
    # Add check for last admin if applicable (more complex logic)
    # num_active_admins = db.query(models.Funcionario).filter(models.Funcionario.is_active == True, models.Funcionario.cargo == "admin").count() # Example
    # if db_funcionario.cargo == "admin" and num_active_admins == 1:
    #     logger.warning(f"Tentativa de excluir o último administrador ativo (ID: {funcionario_id}).")
    #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não é possível excluir o último administrador ativo.")

    db.delete(db_funcionario)
    db.commit()
    logger.info(f"Funcionário com id {funcionario_id} excluído com sucesso.")
    return db_funcionario


# --- Exemplar CRUD (Existente) ---
def get_exemplar(db: Session, exemplar_id: int) -> Optional[models.Exemplar]:
    logger.debug(f"Buscando exemplar com id: {exemplar_id}")
    exemplar = db.query(models.Exemplar).options(
        joinedload(models.Exemplar.livro).joinedload(models.Livro.categoria),
        joinedload(models.Exemplar.livro).selectinload(models.Livro.autores)
    ).filter(models.Exemplar.id_exemplar == exemplar_id).first()

    if not exemplar:
        logger.warning(f"Exemplar com id {exemplar_id} não encontrado.")
    return exemplar

def get_exemplares_por_livro(db: Session, livro_id: int, skip: int = 0, limit: int = 100) -> List[models.Exemplar]:
    logger.debug(f"Buscando exemplares para o livro ID {livro_id}, skip: {skip}, limit: {limit}")
    return db.query(models.Exemplar)\
        .filter(models.Exemplar.id_livro == livro_id)\
        .offset(skip).limit(limit).all()

def get_exemplares(db: Session, skip: int = 0, limit: int = 100) -> List[models.Exemplar]:
    logger.debug(f"Buscando exemplares com skip: {skip}, limit: {limit}")
    return db.query(models.Exemplar).options(
        joinedload(models.Exemplar.livro)
    ).offset(skip).limit(limit).all()


def create_exemplar(db: Session, exemplar: schemas.ExemplarCreate) -> models.Exemplar:
    logger.info(f"Tentando criar exemplar com código: {exemplar.codigo_identificacao} para o livro ID: {exemplar.id_livro}")
    # Check if livro_id is valid
    db_livro = db.query(models.Livro).filter(models.Livro.id_livro == exemplar.id_livro).first()
    if not db_livro:
        logger.error(f"Livro com id {exemplar.id_livro} não encontrado ao tentar criar exemplar {exemplar.codigo_identificacao}.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Livro com id {exemplar.id_livro} não encontrado.")
    
    # Check if codigo_identificacao is unique
    db_exemplar_check = db.query(models.Exemplar).filter(models.Exemplar.codigo_identificacao == exemplar.codigo_identificacao).first()
    if db_exemplar_check:
        logger.warning(f"Exemplar com có    if db_livro.status_geral == "descatalogado" and exemplar.status == "disponivel":
        logger.warning(f"Tentativa de criar exemplar disponível para livro descatalogado (ID: {exemplar.id_livro}).")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não é permitido criar exemplar disponível para livro descatalogado.")
    # Se livro descatalogado, força status para 'descartado'
    if db_livro.status_geral == "descatalogado":
        exemplar.status = "descartado"
    # Check if codigo_identificacao is unique
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

# --- Emprestimo CRUD (Existente) ---
def get_emprestimo(db: Session, emprestimo_id: int) -> Optional[models.Emprestimo]:
    logger.debug(f"Buscando empréstimo com id: {emprestimo_id}")
    emprestimo = db.query(models.Emprestimo).options(
        joinedload(models.Emprestimo.usuario),
        joinedload(models.Emprestimo.exemplar).joinedload(models.Exemplar.livro),
        joinedload(models.Emprestimo.funcionario_registro_emprestimo)
    ).filter(models.Emprestimo.id_emprestimo == emprestimo_id).first()

    if not emprestimo:
        logger.warning(f"Empréstimo com id {emprestimo_id} não encontrado.")
    return emprestimo

def get_emprestimos(db: Session, skip: int = 0, limit: int = 100) -> List[models.Emprestimo]:
    logger.debug(f"Buscando empréstimos com skip: {skip}, limit: {limit}")
    return db.query(models.Emprestimo).options(
        joinedload(models.Emprestimo.usuario),
        joinedload(models.Emprestimo.exemplar).joinedload(models.Exemplar.livro),
        joinedload(models.Emprestimo.funcionario_registro_emprestimo)
    ).order_by(models.Emprestimo.data_retirada.desc()).offset(skip).limit(limit).all()

def create_emprestimo(db: Session, emprestimo: schemas.EmprestimoCreate) -> models.Emprestimo:
    logger.info(f"Tentando criar empréstimo para exemplar numero_tombo {emprestimo.numero_tombo} por usuário ID {emprestimo.id_usuario}")
    db_exemplar = db.query(models.Exemplar).filter(models.Exemplar.numero_tombo == emprestimo.numero_tombo).first()
    if not db_exemplar:
        logger.error(f"Exemplar com numero_tombo {emprestimo.numero_tombo} não encontrado ao criar empréstimo.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Exemplar com numero_tombo {emprestimo.numero_tombo} não encontrado.")
    # NOVA REGRA: Não permitir empréstimo de livro descatalogado
    if db_exemplar.livro and db_exemplar.livro.status_geral == "descatalogado":
        logger.warning(f"Tentativa de empréstimo de exemplar {emprestimo.numero_tombo} de livro descatalogado.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não é permitido emprestar exemplares de livros descatalogados.")
    if db_exemplar.status != "disponivel":
        logger.warning(f"Exemplar {emprestimo.numero_tombo} não está disponível (status: {db_exemplar.status}).")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Exemplar {emprestimo.numero_tombo} não está disponível para empréstimo.")

    db_usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == emprestimo.id_usuario).first()
    if not db_usuario:
        logger.error(f"Usuário com id {emprestimo.id_usuario} não encontrado ao criar empréstimo.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Usuário com id {emprestimo.id_usuario} não encontrado.")
    if not db_usuario.is_active:
        logger.warning(f"Usuário com id {emprestimo.id_usuario} está inativo.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Usuário com id {emprestimo.id_usuario} está inativo.")

    db_funcionario = db.query(models.Funcionario).filter(models.Funcionario.id_funcionario == emprestimo.id_funcionario_registro).first()
    if not db_funcionario:
        logger.error(f"Funcionário de registro com id {emprestimo.id_funcionario_registro} não encontrado ao criar empréstimo.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Funcionário de registro com id {emprestimo.id_funcionario_registro} não encontrado.")
    if not db_funcionario.is_active:
        logger.warning(f"Funcionário de registro com id {emprestimo.id_funcionario_registro} está inativo.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Funcionário de registro com id {emprestimo.id_funcionario_registro} está inativo.")

    db_emprestimo = models.Emprestimo(**emprestimo.model_dump())
    db_exemplar.status = "emprestado"
    db.add(db_emprestimo)
    db.add(db_exemplar)
    db.commit()
    db.refresh(db_emprestimo)
    db.refresh(db_exemplar)
    logger.info(f"Empréstimo ID {db_emprestimo.id_emprestimo} criado com sucesso. Exemplar Nº Tombo {db_exemplar.numero_tombo} status atualizado para 'emprestado'.")
    return db_emprestimo

def get_emprestimos_by_usuario_id(db: Session, usuario_id: int, skip: int = 0, limit: int = 100) -> List[models.Emprestimo]:
    logger.debug(f"Buscando empréstimos para o usuário ID {usuario_id}, skip: {skip}, limit: {limit}")
    return db.query(models.Emprestimo).filter(models.Emprestimo.id_usuario == usuario_id).options(
        joinedload(models.Emprestimo.usuario),
        joinedload(models.Emprestimo.exemplar).joinedload(models.Exemplar.livro),
        joinedload(models.Emprestimo.funcionario_registro_emprestimo)
    ).order_by(models.Emprestimo.data_retirada.desc()).offset(skip).limit(limit).all()

def delete_emprestimo(db: Session, emprestimo_id: int) -> Optional[models.Emprestimo]:
    logger.info(f"Tentando excluir empréstimo com id: {emprestimo_id}")
    db_emprestimo = db.query(models.Emprestimo).options(
        selectinload(models.Emprestimo.penalidades_associadas)
    ).filter(models.Emprestimo.id_emprestimo == emprestimo_id).first()
    
    if not db_emprestimo:
        logger.warning(f"Empréstimo com id {emprestimo_id} não encontrado para exclusão.")
        return None

    if db_emprestimo.status_emprestimo == "ativo":
        logger.warning(f"Empréstimo ID {emprestimo_id} está ativo. Exclusão não permitida.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empréstimo ativo não pode ser excluído. Registre a devolução primeiro.")

    if db_emprestimo.penalidades_associadas:
        logger.warning(f"Empréstimo ID {emprestimo_id} possui penalidades associadas. Exclusão não permitida.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empréstimo possui penalidades associadas e não pode ser excluído.")
        
    # Se o empréstimo foi devolvido, o status do exemplar já deve ter sido atualizado.
    # Se houver lógica de arquivamento em vez de deleção, seria implementada aqui.
    db.delete(db_emprestimo)
    db.commit()
    logger.info(f"Empréstimo com id {emprestimo_id} excluído com sucesso.")
    return db_emprestimo

# --- Reserva CRUD (Existente) ---
def get_reserva(db: Session, reserva_id: int) -> Optional[models.Reserva]:
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

def get_reservas(db: Session, skip: int = 0, limit: int = 100) -> List[models.Reserva]:
    logger.debug(f"Buscando reservas com skip: {skip}, limit: {limit}")
    return db.query(models.Reserva).options(
        joinedload(models.Reserva.usuario),
        joinedload(models.Reserva.exemplar).joinedload(models.Exemplar.livro),
        joinedload(models.Reserva.livro_solicitado),
        joinedload(models.Reserva.funcionario_registro_reserva)
    ).order_by(models.Reserva.data_reserva.desc()).offset(skip).limit(limit).all()

def create_reserva(db: Session, reserva: schemas.ReservaCreate) -> models.Reserva:
    logger.info(f"Tentando criar reserva para usuário ID {reserva.id_usuario}, numero_tombo {getattr(reserva, 'numero_tombo', None)}, livro ID {getattr(reserva, 'id_livro_solicitado', None)}")
    # Validate usuario
    db_usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == reserva.id_usuario).first()
    if not db_usuario:
        logger.error(f"Usuário com id {reserva.id_usuario} não encontrado ao criar reserva.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Usuário com id {reserva.id_usuario} não encontrado.")
    if not db_usuario.is_active:
        logger.warning(f"Usuário com id {reserva.id_usuario} está inativo.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Usuário com id {reserva.id_usuario} está inativo.")

    # Validate funcionario_registro if provided
    if reserva.id_funcionario_registro:
        db_funcionario = db.query(models.Funcionario).filter(models.Funcionario.id_funcionario == reserva.id_funcionario_registro).first()
        if not db_funcionario:
            logger.error(f"Funcionário de registro com id {reserva.id_funcionario_registro} não encontrado ao criar reserva.")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Funcionário de registro com id {reserva.id_funcionario_registro} não encontrado.")
        if not db_funcionario.is_active:
            logger.warning(f"Funcionário de registro com id {reserva.id_funcionario_registro} está inativo.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Funcionário de registro com id {reserva.id_funcionario_registro} está inativo.")

    numero_tombo = reserva.numero_tombo
    # Se numero_tombo não foi enviado, buscar exemplar disponível do livro
    if not numero_tombo:
        if not reserva.id_livro_solicitado:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="É obrigatório informar o numero_tombo do exemplar ou o id_livro_solicitado.")
        # Primeiro tenta um exemplar disponível
        db_exemplar = db.query(models.Exemplar).filter(
            models.Exemplar.id_livro == reserva.id_livro_solicitado,
            models.Exemplar.status == "disponivel"
        ).first()
        # Se não houver disponível, tenta um emprestado
        if not db_exemplar:
            db_exemplar = db.query(models.Exemplar).filter(
                models.Exemplar.id_livro == reserva.id_livro_solicitado,
                models.Exemplar.status == "emprestado"
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

    # Verifica se já existe reserva ativa para este exemplar
    existing_active_reserva_exemplar = db.query(models.Reserva).filter(
        models.Reserva.numero_tombo == numero_tombo,
        models.Reserva.status == "ativa"
    ).first()
    if existing_active_reserva_exemplar and existing_active_reserva_exemplar.id_usuario != reserva.id_usuario:
         logger.warning(f"Exemplar {numero_tombo} já possui uma reserva ativa por outro usuário.")
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Exemplar {numero_tombo} já está reservado ativamente por outro usuário.")
    # Atualiza status do exemplar para 'reservado' ao criar reserva
    db_exemplar.status = "reservado"
    db.add(db_exemplar)

    # Preencher datas se não vierem do frontend
    hoje = datetime.date.today()
    data_reserva = reserva.data_reserva or hoje
    data_validade_reserva = reserva.data_validade_reserva or (hoje + datetime.timedelta(days=3))

    reserva_data = reserva.model_dump()
    reserva_data["numero_tombo"] = numero_tombo
    reserva_data["data_reserva"] = data_reserva
    reserva_data["data_validade_reserva"] = data_validade_reserva
    db_reserva = models.Reserva(**reserva_data)
    db.add(db_reserva)
    db.commit()
    db.refresh(db_reserva)
    logger.info(f"Reserva ID {db_reserva.id_reserva} criada com sucesso para exemplar {numero_tombo}.")
    return db_reserva

def get_reservas_by_usuario_id(db: Session, usuario_id: int, skip: int = 0, limit: int = 100) -> list[schemas.ReservaRead]:
    logger.debug(f"Buscando reservas para o usuário ID {usuario_id}, skip: {skip}, limit: {limit}")
    reservas = db.query(models.Reserva).options(
        joinedload(models.Reserva.usuario),
        joinedload(models.Reserva.exemplar).joinedload(models.Exemplar.livro).joinedload(models.Livro.autores),
        joinedload(models.Reserva.livro_solicitado),
        joinedload(models.Reserva.funcionario_registro_reserva)
    ).filter(models.Reserva.id_usuario == usuario_id).order_by(models.Reserva.data_reserva.desc()).offset(skip).limit(limit).all()
    # Preencher sempre o campo 'livro' com o livro do exemplar reservado, se houver
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
            # Adiciona autores ao livro
            if hasattr(livro, "autores"):
                reserva_dict["livro"]["autores"] = [schemas.AutorReadBasic.model_validate(a).model_dump() for a in livro.autores]
        reservas_read.append(reserva_dict)
    return reservas_read

def delete_reserva(db: Session, reserva_id: int) -> Optional[models.Reserva]:
    logger.info(f"Tentando excluir reserva com id: {reserva_id}")
    db_reserva = db.query(models.Reserva).filter(models.Reserva.id_reserva == reserva_id).first()
    if db_reserva:
        exemplar = None
        if db_reserva.numero_tombo:
            exemplar = db.query(models.Exemplar).filter(models.Exemplar.numero_tombo == db_reserva.numero_tombo).first()
        if db_reserva.status == "ativa": # Ou "atendida"
            logger.warning(f"Reserva ID {reserva_id} está ativa ou atendida. Exclusão não permitida diretamente. Cancele primeiro.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reserva ativa ou atendida não pode ser excluída. Cancele-a ou marque como expirada primeiro.")
        db.delete(db_reserva)
        db.commit()
        logger.info(f"Reserva com id {reserva_id} (status: {db_reserva.status}) excluída com sucesso.")
        # Se o exemplar estava reservado e não há outra reserva ativa para ele, liberar
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

# --- Devolucao CRUD (Refatorado) ---
def _validar_emprestimo_para_devolucao(db, devolucao):
    """Valida se o empréstimo existe e pode ser devolvido."""
    db_emprestimo = db.query(models.Emprestimo).filter(models.Emprestimo.id_emprestimo == devolucao.id_emprestimo).first()
    if not db_emprestimo:
        logger.error(f"Empréstimo com ID {devolucao.id_emprestimo} não encontrado ao registrar devolução.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Empréstimo com ID {devolucao.id_emprestimo} não encontrado.")
    if db_emprestimo.data_efetiva_devolucao is not None or db_emprestimo.status_emprestimo == "devolvido":
        logger.warning(f"Empréstimo {devolucao.id_emprestimo} já foi devolvido.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Empréstimo {devolucao.id_emprestimo} já foi devolvido.")
    return db_emprestimo

def _validar_funcionario_para_devolucao(db, devolucao):
    """Valida se o funcionário existe e está ativo."""
    db_funcionario = db.query(models.Funcionario).filter(models.Funcionario.id_funcionario == devolucao.id_funcionario_registro).first()
    if not db_funcionario:
        logger.error(f"Funcionário de registro com id {devolucao.id_funcionario_registro} não encontrado ao registrar devolução.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Funcionário de registro com id {devolucao.id_funcionario_registro} não encontrado.")
    if not db_funcionario.is_active:
        logger.warning(f"Funcionário de registro com id {devolucao.id_funcionario_registro} está inativo.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Funcionário de registro com id {devolucao.id_funcionario_registro} está inativo.")
    return db_funcionario

def create_devolucao(db: Session, devolucao: schemas.DevolucaoCreate) -> models.Devolucao:
    """Registra uma devolução, atualiza status do empréstimo e exemplar."""
    logger.info(f"Tentando registrar devolução para empréstimo ID {devolucao.id_emprestimo}")
    db_emprestimo = _validar_emprestimo_para_devolucao(db, devolucao)
    _validar_funcionario_para_devolucao(db, devolucao)

    db_devolucao = models.Devolucao(**devolucao.model_dump())
    db_emprestimo.data_efetiva_devolucao = devolucao.data_devolucao
    db_emprestimo.status_emprestimo = "devolvido"

    db_exemplar = db_emprestimo.exemplar
    if db_exemplar:
        db_exemplar.status = "disponivel"
        db.add(db_exemplar)

    db.add(db_devolucao)
    db.add(db_emprestimo)
    db.commit()
    db.refresh(db_devolucao)
    db.refresh(db_emprestimo)
    if db_exemplar:
        db.refresh(db_exemplar)
    logger.info(f"Devolução ID {db_devolucao.id_devolucao} registrada para empréstimo ID {db_emprestimo.id_emprestimo}. Exemplar Nº Tombo {db_exemplar.numero_tombo if db_exemplar else 'N/A'} status atualizado.")
    return db_devolucao

# --- Curso CRUD (Placeholder - Adicionar se necessário) ---
def get_curso(db: Session, curso_id: int) -> Optional[models.Curso]:
    logger.debug(f"Buscando curso com id: {curso_id}")
    curso = db.query(models.Curso).filter(models.Curso.id_curso == curso_id).first()
    if not curso:
        logger.warning(f"Curso com id {curso_id} não encontrado.")
    return curso

def get_cursos(db: Session, skip: int = 0, limit: int = 100) -> List[models.Curso]:
    logger.debug(f"Buscando cursos com skip: {skip}, limit: {limit}")
    return db.query(models.Curso).offset(skip).limit(limit).all()

def create_curso(db: Session, curso: schemas.CursoCreate) -> models.Curso:
    logger.info(f"Tentando criar curso: {curso.nome}")
    db_curso_check = db.query(models.Curso).filter(models.Curso.nome == curso.nome).first()
    if db_curso_check:
        logger.warning(f"Curso com nome '{curso.nome}' já existe.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Curso com este nome já existe.")
    db_curso = models.Curso(**curso.model_dump())
    db.add(db_curso)
    db.commit()
    db.refresh(db_curso)
    logger.info(f"Curso '{db_curso.nome}' (ID: {db_curso.id_curso}) criado com sucesso.")
    return db_curso

# --- Penalidade CRUD (Placeholder - Adicionar se necessário) ---
def create_penalidade(db: Session, penalidade: schemas.PenalidadeCreate) -> models.Penalidade:
    logger.info(f"Tentando criar penalidade para usuário ID {penalidade.id_usuario}, tipo: {penalidade.tipo_penalidade}")
    # Validar usuario
    db_usuario = get_usuario(db, penalidade.id_usuario)
    if not db_usuario:
        logger.error(f"Usuário ID {penalidade.id_usuario} não encontrado ao criar penalidade.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Usuário com ID {penalidade.id_usuario} não encontrado.")
    # Validar emprestimo_origem se fornecido
    if penalidade.id_emprestimo_origem:
        db_emprestimo = get_emprestimo(db, penalidade.id_emprestimo_origem)
        if not db_emprestimo:
            logger.error(f"Empréstimo de origem ID {penalidade.id_emprestimo_origem} não encontrado ao criar penalidade.")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Empréstimo de origem com ID {penalidade.id_emprestimo_origem} não encontrado.")

    db_penalidade = models.Penalidade(**penalidade.model_dump())
    db.add(db_penalidade)
    db.commit()
    db.refresh(db_penalidade)
    logger.info(f"Penalidade ID {db_penalidade.id_penalidade} criada para usuário ID {db_penalidade.id_usuario}.")
    return db_penalidade

def get_penalidade(db: Session, penalidade_id: int) -> Optional[models.Penalidade]:
    logger.debug(f"Buscando penalidade com ID: {penalidade_id}")
    penalidade = db.query(models.Penalidade).options(
        joinedload(models.Penalidade.usuario),
        joinedload(models.Penalidade.emprestimo_relacionado)
    ).filter(models.Penalidade.id_penalidade == penalidade_id).first()
    if not penalidade:
        logger.warning(f"Penalidade com ID {penalidade_id} não encontrada.")
    return penalidade

def get_penalidades_by_usuario(db: Session, usuario_id: int, skip: int = 0, limit: int = 100) -> List[models.Penalidade]:
    logger.debug(f"Buscando penalidades para usuário ID {usuario_id}, skip: {skip}, limit: {limit}")
    return db.query(models.Penalidade).filter(models.Penalidade.id_usuario == usuario_id).options(
        joinedload(models.Penalidade.emprestimo_relacionado)
    ).order_by(models.Penalidade.data_inicio.desc()).offset(skip).limit(limit).all()

def is_last_admin(db: Session, funcionario_id: int) -> bool:
    """
    Retorna True se o funcionário dado for o último admin ativo.
    """
    # Conta admins ativos, exceto o que está sendo removido/desativado
    num_admins_ativos = db.query(models.Funcionario).filter(
        models.Funcionario.is_active == True,
        models.Funcionario.cargo.ilike("admin"),
        models.Funcionario.id_funcionario != funcionario_id
    ).count()
    # Se não há outros admins ativos além deste, ele é o último admin
    return num_admins_ativos == 0

def cancelar_emprestimo(db: Session, emprestimo_id: int) -> Optional[models.Emprestimo]:
    """
    Marca o empréstimo como 'cancelado' se ainda não devolvido.
    """
    emprestimo = db.query(models.Emprestimo).filter(models.Emprestimo.id_emprestimo == emprestimo_id).first()
    if not emprestimo:
        logger.warning(f"Empréstimo ID {emprestimo_id} não encontrado para cancelamento.")
        return None
    if emprestimo.status_emprestimo == "devolvido":
        logger.warning(f"Empréstimo ID {emprestimo_id} já devolvido, não pode ser cancelado.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empréstimo já devolvido não pode ser cancelado.")
    emprestimo.status_emprestimo = "cancelado"
    db.add(emprestimo)
    # Atualiza status do exemplar para 'disponivel'
    if emprestimo.exemplar:
        emprestimo.exemplar.status = "disponivel"
        db.add(emprestimo.exemplar)
    db.commit()
    db.refresh(emprestimo)
    logger.info(f"Empréstimo ID {emprestimo_id} marcado como cancelado.")
    return emprestimo

def marcar_emprestimo_como_devolvido(db: Session, emprestimo_id: int) -> Optional[models.Emprestimo]:
    """
    Marca o empréstimo como devolvido e atualiza o status do exemplar para 'disponivel'.
    """
    emprestimo = db.query(models.Emprestimo).filter(models.Emprestimo.id_emprestimo == emprestimo_id).first()
    if not emprestimo:
        logger.warning(f"Empréstimo ID {emprestimo_id} não encontrado para marcar como devolvido.")
        return None
    if emprestimo.status_emprestimo == "devolvido":
        logger.info(f"Empréstimo ID {emprestimo_id} já está como devolvido.")
        return emprestimo
    emprestimo.status_emprestimo = "devolvido"
    # Atualiza status do exemplar
    if emprestimo.exemplar:
        emprestimo.exemplar.status = "disponivel"
        db.add(emprestimo.exemplar)
    db.add(emprestimo)
    db.commit()
    db.refresh(emprestimo)
    logger.info(f"Empréstimo ID {emprestimo_id} marcado como devolvido e exemplar atualizado para disponível.")
    return emprestimo

# --- CRUD para Autor ---
def update_autor(db: Session, autor_id: int, autor_update: schemas.AutorCreate) -> Optional[models.Autor]:
    autor = get_autor(db, autor_id)
    if not autor:
        logger.warning(f"Autor com id {autor_id} não encontrado para atualização.")
        return None
    for key, value in autor_update.model_dump(exclude_unset=True).items():
        setattr(autor, key, value)
    db.commit()
    db.refresh(autor)
    logger.info(f"Autor ID {autor_id} atualizado com sucesso.")
    return autor

def delete_autor(db: Session, autor_id: int) -> Optional[models.Autor]:
    autor = get_autor(db, autor_id)
    if not autor:
        logger.warning(f"Autor com id {autor_id} não encontrado para exclusão.")
        return None
    if autor.livros:
        logger.warning(f"Autor ID {autor_id} possui livros associados. Exclusão não permitida.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Autor possui livros associados e não pode ser excluído.")
    db.delete(autor)
    db.commit()
    logger.info(f"Autor com id {autor_id} excluído com sucesso.")
    return autor

# --- CRUD para Exemplar ---
def update_exemplar(db: Session, exemplar_id: int, exemplar_update: schemas.ExemplarUpdate) -> Optional[models.Exemplar]:
    exemplar = get_exemplar(db, exemplar_id)
    if not exemplar:
        logger.warning(f"Exemplar com id {exemplar_id} não encontrado para atualização.")
        return None
    # Impede atualizar exemplar para disponível se o livro está descatalogado
    db_livro = exemplar.livro
    novo_status = exemplar_update.status if exemplar_update.status is not None else exemplar.status
    if db_livro and db_livro.status_geral == "descatalogado" and novo_status == "disponivel":
        logger.warning(f"Tentativa de atualizar exemplar para disponível em livro descatalogado (ID: {db_livro.id_livro}).")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não é permitido deixar exemplar disponível para livro descatalogado.")
    # Se livro descatalogado, força status para 'descartado'
    if db_livro and db_livro.status_geral == "descatalogado":
        exemplar_update.status = "descartado"
    for key, value in exemplar_update.model_dump(exclude_unset=True).items():
        setattr(exemplar, key, value)
    db.commit()
    db.refresh(exemplar)
    logger.info(f"Exemplar ID {exemplar_id} atualizado com sucesso.")
    return exemplar

def delete_exemplar(db: Session, exemplar_id: int) -> Optional[models.Exemplar]:
    exemplar = get_exemplar(db, exemplar_id)
    if not exemplar:
        logger.warning(f"Exemplar com id {exemplar_id} não encontrado para exclusão.")
        return None
    if exemplar.status == "emprestado":
        logger.warning(f"Exemplar ID {exemplar_id} está emprestado. Exclusão não permitida.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exemplar emprestado não pode ser excluído.")
    db.delete(exemplar)
    db.commit()
    logger.info(f"Exemplar com id {exemplar_id} excluído com sucesso.")
    return exemplar

# --- CRUD para Curso ---
def update_curso(db: Session, curso_id: int, curso_update: schemas.CursoCreate) -> Optional[models.Curso]:
    curso = get_curso(db, curso_id)
    if not curso:
        logger.warning(f"Curso com id {curso_id} não encontrado para atualização.")
        return None
    for key, value in curso_update.model_dump(exclude_unset=True).items():
        setattr(curso, key, value)
    db.commit()
    db.refresh(curso)
    logger.info(f"Curso ID {curso_id} atualizado com sucesso.")
    return curso

def delete_curso(db: Session, curso_id: int) -> Optional[models.Curso]:
    curso = get_curso(db, curso_id)
    if not curso:
        logger.warning(f"Curso com id {curso_id} não encontrado para exclusão.")
        return None
    if curso.usuarios:
        logger.warning(f"Curso ID {curso_id} possui usuários associados. Exclusão não permitida.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Curso possui usuários associados e não pode ser excluído.")
    db.delete(curso)
    db.commit()
    logger.info(f"Curso com id {curso_id} excluído com sucesso.")
    return curso

# --- CRUD para Categoria ---
def update_categoria(db: Session, categoria_id: int, categoria_update: schemas.CategoriaCreate) -> Optional[models.Categoria]:
    categoria = get_categoria(db, categoria_id)
    if not categoria:
        logger.warning(f"Categoria com id {categoria_id} não encontrada para atualização.")
        return None
    for key, value in categoria_update.model_dump(exclude_unset=True).items():
        setattr(categoria, key, value)
    db.commit()
    db.refresh(categoria)
    logger.info(f"Categoria ID {categoria_id} atualizada com sucesso.")
    return categoria

# --- CRUD para Devolucao ---
def get_devolucao(db: Session, devolucao_id: int) -> Optional[models.Devolucao]:
    return db.query(models.Devolucao).filter(models.Devolucao.id_devolucao == devolucao_id).first()

def get_devolucoes(db: Session, skip: int = 0, limit: int = 100) -> List[models.Devolucao]:
    return db.query(models.Devolucao).offset(skip).limit(limit).all()

def update_devolucao(db: Session, devolucao_id: int, devolucao_update: schemas.DevolucaoCreate) -> Optional[models.Devolucao]:
    devolucao = get_devolucao(db, devolucao_id)
    if not devolucao:
        logger.warning(f"Devolução com id {devolucao_id} não encontrada para atualização.")
        return None
    for key, value in devolucao_update.model_dump(exclude_unset=True).items():
        setattr(devolucao, key, value)
    db.commit()
    db.refresh(devolucao)
    logger.info(f"Devolução ID {devolucao_id} atualizada com sucesso.")
    return devolucao

def delete_devolucao(db: Session, devolucao_id: int) -> Optional[models.Devolucao]:
    devolucao = get_devolucao(db, devolucao_id)
    if not devolucao:
        logger.warning(f"Devolução com id {devolucao_id} não encontrada para exclusão.")
        return None
    db.delete(devolucao)
    db.commit()
    logger.info(f"Devolução com id {devolucao_id} excluída com sucesso.")
    return devolucao

# --- CRUD para Penalidade ---
def update_penalidade(db: Session, penalidade_id: int, penalidade_update: schemas.PenalidadeCreate) -> Optional[models.Penalidade]:
    penalidade = get_penalidade(db, penalidade_id)
    if not penalidade:
        logger.warning(f"Penalidade com id {penalidade_id} não encontrada para atualização.")
        return None
    for key, value in penalidade_update.model_dump(exclude_unset=True).items():
        setattr(penalidade, key, value)
    db.commit()
    db.refresh(penalidade)
    logger.info(f"Penalidade ID {penalidade_id} atualizada com sucesso.")
    return penalidade

def delete_penalidade(db: Session, penalidade_id: int) -> Optional[models.Penalidade]:
    penalidade = get_penalidade(db, penalidade_id)
    if not penalidade:
        logger.warning(f"Penalidade com id {penalidade_id} não encontrada para exclusão.")
        return None
    db.delete(penalidade)
    db.commit()
    logger.info(f"Penalidade com id {penalidade_id} excluída com sucesso.")
    return penalidade

# --- CRUD para Emprestimo ---
def update_emprestimo(db: Session, emprestimo_id: int, emprestimo_update: schemas.EmprestimoCreate) -> Optional[models.Emprestimo]:
    emprestimo = get_emprestimo(db, emprestimo_id)
    if not emprestimo:
        logger.warning(f"Empréstimo com id {emprestimo_id} não encontrado para atualização.")
        return None
    for key, value in emprestimo_update.model_dump(exclude_unset=True).items():
        setattr(emprestimo, key, value)
    db.commit()
    db.refresh(emprestimo)
    logger.info(f"Empréstimo ID {emprestimo_id} atualizado com sucesso.")
    return emprestimo

# --- CRUD para Reserva ---
def update_reserva(db: Session, reserva_id: int, reserva_update: schemas.ReservaCreate) -> Optional[models.Reserva]:
    reserva = get_reserva(db, reserva_id)
    if not reserva:
        logger.warning(f"Reserva com id {reserva_id} não encontrada para atualização.")
        return None
    for key, value in reserva_update.model_dump(exclude_unset=True).items():
        setattr(reserva, key, value)
    db.commit()
    db.refresh(reserva)
    logger.info(f"Reserva ID {reserva_id} atualizada com sucesso.")
    return reserva

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
    # Reaplica os joins para eager loading
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
    # Adiciona as contagens de exemplares
    livros_result = []
    for livro in items:
        total_exemplares = len(livro.exemplares)
        exemplares_disponiveis = sum(1 for ex in livro.exemplares if ex.status == "disponivel")
