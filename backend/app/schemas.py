from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import Optional, List
from datetime import date

# --- Schemas de Autenticação (Passo 3.3) ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    sub: str # 'subject', normalmente o username (matrícula ou matrícula_funcional)
    user_id: Optional[int] = None
    role: Optional[str] = None # 'usuario_cliente' ou 'funcionario'

class UserLogin(BaseModel): # Para login de Usuário (cliente)
    matricula: str
    password: str

class FuncionarioLogin(BaseModel): # Para login de Funcionário
    matricula_funcional: str
    password: str

# --- Schemas Existentes Atualizados ---

# --- Autor Schemas ---
class AutorBase(BaseModel):
    nome: str
    ano_nasc: Optional[int] = None

class AutorCreate(AutorBase):
    pass

class AutorReadBasic(AutorBase):
    id_autor: int
    model_config = ConfigDict(from_attributes=True)

# --- Categoria Schemas ---
class CategoriaBase(BaseModel):
    nome: str

class CategoriaCreate(CategoriaBase):
    pass

class CategoriaReadBasic(CategoriaBase):
    id_categoria: int
    model_config = ConfigDict(from_attributes=True)

# --- Livro Schemas ---
class LivroBase(BaseModel):
    titulo: str
    ano_publicacao: Optional[int] = None
    status_geral: Optional[str] = Field(None, comment="Status geral do título, ex: ativo, descatalogado")
    id_categoria: int

class LivroCreate(LivroBase):
    ids_autores: Optional[List[int]] = Field(None, description="Lista de IDs de Autores para associar a este livro")

class LivroReadBasic(LivroBase):
    id_livro: int
    model_config = ConfigDict(from_attributes=True)

class LivroRead(LivroBase):
    id_livro: int
    categoria: CategoriaReadBasic
    autores: List[AutorReadBasic] = []
    model_config = ConfigDict(from_attributes=True)

class CategoriaRead(CategoriaBase): # deu problema (internal server error), troquei para CategoriaReadBasic
    id_categoria: int
    livros: List[LivroReadBasic] = []
    model_config = ConfigDict(from_attributes=True)

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

class CursoReadBasic(CursoBase):
    id_curso: int
    model_config = ConfigDict(from_attributes=True)

class CursoRead(CursoBase):
    id_curso: int
    model_config = ConfigDict(from_attributes=True)

# --- Usuario Schemas ---
class UsuarioBase(BaseModel):
    nome: str
    telefone: Optional[str] = None
    matricula: str
    email: Optional[EmailStr] = None # Usando EmailStr para validação de e-mail
    id_curso: Optional[int] = None

class UsuarioCreate(UsuarioBase): # Passo 3.1
    password: str # Campo para receber a senha em texto plano no cadastro

class UsuarioRead(UsuarioBase): # Passo 3.2
    id_usuario: int
    is_active: bool # Decidido incluir is_active na resposta
    curso: Optional[CursoReadBasic] = None
    # hashed_password NÃO é incluído aqui por segurança
    model_config = ConfigDict(from_attributes=True)

class UsuarioReadBasic(UsuarioBase):
    id_usuario: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)


# --- Funcionario Schemas ---
class FuncionarioBase(BaseModel):
    nome: str
    cargo: str
    matricula_funcional: str

class FuncionarioCreate(FuncionarioBase): # Passo 3.1
    password: str # Campo para receber a senha em texto plano no cadastro

class FuncionarioRead(FuncionarioBase): # Passo 3.2
    id_funcionario: int
    is_active: bool # Decidido incluir is_active na resposta
    # hashed_password NÃO é incluído aqui por segurança
    model_config = ConfigDict(from_attributes=True)

class FuncionarioReadBasic(FuncionarioBase):
    id_funcionario: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class FuncionarioUpdate(BaseModel): # Novo schema para atualização
    nome: Optional[str] = None
    cargo: Optional[str] = None
    # matricula_funcional: Optional[str] = None # Geralmente não se permite alterar matrícula
    password: Optional[str] = None # Para permitir atualização de senha
    is_active: Optional[bool] = None
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

class ExemplarUpdate(BaseModel):
    codigo_identificacao: Optional[str] = None
    status: Optional[str] = None
    data_aquisicao: Optional[date] = None
    observacoes: Optional[str] = None
    id_livro: Optional[int] = None

class ExemplarReadBasic(ExemplarBase):
    id_exemplar: int
    model_config = ConfigDict(from_attributes=True)

class ExemplarRead(ExemplarBase):
    id_exemplar: int
    livro: LivroReadBasic
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

class EmprestimoReadBasic(EmprestimoBase):
    id_emprestimo: int
    model_config = ConfigDict(from_attributes=True)

class EmprestimoRead(EmprestimoBase):
    id_emprestimo: int
    usuario: UsuarioReadBasic # Usando a versão básica para evitar muita informação aninhada
    exemplar: ExemplarReadBasic
    funcionario_registro_emprestimo: FuncionarioReadBasic
    model_config = ConfigDict(from_attributes=True)

# --- Reserva Schemas ---
class ReservaBase(BaseModel):
    data_reserva: date
    data_validade_reserva: date
    status: str = Field(default="ativa", comment="Status: ativa, cancelada, expirada, atendida")
    id_exemplar: Optional[int] = None
    id_livro_solicitado: Optional[int] = None
    id_usuario: int
    id_funcionario_registro: Optional[int] = None

class ReservaCreate(ReservaBase):
    pass

class ReservaReadBasic(ReservaBase):
    id_reserva: int
    model_config = ConfigDict(from_attributes=True)

class ReservaRead(ReservaBase):
    id_reserva: int
    usuario: UsuarioReadBasic
    exemplar: Optional[ExemplarReadBasic] = None
    livro: Optional[LivroReadBasic] = None # Corresponde a id_livro_solicitado
    funcionario_registro_reserva: Optional[FuncionarioReadBasic] = None
    model_config = ConfigDict(from_attributes=True)

# --- Devolucao Schemas ---
class DevolucaoBase(BaseModel):
    data_devolucao: date
    observacoes: Optional[str] = None
    id_funcionario_registro: int
    id_emprestimo: int

class DevolucaoCreate(DevolucaoBase):
    pass

class DevolucaoReadBasic(DevolucaoBase):
    id_devolucao: int
    model_config = ConfigDict(from_attributes=True)

class DevolucaoRead(DevolucaoBase):
    id_devolucao: int
    funcionario_registro_devolucao: FuncionarioReadBasic
    emprestimo: EmprestimoReadBasic
    model_config = ConfigDict(from_attributes=True)

# --- Penalidade Schemas ---
class PenalidadeBase(BaseModel):
    tipo_penalidade: str = Field(comment="Ex: multa, suspensao")
    data_inicio: date
    data_fim: Optional[date] = None
    valor_multa: Optional[float] = None
    status: str = Field(default="ativa", comment="Status: ativa, paga, cumprida, cancelada")
    observacoes: Optional[str] = None
    id_usuario: int
    id_emprestimo_origem: Optional[int] = None

class PenalidadeCreate(PenalidadeBase):
    pass

class PenalidadeReadBasic(PenalidadeBase):
    id_penalidade: int
    model_config = ConfigDict(from_attributes=True)

class PenalidadeRead(PenalidadeBase):
    id_penalidade: int
    usuario: UsuarioReadBasic
    emprestimo_relacionado: Optional[EmprestimoReadBasic] = None
    model_config = ConfigDict(from_attributes=True)

# --- Paginação Schemas ---
class PaginatedLivros(BaseModel):
    total: int
    items: List[LivroRead]

