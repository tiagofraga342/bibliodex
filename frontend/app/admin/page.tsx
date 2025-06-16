"use client";
import * as React from "react";
import api, {
  CategoriaReadBasic,
  AutorReadBasic,
  CursoReadBasic,
} from "../api";
import withAuth from "../components/withAuth";

function AdminPage() {
  // Categorias
  const [categorias, setCategorias] = React.useState<CategoriaReadBasic[]>([]);
  const [novaCategoria, setNovaCategoria] = React.useState("");
  const [editCategoriaId, setEditCategoriaId] = React.useState<number | null>(null);
  const [editCategoriaNome, setEditCategoriaNome] = React.useState("");
  // Autores
  const [autores, setAutores] = React.useState<AutorReadBasic[]>([]);
  const [novoAutor, setNovoAutor] = React.useState("");
  const [editAutorId, setEditAutorId] = React.useState<number | null>(null);
  const [editAutorNome, setEditAutorNome] = React.useState("");
  // Cursos
  const [cursos, setCursos] = React.useState<CursoReadBasic[]>([]);
  const [novoCurso, setNovoCurso] = React.useState({ nome: "", departamento: "" });
  const [editCursoId, setEditCursoId] = React.useState<number | null>(null);
  const [editCurso, setEditCurso] = React.useState({ nome: "", departamento: "" });

  const [mensagem, setMensagem] = React.useState<string | null>(null);

  // Fetch all on mount
  React.useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAll() {
    try {
      const [cat, aut, cur] = await Promise.all([
        api.get<CategoriaReadBasic[]>("/categorias"),
        api.get<AutorReadBasic[]>("/autores"),
        api.get<CursoReadBasic[]>("/cursos"),
      ]);
      setCategorias(cat.data);
      setAutores(aut.data);
      setCursos(cur.data);
    } catch (e) {
      setMensagem("Erro ao carregar dados.");
    }
  }

  // --- Categoria CRUD ---
  async function criarCategoria(e: React.FormEvent) {
    e.preventDefault();
    if (!novaCategoria.trim()) return;
    try {
      const res = await api.post<CategoriaReadBasic>("/categorias", { nome: novaCategoria });
      setCategorias([...categorias, res.data]);
      setNovaCategoria("");
      setMensagem("Categoria criada!");
    } catch (e: any) {
      setMensagem(e?.data?.detail || "Erro ao criar categoria.");
    }
  }
  async function atualizarCategoria(id: number) {
    try {
      const res = await api.put<CategoriaReadBasic>(`/categorias/${id}`, { nome: editCategoriaNome });
      setCategorias(categorias.map(c => c.id_categoria === id ? res.data : c));
      setEditCategoriaId(null);
      setEditCategoriaNome("");
      setMensagem("Categoria atualizada!");
    } catch (e: any) {
      setMensagem(e?.data?.detail || "Erro ao atualizar categoria.");
    }
  }
  async function excluirCategoria(id: number) {
    if (!window.confirm("Excluir categoria?")) return;
    try {
      await api.delete(`/categorias/${id}`);
      setCategorias(categorias.filter(c => c.id_categoria !== id));
      setMensagem("Categoria excluída!");
    } catch (e: any) {
      setMensagem(e?.data?.detail || "Erro ao excluir categoria.");
    }
  }

  // --- Autor CRUD ---
  async function criarAutor(e: React.FormEvent) {
    e.preventDefault();
    if (!novoAutor.trim()) return;
    try {
      const res = await api.post<AutorReadBasic>("/autores", { nome: novoAutor });
      setAutores([...autores, res.data]);
      setNovoAutor("");
      setMensagem("Autor criado!");
    } catch (e: any) {
      setMensagem(e?.data?.detail || "Erro ao criar autor.");
    }
  }
  async function atualizarAutor(id: number) {
    try {
      const res = await api.put<AutorReadBasic>(`/autores/${id}`, { nome: editAutorNome });
      setAutores(autores.map(a => a.id_autor === id ? res.data : a));
      setEditAutorId(null);
      setEditAutorNome("");
      setMensagem("Autor atualizado!");
    } catch (e: any) {
      setMensagem(e?.data?.detail || "Erro ao atualizar autor.");
    }
  }
  async function excluirAutor(id: number) {
    if (!window.confirm("Excluir autor?")) return;
    try {
      await api.delete(`/autores/${id}`);
      setAutores(autores.filter(a => a.id_autor !== id));
      setMensagem("Autor excluído!");
    } catch (e: any) {
      setMensagem(e?.data?.detail || "Erro ao excluir autor.");
    }
  }

  // --- Curso CRUD ---
  async function criarCurso(e: React.FormEvent) {
    e.preventDefault();
    if (!novoCurso.nome.trim()) return;
    try {
      const res = await api.post<CursoReadBasic>("/cursos", novoCurso);
      setCursos([...cursos, res.data]);
      setNovoCurso({ nome: "", departamento: "" });
      setMensagem("Curso criado!");
    } catch (e: any) {
      setMensagem(e?.data?.detail || "Erro ao criar curso.");
    }
  }
  async function atualizarCurso(id: number) {
    try {
      const res = await api.put<CursoReadBasic>(`/cursos/${id}`, editCurso);
      setCursos(cursos.map(c => c.id_curso === id ? res.data : c));
      setEditCursoId(null);
      setEditCurso({ nome: "", departamento: "" });
      setMensagem("Curso atualizado!");
    } catch (e: any) {
      setMensagem(e?.data?.detail || "Erro ao atualizar curso.");
    }
  }
  async function excluirCurso(id: number) {
    if (!window.confirm("Excluir curso?")) return;
    try {
      await api.delete(`/cursos/${id}`);
      setCursos(cursos.filter(c => c.id_curso !== id));
      setMensagem("Curso excluído!");
    } catch (e: any) {
      setMensagem(e?.data?.detail || "Erro ao excluir curso.");
    }
  }

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Administração</h1>
      {mensagem && (
        <div className={`mb-4 p-2 rounded ${mensagem.includes("sucesso") || mensagem.includes("criad") || mensagem.includes("atualizad") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {mensagem}
        </div>
      )}
      {/* Categorias */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Categorias</h2>
        <form onSubmit={criarCategoria} className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Nova categoria"
            value={novaCategoria}
            onChange={e => setNovaCategoria(e.target.value)}
            className="p-2 border border-gray-400 rounded"
            required
          />
          <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800">Adicionar</button>
        </form>
        <ul>
          {categorias.map(c =>
            <li key={c.id_categoria} className="flex items-center gap-2 mb-1">
              {editCategoriaId === c.id_categoria ? (
                <>
                  <input
                    type="text"
                    value={editCategoriaNome}
                    onChange={e => setEditCategoriaNome(e.target.value)}
                    className="p-1 border border-gray-400 rounded"
                  />
                  <button onClick={() => atualizarCategoria(c.id_categoria)} className="text-green-700 font-bold">Salvar</button>
                  <button onClick={() => { setEditCategoriaId(null); setEditCategoriaNome(""); }} className="text-gray-500">Cancelar</button>
                </>
              ) : (
                <>
                  <span>{c.nome}</span>
                  <button onClick={() => { setEditCategoriaId(c.id_categoria); setEditCategoriaNome(c.nome); }} className="text-blue-700">Editar</button>
                  <button onClick={() => excluirCategoria(c.id_categoria)} className="text-red-700">Excluir</button>
                </>
              )}
            </li>
          )}
        </ul>
      </section>
      {/* Autores */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Autores</h2>
        <form onSubmit={criarAutor} className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Novo autor"
            value={novoAutor}
            onChange={e => setNovoAutor(e.target.value)}
            className="p-2 border border-gray-400 rounded"
            required
          />
          <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800">Adicionar</button>
        </form>
        <ul>
          {autores.map(a =>
            <li key={a.id_autor} className="flex items-center gap-2 mb-1">
              {editAutorId === a.id_autor ? (
                <>
                  <input
                    type="text"
                    value={editAutorNome}
                    onChange={e => setEditAutorNome(e.target.value)}
                    className="p-1 border border-gray-400 rounded"
                  />
                  <button onClick={() => atualizarAutor(a.id_autor)} className="text-green-700 font-bold">Salvar</button>
                  <button onClick={() => { setEditAutorId(null); setEditAutorNome(""); }} className="text-gray-500">Cancelar</button>
                </>
              ) : (
                <>
                  <span>{a.nome}</span>
                  <button onClick={() => { setEditAutorId(a.id_autor); setEditAutorNome(a.nome); }} className="text-blue-700">Editar</button>
                  <button onClick={() => excluirAutor(a.id_autor)} className="text-red-700">Excluir</button>
                </>
              )}
            </li>
          )}
        </ul>
      </section>
      {/* Cursos */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Cursos</h2>
        <form onSubmit={criarCurso} className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Novo curso"
            value={novoCurso.nome}
            onChange={e => setNovoCurso(c => ({ ...c, nome: e.target.value }))}
            className="p-2 border border-gray-400 rounded"
            required
          />
          <input
            type="text"
            placeholder="Departamento"
            value={novoCurso.departamento}
            onChange={e => setNovoCurso(c => ({ ...c, departamento: e.target.value }))}
            className="p-2 border border-gray-400 rounded"
          />
          <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800">Adicionar</button>
        </form>
        <ul>
          {cursos.map(c =>
            <li key={c.id_curso} className="flex items-center gap-2 mb-1">
              {editCursoId === c.id_curso ? (
                <>
                  <input
                    type="text"
                    value={editCurso.nome}
                    onChange={e => setEditCurso(cur => ({ ...cur, nome: e.target.value }))}
                    className="p-1 border border-gray-400 rounded"
                  />
                  <input
                    type="text"
                    value={editCurso.departamento}
                    onChange={e => setEditCurso(cur => ({ ...cur, departamento: e.target.value }))}
                    className="p-1 border border-gray-400 rounded"
                  />
                  <button onClick={() => atualizarCurso(c.id_curso)} className="text-green-700 font-bold">Salvar</button>
                  <button onClick={() => { setEditCursoId(null); setEditCurso({ nome: "", departamento: "" }); }} className="text-gray-500">Cancelar</button>
                </>
              ) : (
                <>
                  <span>{c.nome} {c.departamento && <span className="text-xs text-gray-500">({c.departamento})</span>}</span>
                  <button onClick={() => { setEditCursoId(c.id_curso); setEditCurso({ nome: c.nome, departamento: c.departamento || "" }); }} className="text-blue-700">Editar</button>
                  <button onClick={() => excluirCurso(c.id_curso)} className="text-red-700">Excluir</button>
                </>
              )}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

export default withAuth(AdminPage, ['funcionario']);
