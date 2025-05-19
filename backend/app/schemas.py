from pydantic import BaseModel
from typing import Optional, List

class LivroBase(BaseModel):
    titulo: str
    ano_publicacao: int
    status: str
    id_categoria: int

class LivroCreate(LivroBase):
    pass

class LivroRead(LivroBase):
    id_livro: int

    class Config:
        orm_mode = True
        
class CategoriaBase(BaseModel):
    nome: str

class CategoriaCreate(CategoriaBase):
    pass

class CategoriaRead(CategoriaBase):
    id_categoria: int

    class Config:
        orm_mode = True
