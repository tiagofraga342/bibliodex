from sqlalchemy import Column, Integer, String, Date, ForeignKey, Table, Float, Numeric
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.declarative import declarative_base
from typing import Optional, List as PyList # Use PyList to avoid conflict if List is used elsewhere
from datetime import date as PyDate # Use PyDate for type hinting

Base = declarative_base()

# Associação muitos-para-muitos entre Livro e Autor
escrito_por = Table(
    "escrito_por", Base.metadata,
    Column("id_autor", Integer, ForeignKey("autor.id_autor"), primary_key=True),
    Column("id_livro", Integer, ForeignKey("livro.id_livro"), primary_key=True)
)

class Livro(Base):
    __tablename__ = "livro"

    id_livro: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    titulo: Mapped[str] = mapped_column(String)
    ano_publicacao: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status_geral: Mapped[Optional[str]] = mapped_column(String, nullable=True, comment="Status geral do título, ex: ativo, descatalogado")
    id_categoria: Mapped[int] = mapped_column(Integer, ForeignKey("categoria.id_categoria"))

    categoria: Mapped["Categoria"] = relationship("Categoria", back_populates="livros")
    autores: Mapped[PyList["Autor"]] = relationship("Autor", secondary=escrito_por, back_populates="livros")
    exemplares: Mapped[PyList["Exemplar"]] = relationship("Exemplar", back_populates="livro")
    # Adicionado para Reserva.id_livro_solicitado
    reservas_solicitadas: Mapped[PyList["Reserva"]] = relationship("Reserva", foreign_keys="[Reserva.id_livro_solicitado]", back_populates="livro_solicitado")


class Autor(Base):
    __tablename__ = "autor"

    id_autor: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String)
    ano_nasc: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    livros: Mapped[PyList["Livro"]] = relationship("Livro", secondary=escrito_por, back_populates="autores")

class Categoria(Base):
    __tablename__ = "categoria"

    id_categoria: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String, unique=True)

    livros: Mapped[PyList["Livro"]] = relationship("Livro", back_populates="categoria")

class Curso(Base):
    __tablename__ = "curso"

    id_curso: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String, unique=True)
    departamento: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    usuarios: Mapped[PyList["Usuario"]] = relationship("Usuario", back_populates="curso")

class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String)
    telefone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    matricula: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    email: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    id_curso: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("curso.id_curso"), nullable=True)

    curso: Mapped[Optional["Curso"]] = relationship("Curso", back_populates="usuarios") # Optional if id_curso is nullable
    emprestimos: Mapped[PyList["Emprestimo"]] = relationship("Emprestimo", back_populates="usuario")
    reservas: Mapped[PyList["Reserva"]] = relationship("Reserva", back_populates="usuario")
    penalidades: Mapped[PyList["Penalidade"]] = relationship("Penalidade", back_populates="usuario")

class Funcionario(Base):
    __tablename__ = "funcionario"

    id_funcionario: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String)
    cargo: Mapped[str] = mapped_column(String)
    matricula_funcional: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    emprestimos_registrados: Mapped[PyList["Emprestimo"]] = relationship("Emprestimo", foreign_keys="[Emprestimo.id_funcionario_registro]", back_populates="funcionario_registro_emprestimo")
    reservas_registradas: Mapped[PyList["Reserva"]] = relationship("Reserva", foreign_keys="[Reserva.id_funcionario_registro]", back_populates="funcionario_registro_reserva")
    devolucoes_registradas: Mapped[PyList["Devolucao"]] = relationship("Devolucao", foreign_keys="[Devolucao.id_funcionario_registro]", back_populates="funcionario_registro_devolucao")

class Exemplar(Base):
    __tablename__ = "exemplar"

    id_exemplar: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    codigo_identificacao: Mapped[str] = mapped_column(String, unique=True, index=True, comment="Código único do exemplar, ex: código de barras")
    status: Mapped[str] = mapped_column(String, default="disponivel", comment="Status: disponivel, emprestado, reservado, em_manutencao, perdido, descartado")
    data_aquisicao: Mapped[Optional[PyDate]] = mapped_column(Date, nullable=True)
    observacoes: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    id_livro: Mapped[int] = mapped_column(Integer, ForeignKey("livro.id_livro"))

    livro: Mapped["Livro"] = relationship("Livro", back_populates="exemplares")
    emprestimos: Mapped[PyList["Emprestimo"]] = relationship("Emprestimo", back_populates="exemplar")
    reservas: Mapped[PyList["Reserva"]] = relationship("Reserva", foreign_keys="[Reserva.id_exemplar]", back_populates="exemplar")


