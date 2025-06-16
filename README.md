# 📚 Bibliodex - Sistema de Gerenciamento de Biblioteca

**Bibliodex** é um sistema inteligente e completo para gerenciamento de bibliotecas universitárias, permitindo o controle eficiente de empréstimos, reservas, devoluções e acervos. Desenvolvido como projeto da disciplina de Banco de Dados II do curso de Sistemas de Informação da EACH-USP, o sistema foca em **otimização de banco de dados** e **uso crítico de Inteligência Artificial Generativa (IAG)** durante o ciclo de desenvolvimento.

---

## 🚀 Funcionalidades Principais

- 🔍 Consulta de livros por título, autor ou categoria
- 📦 Controle de empréstimos e devoluções
- ⏳ Reservas com verificação de disponibilidade
- 👥 Cadastro e gerenciamento de usuários (alunos, funcionários) com autenticação e autorização baseadas em JWT
- 📑 Relatórios sobre uso da biblioteca, livros mais emprestados, penalidades
- 🛡️ API robusta com logging detalhado e tratamento de erros centralizado
- 🐳 Backend containerizado com Docker para fácil implantação e escalabilidade
- 🧠 Otimizações aplicadas: índices compostos, views materializadas, particionamento
- 🤖 Uso de IA Generativa (ChatGPT, Copilot) para geração de scripts, testes e tuning

---

## 🧱 Arquitetura do Sistema

- **Frontend**: React.js (Next.js) para uma interface de usuário moderna e responsiva.
- **Backend**: FastAPI (Python) utilizando SQLAlchemy para ORM, Pydantic para validação de dados, e JWT para autenticação segura.
- **Banco de Dados**: PostgreSQL, otimizado para desempenho e consultas complexas.
- **Containerização**: Docker para empacotar e executar o ambiente backend de forma consistente.
- **Relatórios**: Metabase integrado ao banco para visualização de dados críticos.
- **Ferramentas de IA**: ChatGPT para sugestões de modelagem e código, GitHub Copilot para assistência no desenvolvimento.

---

## 📊 IA Generativa no Projeto

Durante o desenvolvimento, utilizamos **IA Generativa** em diversas etapas:

| Etapa                         | Uso de IA                                                  |
|------------------------------|-------------------------------------------------------------|
| Modelagem do banco           | Sugestões de DER e normalização com ChatGPT                |
| Geração de código SQL        | DDL/DML otimizados gerados e revisados com Copilot         |
| Plano de testes              | Criação de cenários e dados fictícios com IA               |
| Otimizações                  | Análise de EXPLAIN e sugestões de índices via ChatGPT      |
| Documentação                 | Escrita colaborativa de README, comentários e relatórios   |

---

## 🚀 Como Executar o Projeto

1.  **Clone o repositório:**
    ```bash
    git clone <url-do-repositorio>
    cd bibliodex
    ```

2.  **Variáveis de Ambiente (Backend):**
    *   No diretório `backend/`, se necessário, crie um arquivo `.env` baseado em um exemplo (se houver) ou configure as variáveis diretamente no `docker-compose.yml` se preferir para desenvolvimento. As chaves importantes são `DATABASE_URL` (já configurada para o serviço `db` no Docker Compose) e `SECRET_KEY` para JWT.
    *   **Importante:** Para produção, a `SECRET_KEY` deve ser forte e única.

3.  **Inicialização do Banco de Dados:**
    *   O arquivo `init.sql` na raiz do projeto será executado automaticamente na primeira vez que o contêiner do banco de dados (`db`) for iniciado, criando as tabelas necessárias.

4.  **Suba os contêineres com Docker Compose:**
    Na raiz do projeto (`bibliodex/`), execute:
    ```bash
    docker-compose up --build
    ```
    *   O `--build` é recomendado na primeira vez ou após alterações nos Dockerfiles.

5.  **Acesso às Aplicações:**
    *   **Frontend:** [http://localhost:3001](http://localhost:3001)
    *   **Backend API (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Créditos
- Tiago Lima Fraga
- Giovana Couto
- Luan Pinheiro
- Andre Palacio
