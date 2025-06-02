from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import date # Import date

# --- Forward References Helper ---
# For models that refer to each other, Pydantic needs a little help initially.
# We'll define basic "Read" schemas first, then more complete ones.

# --- Autor Schemas ---
class AutorBase(BaseModel):
    nome: str
    ano_nasc: Optional[int] = None

class AutorCreate(AutorBase):
    pass

class AutorReadBasic(AutorBase): # Basic version for nesting
    id_autor: int
    model_config = ConfigDict(from_attributes=True)

# --- Categoria Schemas ---
class CategoriaBase(BaseModel):
    nome: str

class CategoriaCreate(CategoriaBase):
    pass

class CategoriaReadBasic(CategoriaBase): # Basic version for nesting
    id_categoria: int
    model_config = ConfigDict(from_attributes=True)

# --- Livro Schemas ---
class LivroBase(BaseModel):
    titulo: str
    ano_publicacao: Optional[int] = None
    status_geral: Optional[str] = Field(None, comment="Status geral do título, ex: ativo, descatalogado")
    id_categoria: int

class LivroCreate(LivroBase):
    ids_autores: Optional[List[int]] = Field(None, description="List of Author IDs to associate with this book")

class LivroReadBasic(LivroBase): # Basic version for nesting, e.g., in CategoriaRead
    id_livro: int
    model_config = ConfigDict(from_attributes=True)

class LivroRead(LivroBase): # Full version
    id_livro: int
    categoria: CategoriaReadBasic
    autores: List[AutorReadBasic] = []
    # exemplares: List['ExemplarReadBasic'] = [] # Add if needed, define ExemplarReadBasic
    model_config = ConfigDict(from_attributes=True)

# --- Update CategoriaRead to include a list of basic Livro info ---
class CategoriaRead(CategoriaBase):
    id_categoria: int
    livros: List[LivroReadBasic] = []
    model_config = ConfigDict(from_attributes=True)

# --- Update AutorRead to include a list of basic Livro info ---
class AutorRead(AutorBase):
    id_autor: int
    livros: List[LivroReadBasic] = []
    model_config = ConfigDict(from_attributes=True)

# --- Curso Schemas ---
class CursoBase(BaseModel):
    nome: str
    departamento: Optional[str] = None

class CursoCreate(CursoBase):
    pass

class CursoReadBasic(CursoBase): # Basic for nesting
    id_curso: int
    model_config = ConfigDict(from_attributes=True)

class CursoRead(CursoBase): # Full version
    id_curso: int
    # usuarios: List['UsuarioReadBasic'] = [] # Add if needed, define UsuarioReadBasic
    model_config = ConfigDict(from_attributes=True)


# --- Usuario Schemas ---
class UsuarioBase(BaseModel):
    nome: str
    telefone: Optional[str] = None
    matricula: str
    email: Optional[str] = None
    id_curso: Optional[int] = None

class UsuarioCreate(UsuarioBase):
    pass

class UsuarioReadBasic(UsuarioBase): # Basic for nesting
    id_usuario: int
    model_config = ConfigDict(from_attributes=True)

class UsuarioRead(UsuarioBase): # Full version
    id_usuario: int
    curso: Optional[CursoReadBasic] = None
    # emprestimos: List['EmprestimoReadBasic'] = []
    # reservas: List['ReservaReadBasic'] = []
    # penalidades: List['PenalidadeReadBasic'] = []
    model_config = ConfigDict(from_attributes=True)

# --- Funcionario Schemas ---
class FuncionarioBase(BaseModel):
    nome: str
    cargo: str
    matricula_funcional: str

class FuncionarioCreate(FuncionarioBase):
    pass

class FuncionarioReadBasic(FuncionarioBase): # Basic for nesting
    id_funcionario: int
    model_config = ConfigDict(from_attributes=True)

class FuncionarioRead(FuncionarioBase): # Full version
    id_funcionario: int
    # emprestimos_registrados: List['EmprestimoReadBasic'] = []
    # reservas_registradas: List['ReservaReadBasic'] = []
    # devolucoes_registradas: List['DevolucaoReadBasic'] = []
    model_config = ConfigDict(from_attributes=True)

# --- Exemplar Schemas ---
class ExemplarBase(BaseModel):
    codigo_identificacao: str = Field(comment="Código único do exemplar, ex: código de barras")
    status: str = Field(default="disponivel", comment="Status: disponivel, emprestado, reservado, em_manutencao, perdido, descartado")
    data_aquisicao: Optional[date] = None
    observacoes: Optional[str] = None
    id_livro: int

class ExemplarCreate(ExemplarBase):
    pass

