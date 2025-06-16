# Esquema do Banco de Dados - Bibliodex

Este documento detalha as entidades (tabelas) do banco de dados do sistema Bibliodex, seus atributos e os relacionamentos entre elas.

## Entidades Principais

### 1. `Livro`
Armazena informações sobre os títulos dos livros.

**Atributos:**
*   `id_livro` (INTEGER, PK): Identificador único do livro.
*   `titulo` (VARCHAR): Título do livro.
*   `ano_publicacao` (INTEGER, NULLABLE): Ano de publicação do livro.
*   `status_geral` (VARCHAR, NULLABLE): Status geral do título (ex: "ativo", "descatalogado").
*   `id_categoria` (INTEGER, FK): Chave estrangeira para `Categoria.id_categoria`.

**Relacionamentos:**
*   **Categoria:** Muitos para Um com `Categoria` (um livro pertence a uma categoria).
*   **Autores:** Muitos para Muitos com `Autor` (um livro pode ter vários autores, e um autor pode ter escrito vários livros). A tabela de associação é `escrito_por`.
*   **Exemplares:** Um para Muitos com `Exemplar` (um livro pode ter vários exemplares).
*   **Reservas Solicitadas:** Um para Muitos com `Reserva` (um livro pode ser solicitado em várias reservas genéricas).

---

### 2. `Autor`
Armazena informações sobre os autores dos livros.

**Atributos:**
*   `id_autor` (INTEGER, PK): Identificador único do autor.
*   `nome` (VARCHAR): Nome do autor.
*   `ano_nasc` (INTEGER, NULLABLE): Ano de nascimento do autor.

**Relacionamentos:**
*   **Livros:** Muitos para Muitos com `Livro` (um autor pode ter escrito vários livros, e um livro pode ter vários autores). A tabela de associação é `escrito_por`.

---

### 3. `Categoria`
Armazena as categorias dos livros.

**Atributos:**
*   `id_categoria` (INTEGER, PK): Identificador único da categoria.
*   `nome` (VARCHAR, UNIQUE): Nome da categoria.

**Relacionamentos:**
*   **Livros:** Um para Muitos com `Livro` (uma categoria pode conter vários livros).

---

### 4. `Curso`
Armazena informações sobre os cursos aos quais os usuários podem estar vinculados.

**Atributos:**
*   `id_curso` (INTEGER, PK): Identificador único do curso.
*   `nome` (VARCHAR, UNIQUE): Nome do curso.
*   `departamento` (VARCHAR, NULLABLE): Departamento ao qual o curso pertence.

**Relacionamentos:**
*   **Usuários:** Um para Muitos com `Usuario` (um curso pode ter vários usuários).

---

### 5. `Usuario`
Armazena informações sobre os usuários (leitores) do sistema.

**Atributos:**
*   `id_usuario` (INTEGER, PK): Identificador único do usuário.
*   `nome` (VARCHAR): Nome completo do usuário.
*   `telefone` (VARCHAR, NULLABLE): Número de telefone do usuário.
*   `matricula` (VARCHAR, UNIQUE, INDEXED): Matrícula única do usuário.
*   `email` (VARCHAR, UNIQUE, NULLABLE): Endereço de e-mail do usuário.
*   `id_curso` (INTEGER, FK, NULLABLE): Chave estrangeira para `Curso.id_curso`.
*   `hashed_password` (VARCHAR): Senha do usuário armazenada de forma segura (hash).
*   `is_active` (BOOLEAN, DEFAULT TRUE): Indica se o usuário está ativo no sistema.

**Relacionamentos:**
*   **Curso:** Muitos para Um com `Curso` (um usuário pode pertencer a um curso).
*   **Empréstimos:** Um para Muitos com `Emprestimo` (um usuário pode ter vários empréstimos).
*   **Reservas:** Um para Muitos com `Reserva` (um usuário pode fazer várias reservas).
*   **Penalidades:** Um para Muitos com `Penalidade` (um usuário pode ter várias penalidades).

---

### 6. `Funcionario`
Armazena informações sobre os funcionários da biblioteca.

