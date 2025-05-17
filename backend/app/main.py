from fastapi import FastAPI
from app.routers import livros

app = FastAPI(title="Bibliodex API")

app.include_router(livros.router, prefix="/livros", tags=["Livros"])

@app.get("/")
def read_root():
    return {"msg": "Bem-vindo à API do Bibliodex"}

