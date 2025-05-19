from sqlalchemy import Column, Integer, String, Date, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.database import Base

# Associação muitos-para-muitos entre Livro e Autor
escrito_por = Table(
    "escrito_por", Base.metadata,
    Column("id_autor", Integer, ForeignKey("autor.id_autor"), primary_key=True),
    Column("id_livro", Integer, ForeignKey("livro.id_livro"), primary_key=True)
)

class Livro(Base):
    __tablename__ = "livro"

    id_livro = Column(Integer, primary_key=True, index=True)
    titulo = Column(String)
    ano_publicacao = Column(Integer)
    status = Column(String)
    id_categoria = Column(Integer, ForeignKey("categoria.id_categoria"))

    categoria = relationship("Categoria", back_populates="livros")
    autores = relationship("Autor", secondary=escrito_por, back_populates="livros")

class Autor(Base):
    __tablename__ = "autor"

    id_autor = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    ano_nasc = Column(Integer)

    livros = relationship("Livro", secondary=escrito_por, back_populates="autores")

class Categoria(Base):
    __tablename__ = "categoria"

    id_categoria = Column(Integer, primary_key=True)
    nome = Column(String)

    livros = relationship("Livro", back_populates="categoria")

class Curso(Base):
    __tablename__ = "curso"

    id_curso = Column(Integer, primary_key=True)
    nome = Column(String)
    departamento = Column(String)

    usuarios = relationship("Usuario", back_populates="curso")

class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario = Column(Integer, primary_key=True)
    nome = Column(String)
    telefone = Column(Integer)
    matricula = Column(Integer, nullable=False)
    id_curso = Column(Integer, ForeignKey("curso.id_curso"))

    curso = relationship("Curso", back_populates="usuarios")
    emprestimos = relationship("Emprestimo", back_populates="usuario")
    reservas = relationship("Reserva", back_populates="usuario")
    penalidades = relationship("Penalidade", back_populates="usuario")

class Funcionario(Base):
    __tablename__ = "funcionario"

    id_funcionario = Column(Integer, primary_key=True)
    nome = Column(String)
    cargo = Column(String)

    emprestimos = relationship("Emprestimo", back_populates="funcionario")
    reservas = relationship("Reserva", back_populates="funcionario")
    devolucoes = relationship("Devolucao", back_populates="funcionario")

class Emprestimo(Base):
    __tablename__ = "emprestimo"

    id_emprestimo = Column(Integer, primary_key=True, autoincrement=True)
    data_retirada = Column(Date)
    data_devolucao = Column(Date)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"))
    id_livro = Column(Integer, ForeignKey("livro.id_livro"))
    id_funcionario = Column(Integer, ForeignKey("funcionario.id_funcionario"))

    usuario = relationship("Usuario", back_populates="emprestimos")
    livro = relationship("Livro")
    funcionario = relationship("Funcionario", back_populates="emprestimos")

class Reserva(Base):
    __tablename__ = "reserva"

    id_reserva = Column(Integer, primary_key=True)
    data_reserva = Column(Date)
    status = Column(String)
    id_livro = Column(Integer, ForeignKey("livro.id_livro"))
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"))
    id_funcionario = Column(Integer, ForeignKey("funcionario.id_funcionario"))

    usuario = relationship("Usuario", back_populates="reservas")
    livro = relationship("Livro")
    funcionario = relationship("Funcionario", back_populates="reservas")

class Devolucao(Base):
    __tablename__ = "devolucao"

    id_devolucao = Column(Integer, primary_key=True)
    id_funcionario = Column(Integer, ForeignKey("funcionario.id_funcionario"))
    id_emprestimo = Column(Integer, ForeignKey("emprestimo.id_emprestimo"))

    funcionario = relationship("Funcionario", back_populates="devolucoes")
    emprestimo = relationship("Emprestimo")

class Penalidade(Base):
    __tablename__ = "penalidade"

    id_penalidade = Column(Integer, primary_key=True)
    status = Column(String)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"))

    usuario = relationship("Usuario", back_populates="penalidades")

