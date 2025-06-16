import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError, JWTError as JoseJWTError
from passlib.context import CryptContext

# --- Configuração para Hashing de Senhas (Passo 1.1) ---
# Define os esquemas de hashing. bcrypt é o recomendado.
# "deprecated="auto"" significa que hashes antigos (se você mudar os esquemas) ainda podem ser verificados.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --- Funções de Senha (Passos 1.2 e 1.3) ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha em texto plano corresponde à senha hasheada."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Gera o hash de uma senha."""
    return pwd_context.hash(password)


# --- Configuração para Tokens JWT (Passo 2.1) ---

# IMPORTANTE: Esta chave deve ser secreta e complexa!
# Em produção, NUNCA deixe a chave no código. Carregue-a de uma variável de ambiente.
# Exemplo de como gerar uma chave secreta forte no terminal:
# openssl rand -hex 32
SECRET_KEY = os.getenv("SECRET_KEY", "sua_chave_secreta_super_dificil_de_adivinhar_e_bem_longa_aqui_por_seguranca")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # O token de acesso expira em 30 minutos
REFRESH_TOKEN_EXPIRE_DAYS = 7  # Refresh token expira em 7 dias


# --- Função para Criar Token JWT (Passo 2.2) ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Cria um novo token de acesso JWT.

    :param data: Dados a serem incluídos no payload do token (ex: 'sub', 'role').
    :param expires_delta: Tempo de vida opcional para o token. Se não fornecido,
                          usa ACCESS_TOKEN_EXPIRE_MINUTES.
    :return: O token JWT codificado como string.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    # Opcional: Adicionar o campo "iat" (issued at - momento da emissão)
    # to_encode.update({"iat": datetime.now(timezone.utc)})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Cria um novo refresh token JWT.

    :param data: Dados a serem incluídos no payload do token (ex: 'sub', 'role').
    :param expires_delta: Tempo de vida opcional para o refresh token.
    :return: O refresh token JWT codificado como string.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_refresh_token(token: str) -> dict:
    """
    Decodifica e valida um refresh token JWT.
    Lança JWTError se inválido/expirado.
    Garante que o campo "type" seja "refresh".
    """
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("type") != "refresh":
        raise JWTError("Token não é um refresh token válido.")
    return payload

def decode_and_validate_token(token: str) -> dict:
    """
    Decodifica e valida um token JWT de acesso.
    - Verifica assinatura, expiração e formato.
    - Lança JWTError se inválido/expirado.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Verificação extra de campos obrigatórios (sub, user_id, role)
        if not all(k in payload for k in ("sub", "user_id", "role")):
            raise JoseJWTError("Payload do token JWT está incompleto.")
        return payload
    except ExpiredSignatureError:
        raise JoseJWTError("Token JWT expirado.")
    except JoseJWTError as e:
        raise JoseJWTError(f"Token JWT inválido: {e}")

# Nota sobre Passo 2.3 (Decodificação e Validação de Token):
# A funcionalidade para decodificar e validar tokens JWT será implementada
# na Fase 4, como parte das dependências de autorização do FastAPI.
# Por enquanto, temos apenas a criação de tokens.
