import os
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import pool

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://bibliodex:bibliodex@localhost:5432/bibliodex_db"
)

# Cria pool de conexões
pg_pool = pool.SimpleConnectionPool(
    minconn=1,
    maxconn=10,
    dsn=DATABASE_URL
)

def get_db():
    conn = pg_pool.getconn()
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        yield cursor
        conn.commit()
    finally:
        cursor.close()
        pg_pool.putconn(conn)
