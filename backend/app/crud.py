from typing import List, Dict

def get_livros(db) -> List[Dict]:
    db.execute("""
        SELECT l.id_livro, l.titulo, l.ano_publicacao, l.status,
               c.nome AS categoria
        FROM livro l
        LEFT JOIN categoria c ON l.id_categoria = c.id_categoria
    """)
    return db.fetchall()

def get_livro(db, livro_id: int) -> Dict:
    db.execute("""
        SELECT id_livro, titulo, ano_publicacao, status, id_categoria
        FROM livro WHERE id_livro = %s
    """, (livro_id,))
    return db.fetchone()

def create_livro(db, livro_data: dict) -> dict:
    db.execute("""
        INSERT INTO livro (titulo, ano_publicacao, status, id_categoria)
        VALUES (%s, %s, %s, %s)
        RETURNING id_livro, titulo, ano_publicacao, status, id_categoria
    """, (
        livro_data["titulo"],
        livro_data["ano_publicacao"],
        livro_data["status"],
        livro_data["id_categoria"]
    ))
    return db.fetchone()

def delete_livro(db, livro_id: int) -> None:
    db.execute("DELETE FROM livro WHERE id_livro = %s", (livro_id,))

def get_categorias(db) -> list[dict]:
    db.execute("SELECT id_categoria, nome FROM categoria;")
    return db.fetchall()

def get_categoria(db, categoria_id: int) -> dict | None:
    db.execute(
        "SELECT id_categoria, nome FROM categoria WHERE id_categoria = %s;",
        (categoria_id,)
    )
    return db.fetchone()

def create_categoria(db, cat_data: dict) -> dict:
    db.execute(
        "INSERT INTO categoria (nome) VALUES (%s) RETURNING id_categoria, nome;",
        (cat_data["nome"],)
    )
    return db.fetchone()

def delete_categoria(db, categoria_id: int) -> dict | None:
    # opcionalmente retornar a categoria removida
    categoria = get_categoria(db, categoria_id)
    if categoria:
        db.execute("DELETE FROM categoria WHERE id_categoria = %s;", (categoria_id,))
    return categoria