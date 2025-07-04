import psycopg2
import os

"""
Script de manutenção e otimização do banco de dados Bibliodex.
Inclui:
- VACUUM e ANALYZE regulares
- Criação de índices otimizados para paginação, busca e ordenação
- Full-Text Search para livros
"""

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://bibliodex_user:bibliodex_password@localhost:5432/bibliodex_db"
)


import time

def explain_analyze_busca_titulo(cur, termo_busca):
    print(f"\nEXPLAIN ANALYZE busca por título exato: '{termo_busca}'")
    cur.execute(
        """
        EXPLAIN ANALYZE SELECT * FROM livro
        WHERE titulo = %s;
        """,
        (termo_busca,)
    )
    for row in cur.fetchall():
        print(row[0])

def explain_analyze_busca_isbn(cur, isbn):
    print(f"\nEXPLAIN ANALYZE busca por ISBN exato: '{isbn}'")
    cur.execute(
        """
        EXPLAIN ANALYZE SELECT * FROM livro
        WHERE isbn = %s;
        """,
        (isbn,)
    )
    for row in cur.fetchall():
        print(row[0])

def explain_analyze_busca_isbn_forcada(cur, isbn, usar_btree=True):
    if usar_btree:
        print(f"\nEXPLAIN ANALYZE busca por ISBN (apenas B-tree): '{isbn}' (drop hash, cria btree)")
        cur.execute("DROP INDEX IF EXISTS idx_livro_isbn_hash;")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_livro_isbn_btree ON livro (isbn);")
    else:
        print(f"\nEXPLAIN ANALYZE busca por ISBN (apenas Hash): '{isbn}' (drop btree, cria hash)")
        cur.execute("DROP INDEX IF EXISTS idx_livro_isbn_btree;")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_livro_isbn_hash ON livro USING HASH (isbn);")
    cur.execute(
        """
        EXPLAIN ANALYZE SELECT * FROM livro WHERE isbn = %s;
        """,
        (isbn,)
    )
    for row in cur.fetchall():
        print(row[0])


conn = psycopg2.connect(DATABASE_URL)
conn.set_session(autocommit=True)  # Necessário para VACUUM FULL
cur = conn.cursor()

# Dropa todos os índices customizados relevantes para garantir que o banco não esteja otimizado
print("\nRemovendo índices customizados antes dos testes iniciais...")
cur.execute("""
DROP INDEX IF EXISTS idx_livro_titulo;
DROP INDEX IF EXISTS idx_livro_editora;
DROP INDEX IF EXISTS idx_livro_isbn_hash;
DROP INDEX IF EXISTS idx_livro_isbn_btree;
DROP INDEX IF EXISTS idx_autor_nome;
""")
conn.commit()

# 0. Medir tempo de execução da busca por título ANTES das otimizações
explain_analyze_busca_titulo(cur, 'titulo 123456')
# 0b. Medir tempo de execução da busca por ISBN ANTES das otimizações
explain_analyze_busca_isbn(cur, '978-010179998')


# 1. VACUUM e ANALYZE
print("\nExecutando VACUUM FULL e ANALYZE...")
cur.execute("VACUUM FULL;")
conn.set_session(autocommit=False)
cur.execute("ANALYZE;")
conn.commit()



# 4. Índices para livros




print("\nCriando índices de busca e ordenação para livros e autores...")
cur.execute("""
-- Índice B-tree para buscas e ordenação por título (mais eficiente para títulos sequenciais)
CREATE INDEX IF NOT EXISTS idx_livro_titulo ON livro (titulo);
-- Índice B-tree para ordenação por editora
CREATE INDEX IF NOT EXISTS idx_livro_editora ON livro (editora);
-- Índice Hash para ISBN
CREATE INDEX IF NOT EXISTS idx_livro_isbn_hash ON livro USING HASH (isbn);
-- Índice B-tree para ISBN (para comparação de desempenho)
CREATE INDEX IF NOT EXISTS idx_livro_isbn_btree ON livro (isbn);
-- Índice B-tree para buscas por nome de autor
CREATE INDEX IF NOT EXISTS idx_autor_nome ON autor (nome);
""")
conn.commit()

# Observação: Em um cenário real, com títulos variados e buscas por palavras-chave,
# um índice Full-Text Search (GIN) seria mais adequado para acelerar buscas textuais.


# 5. Medir tempo de execução da busca por título DEPOIS das otimizações
explain_analyze_busca_titulo(cur, 'titulo 123456')
# 5b. Medir tempo de execução da busca por ISBN DEPOIS das otimizações
explain_analyze_busca_isbn_forcada(cur, '978-010179998', usar_btree=True)
explain_analyze_busca_isbn_forcada(cur, '978-010179998', usar_btree=False)

cur.close()
conn.close()
print("\nOtimizações e manutenção concluídas.")
