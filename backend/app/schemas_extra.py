from .schemas import ExemplarReadBasic, LivroReadBasic
from typing import Optional
from datetime import date

class ExemplarWithDevolucao(ExemplarReadBasic):
    data_prevista_devolucao: Optional[date] = None

    class Config:
        orm_mode = True

ExemplarWithDevolucao.model_rebuild()
