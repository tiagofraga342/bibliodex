
import psycopg2
import os
import time

"""
Script para criar e popular tabela auxiliar de paginação otimizada para livros,
baseada na ordenação por título, e medir o tempo de execução antes e depois da otimização.
"""

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://bibliodex_user:bibliodex_password@localhost:5432/bibliodex_db"
)

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

pagina = 1000000  # Altere para a página desejada
tam_pagina = 20

def tempo_paginacao_padrao(cur, pagina, tam_pagina):
    offset = (pagina - 1) * tam_pagina
    print(f"\nTempo da busca paginada padrão (OFFSET) para página {pagina}:")
    start = time.time()
    cur.execute(
        """
        SELECT * FROM livro
        ORDER BY titulo
        OFFSET %s LIMIT %s;
        """,
        (offset, tam_pagina)
    )
    _ = cur.fetchall()
    elapsed = time.time() - start
    print(f"Tempo: {elapsed:.4f} segundos")
    return elapsed

def tempo_paginacao_otimizada(cur, pagina, tam_pagina):
    print(f"\nTempo da busca paginada OTIMIZADA para página {pagina}:")
    cur.execute("SELECT primeiro_titulo FROM paginacao_livro_aux WHERE pagina = %s;", (pagina,))
    row = cur.fetchone()
    if row:
        primeiro_titulo = row[0]
        start = time.time()
        cur.execute(
            """
            SELECT * FROM livro
            WHERE titulo >= %s
            ORDER BY titulo
            LIMIT %s;
            """,
            (primeiro_titulo, tam_pagina)
        )
        _ = cur.fetchall()
        elapsed = time.time() - start
        print(f"Tempo: {elapsed:.4f} segundos")
        return elapsed
    else:
        print(f"Página {pagina} não encontrada na tabela auxiliar.")
        return None

# Medir tempo ANTES da otimização (paginacao padrão)
tempo_paginacao_padrao(cur, pagina, tam_pagina)

# a) Criação da tabela auxiliar
cur.execute("""
CREATE TABLE IF NOT EXISTS paginacao_livro_aux (
    pagina INT PRIMARY KEY,
    primeiro_titulo TEXT
);
""")
conn.commit()

# b) Preenchimento da tabela auxiliar
print("\nLimpando e preenchendo tabela auxiliar de paginação...")
cur.execute("TRUNCATE paginacao_livro_aux;")
cur.execute("""
INSERT INTO paginacao_livro_aux (pagina, primeiro_titulo)
SELECT
    pagina,
    MIN(titulo) as primeiro_titulo
FROM (
    SELECT
        titulo,
        FLOOR( (ROW_NUMBER() OVER (ORDER BY titulo) - 1) / %s ) + 1 AS pagina
    FROM livro
) sub
GROUP BY pagina;
""", (tam_pagina,))
conn.commit()

# Medir tempo DEPOIS da otimização (paginacao otimizada)
tempo_paginacao_otimizada(cur, pagina, tam_pagina)

cur.close()
conn.close()
print("\nTabela auxiliar de paginação atualizada e tempos medidos.")
