from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import livros, categorias, usuarios, emprestimos, reservas

app = FastAPI(title="Bibliodex API")

# Adicionando CORS para permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(livros.router, prefix="/livros", tags=["Livros"])
app.include_router(categorias.router)
app.include_router(usuarios.router, prefix="/usuarios", tags=["Usuários"])
app.include_router(emprestimos.router, prefix="/emprestimos", tags=["Empréstimos"])
app.include_router(reservas.router, prefix="/reservas", tags=["Reservas"])

@app.get("/")
def read_root():
    return {"msg": "Bem-vindo à API do Bibliodex"}

