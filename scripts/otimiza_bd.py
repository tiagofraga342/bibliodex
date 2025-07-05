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


def busca_livro_por_titulo(cur, termo_busca):
    print(f"\nTempo busca por título exato (Python): '{termo_busca}'")
    start = time.time()
    cur.execute(
        """
        SELECT * FROM livro WHERE titulo = %s;
        """,
        (termo_busca,)
    )
    _ = cur.fetchall()
    elapsed = time.time() - start
    print(f"Tempo: {elapsed:.6f}s")


def busca_livro_por_editora(cur, editora):
    print(f"\nTempo busca por editora (Python): '{editora}'")
    start = time.time()
    cur.execute(
        """
        SELECT * FROM livro WHERE editora = %s;
        """,
        (editora,)
    )
    _ = cur.fetchall()
    elapsed = time.time() - start
    print(f"Tempo: {elapsed:.6f}s")


conn = psycopg2.connect(DATABASE_URL)
conn.set_session(autocommit=True)  # Necessário para VACUUM FULL
cur = conn.cursor()

# Dropa todos os índices customizados relevantes para garantir que o banco não esteja otimizado
print("\nRemovendo índices customizados antes dos testes iniciais...")
cur.execute("""
DROP INDEX IF EXISTS idx_livro_titulo;
DROP INDEX IF EXISTS idx_livro_editora;
""")
conn.commit()



# 0. Medir tempo de execução da busca por título ANTES das otimizações
busca_livro_por_titulo(cur, 'Livro Teste 123456')
# 0b. Medir tempo de execução da busca por editora ANTES das otimizações
busca_livro_por_editora(cur, 'Editora Teste')





# 4. Índices para livros
print("\nCriando índices de busca e ordenação para livros...")
cur.execute("""
-- Índice B-tree para buscas e ordenação por título (mais eficiente para títulos sequenciais)
CREATE INDEX IF NOT EXISTS idx_livro_titulo ON livro (titulo);
-- Índice B-tree para ordenação por editora
CREATE INDEX IF NOT EXISTS idx_livro_editora ON livro (editora);
""")
conn.commit()

# Observação: Em um cenário real, com títulos variados e buscas por palavras-chave,
# um índice Full-Text Search (GIN) seria mais adequado para acelerar buscas textuais.




# 5. Medir tempo de execução da busca por título DEPOIS das otimizações
busca_livro_por_titulo(cur, 'Livro Teste 123456')
# 5b. Medir tempo de execução da busca por editora DEPOIS das otimizações
busca_livro_por_editora(cur, 'Editora Teste')

cur.close()
conn.close()
print("\nOtimizações e manutenção concluídas.")
