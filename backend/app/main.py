from fastapi import FastAPI
from app.routers import livros, categorias

app = FastAPI(title="Bibliodex API")

app.include_router(livros.router, prefix="/livros", tags=["Livros"])
app.include_router(categorias.router)

@app.get("/")
def root():
    return {"message": "Bem-vindo à API do Bibliodex"}
