# Bibliodex - Backend

Esta é a API backend para o sistema Bibliodex, desenvolvida com FastAPI (Python).

## Funcionalidades Principais

*   **Endpoints CRUD:** Para todas as entidades principais: Livros, Autores, Categorias, Exemplares, Usuários, Funcionários, Empréstimos, Reservas, Devoluções.
*   **Autenticação:** Sistema de login baseado em JWT (JSON Web Tokens) para usuários e funcionários. Geração de access tokens e refresh tokens.
*   **Autorização:** Proteção de rotas baseada no papel do usuário autenticado (ex: apenas funcionários podem acessar certas rotas de gerenciamento).
*   **Validação de Dados:** Uso de Pydantic para validação de entrada e serialização de saída.
*   **ORM:** SQLAlchemy para interação com o banco de dados PostgreSQL.
*   **Documentação Automática da API:** Swagger UI e ReDoc disponíveis.

## Documentação da API

Após iniciar a aplicação, a documentação interativa da API (Swagger UI) estará disponível em:
[http://localhost:8000/docs](http://localhost:8000/docs)

A documentação alternativa (ReDoc) estará disponível em:
[http://localhost:8000/redoc](http://localhost:8000/redoc)

## Variáveis de Ambiente

As seguintes variáveis de ambiente são importantes para a configuração do backend:

*   `DATABASE_URL`: String de conexão com o banco de dados PostgreSQL.
    *   Exemplo: `postgresql://bibliodex_user:bibliodex_password@db:5432/bibliodex_db` (usado no `docker-compose.yml`)
*   `SECRET_KEY`: Chave secreta para a codificação e decodificação de tokens JWT. **Deve ser longa, complexa e mantida em segredo em produção.**
*   `ALLOWED_ORIGINS`: Lista de origens CORS permitidas (separadas por vírgula).
    *   Exemplo: `http://localhost:3001,http://127.0.0.1:3001`

Para desenvolvimento local (fora do Docker), você pode criar um arquivo `.env` na raiz da pasta `backend/` para definir essas variáveis.

## Como Executar (via Docker Compose)

As instruções para executar o backend como parte do sistema completo estão no [README principal do projeto](../README.md).

## Desenvolvimento Local (Fora do Docker)

1.  **Navegue até o diretório do backend:**
    ```bash
    cd backend
    ```
2.  **Crie e ative um ambiente virtual (recomendado):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # Linux/macOS
    # venv\Scripts\activate    # Windows
    ```
3.  **Instale as dependências:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz da pasta `backend/` com o conteúdo necessário (veja a seção "Variáveis de Ambiente"). Certifique-se de que o PostgreSQL esteja acessível conforme a `DATABASE_URL` configurada.

5.  **Execute o servidor de desenvolvimento Uvicorn:**
    A partir da pasta `backend/`:
    ```bash
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```
    A API estará disponível em `http://localhost:8000`.

## Estrutura dos Módulos Principais (dentro de `backend/app/`)

*   `main.py`: Ponto de entrada da aplicação FastAPI, configuração de routers e CORS.
*   `database.py`: Configuração da sessão do banco de dados e motor SQLAlchemy.
*   `models.py`: Definições dos modelos de dados SQLAlchemy.
*   `schemas.py`: Definições dos schemas Pydantic para validação e serialização.
*   `crud.py`: Funções de Create, Read, Update, Delete para interagir com o banco de dados.
*   `security.py`: Funções relacionadas à segurança, como hashing de senhas e manipulação de JWT.
*   `routers/`: Contém os módulos que definem os endpoints da API para cada recurso (ex: `livros.py`, `usuarios.py`, `auth.py`).
