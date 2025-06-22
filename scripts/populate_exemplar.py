import os
import psycopg2
from psycopg2.extras import execute_values
import random

# ────── CONSTANTES DE CONFIGURAÇÃO ──────
BATCH_SIZE = 100_000
LOCALIZACOES = [
    'Estante A1', 'Estante A2', 'Estante B1', 'Estante B2',
    'Sala de Leitura', 'Depósito', 'Estante C1', 'Estante C2'
]
STATUS = ['disponivel', 'emprestado', 'reservado', 'em_manutencao', 'perdido', 'descartado']

def main():
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://bibliodex:bibliodex@db:5432/bibliodex_db"
    )
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Buscar todos os livros existentes
    cur.execute("SELECT id_livro FROM livro")
    livros = [row[0] for row in cur.fetchall()]
    if not livros:
        print("Nenhum livro encontrado para associar exemplares.")
        return

    total = 0
    for offset in range(0, len(livros), BATCH_SIZE):
        batch = []
        upper = min(offset + BATCH_SIZE, len(livros))
        for idx, id_livro in enumerate(livros[offset:upper], start=offset+1):
            # 85% dos livros: 0 ou 1 exemplar, 15%: 2 a 10 exemplares
            prob = random.random()
            if prob < 0.10:
                n_exemplares = 0
            elif prob < 0.95:
                n_exemplares = 1
            else:
                n_exemplares = random.randint(2, 10)
            for ex in range(n_exemplares):
                codigo = f"L{id_livro:07d}E{ex+1:02d}"
                status = random.choices(STATUS, weights=[8,2,1,1,1,1])[0]
                localizacao = random.choice(LOCALIZACOES)
                batch.append((codigo, status, localizacao, id_livro))
        if batch:
            execute_values(
                cur,
                """
                INSERT INTO exemplar (codigo_identificacao, status, localizacao, id_livro)
                VALUES %s
                ON CONFLICT (codigo_identificacao) DO NOTHING
                """,
                batch
            )
            conn.commit()
            total += len(batch)
            print(f"Inseridos {total} exemplares até agora ({upper} livros processados)")
    cur.close()
    conn.close()
    print(f"População de exemplares concluída. Total inserido: {total}")

if __name__ == "__main__":
    main()