class Emprestimo(Base):
    __tablename__ = "emprestimo"

    id_emprestimo: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    data_retirada: Mapped[PyDate] = mapped_column(Date, nullable=False)
    data_prevista_devolucao: Mapped[PyDate] = mapped_column(Date, nullable=False)
    data_efetiva_devolucao: Mapped[Optional[PyDate]] = mapped_column(Date, nullable=True)
    status_emprestimo: Mapped[str] = mapped_column(String, default="ativo", comment="Status: ativo, devolvido, atrasado")
    id_usuario: Mapped[int] = mapped_column(Integer, ForeignKey("usuario.id_usuario"))
    id_exemplar: Mapped[int] = mapped_column(Integer, ForeignKey("exemplar.id_exemplar"))
    id_funcionario_registro: Mapped[int] = mapped_column(Integer, ForeignKey("funcionario.id_funcionario"))

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="emprestimos")
    exemplar: Mapped["Exemplar"] = relationship("Exemplar", back_populates="emprestimos")
    funcionario_registro_emprestimo: Mapped["Funcionario"] = relationship("Funcionario", foreign_keys=[id_funcionario_registro], back_populates="emprestimos_registrados")
    devolucao: Mapped[Optional["Devolucao"]] = relationship("Devolucao", back_populates="emprestimo", uselist=False)
    penalidades_associadas: Mapped[PyList["Penalidade"]] = relationship("Penalidade", foreign_keys="[Penalidade.id_emprestimo_origem]", back_populates="emprestimo_relacionado")


class Reserva(Base):
    __tablename__ = "reserva"

    id_reserva: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    data_reserva: Mapped[PyDate] = mapped_column(Date, nullable=False)
    data_validade_reserva: Mapped[PyDate] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String, default="ativa", comment="Status: ativa, cancelada, expirada, atendida")
    id_exemplar: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("exemplar.id_exemplar"), nullable=True)
    id_livro_solicitado: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("livro.id_livro"), nullable=True, comment="Para reservas genéricas de um título")
    id_usuario: Mapped[int] = mapped_column(Integer, ForeignKey("usuario.id_usuario"))
    id_funcionario_registro: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("funcionario.id_funcionario"), nullable=True)

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="reservas")
    exemplar: Mapped[Optional["Exemplar"]] = relationship("Exemplar", foreign_keys=[id_exemplar], back_populates="reservas")
    livro_solicitado: Mapped[Optional["Livro"]] = relationship("Livro", foreign_keys=[id_livro_solicitado], back_populates="reservas_solicitadas")
    funcionario_registro_reserva: Mapped[Optional["Funcionario"]] = relationship("Funcionario", foreign_keys=[id_funcionario_registro], back_populates="reservas_registradas")


class Devolucao(Base):
    __tablename__ = "devolucao"

    id_devolucao: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    data_devolucao: Mapped[PyDate] = mapped_column(Date, nullable=False)
    observacoes: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    id_funcionario_registro: Mapped[int] = mapped_column(Integer, ForeignKey("funcionario.id_funcionario"))
    id_emprestimo: Mapped[int] = mapped_column(Integer, ForeignKey("emprestimo.id_emprestimo"), unique=True)

    funcionario_registro_devolucao: Mapped["Funcionario"] = relationship("Funcionario", foreign_keys=[id_funcionario_registro], back_populates="devolucoes_registradas")
    emprestimo: Mapped["Emprestimo"] = relationship("Emprestimo", back_populates="devolucao")

class Penalidade(Base):
    __tablename__ = "penalidade"

    id_penalidade: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tipo_penalidade: Mapped[str] = mapped_column(String, comment="Ex: multa, suspensao")
    data_inicio: Mapped[PyDate] = mapped_column(Date, nullable=False)
    data_fim: Mapped[Optional[PyDate]] = mapped_column(Date, nullable=True)
    valor_multa: Mapped[Optional[float]] = mapped_column(Float, nullable=True) # Corrected: Integer to Float
    status: Mapped[str] = mapped_column(String, default="ativa", comment="Status: ativa, paga, cumprida, cancelada")
    observacoes: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    id_usuario: Mapped[int] = mapped_column(Integer, ForeignKey("usuario.id_usuario"))
    id_emprestimo_origem: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("emprestimo.id_emprestimo"), nullable=True)

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="penalidades")
    emprestimo_relacionado: Mapped[Optional["Emprestimo"]] = relationship("Emprestimo", foreign_keys=[id_emprestimo_origem], back_populates="penalidades_associadas")
