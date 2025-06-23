from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os # Import os to access environment variables
import logging # Import logging
import time # For request timing

# Ajuste: todos os imports de routers no topo
from app.routers import livros, categorias, usuarios, emprestimos, reservas, auth, funcionarios, devolucoes, autores, exemplares, cursos
from app import models # To create tables if needed
from app.database import engine # Import engine if you uncomment create_all

# Create database tables (Only for development/initial setup if not using Alembic)
# models.Base.metadata.create_all(bind=engine)

# --- Logging Configuration ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(module)s - %(funcName)s - line %(lineno)d - %(message)s",
    handlers=[
        logging.StreamHandler() # Logs to console
        # You can add logging.FileHandler("app.log") here to log to a file
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Bibliodex API")

# --- Exception Handlers ---
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(
        f"HTTPException: {exc.status_code} {exc.detail} "
        f"for {request.method} {request.url}"
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers,
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_messages = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error['loc'])
        message = error['msg']
        error_messages.append(f"Field '{field}': {message}")
    logger.error(
        f"RequestValidationError: {error_messages} "
        f"for {request.method} {request.url} - Body: {await request.body()}"
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Erro de validação", "errors": exc.errors()},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception(
        f"UnhandledException: {exc} for {request.method} {request.url}"
    )  # Logs stack trace
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Ocorreu um erro interno no servidor."},
    )

# --- Request Logging Middleware ---
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    client_host = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    logger.info(
        f"Requisição recebida: {request.method} {request.url} | IP: {client_host} | User-Agent: {user_agent}"
    )
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(
            f"Requisição finalizada: {request.method} {request.url} | Status: {response.status_code} | "
            f"IP: {client_host} | User-Agent: {user_agent} | Duração: {process_time:.4f}s"
        )
    except Exception as e:
        process_time = time.time() - start_time
        logger.exception(
            f"Erro durante a requisição: {request.method} {request.url} | IP: {client_host} | "
            f"User-Agent: {user_agent} | Duração: {process_time:.4f}s"
        )
        raise e
    return response

# Adicionando CORS para permitir requisições do frontend
# Carregar origens permitidas a partir de uma variável de ambiente
# Ajuste o fallback para incluir http://localhost:3000 e http://127.0.0.1:3000
allowed_origins_str = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
)
allowed_origins_list = [origin.strip() for origin in allowed_origins_str.split(',') if origin.strip()]

# Se a lista estiver vazia após o processamento (ex: env var não definida ou vazia),
# pode-se definir um padrão mais restritivo ou levantar um erro.
# Por segurança, evite ["*"] com allow_credentials=True em produção.
if not allowed_origins_list:
    # Fallback para um valor padrão seguro ou levantar um erro de configuração
    # Aqui, estamos definindo um placeholder que deve ser configurado.
    # Em um cenário real, você pode querer que a aplicação não inicie sem essa configuração.
    print("AVISO: Nenhuma origem CORS configurada via ALLOWED_ORIGINS. Usando placeholder. Configure para produção.")
    allowed_origins_list = ["https://your-production-frontend-url.com"] # Substitua pela URL do seu frontend

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins_list, # Use a lista de origens configurada
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router) 
app.include_router(livros.router, prefix="/livros", tags=["Livros"])
app.include_router(categorias.router, prefix="/categorias", tags=["Categorias"])
app.include_router(usuarios.router, prefix="/usuarios", tags=["Usuários"])
app.include_router(emprestimos.router, prefix="/emprestimos", tags=["Empréstimos"])
app.include_router(reservas.router, prefix="/reservas", tags=["Reservas"])
app.include_router(funcionarios.router, prefix="/funcionarios", tags=["Funcionários"])
app.include_router(devolucoes.router)
app.include_router(autores.router, prefix="/autores", tags=["Autores"])
app.include_router(exemplares.router, prefix="/exemplares", tags=["Exemplares"])
app.include_router(cursos.router, prefix="/cursos", tags=["Cursos"])
# ... include other routers for Funcionario, Devolucao, Penalidade, Curso

@app.get("/")
def read_root():
    return {"msg": "Bem-vindo à API do Bibliodex"}

@app.on_event("startup")
async def startup_event():
    logger.info("Aplicação Bibliodex iniciada.")
    # RECOMENDAÇÃO: Use Alembic para migrações em produção!
    # Para desenvolvimento/local, descomente a linha abaixo para criar as tabelas automaticamente:
    # try:
    #     models.Base.metadata.create_all(bind=engine)
    #     logger.info("Tabelas do banco de dados verificadas/criadas.")
    # except Exception as e:
    #     logger.error(f"Erro ao criar tabelas do banco de dados: {e}")


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
