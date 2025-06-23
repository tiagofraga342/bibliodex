import os
import psycopg2
from psycopg2.extras import execute_values
import random
from datetime import date, timedelta
from psycopg2 import sql

# ────── CONFIGURAÇÃO ──────
LOAN_COUNT    = 10_000_000
BATCH_SIZE    = 100_000
START_DATE    = date(2020, 1, 1)  # Data mínima de retirada
MAX_LOAN_DAYS = 60               # Máximo de dias para devolver (mínimo 1 dia)

def random_date(start: date, end: date) -> date:
    """Gera uma data aleatória entre start e end."""
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))

def main():
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://bibliodex:bibliodex@db:5432/bibliodex_db"
    )

    conn = psycopg2.connect(DATABASE_URL)
    cur  = conn.cursor()

    # Carrega apenas usuários e funcionários
    cur.execute("SELECT id_usuario FROM usuario;")
    usuarios = [r[0] for r in cur.fetchall()]

    cur.execute("SELECT id_funcionario FROM funcionario;")
    funcionarios = [r[0] for r in cur.fetchall()]

    if not usuarios or not funcionarios:
        print("Tabelas de usuário ou funcionário estão vazias.")
        return

    # Busca todos os exemplares disponíveis
    cur.execute("SELECT numero_tombo FROM exemplar;")
    exemplares = [r[0] for r in cur.fetchall()]
    if not exemplares:
        print("Tabela 'exemplar' vazia.")
        return

    today = date.today()
    total_inserted = 0

    for offset in range(0, LOAN_COUNT, BATCH_SIZE):
        batch = []
        upper = min(offset + BATCH_SIZE, LOAN_COUNT)
        for _ in range(offset, upper):
            data_retirada = random_date(START_DATE, today - timedelta(days=1))

            # Define data_prevista_devolucao (prazo aleatório entre 7 e MAX_LOAN_DAYS dias)
            prazo = random.randint(7, MAX_LOAN_DAYS)
            data_prevista_devolucao = data_retirada + timedelta(days=prazo)

            # Define data_efetiva_devolucao (75% devolvido, 25% pendente)
            if random.random() < 0.75:
                days = random.randint(1, prazo)
                data_efetiva_devolucao = data_retirada + timedelta(days=days)
                if data_efetiva_devolucao > today:
                    data_efetiva_devolucao = today
            else:
                data_efetiva_devolucao = None

            usuario_id     = random.choice(usuarios)
            numero_tombo   = random.choice(exemplares)
            funcionario_id = random.choice(funcionarios)

            batch.append((data_retirada, data_prevista_devolucao, data_efetiva_devolucao,
                          usuario_id, numero_tombo, funcionario_id))

        execute_values(
            cur,
            """
            INSERT INTO emprestimo
              (data_retirada, data_prevista_devolucao, data_efetiva_devolucao, id_usuario, numero_tombo, id_funcionario_registro)
            VALUES %s
            """,
            batch,
            template="(%s, %s, %s, %s, %s, %s)"
        )
        conn.commit()
        total_inserted = upper
        print(f"Inserted {total_inserted} / {LOAN_COUNT} empréstimos")

    cur.close()
    conn.close()
    print("População de empréstimos concluída.")

if __name__ == "__main__":
    main()
