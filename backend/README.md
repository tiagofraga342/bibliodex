# Bibliodex Backend API

Este é o backend da aplicação Bibliodex, construído com FastAPI, Python, SQLAlchemy e PostgreSQL. Ele fornece uma API RESTful para gerenciar livros, usuários, empréstimos, reservas e outras funcionalidades do sistema de biblioteca.

## ✨ Funcionalidades

- Gerenciamento completo de CRUD para Livros, Autores, Categorias, Usuários, Funcionários, Exemplares, Empréstimos, Reservas, Devoluções e Penalidades.
- Autenticação baseada em JWT (JSON Web Tokens) para Usuários e Funcionários.
- Autorização baseada em papéis (usuário cliente, funcionário).
- Validação de dados robusta utilizando Pydantic.
- Logging centralizado para rastreamento de requisições e erros.
- Tratamento de exceções global.
- Configuração de CORS para permitir requisições do frontend.
- Suporte a Docker para fácil implantação.

## 🛠️ Tecnologias Utilizadas

- **Python 3.11+**
- **FastAPI**: Framework web moderno e de alta performance.
- **SQLAlchemy**: ORM para interação com o banco de dados.
- **Pydantic**: Validação de dados e gerenciamento de configurações.
- **PostgreSQL**: Banco de dados relacional.
- **Uvicorn & Gunicorn**: Servidores ASGI.
- **Docker**: Containerização da aplicação.
- **Alembic**: (Recomendado para) Gerenciamento de migrações de banco de dados.
- **python-jose & passlib**: Para JWT e hashing de senhas.

## ⚙️ Configuração e Execução

### Pré-requisitos

- Python 3.11 ou superior
- Docker (opcional, para execução em container)
- PostgreSQL Server

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do diretório `backend` (ou configure as variáveis diretamente no seu ambiente) com as seguintes variáveis:

```env
DATABASE_URL="postgresql://user:password@host:port/dbname"
SECRET_KEY="sua_chave_secreta_super_segura_para_jwt"
ALLOWED_ORIGINS="http://localhost:3000,https://seu-frontend-em-producao.com"
# Para Alembic (se utilizado):
# ALEMBIC_DATABASE_URL=${DATABASE_URL}
```

- `DATABASE_URL`: String de conexão para o banco de dados PostgreSQL.
- `SECRET_KEY`: Chave secreta para codificar e decodificar os tokens JWT. Use um valor longo e aleatório.
- `ALLOWED_ORIGINS`: Lista separada por vírgulas das URLs de origem permitidas para CORS.

### 1. Executando com Docker (Recomendado para Produção/Simplicidade)

1.  **Construa a imagem Docker:**
    ```bash
    docker build -t bibliodex-backend .
    ```

2.  **Execute o container:**
    Substitua os placeholders pelas suas variáveis de ambiente.
    ```bash
    docker run -d -p 8000:8000 \
      -e DATABASE_URL="postgresql://bibliodex:bibliodex@localhost:5432/bibliodex_db" \
      -e SECRET_KEY="sua_chave_secreta_aqui" \
      -e ALLOWED_ORIGINS="http://localhost:3000" \
      --name bibliodex-backend-container \
      bibliodex-backend
    ```
    (Ajuste `localhost` no `DATABASE_URL` para o IP do host da máquina Docker se o PostgreSQL estiver rodando fora de um container na mesma rede Docker, ou use `host.docker.internal` em alguns sistemas).

### 2. Executando Localmente (Para Desenvolvimento)

1.  **Crie e ative um ambiente virtual:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # No Windows: venv\Scripts\activate
    ```

2.  **Instale as dependências:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configure as variáveis de ambiente** (conforme descrito acima, pode ser exportando-as no terminal ou usando um arquivo `.env` com `python-dotenv` se adicionado ao projeto).

4.  **(Opcional/Recomendado) Execute as migrações do banco de dados (se estiver usando Alembic):**
    ```bash
    # alembic upgrade head
    ```
    Se não estiver usando Alembic, as tabelas podem ser criadas pela aplicação na primeira execução se `models.Base.metadata.create_all(bind=engine)` estiver habilitado em `main.py` ou `database.py` (geralmente para desenvolvimento).

5.  **Inicie o servidor de desenvolvimento Uvicorn:**
    A partir do diretório `backend/`:
    ```bash
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ```

## 📖 Documentação da API

Com o servidor em execução, a documentação interativa da API (Swagger UI) estará disponível em:
`http://localhost:8000/docs`

E a documentação alternativa (ReDoc) em:
`http://localhost:8000/redoc`

## 🏗️ Estrutura do Projeto

```
backend/
├── app/
│   ├── __init__.py
│   ├── crud.py           # Funções de Create, Read, Update, Delete
│   ├── database.py       # Configuração da conexão com o banco
│   ├── main.py           # Ponto de entrada da aplicação FastAPI
│   ├── models.py         # Modelos SQLAlchemy (tabelas do banco)
│   ├── schemas.py        # Schemas Pydantic (validação de dados da API)
│   ├── security.py       # Funções de segurança (hashing, JWT)
│   └── routers/          # Módulos com os endpoints da API
│       ├── __init__.py
│       ├── auth.py
│       ├── livros.py
│       └── ...           # Outros routers
├── tests/                # Testes da aplicação (pytest)
├── alembic/              # (Se usado) Configurações e migrações Alembic
├── alembic.ini           # (Se usado) Configuração do Alembic
├── Dockerfile            # Define a imagem Docker para o backend
├── requirements.txt      # Dependências Python
└── README.md             # Este arquivo
```

## 📝 Logging

A aplicação utiliza o módulo `logging` do Python. Os logs são configurados em `app/main.py` e exibidos no console. Em produção, considere configurar handlers para arquivos ou serviços de logging centralizado.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.
