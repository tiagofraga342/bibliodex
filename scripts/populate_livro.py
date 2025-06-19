# populate_books.py

import os
import psycopg2
from psycopg2.extras import execute_values
import random

# ────── CONSTANTES DE CONFIGURAÇÃO ──────
BOOK_COUNT = 100_000_000     # Total de livros a inserir
BATCH_SIZE = 100_000       # Quantos inserir por transação
NUM_CATEGORIES = 10      # Quantas categorias pré-criar, se necessário

def main():
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://bibliodex:bibliodex@db:5432/bibliodex_db"
    )

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Garante que existam categorias (de 1 a NUM_CATEGORIES)
    cur.execute("SELECT id_categoria FROM categoria")
    categorias = [row[0] for row in cur.fetchall()]
    if not categorias:
        for i in range(1, NUM_CATEGORIES + 1):
            cur.execute(
                "INSERT INTO categoria (nome) VALUES (%s) RETURNING id_categoria;",
                (f"Categoria {i}",)
            )
            categorias.append(cur.fetchone()[0])
        conn.commit()

    status_geral_options = ["ativo", "descatalogado"]

    for offset in range(0, BOOK_COUNT, BATCH_SIZE):
        batch = []
        upper = min(offset + BATCH_SIZE, BOOK_COUNT)
        for i in range(offset, upper):
            title = f"Livro Teste {i+1}"
            year = random.randint(1900, 2025)
            status_geral = random.choice(status_geral_options)
            cat = random.choice(categorias)
            batch.append((title, year, status_geral, cat))

        execute_values(
            cur,
            """
            INSERT INTO livro (titulo, ano_publicacao, status_geral, id_categoria)
            VALUES %s
            """,
            batch
        )
        conn.commit()
        print(f"Inserted {upper} / {BOOK_COUNT} livros")

    cur.close()
    conn.close()
    print("População concluída.")

if __name__ == "__main__":
    main()