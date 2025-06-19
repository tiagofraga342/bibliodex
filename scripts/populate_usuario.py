import os
import psycopg2
from psycopg2.extras import execute_values
import random

# ────── CONSTANTES DE CONFIGURAÇÃO ──────
USER_COUNT   = 8_000_000
BATCH_SIZE   = 100_000
NUM_COURSES  = 10

def main():
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://bibliodex:bibliodex@localhost:5432/bibliodex_db"
    )

    conn = psycopg2.connect(DATABASE_URL)
    cur  = conn.cursor()

    # Garante que existam cursos (de 1 a NUM_COURSES)
    cur.execute("SELECT id_curso FROM curso;")
    cursos = [row[0] for row in cur.fetchall()]
    if not cursos:
        for i in range(1, NUM_COURSES + 1):
            cur.execute(
                "INSERT INTO curso (nome, departamento) VALUES (%s, %s) RETURNING id_curso;",
                (f"Curso {i}", f"Departamento {i}")
            )
            cursos.append(cur.fetchone()[0])
        conn.commit()

    for offset in range(0, USER_COUNT, BATCH_SIZE):
        batch = []
        upper = min(offset + BATCH_SIZE, USER_COUNT)
        for i in range(offset, upper):
            nome       = f"Usuario Teste {i+1}"
            telefone   = f"{random.randint(1100000000, 1199999999)}"
            matricula  = 10000000 + i
            curso_id   = random.choice(cursos)
            hashed_password = "$2b$12$abcdefghijklmnopqrstuv"  # hash fake para dev
            batch.append((nome, telefone, matricula, curso_id, hashed_password))

        execute_values(
            cur,
            """
            INSERT INTO usuario (nome, telefone, matricula, id_curso, hashed_password)
            VALUES %s
            """,
            batch
        )
        conn.commit()
        print(f"Inserted {upper} / {USER_COUNT} usuários")

    cur.close()
    conn.close()
    print("População de usuários concluída.")

if __name__ == "__main__":
    main()
