from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def listar_livros():
    return [
        {"id": 1, "titulo": "Dom Casmurro", "autor": "Machado de Assis"},
        {"id": 2, "titulo": "O Cortiço", "autor": "Aluísio Azevedo"},
        {"id": 3, "titulo": "Memórias Póstumas de Brás Cubas", "autor": "Machado de Assis"}
    ]

