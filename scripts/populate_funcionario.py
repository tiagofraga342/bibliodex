import os
import psycopg2
from psycopg2.extras import execute_values
import random

# ────── CONFIGURAÇÃO ──────
EMPLOYEE_COUNT = 500
BATCH_SIZE     = 100

CARGOS = [
    "Bibliotecário",
    "Assistente Técnico",
    "Estagiário",
    "Coordenador de Acervo",
    "Técnico de TI",
    "Gerente de Biblioteca",
    "Atendente"
]

def main():
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://bibliodex:bibliodex@localhost:5432/bibliodex_db"
    )

    conn = psycopg2.connect(DATABASE_URL)
    cur  = conn.cursor()

    for offset in range(0, EMPLOYEE_COUNT, BATCH_SIZE):
        batch = []
        upper = min(offset + BATCH_SIZE, EMPLOYEE_COUNT)
        for i in range(offset, upper):
            nome = f"Funcionario Teste {i+1}"
            cargo = random.choice(CARGOS)
            matricula_funcional = f"FUNC{i+1:06d}"
            hashed_password = "$2b$12$qFw5eWD98fxIA4g6554xm.1/L2QEpbOBAmLFMWwPFy.HNtgNJFbNq"  # hash fake para dev (teste123)
            batch.append((nome, cargo, matricula_funcional, hashed_password))

        execute_values(
            cur,
            """
            INSERT INTO funcionario (nome, cargo, matricula_funcional, hashed_password)
            VALUES %s
            """,
            batch
        )
        conn.commit()
        print(f"Inserted {upper} / {EMPLOYEE_COUNT} funcionários")

    cur.close()
    conn.close()
    print("População de funcionários concluída.")

if __name__ == "__main__":
    main()