class ExemplarReadBasic(ExemplarBase): # Basic for nesting
    id_exemplar: int
    model_config = ConfigDict(from_attributes=True)

class ExemplarRead(ExemplarBase): # Full version
    id_exemplar: int
    livro: LivroReadBasic # Show basic info of the book it belongs to
    # emprestimos: List['EmprestimoReadBasic'] = []
    # reservas: List['ReservaReadBasic'] = []
    model_config = ConfigDict(from_attributes=True)

# --- Emprestimo Schemas ---
class EmprestimoBase(BaseModel):
    data_retirada: date
    data_prevista_devolucao: date
    data_efetiva_devolucao: Optional[date] = None
    status_emprestimo: str = Field(default="ativo", comment="Status: ativo, devolvido, atrasado")
    id_usuario: int
    id_exemplar: int
    id_funcionario_registro: int

class EmprestimoCreate(EmprestimoBase):
    pass

class EmprestimoReadBasic(EmprestimoBase): # Basic for nesting
    id_emprestimo: int
    model_config = ConfigDict(from_attributes=True)

class EmprestimoRead(EmprestimoBase): # Full version
    id_emprestimo: int
    usuario: UsuarioReadBasic
    exemplar: ExemplarReadBasic
    funcionario_registro_emprestimo: FuncionarioReadBasic
    # devolucao: Optional['DevolucaoReadBasic'] = None
    model_config = ConfigDict(from_attributes=True)


# --- Reserva Schemas ---
class ReservaBase(BaseModel):
    data_reserva: date
    data_validade_reserva: date
    status: str = Field(default="ativa", comment="Status: ativa, cancelada, expirada, atendida")
    id_exemplar: Optional[int] = None # Can reserve a specific copy
    id_livro_solicitado: Optional[int] = None # Or reserve a title in general
    id_usuario: int
    id_funcionario_registro: Optional[int] = None # Can be self-service

class ReservaCreate(ReservaBase):
    pass

class ReservaReadBasic(ReservaBase): # Basic for nesting
    id_reserva: int
    model_config = ConfigDict(from_attributes=True)

class ReservaRead(ReservaBase): # Full version
    id_reserva: int
    usuario: UsuarioReadBasic
    exemplar: Optional[ExemplarReadBasic] = None
    livro: Optional[LivroReadBasic] = None # Corresponds to id_livro_solicitado
    funcionario_registro_reserva: Optional[FuncionarioReadBasic] = None
    model_config = ConfigDict(from_attributes=True)

# --- Devolucao Schemas ---
class DevolucaoBase(BaseModel):
    data_devolucao: date
    observacoes: Optional[str] = None
    id_funcionario_registro: int
    id_emprestimo: int # Should be unique

class DevolucaoCreate(DevolucaoBase):
    pass

class DevolucaoReadBasic(DevolucaoBase): # Basic for nesting
    id_devolucao: int
    model_config = ConfigDict(from_attributes=True)

class DevolucaoRead(DevolucaoBase): # Full version
    id_devolucao: int
    funcionario_registro_devolucao: FuncionarioReadBasic
    emprestimo: EmprestimoReadBasic # Show info about the loan being returned
    model_config = ConfigDict(from_attributes=True)

# --- Penalidade Schemas ---
class PenalidadeBase(BaseModel):
    tipo_penalidade: str = Field(comment="Ex: multa, suspensao")
    data_inicio: date
    data_fim: Optional[date] = None
    valor_multa: Optional[float] = None # Corrected to float
    status: str = Field(default="ativa", comment="Status: ativa, paga, cumprida, cancelada")
    observacoes: Optional[str] = None
    id_usuario: int
    id_emprestimo_origem: Optional[int] = None

class PenalidadeCreate(PenalidadeBase):
    pass

class PenalidadeReadBasic(PenalidadeBase): # Basic for nesting
    id_penalidade: int
    model_config = ConfigDict(from_attributes=True)

class PenalidadeRead(PenalidadeBase): # Full version
    id_penalidade: int
    usuario: UsuarioReadBasic
    emprestimo_relacionado: Optional[EmprestimoReadBasic] = None
    model_config = ConfigDict(from_attributes=True)

# Update forward references if Pydantic V1 style was needed for complex cases
# Pydantic V2 generally handles this better with string annotations.
# If you encounter issues, you might need to explicitly update_forward_refs()
# Example:
# LivroRead.model_rebuild()
# CategoriaRead.model_rebuild()
# AutorRead.model_rebuild()
# ... and so on for all models with forward references or complex nesting.
# For Pydantic V2, this is often not necessary if types are hinted correctly.
