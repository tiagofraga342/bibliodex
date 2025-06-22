-- Script de inicialização do banco de dados PostgreSQL para Bibliodex

-- Tabela: categoria
CREATE TABLE IF NOT EXISTS categoria (
    id_categoria SERIAL PRIMARY KEY,
    nome VARCHAR UNIQUE NOT NULL
);
COMMENT ON TABLE categoria IS 'Tabela para armazenar as categorias dos livros.';

-- Tabela: livro
CREATE TABLE IF NOT EXISTS livro (
    id_livro SERIAL PRIMARY KEY,
    titulo VARCHAR NOT NULL,
    edicao VARCHAR,
    editora VARCHAR,
    isbn VARCHAR UNIQUE,
    ano_publicacao INTEGER,
    status_geral VARCHAR, -- Status geral do título, ex: ativo, descatalogado
    id_categoria INTEGER NOT NULL,
    CONSTRAINT fk_categoria
        FOREIGN KEY(id_categoria)
        REFERENCES categoria(id_categoria)
        ON DELETE RESTRICT -- Ou SET NULL, dependendo da regra de negócio
);
CREATE INDEX IF NOT EXISTS idx_livro_id_livro ON livro(id_livro);
COMMENT ON TABLE livro IS 'Tabela para armazenar informações sobre os livros.';
COMMENT ON COLUMN livro.status_geral IS 'Status geral do título, ex: ativo, descatalogado';
COMMENT ON COLUMN livro.edicao IS 'Edição do livro, ex: 1ª, 2ª, revisada';
COMMENT ON COLUMN livro.editora IS 'Editora do livro';
COMMENT ON COLUMN livro.isbn IS 'ISBN do livro';

-- Tabela: autor
CREATE TABLE IF NOT EXISTS autor (
    id_autor SERIAL PRIMARY KEY,
    nome VARCHAR NOT NULL,
    ano_nasc INTEGER
);
CREATE INDEX IF NOT EXISTS idx_autor_id_autor ON autor(id_autor);
COMMENT ON TABLE autor IS 'Tabela para armazenar informações sobre os autores.';

-- Tabela de Associação: escrito_por (entre livro e autor)
CREATE TABLE IF NOT EXISTS escrito_por (
    id_autor INTEGER NOT NULL,
    id_livro INTEGER NOT NULL,
    PRIMARY KEY (id_autor, id_livro),
    CONSTRAINT fk_escrito_por_autor
        FOREIGN KEY(id_autor)
        REFERENCES autor(id_autor)
        ON DELETE CASCADE,
    CONSTRAINT fk_escrito_por_livro
        FOREIGN KEY(id_livro)
        REFERENCES livro(id_livro)
        ON DELETE CASCADE
);
COMMENT ON TABLE escrito_por IS 'Tabela de associação entre autores e livros (muitos-para-muitos).';

-- Tabela: curso
CREATE TABLE IF NOT EXISTS curso (
    id_curso SERIAL PRIMARY KEY,
    nome VARCHAR UNIQUE NOT NULL,
    departamento VARCHAR
);
COMMENT ON TABLE curso IS 'Tabela para armazenar os cursos dos usuários.';

-- Tabela: usuario
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR NOT NULL,
    telefone VARCHAR,
    matricula VARCHAR UNIQUE NOT NULL,
    email VARCHAR UNIQUE,
    id_curso INTEGER,
    hashed_password VARCHAR NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT fk_curso
        FOREIGN KEY(id_curso)
        REFERENCES curso(id_curso)
        ON DELETE SET NULL -- Se o curso for deletado, o usuário não é, mas perde a ref.
);
CREATE INDEX IF NOT EXISTS idx_usuario_matricula ON usuario(matricula);
COMMENT ON TABLE usuario IS 'Tabela para armazenar informações dos usuários (clientes da biblioteca).';

