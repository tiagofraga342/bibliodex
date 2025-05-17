# 📚 Bibliodex

**Bibliodex** é um sistema inteligente de gestão de bibliotecas universitárias, desenvolvido como projeto da disciplina de Banco de Dados II do curso de Sistemas de Informação da EACH-USP. Ele permite o controle eficiente de empréstimos, reservas, devoluções e acervos, com foco em **otimização de banco de dados** e **uso crítico de Inteligência Artificial Generativa (IAG)** durante o ciclo de desenvolvimento.

---

## 🚀 Funcionalidades Principais

- 🔍 Consulta de livros por título, autor ou categoria
- 📦 Controle de empréstimos e devoluções
- ⏳ Reservas com verificação de disponibilidade
- 👥 Cadastro e gerenciamento de usuários (alunos, funcionários)
- 📑 Relatórios sobre uso da biblioteca, livros mais emprestados, penalidades
- 🧠 Otimizações aplicadas: índices compostos, views materializadas, particionamento
- 🤖 Uso de IA Generativa (ChatGPT, Copilot) para geração de scripts, testes e tuning

---

## 🧱 Arquitetura do Sistema

- **Frontend**: React.js com Axios para consumo de APIs
- **Backend**: FastAPI (Python) com validações Pydantic
- **Banco de Dados**: PostgreSQL com tuning de desempenho
- **Relatórios**: Metabase integrado ao banco para visualização de dados críticos
- **Ferramentas de IA**: ChatGPT para sugestões de modelagem e código

---

## 🗃️ Modelo de Dados

O banco de dados foi estruturado com base na normalização e foco em consultas otimizadas. Ele inclui ao menos 10 tabelas principais:

- `usuario`, `livro`, `autor`, `categoria`, `emprestimo`, `reserva`, `devolucao`, `penalidade`, `funcionario`, `curso`

Com as seguintes otimizações:
- Índices compostos (`livro(titulo, id_categoria)`, `emprestimo(id_usuario, data_emprestimo)`)
- Views materializadas (livros disponíveis, histórico do usuário)
- Particionamento por semestre (`emprestimo`)
- Uso de `EXPLAIN ANALYZE` para tuning das principais queries

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

### Créditos
- Tiago Lima Fraga
- Giovana Couto
- Luan Pinheiro
- Andre Palacio
