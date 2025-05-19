-- ====================================
-- DROP das tabelas (na ordem de dependência)
-- ====================================
DROP TABLE IF EXISTS devolucao;
DROP TABLE IF EXISTS reserva;
DROP TABLE IF EXISTS emprestimo;
DROP TABLE IF EXISTS penalidade;
DROP TABLE IF EXISTS escrito_por;
DROP TABLE IF EXISTS usuario;
DROP TABLE IF EXISTS funcionario;
DROP TABLE IF EXISTS livro;
DROP TABLE IF EXISTS autor;
DROP TABLE IF EXISTS categoria;
DROP TABLE IF EXISTS curso;

-- ====================================
-- TABELAS BASE
-- ====================================

CREATE TABLE categoria (
  id_categoria   SERIAL PRIMARY KEY,
  nome           VARCHAR(255) NOT NULL
);

CREATE TABLE autor (
  id_autor       SERIAL PRIMARY KEY,
  nome           VARCHAR(255) NOT NULL,
  ano_nasc       INT
);

CREATE TABLE livro (
  id_livro             SERIAL PRIMARY KEY,
  titulo               VARCHAR(255) NOT NULL,
  ano_publicacao       INT,
  status               VARCHAR(50),
  id_categoria         INT NOT NULL
);

CREATE TABLE curso (
  id_curso      SERIAL PRIMARY KEY,
  nome          VARCHAR(255) NOT NULL,
  departamento  VARCHAR(255)
);

CREATE TABLE usuario (
  id_usuario    SERIAL PRIMARY KEY,
  nome          VARCHAR(255) NOT NULL,
  telefone      VARCHAR(20),
  matricula     INT NOT NULL,
  id_curso      INT NOT NULL
);

CREATE TABLE funcionario (
  id_funcionario  SERIAL PRIMARY KEY,
  nome            VARCHAR(255) NOT NULL,
  cargo           VARCHAR(100)
);

-- ====================================
-- TABELA DE ASSOCIÇÃO (N:N)
-- ====================================

CREATE TABLE escrito_por (
  id_autor      INT NOT NULL,
  id_livro      INT NOT NULL,
  PRIMARY KEY (id_autor, id_livro)
);

-- ====================================
-- TABELAS DE TRANSAÇÃO
-- ====================================

CREATE TABLE emprestimo (
  id_emprestimo     SERIAL PRIMARY KEY,
  data_retirada     DATE     NOT NULL,
  data_devolucao    DATE,
  id_usuario        INT      NOT NULL,
  id_livro          INT      NOT NULL,
  id_funcionario    INT      NOT NULL
);

CREATE TABLE reserva (
  id_reserva     SERIAL PRIMARY KEY,
  data_reserva   DATE     NOT NULL,
  status         VARCHAR(50),
  id_livro       INT      NOT NULL,
  id_usuario     INT,
  id_funcionario INT
);

CREATE TABLE penalidade (
  id_penalidade  SERIAL PRIMARY KEY,
  status         VARCHAR(50) NOT NULL,
  id_usuario     INT      NOT NULL
);

CREATE TABLE devolucao (
  id_devolucao     SERIAL PRIMARY KEY,
  id_emprestimo    INT      NOT NULL UNIQUE,
  id_funcionario   INT      NOT NULL,
  data_hora        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  observacoes      TEXT
);

-- ====================================
-- CHAVES ESTRANGEIRAS
-- ====================================

ALTER TABLE livro
  ADD FOREIGN KEY (id_categoria)
    REFERENCES categoria(id_categoria);

ALTER TABLE usuario
  ADD FOREIGN KEY (id_curso)
    REFERENCES curso(id_curso);

ALTER TABLE escrito_por
  ADD FOREIGN KEY (id_autor)
    REFERENCES autor(id_autor),
  ADD FOREIGN KEY (id_livro)
    REFERENCES livro(id_livro);

ALTER TABLE emprestimo
  ADD FOREIGN KEY (id_usuario)
    REFERENCES usuario(id_usuario),
  ADD FOREIGN KEY (id_livro)
    REFERENCES livro(id_livro),
  ADD FOREIGN KEY (id_funcionario)
    REFERENCES funcionario(id_funcionario);

ALTER TABLE reserva
  ADD FOREIGN KEY (id_livro)
    REFERENCES livro(id_livro),
  ADD FOREIGN KEY (id_usuario)
    REFERENCES usuario(id_usuario),
  ADD FOREIGN KEY (id_funcionario)
    REFERENCES funcionario(id_funcionario);

ALTER TABLE penalidade
  ADD FOREIGN KEY (id_usuario)
    REFERENCES usuario(id_usuario);

ALTER TABLE devolucao
  ADD FOREIGN KEY (id_emprestimo)
    REFERENCES emprestimo(id_emprestimo),
  ADD FOREIGN KEY (id_funcionario)
    REFERENCES funcionario(id_funcionario);
