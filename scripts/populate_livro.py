# populate_books.py

import os
import psycopg2
from psycopg2.extras import execute_values
import random

# ────── CONSTANTES DE CONFIGURAÇÃO ──────
BOOK_COUNT = 25_000_000     # Total de livros a inserir
BATCH_SIZE = 100_000       # Quantos inserir por transação
NUM_CATEGORIES = 10      # Quantas categorias pré-criar, se necessário
NUM_AUTHORS = 1000

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

    # Garante que existam autores (de 1 a NUM_AUTHORS)
    cur.execute("SELECT id_autor FROM autor")
    autores = [row[0] for row in cur.fetchall()]
    if not autores:
        for i in range(1, NUM_AUTHORS + 1):
            cur.execute(
                "INSERT INTO autor (nome, ano_nasc) VALUES (%s, %s) RETURNING id_autor;",
                (f"Autor {i}", random.randint(1940, 2000))
            )
            autores.append(cur.fetchone()[0])
        conn.commit()

    status_geral_options = ["Ativo", "Descatalogado"]

    for offset in range(0, BOOK_COUNT, BATCH_SIZE):
        batch = []
        upper = min(offset + BATCH_SIZE, BOOK_COUNT)
        for i in range(offset, upper):
            title = f"Livro Teste {i+1}"
            edicao = f"{random.randint(1, 5)}ª"
            editora = f"Editora {random.randint(1, 20)}"
            isbn = f"978-{i+1:09d}"
            year = random.randint(1900, 2025)
            status_geral = random.choice(status_geral_options)
            cat = random.choice(categorias)
            batch.append((title, edicao, editora, isbn, year, status_geral, cat))

        execute_values(
            cur,
            """
            INSERT INTO livro (titulo, edicao, editora, isbn, ano_publicacao, status_geral, id_categoria)
            VALUES %s
            RETURNING id_livro
            """,
            batch
        )
        livro_ids = [row[0] for row in cur.fetchall()]
        # Associa autores aleatórios a cada livro (mas deixa alguns livros sem autores)
        escrito_por_batch = []
        for livro_id in livro_ids:
            if random.random() < 0.1:  # 10% dos livros sem autores
                continue
            num_autores = random.randint(1, 3)
            autores_livro = random.sample(autores, num_autores)
            for autor_id in autores_livro:
                escrito_por_batch.append((autor_id, livro_id))
        if escrito_por_batch:
            execute_values(
                cur,
                "INSERT INTO escrito_por (id_autor, id_livro) VALUES %s ON CONFLICT DO NOTHING",
                escrito_por_batch
            )
        conn.commit()
        print(f"Inserted {upper} / {BOOK_COUNT} livros e autores associados")

    cur.close()
    conn.close()
    print("População concluída.")

if __name__ == "__main__":
    main()