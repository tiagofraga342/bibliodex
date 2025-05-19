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

def get_usuarios(db) -> list[dict]:
    db.execute("""
        SELECT id_usuario, nome, 'Aluno' as tipo
        FROM usuario
        LIMIT 1000
    """)
    return db.fetchall()

def get_reservas(db) -> list[dict]:
    db.execute('''
        SELECT r.id_reserva as id,
               json_build_object(
                   'id', l.id_livro,
                   'titulo', l.titulo,
                   'autor', COALESCE(a.nome, ''),
                   'categoria', c.nome
               ) as livro,
               json_build_object(
                   'id', u.id_usuario,
                   'nome', u.nome,
                   'tipo', 'Aluno'
               ) as usuario,
               to_char(r.data_reserva, 'YYYY-MM-DD') as dataReserva,
               r.status
        FROM reserva r
        JOIN usuario u ON r.id_usuario = u.id_usuario
        JOIN livro l ON r.id_livro = l.id_livro
        LEFT JOIN categoria c ON l.id_categoria = c.id_categoria
        LEFT JOIN escrito_por ep ON l.id_livro = ep.id_livro
        LEFT JOIN autor a ON ep.id_autor = a.id_autor
        LIMIT 1000
    ''')
    # Retorna como lista de dicts já estruturados
    return [
        {**row, 'livro': row['livro'], 'usuario': row['usuario']} for row in db.fetchall()
    ]

def get_emprestimos(db) -> list[dict]:
    db.execute('''
        SELECT e.id_emprestimo as id,
               json_build_object(
                   'id', l.id_livro,
                   'titulo', l.titulo,
                   'autor', COALESCE(a.nome, ''),
                   'categoria', c.nome
               ) as livro,
               json_build_object(
                   'id', u.id_usuario,
                   'nome', u.nome,
                   'tipo', 'Aluno'
               ) as usuario,
               to_char(e.data_retirada, 'YYYY-MM-DD') as dataEmprestimo,
               to_char(e.data_devolucao, 'YYYY-MM-DD') as dataDevolucao,
               CASE WHEN e.data_devolucao IS NULL THEN 'Em andamento' ELSE 'Devolvido' END as status
        FROM emprestimo e
        JOIN usuario u ON e.id_usuario = u.id_usuario
        JOIN livro l ON e.id_livro = l.id_livro
        LEFT JOIN categoria c ON l.id_categoria = c.id_categoria
        LEFT JOIN escrito_por ep ON l.id_livro = ep.id_livro
        LEFT JOIN autor a ON ep.id_autor = a.id_autor
        LIMIT 1000
    ''')
    # Retorna como lista de dicts já estruturados
    return [
        {**row, 'livro': row['livro'], 'usuario': row['usuario']} for row in db.fetchall()
    ]