**Atributos:**
*   `id_funcionario` (INTEGER, PK): Identificador único do funcionário.
*   `nome` (VARCHAR): Nome completo do funcionário.
*   `cargo` (VARCHAR): Cargo do funcionário (ex: "Bibliotecário", "Atendente").
*   `matricula_funcional` (VARCHAR, UNIQUE, INDEXED): Matrícula funcional única do funcionário.
*   `hashed_password` (VARCHAR): Senha do funcionário armazenada de forma segura (hash).
*   `is_active` (BOOLEAN, DEFAULT TRUE): Indica se o funcionário está ativo no sistema.

**Relacionamentos:**
*   **Empréstimos Registrados:** Um para Muitos com `Emprestimo` (um funcionário pode registrar vários empréstimos).
*   **Reservas Registradas:** Um para Muitos com `Reserva` (um funcionário pode registrar várias reservas).
*   **Devoluções Registradas:** Um para Muitos com `Devolucao` (um funcionário pode registrar várias devoluções).

---

### 7. `Exemplar`
Armazena informações sobre cada cópia física de um livro.

**Atributos:**
*   `id_exemplar` (INTEGER, PK, AUTOINCREMENT): Identificador único do exemplar.
*   `codigo_identificacao` (VARCHAR, UNIQUE, INDEXED): Código único do exemplar (ex: código de barras).
*   `status` (VARCHAR, DEFAULT "disponivel"): Status do exemplar (ex: "disponivel", "emprestado", "reservado", "em_manutencao", "perdido", "descartado").
*   `data_aquisicao` (DATE, NULLABLE): Data de aquisição do exemplar.
*   `observacoes` (VARCHAR, NULLABLE): Observações adicionais sobre o exemplar.
*   `id_livro` (INTEGER, FK): Chave estrangeira para `Livro.id_livro`.

**Relacionamentos:**
*   **Livro:** Muitos para Um com `Livro` (um exemplar pertence a um livro específico).
*   **Empréstimos:** Um para Muitos com `Emprestimo` (um exemplar pode ser emprestado várias vezes ao longo do tempo, mas apenas um empréstimo ativo por vez).
*   **Reservas:** Um para Muitos com `Reserva` (um exemplar específico pode ser reservado).

---

### 8. `Emprestimo`
Registra os empréstimos de exemplares aos usuários.

**Atributos:**
*   `id_emprestimo` (INTEGER, PK, AUTOINCREMENT): Identificador único do empréstimo.
*   `data_retirada` (DATE): Data em que o exemplar foi retirado.
*   `data_prevista_devolucao` (DATE): Data prevista para a devolução do exemplar.
*   `data_efetiva_devolucao` (DATE, NULLABLE): Data em que o exemplar foi efetivamente devolvido.
*   `status_emprestimo` (VARCHAR, DEFAULT "ativo"): Status do empréstimo (ex: "ativo", "devolvido", "atrasado").
*   `id_usuario` (INTEGER, FK): Chave estrangeira para `Usuario.id_usuario`.
*   `id_exemplar` (INTEGER, FK): Chave estrangeira para `Exemplar.id_exemplar`.
*   `id_funcionario_registro` (INTEGER, FK): Chave estrangeira para `Funcionario.id_funcionario` (quem registrou o empréstimo).

**Relacionamentos:**
*   **Usuário:** Muitos para Um com `Usuario` (um empréstimo é feito por um usuário).
*   **Exemplar:** Muitos para Um com `Exemplar` (um empréstimo refere-se a um exemplar específico).
*   **Funcionário Registro Empréstimo:** Muitos para Um com `Funcionario` (um empréstimo é registrado por um funcionário).
*   **Devolução:** Um para Um com `Devolucao` (um empréstimo pode ter uma devolução associada).
*   **Penalidades Associadas:** Um para Muitos com `Penalidade` (um empréstimo pode originar penalidades).

---

### 9. `Reserva`
Registra as reservas de livros ou exemplares feitas pelos usuários.

