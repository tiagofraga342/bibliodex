from fastapi import Depends, HTTPException, status, APIRouter # Added APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm # Added OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from typing import Annotated # Para Python 3.9+
from datetime import timedelta
import logging # Import logging


from app import schemas, models, crud, security 

from app.database import get_db

router = APIRouter(tags=["Autenticação"]) # Define router for auth endpoints

# Define o scheme OAuth2, apontando para o endpoint de login/token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

logger = logging.getLogger(__name__) # Logger para este módulo


# Exceção padrão para credenciais inválidas
credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Não foi possível validar as credenciais",
    headers={"WWW-Authenticate": "Bearer"},
)

# Exceção para permissão negada (papel incorreto)
permission_denied_exception = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Permissão negada",
)


# Passo 1.1: Dependência principal para obter dados do token
async def get_current_user_data(
    token: Annotated[str, Depends(oauth2_scheme)],
) -> schemas.TokenData:
    """
    Decodifica e valida o token JWT.
    Retorna os dados do payload do token (schemas.TokenData).
    Lança HTTPException se o token for inválido.
    """
    try:
        payload = security.decode_and_validate_token(token)
        username: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        role: str = payload.get("role")
        # Checagem redundante, mas garante robustez
        if username is None or user_id is None or role is None:
            logger.warning(f"Token inválido ou incompleto recebido: {token[:20]}...")
            raise credentials_exception
        token_data = schemas.TokenData(sub=username, user_id=user_id, role=role)
    except Exception as e:
        logger.warning(f"Erro ao decodificar/validar token JWT: {e} - Token: {token[:20]}...")
        raise credentials_exception
    return token_data


# Passo 1.2: Dependência para obter o Funcionário ativo atual
async def get_current_active_funcionario(
    token_data: Annotated[schemas.TokenData, Depends(get_current_user_data)],
    db: Annotated[Session, Depends(get_db)]
) -> models.Funcionario:
    """
    Verifica se o token pertence a um Funcionário, busca o funcionário no banco
    e verifica se ele está ativo.
    Retorna o objeto models.Funcionario.
    Lança HTTPException se o papel for incorreto, funcionário não encontrado ou inativo.
    """
    if token_data.role != "funcionario":
        logger.warning(f"Tentativa de acesso à rota de funcionário com papel '{token_data.role}' para sub '{token_data.sub}'.")
        raise permission_denied_exception # Papel incorreto

    # A matrícula funcional está no campo 'sub' do token_data
    funcionario = crud.get_funcionario_by_matricula_funcional(db, matricula_funcional=token_data.sub)
    
    if funcionario is None:
        logger.warning(f"Funcionário com matrícula '{token_data.sub}' (do token) não encontrado no banco.")
        raise credentials_exception # Funcionário não encontrado (token pode ser válido, mas o usuário não existe mais)
    if not funcionario.is_active:
        logger.warning(f"Funcionário '{funcionario.matricula_funcional}' (ID: {funcionario.id_funcionario}) está inativo.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Funcionário inativo")
    
    logger.debug(f"Funcionário ativo '{funcionario.matricula_funcional}' autenticado via token.")
    return funcionario


# Passo 1.3: Dependência para obter o Usuário (cliente) ativo atual
async def get_current_active_usuario_cliente(
    token_data: Annotated[schemas.TokenData, Depends(get_current_user_data)],
    db: Annotated[Session, Depends(get_db)]
) -> models.Usuario:
    """
    Verifica se o token pertence a um Usuário (cliente), busca o usuário no banco
    e verifica se ele está ativo.
    Retorna o objeto models.Usuario.
    Lança HTTPException se o papel for incorreto, usuário não encontrado ou inativo.
    """
    if token_data.role != "usuario_cliente":
        logger.warning(f"Tentativa de acesso à rota de usuário cliente com papel '{token_data.role}' para sub '{token_data.sub}'.")
        raise permission_denied_exception # Papel incorreto

    # A matrícula do usuário está no campo 'sub' do token_data
    usuario = crud.get_usuario_by_matricula(db, matricula=token_data.sub)

    if usuario is None:
        logger.warning(f"Usuário com matrícula '{token_data.sub}' (do token) não encontrado no banco.")
        raise credentials_exception # Usuário não encontrado
    if not usuario.is_active:
        logger.warning(f"Usuário '{usuario.matricula}' (ID: {usuario.id_usuario}) está inativo.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário inativo")
        
    logger.debug(f"Usuário cliente ativo '{usuario.matricula}' autenticado via token.")
    return usuario