-- Tabela: funcionario
CREATE TABLE IF NOT EXISTS funcionario (
    id_funcionario SERIAL PRIMARY KEY,
    nome VARCHAR NOT NULL,
    cargo VARCHAR NOT NULL,
    matricula_funcional VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_funcionario_matricula_funcional ON funcionario(matricula_funcional);
COMMENT ON TABLE funcionario IS 'Tabela para armazenar informações dos funcionários da biblioteca.';

-- Tabela: exemplar
CREATE TABLE IF NOT EXISTS exemplar (
    numero_tombo SERIAL PRIMARY KEY,
    codigo_identificacao VARCHAR UNIQUE NOT NULL, -- Código único do exemplar, ex: código de barras
    status VARCHAR DEFAULT 'disponivel' NOT NULL, -- Status: disponivel, emprestado, reservado, em_manutencao, perdido, descartado
    data_aquisicao DATE,
    observacoes TEXT,
    localizacao VARCHAR, -- Localização física do exemplar
    id_livro INTEGER NOT NULL,
    CONSTRAINT fk_exemplar_livro
        FOREIGN KEY(id_livro)
        REFERENCES livro(id_livro)
        ON DELETE RESTRICT -- Não deletar livro se houver exemplares
);
CREATE INDEX IF NOT EXISTS idx_exemplar_codigo_identificacao ON exemplar(codigo_identificacao);
COMMENT ON TABLE exemplar IS 'Tabela para armazenar os exemplares físicos dos livros.';
COMMENT ON COLUMN exemplar.codigo_identificacao IS 'Código único do exemplar, ex: código de barras';
COMMENT ON COLUMN exemplar.status IS 'Status: disponivel, emprestado, reservado, em_manutencao, perdido, descartado';
COMMENT ON COLUMN exemplar.localizacao IS 'Localização física do exemplar na biblioteca.';

-- Tabela: emprestimo
CREATE TABLE IF NOT EXISTS emprestimo (
    id_emprestimo SERIAL PRIMARY KEY,
    data_retirada DATE NOT NULL,
    data_prevista_devolucao DATE NOT NULL,
    data_efetiva_devolucao DATE,
    status_emprestimo VARCHAR DEFAULT 'ativo' NOT NULL, -- Status: ativo, devolvido, atrasado
    id_usuario INTEGER NOT NULL,
    numero_tombo INTEGER NOT NULL,
    id_funcionario_registro INTEGER NOT NULL,
    CONSTRAINT fk_emprestimo_usuario
        FOREIGN KEY(id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE RESTRICT,
    CONSTRAINT fk_emprestimo_exemplar
        FOREIGN KEY(numero_tombo)
        REFERENCES exemplar(numero_tombo)
        ON DELETE RESTRICT,
    CONSTRAINT fk_emprestimo_funcionario
        FOREIGN KEY(id_funcionario_registro)
        REFERENCES funcionario(id_funcionario)
        ON DELETE RESTRICT
);
COMMENT ON TABLE emprestimo IS 'Tabela para registrar os empréstimos de exemplares.';
COMMENT ON COLUMN emprestimo.status_emprestimo IS 'Status: ativo, devolvido, atrasado';

-- Tabela: reserva
CREATE TABLE IF NOT EXISTS reserva (
    id_reserva SERIAL PRIMARY KEY,
    data_reserva DATE NOT NULL,
    data_validade_reserva DATE NOT NULL,
    status VARCHAR DEFAULT 'ativa' NOT NULL, -- Status: ativa, cancelada, expirada, atendida
    numero_tombo INTEGER, -- Pode ser nulo se for reserva de título
    id_livro_solicitado INTEGER, -- Para reservas genéricas de um título
    id_usuario INTEGER NOT NULL,
    id_funcionario_registro INTEGER, -- Funcionário que auxiliou no registro
    CONSTRAINT fk_reserva_usuario
        FOREIGN KEY(id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE, -- Se usuário for deletado, suas reservas são canceladas/deletadas
    CONSTRAINT fk_reserva_exemplar
        FOREIGN KEY(numero_tombo)
        REFERENCES exemplar(numero_tombo)
        ON DELETE SET NULL, -- Se exemplar for deletado, a reserva pode ficar sem exemplar específico
    CONSTRAINT fk_reserva_livro_solicitado
        FOREIGN KEY(id_livro_solicitado)
        REFERENCES livro(id_livro)
        ON DELETE CASCADE, -- Se o livro for deletado, reservas para ele são canceladas/deletadas
    CONSTRAINT fk_reserva_funcionario
        FOREIGN KEY(id_funcionario_registro)
        REFERENCES funcionario(id_funcionario)
        ON DELETE SET NULL,
    CONSTRAINT chk_reserva_item CHECK (numero_tombo IS NOT NULL OR id_livro_solicitado IS NOT NULL) -- Garante que ou exemplar ou livro é referenciado
);
COMMENT ON TABLE reserva IS 'Tabela para registrar as reservas de livros/exemplares.';
COMMENT ON COLUMN reserva.status IS 'Status: ativa, cancelada, expirada, atendida';
COMMENT ON COLUMN reserva.id_livro_solicitado IS 'Para reservas genéricas de um título';

-- Tabela: devolucao
CREATE TABLE IF NOT EXISTS devolucao (
    id_devolucao SERIAL PRIMARY KEY,
    data_devolucao DATE NOT NULL,
    observacoes TEXT,
    id_funcionario_registro INTEGER NOT NULL,
    id_emprestimo INTEGER UNIQUE NOT NULL, -- Cada empréstimo tem uma única devolução
    CONSTRAINT fk_devolucao_funcionario
        FOREIGN KEY(id_funcionario_registro)
        REFERENCES funcionario(id_funcionario)
        ON DELETE RESTRICT,
    CONSTRAINT fk_devolucao_emprestimo
        FOREIGN KEY(id_emprestimo)
        REFERENCES emprestimo(id_emprestimo)
        ON DELETE CASCADE -- Se o empréstimo for deletado, a devolução associada também é.
);
COMMENT ON TABLE devolucao IS 'Tabela para registrar as devoluções de empréstimos.';

-- Tabela: penalidade
CREATE TABLE IF NOT EXISTS penalidade (
    id_penalidade SERIAL PRIMARY KEY,
    tipo_penalidade VARCHAR NOT NULL, -- Ex: multa, suspensao
    data_inicio DATE NOT NULL,
    data_fim DATE,
    valor_multa FLOAT,
    status VARCHAR DEFAULT 'ativa' NOT NULL, -- Status: ativa, paga, cumprida, cancelada
    observacoes TEXT,
    id_usuario INTEGER NOT NULL,
    id_emprestimo_origem INTEGER, -- Empréstimo que originou a penalidade
    CONSTRAINT fk_penalidade_usuario
        FOREIGN KEY(id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE, -- Se usuário for deletado, suas penalidades são deletadas
    CONSTRAINT fk_penalidade_emprestimo
        FOREIGN KEY(id_emprestimo_origem)
        REFERENCES emprestimo(id_emprestimo)
        ON DELETE SET NULL -- Se o empréstimo for deletado, a penalidade pode perder a referência de origem
);
COMMENT ON TABLE penalidade IS 'Tabela para registrar penalidades aplicadas aos usuários.';
COMMENT ON COLUMN penalidade.tipo_penalidade IS 'Ex: multa, suspensao';
COMMENT ON COLUMN penalidade.status IS 'Status: ativa, paga, cumprida, cancelada';

-- Adicionar quaisquer outros índices que possam ser úteis para otimizar consultas frequentes
CREATE INDEX IF NOT EXISTS idx_emprestimo_id_usuario ON emprestimo(id_usuario);
CREATE INDEX IF NOT EXISTS idx_emprestimo_id_exemplar ON emprestimo(id_exemplar);
CREATE INDEX IF NOT EXISTS idx_reserva_id_usuario ON reserva(id_usuario);
CREATE INDEX IF NOT EXISTS idx_reserva_id_exemplar ON reserva(id_exemplar);
CREATE INDEX IF NOT EXISTS idx_reserva_id_livro_solicitado ON reserva(id_livro_solicitado);

-- Mensagem de conclusão
\echo 'Schema do Bibliodex criado/verificado com sucesso.'