**Atributos:**
*   `id_reserva` (INTEGER, PK, AUTOINCREMENT): Identificador único da reserva.
*   `data_reserva` (DATE): Data em que a reserva foi feita.
*   `data_validade_reserva` (DATE): Data até a qual a reserva é válida.
*   `status` (VARCHAR, DEFAULT "ativa"): Status da reserva (ex: "ativa", "cancelada", "expirada", "atendida").
*   `id_exemplar` (INTEGER, FK, NULLABLE): Chave estrangeira para `Exemplar.id_exemplar` (se a reserva for para um exemplar específico).
*   `id_livro_solicitado` (INTEGER, FK, NULLABLE): Chave estrangeira para `Livro.id_livro` (se a reserva for para um título genérico).
*   `id_usuario` (INTEGER, FK): Chave estrangeira para `Usuario.id_usuario`.
*   `id_funcionario_registro` (INTEGER, FK, NULLABLE): Chave estrangeira para `Funcionario.id_funcionario` (quem registrou a reserva, se aplicável).

**Relacionamentos:**
*   **Usuário:** Muitos para Um com `Usuario` (uma reserva é feita por um usuário).
*   **Exemplar:** Muitos para Um com `Exemplar` (uma reserva pode ser para um exemplar específico).
*   **Livro Solicitado:** Muitos para Um com `Livro` (uma reserva pode ser para um título de livro).
*   **Funcionário Registro Reserva:** Muitos para Um com `Funcionario` (uma reserva pode ser registrada por um funcionário).

---

### 10. `Devolucao`
Registra as devoluções de exemplares emprestados.

**Atributos:**
*   `id_devolucao` (INTEGER, PK, AUTOINCREMENT): Identificador único da devolução.
*   `data_devolucao` (DATE): Data em que o exemplar foi devolvido.
*   `observacoes` (VARCHAR, NULLABLE): Observações sobre a devolução (ex: estado do livro).
*   `id_funcionario_registro` (INTEGER, FK): Chave estrangeira para `Funcionario.id_funcionario` (quem registrou a devolução).
*   `id_emprestimo` (INTEGER, FK, UNIQUE): Chave estrangeira para `Emprestimo.id_emprestimo` (devolução associada a um único empréstimo).

**Relacionamentos:**
*   **Funcionário Registro Devolução:** Muitos para Um com `Funcionario` (uma devolução é registrada por um funcionário).
*   **Empréstimo:** Um para Um com `Emprestimo` (uma devolução está ligada a um empréstimo específico).

---

### 11. `Penalidade`
Registra penalidades aplicadas aos usuários (ex: multas, suspensões).

**Atributos:**
*   `id_penalidade` (INTEGER, PK, AUTOINCREMENT): Identificador único da penalidade.
*   `tipo_penalidade` (VARCHAR): Tipo de penalidade (ex: "multa", "suspensao").
*   `data_inicio` (DATE): Data de início da penalidade.
*   `data_fim` (DATE, NULLABLE): Data de término da penalidade (para suspensões).
*   `valor_multa` (FLOAT, NULLABLE): Valor da multa (se aplicável).
*   `status` (VARCHAR, DEFAULT "ativa"): Status da penalidade (ex: "ativa", "paga", "cumprida", "cancelada").
*   `observacoes` (VARCHAR, NULLABLE): Observações sobre a penalidade.
*   `id_usuario` (INTEGER, FK): Chave estrangeira para `Usuario.id_usuario`.
*   `id_emprestimo_origem` (INTEGER, FK, NULLABLE): Chave estrangeira para `Emprestimo.id_emprestimo` (se a penalidade originou-se de um empréstimo).

**Relacionamentos:**
*   **Usuário:** Muitos para Um com `Usuario` (uma penalidade é aplicada a um usuário).
*   **Empréstimo Relacionado:** Muitos para Um com `Emprestimo` (uma penalidade pode estar relacionada a um empréstimo).

---

## Tabela de Associação

### `escrito_por`
Tabela de associação para o relacionamento Muitos para Muitos entre `Livro` e `Autor`.

**Atributos:**
*   `id_autor` (INTEGER, FK, PK component): Chave estrangeira para `Autor.id_autor`.
*   `id_livro` (INTEGER, FK, PK component): Chave estrangeira para `Livro.id_livro`.

**Relacionamentos:**
*   Liga um `Autor` a um `Livro`.