# Dependência para obter o usuário autenticado (funcionário OU cliente)
async def get_current_user(
    token_data: Annotated[schemas.TokenData, Depends(get_current_user_data)],
    db: Annotated[Session, Depends(get_db)]
) -> models.Usuario | models.Funcionario:
    """
    Retorna o usuário autenticado (funcionário ou cliente), validando se está ativo.
    Lança HTTPException se não encontrado ou inativo.
    """
    if token_data.role == "funcionario":
        funcionario = crud.get_funcionario_by_matricula_funcional(db, matricula_funcional=token_data.sub)
        if funcionario is None:
            logger.warning(f"Funcionário com matrícula '{token_data.sub}' não encontrado.")
            raise credentials_exception
        if not funcionario.is_active:
            logger.warning(f"Funcionário '{funcionario.matricula_funcional}' está inativo.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Funcionário inativo")
        # Adiciona atributo de role para facilitar uso posterior
        funcionario.role = "funcionario"
        return funcionario
    elif token_data.role == "usuario_cliente":
        usuario = crud.get_usuario_by_matricula(db, matricula=token_data.sub)
        if usuario is None:
            logger.warning(f"Usuário com matrícula '{token_data.sub}' não encontrado.")
            raise credentials_exception
        if not usuario.is_active:
            logger.warning(f"Usuário '{usuario.matricula}' está inativo.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário inativo")
        usuario.role = "usuario_cliente"
        return usuario
    else:
        logger.warning(f"Papel desconhecido no token: {token_data.role}")
        raise permission_denied_exception


# --- Endpoints de Autenticação ---

@router.post("/auth/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], 
    db: Annotated[Session, Depends(get_db)]
):
    logger.info(f"Tentativa de login para username: {form_data.username}")
    # Tenta autenticar como Funcionário primeiro
    funcionario = crud.get_funcionario_by_matricula_funcional(db, matricula_funcional=form_data.username)
    if funcionario and security.verify_password(form_data.password, funcionario.hashed_password):
        if not funcionario.is_active:
            logger.warning(f"Tentativa de login falhou para funcionário inativo: {form_data.username}")
            raise HTTPException(status_code=400, detail="Funcionário inativo")
        access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(days=security.REFRESH_TOKEN_EXPIRE_DAYS)
        access_token = security.create_access_token(
            data={"sub": funcionario.matricula_funcional, "user_id": funcionario.id_funcionario, "role": "funcionario"},
            expires_delta=access_token_expires
        )
        refresh_token = security.create_refresh_token(
            data={"sub": funcionario.matricula_funcional, "user_id": funcionario.id_funcionario, "role": "funcionario"},
            expires_delta=refresh_token_expires
        )
        logger.info(f"Login bem-sucedido para funcionário: {form_data.username}")
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

    # Se não for Funcionário, tenta autenticar como Usuário (cliente)
    usuario = crud.get_usuario_by_matricula(db, matricula=form_data.username)
    if usuario and security.verify_password(form_data.password, usuario.hashed_password):
        if not usuario.is_active:
            logger.warning(f"Tentativa de login falhou para usuário inativo: {form_data.username}")
            raise HTTPException(status_code=400, detail="Usuário inativo")
        access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(days=security.REFRESH_TOKEN_EXPIRE_DAYS)
        access_token = security.create_access_token(
            data={"sub": usuario.matricula, "user_id": usuario.id_usuario, "role": "usuario_cliente"},
            expires_delta=access_token_expires
        )
        refresh_token = security.create_refresh_token(
            data={"sub": usuario.matricula, "user_id": usuario.id_usuario, "role": "usuario_cliente"},
            expires_delta=refresh_token_expires
        )
        logger.info(f"Login bem-sucedido para usuário cliente: {form_data.username}")
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}
    
    logger.warning(f"Tentativa de login falhou para username: {form_data.username} - Matrícula ou senha incorreta.")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Matrícula ou senha incorreta",
        headers={"WWW-Authenticate": "Bearer"},
    )


@router.post("/auth/refresh_token", response_model=schemas.Token)
async def refresh_access_token(refresh_token: str):
    """
    Recebe um refresh_token, valida, e retorna novo access_token e refresh_token.
    """
    from app import security
    try:
        payload = security.decode_refresh_token(refresh_token)
        # Gera novos tokens (rotação de refresh token)
        access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(days=security.REFRESH_TOKEN_EXPIRE_DAYS)
        access_token = security.create_access_token(
            data={"sub": payload["sub"], "user_id": payload["user_id"], "role": payload["role"]},
            expires_delta=access_token_expires
        )
        new_refresh_token = security.create_refresh_token(
            data={"sub": payload["sub"], "user_id": payload["user_id"], "role": payload["role"]},
            expires_delta=refresh_token_expires
        )
        logger.info(f"Refresh token bem-sucedido para sub: {payload['sub']}")
        return {"access_token": access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}
    except Exception as e:
        logger.warning(f"Falha ao usar refresh_token: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido ou expirado")
