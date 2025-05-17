from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def listar_livros():
    return [{"id": 1, "titulo": "Dom Casmurro"}]

