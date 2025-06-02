from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Adjust imports based on your project structure
# Assuming routers are in 'app.routers' and crud, models, schemas, database are in 'app'
from app.routers import livros, categorias, usuarios, emprestimos, reservas # Add other routers as you create them
from app.database import engine, get_db # get_db now yields SQLAlchemy session
from app import models # To create tables if needed

# Create database tables (Only for development/initial setup if not using Alembic)
# models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bibliodex API")

# Adicionando CORS para permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Configure as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
# Ensure your router files (e.g., app/routers/categorias.py) are updated to use
# db: Session = Depends(get_db) and return SQLAlchemy models
# which will be automatically converted by Pydantic response_model.

app.include_router(livros.router, prefix="/livros", tags=["Livros"])
app.include_router(categorias.router, prefix="/categorias", tags=["Categorias"]) # Added prefix and tags for consistency
app.include_router(usuarios.router, prefix="/usuarios", tags=["Usuários"])
app.include_router(emprestimos.router, prefix="/emprestimos", tags=["Empréstimos"])
app.include_router(reservas.router, prefix="/reservas", tags=["Reservas"])
# app.include_router(autores.router, prefix="/autores", tags=["Autores"])
# app.include_router(exemplares.router, prefix="/exemplares", tags=["Exemplares"])
# ... include other routers for Funcionario, Devolucao, Penalidade, Curso

@app.get("/")
def read_root():
    return {"msg": "Bem-vindo à API do Bibliodex"}

# Example of how a path operation in a router file (e.g., routers/categorias.py) would look:
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas, models
from app.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.CategoriaRead)
def create_categoria_endpoint(categoria: schemas.CategoriaCreate, db: Session = Depends(get_db)):
    db_categoria_check = db.query(models.Categoria).filter(models.Categoria.nome == categoria.nome).first()
    if db_categoria_check:
        raise HTTPException(status_code=400, detail="Nome da categoria já existe")
    return crud.create_categoria(db=db, categoria=categoria)

@router.get("/", response_model=List[schemas.CategoriaRead])
def read_categorias_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    categorias_list = crud.get_categorias(db, skip=skip, limit=limit)
    return categorias_list

@router.get("/{categoria_id}", response_model=schemas.CategoriaRead)
def read_categoria_endpoint(categoria_id: int, db: Session = Depends(get_db)):
    db_categoria = crud.get_categoria(db, categoria_id=categoria_id)
    if db_categoria is None:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return db_categoria
"""
