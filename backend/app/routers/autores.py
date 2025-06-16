from fastapi import APIRouter

router = APIRouter(
    prefix="/autores",
    tags=["Autores"]
)

# Exemplo de rota (você pode expandir depois)
@router.get("/")
def listar_autores():
    return {"message": "Rota de autores funcionando"}
