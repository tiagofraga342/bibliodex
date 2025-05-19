from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.database import get_db
import app.crud as crud

router = APIRouter()

@router.get("/", response_model=List[dict])
def listar_reservas(db = Depends(get_db)):
    try:
        reservas = crud.get_reservas(db)
        if not isinstance(reservas, list):
            print(f"Resposta inesperada de get_reservas: {type(reservas)} {reservas}")
            return []
        return reservas
    except Exception as e:
        print(f"Erro ao listar reservas: {e}")
        return []

# ...outros endpoints de reserva podem ser adicionados aqui...
