"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import api, { EmprestimoRead, LivroRead, AutorReadBasic } from "../api";
import { useAuth } from "../contexts/AuthContext";
import withAuth from "../components/withAuth";

function EmprestimosPage() {
  const { user } = useAuth();
  const [filtroUsuario, setFiltroUsuario] = useState(""); // ID do usuário
  const [filtroLivro, setFiltroLivro] = useState(""); // ID do livro
  const [filtroAutor, setFiltroAutor] = useState(""); // Nome do autor
  const [filtroCategoria, setFiltroCategoria] = useState(""); // Nome da categoria
  const [filtroStatus, setFiltroStatus] = useState("");
  const [emprestimos, setEmprestimos] = useState<EmprestimoRead[]>([]);
  const [modalDetalhes, setModalDetalhes] = useState<EmprestimoRead | null>(null);

  // Estados e refs para dropdowns
  const [isDropdownUsuarioOpen, setIsDropdownUsuarioOpen] = useState(false);
  const usuarioDropdownRef = React.useRef<HTMLDivElement>(null);
  const [isDropdownLivroOpen, setIsDropdownLivroOpen] = useState(false);
  const livroDropdownRef = React.useRef<HTMLDivElement>(null);

  // Dropdowns para autor e categoria (filtros)
  const [dropdownAutorFiltroAberto, setDropdownAutorFiltroAberto] = useState(false);
  const dropdownAutorFiltroRef = React.useRef<HTMLDivElement>(null);
  const [dropdownCategoriaFiltroAberto, setDropdownCategoriaFiltroAberto] = useState(false);
  const dropdownCategoriaFiltroRef = React.useRef<HTMLDivElement>(null);
  const [autoresFiltradosDropdown, setAutoresFiltradosDropdown] = useState<string[]>([]);
  const [categoriasFiltradasDropdown, setCategoriasFiltradasDropdown] = useState<string[]>([]);
  const [filtroUsuarioNome, setFiltroUsuarioNome] = useState("");
  const [filtroLivroTitulo, setFiltroLivroTitulo] = useState("");

  // Estados para autocomplete de usuário/livro
  const [usuariosFiltradosDropdown, setUsuariosFiltradosDropdown] = useState<string[]>([]);
  const [livrosFiltradosDropdown, setLivrosFiltradosDropdown] = useState<string[]>([]);

  // Gerar listas únicas de autores/categorias
  const autoresUnicos = React.useMemo(
    () =>
      Array.from(
        new Set(
          emprestimos
            .flatMap(e =>
              e.exemplar && (e as any).exemplar.livro && Array.isArray((e as any).exemplar.livro.autores)
                ? (e as any).exemplar.livro.autores.map((a: AutorReadBasic) => a.nome)
                : []
            )
        )
      ).sort(),
    [emprestimos]
  );
  // Corrija categoriasUnicas: deve considerar todos os livros dos exemplares, não apenas o primeiro encontrado
  const categoriasUnicas = React.useMemo(
    () =>
      Array.from(
        new Set(
          emprestimos
            .flatMap(e =>
              e.exemplar && (e as any).exemplar.livro && (e as any).exemplar.livro.categoria?.nome
                ? [(e as any).exemplar.livro.categoria.nome]
                : []
            )
        )
      ).sort(),
    [emprestimos]
  );

  // Gerar listas únicas de usuários/livros
  const usuariosUnicos = React.useMemo(
    () =>
      Array.from(
        new Map(
          emprestimos.map(e => [e.usuario.id_usuario, e.usuario])
        ).values()
      ),
    [emprestimos]
  );
  const livrosUnicos = React.useMemo(
    () =>
      Array.from(
        new Map(
          emprestimos
            .filter(e => (e as any).exemplar.livro)
            .map(e => [(e as any).exemplar.livro.id_livro, (e as any).exemplar.livro])
        ).values()
      ),
    [emprestimos]
  );

  // Atualizar dropdown de autores
  useEffect(() => {
    if (filtroAutor.length === 0) {
      setAutoresFiltradosDropdown(autoresUnicos);
    } else if (filtroAutor.length > 1) {
      setAutoresFiltradosDropdown(autoresUnicos.filter(a => a.toLowerCase().includes(filtroAutor.toLowerCase())));
    } else {
      setAutoresFiltradosDropdown([]);
    }
  }, [filtroAutor, autoresUnicos]);

  // Atualizar dropdown de categorias
  useEffect(() => {
    if (filtroCategoria.length === 0) {
      setCategoriasFiltradasDropdown(categoriasUnicas as string[]);
    } else if (filtroCategoria.length > 1) {
      setCategoriasFiltradasDropdown((categoriasUnicas as string[]).filter(c => c.toLowerCase().includes(filtroCategoria.toLowerCase())));
    } else {
      setCategoriasFiltradasDropdown([]);
    }
  }, [filtroCategoria, categoriasUnicas]);

  // Atualizar dropdown de usuários
  useEffect(() => {
    if (filtroUsuarioNome.length === 0) {
      setUsuariosFiltradosDropdown(usuariosUnicos.map(u => u.nome));
    } else if (filtroUsuarioNome.length > 1) {
      setUsuariosFiltradosDropdown(
        usuariosUnicos
          .filter(u => u.nome.toLowerCase().includes(filtroUsuarioNome.toLowerCase()))
          .map(u => u.nome)
      );
    } else {
      setUsuariosFiltradosDropdown([]);
    }
  }, [filtroUsuarioNome, usuariosUnicos]);

  // Atualizar dropdown de livros
  useEffect(() => {
    if (filtroLivroTitulo.length === 0) {
      setLivrosFiltradosDropdown(livrosUnicos.map(l => l.titulo));
    } else if (filtroLivroTitulo.length > 1) {
      setLivrosFiltradosDropdown(
        livrosUnicos
          .filter(l => l.titulo.toLowerCase().includes(filtroLivroTitulo.toLowerCase()))
          .map(l => l.titulo)
      );
    } else {
      setLivrosFiltradosDropdown([]);
    }
  }, [filtroLivroTitulo, livrosUnicos]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (usuarioDropdownRef.current && !usuarioDropdownRef.current.contains(event.target as Node)) {
        setIsDropdownUsuarioOpen(false);
      }
      if (livroDropdownRef.current && !livroDropdownRef.current.contains(event.target as Node)) {
        setIsDropdownLivroOpen(false);
      }
      if (dropdownAutorFiltroRef.current && !dropdownAutorFiltroRef.current.contains(event.target as Node)) {
        setDropdownAutorFiltroAberto(false);
      }
      if (dropdownCategoriaFiltroRef.current && !dropdownCategoriaFiltroRef.current.contains(event.target as Node)) {
        setDropdownCategoriaFiltroAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const emprestimosRes = await api.get<EmprestimoRead[]>("/emprestimos");
        setEmprestimos(emprestimosRes.data);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    }
    fetchData();
  }, [user]);

  function statusEmprestimoLabel(status: string) {
    switch (status) {
      case "ativo":
        return "Em andamento";
      case "devolvido":
        return "Devolvido";
      case "atrasado":
        return "Atrasado";
      default:
        return status;
    }
  }

  function filtrarEmprestimos() {
    return emprestimos.filter(e =>
      (!filtroUsuario || String(e.usuario.id_usuario) === filtroUsuario) &&
      (!filtroLivro || ((e as any).exemplar.livro && String((e as any).exemplar.livro.id_livro) === filtroLivro)) &&
      (!filtroStatus || e.status_emprestimo === filtroStatus) &&
      (!filtroAutor ||
        ((e as any).exemplar.livro &&
          Array.isArray((e as any).exemplar.livro.autores) &&
          (e as any).exemplar.livro.autores.some((a: AutorReadBasic) =>
            a.nome.toLowerCase().includes(filtroAutor.toLowerCase())
          ))
      ) &&
      (!filtroCategoria ||
        ((e as any).exemplar.livro &&
          (e as any).exemplar.livro.categoria &&
          (e as any).exemplar.livro.categoria.nome.toLowerCase().includes(filtroCategoria.toLowerCase()))
      )
    );
  }

  async function registrarDevolucao(id: number) {
    try {
      const emprestimoToUpdate = emprestimos.find(e => e.id_emprestimo === id);
      if (emprestimoToUpdate) {
        const payload = {
          data_devolucao: new Date().toISOString().slice(0, 10),
          id_emprestimo: id,
        };
        await api.post('/devolucoes', payload);
        const emprestimosRes = await api.get<EmprestimoRead[]>("/emprestimos");
        setEmprestimos(emprestimosRes.data);
      }
    } catch (error) {
      console.error("Erro ao registrar devolução:", error);
    }
  }

  // Corrija o fetchLivroDetalhe: busque pelo id_livro do exemplar, não por modalDetalhes.exemplar.livro
  const [livroDetalhe, setLivroDetalhe] = useState<{ titulo: string; autores: string[] } | null>(null);

  useEffect(() => {
    async function fetchLivroDetalhe() {
      const idLivro =
        modalDetalhes && (modalDetalhes.exemplar as any)?.id_livro
          ? (modalDetalhes.exemplar as any).id_livro
          : null;
      if (idLivro) {
        try {
          const res = await api.get<LivroRead>(`/livros/${idLivro}`);
          setLivroDetalhe({
            titulo: res.data.titulo,
            autores: Array.isArray(res.data.autores) ? res.data.autores.map((a: AutorReadBasic) => a.nome) : [],
          });
        } catch {
          setLivroDetalhe(null);
        }
      } else {
        setLivroDetalhe(null);
      }
    }
    fetchLivroDetalhe();
  }, [modalDetalhes]);

  return (
    <div className="max-w-5xl mx-auto mt-8 bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Gestão de Empréstimos</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Filtro de usuário com autocomplete */}
        <div className="flex flex-col gap-1 min-w-[180px] relative" ref={usuarioDropdownRef}>
          <input
            type="text"
            className="p-2 border border-gray-400 rounded"
            placeholder="Buscar usuário"
            value={filtroUsuarioNome}
            onChange={e => {
              setFiltroUsuarioNome(e.target.value);
              setIsDropdownUsuarioOpen(true);
            }}
            onFocus={() => setIsDropdownUsuarioOpen(true)}
            autoComplete="off"
          />
          {isDropdownUsuarioOpen && (filtroUsuarioNome.length === 0 || filtroUsuarioNome.length > 1) && usuariosFiltradosDropdown.length > 0 && (
            <ul className="border border-gray-300 rounded bg-white mt-1 max-h-32 overflow-y-auto z-10 absolute left-0 right-0">
              {usuariosFiltradosDropdown.map(nome => {
                const usuarioObj = usuariosUnicos.find(u => u.nome === nome);
                return (
                  <li
                    key={usuarioObj?.id_usuario || nome}
                    className={`px-2 py-1 cursor-pointer hover:bg-blue-100 ${filtroUsuarioNome === nome ? 'bg-blue-200' : ''}`}
                    onClick={() => {
                      setFiltroUsuarioNome(nome);
                      if (usuarioObj) setFiltroUsuario(String(usuarioObj.id_usuario));
                      setIsDropdownUsuarioOpen(false);
                    }}
                  >
                    {nome}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {/* Filtro de livro com autocomplete */}
        <div className="flex flex-col gap-1 min-w-[180px] relative" ref={livroDropdownRef}>
          <input
            type="text"
            className="p-2 border border-gray-400 rounded"
            placeholder="Buscar livro"
            value={filtroLivroTitulo}
            onChange={e => {
              setFiltroLivroTitulo(e.target.value);
              setIsDropdownLivroOpen(true);
            }}
            onFocus={() => setIsDropdownLivroOpen(true)}
            autoComplete="off"
          />
          {isDropdownLivroOpen && (filtroLivroTitulo.length === 0 || filtroLivroTitulo.length > 1) && livrosFiltradosDropdown.length > 0 && (
            <ul className="border border-gray-300 rounded bg-white mt-1 max-h-32 overflow-y-auto z-10 absolute left-0 right-0">
              {livrosFiltradosDropdown.map(titulo => {
                const livroObj = livrosUnicos.find(l => l.titulo === titulo);
                return (
                  <li
                    key={livroObj?.id_livro || titulo}
                    className={`px-2 py-1 cursor-pointer hover:bg-blue-100 ${filtroLivroTitulo === titulo ? 'bg-blue-200' : ''}`}
                    onClick={() => {
                      setFiltroLivroTitulo(titulo);
                      if (livroObj) setFiltroLivro(String(livroObj.id_livro));
                      setIsDropdownLivroOpen(false);
                    }}
                  >
                    {titulo}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="relative min-w-[180px]" ref={dropdownAutorFiltroRef}>
          <input
            type="text"
            className="p-2 border border-gray-400 rounded w-full"
            placeholder="Filtrar por autor"
            value={filtroAutor}
            onChange={e => {
              setFiltroAutor(e.target.value);
              setDropdownAutorFiltroAberto(true);
            }}
            onFocus={() => setDropdownAutorFiltroAberto(true)}
            autoComplete="off"
          />
          {dropdownAutorFiltroAberto && (filtroAutor.length === 0 || filtroAutor.length > 1) && autoresFiltradosDropdown.length > 0 && (
            <ul className="absolute left-0 right-0 border border-gray-300 rounded bg-white mt-1 max-h-40 overflow-y-auto z-20 shadow-lg">
              {autoresFiltradosDropdown.map(autor => (
                <li
                  key={autor}
                  className="px-2 py-1 cursor-pointer hover:bg-blue-100"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    setFiltroAutor(autor);
                    setDropdownAutorFiltroAberto(false);
                  }}
                >
                  {autor}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="relative min-w-[180px]" ref={dropdownCategoriaFiltroRef}>
          <input
            type="text"
            className="p-2 border border-gray-400 rounded w-full"
            placeholder="Filtrar por categoria"
            value={filtroCategoria}
            onChange={e => {
              setFiltroCategoria(e.target.value);
              setDropdownCategoriaFiltroAberto(true);
            }}
            onFocus={() => setDropdownCategoriaFiltroAberto(true)}
            autoComplete="off"
          />
          {dropdownCategoriaFiltroAberto && (filtroCategoria.length === 0 || filtroCategoria.length > 1) && categoriasFiltradasDropdown.length > 0 && (
            <ul className="absolute left-0 right-0 border border-gray-300 rounded bg-white mt-1 max-h-40 overflow-y-auto z-20 shadow-lg">
              {categoriasFiltradasDropdown.map(categoria => (
                <li
                  key={categoria}
                  className="px-2 py-1 cursor-pointer hover:bg-blue-100"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    setFiltroCategoria(categoria);
                    setDropdownCategoriaFiltroAberto(false);
                  }}
                >
                  {categoria}
                </li>
              ))}
            </ul>
          )}
        </div>
        <select
          className="p-2 border border-gray-400 rounded min-w-[180px]"
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="ativo">Em andamento</option>
          <option value="devolvido">Devolvido</option>
          <option value="atrasado">Atrasado</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 rounded">
          <thead className="bg-blue-100">
            <tr>
              <th className="px-4 py-2 text-left">Exemplar</th>
              <th className="px-4 py-2 text-left">Usuário</th>
              <th className="px-4 py-2 text-left">Data de Empréstimo</th>
              <th className="px-4 py-2 text-left">Data de Devolução</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrarEmprestimos().map(e => (
              <tr key={e.id_emprestimo} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-2">{e.exemplar.codigo_identificacao}</td>
                <td className="px-4 py-2">{e.usuario.nome}</td>
                <td className="px-4 py-2">{e.data_retirada}</td>
                <td className="px-4 py-2">{e.data_efetiva_devolucao || <span className="text-gray-400">—</span>}</td>
                <td className="px-4 py-2">
                  <span className={
                    e.status_emprestimo === "ativo"
                      ? "bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs"
                      : e.status_emprestimo === "devolvido"
                      ? "bg-green-200 text-green-800 px-2 py-1 rounded text-xs"
                      : "bg-red-200 text-red-800 px-2 py-1 rounded text-xs"
                  }>
                    {statusEmprestimoLabel(e.status_emprestimo)}
                  </span>
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    className="px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800 text-xs"
                    onClick={() => setModalDetalhes(e)}
                  >Detalhes</button>
                  {e.status_emprestimo === "ativo" && (
                    <button
                      className="px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800 text-xs"
                      onClick={() => registrarDevolucao(e.id_emprestimo)}
                    >Registrar Devolução</button>
                  )}
                </td>
              </tr>
            ))}
            {filtrarEmprestimos().length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-8">Nenhum empréstimo encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Modal de detalhes */}
      {modalDetalhes && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 min-w-[320px] max-w-[90vw]">
            <h2 className="text-xl font-bold mb-2">Detalhes do Empréstimo</h2>
            <div className="mb-2"><b>Exemplar:</b> {modalDetalhes.exemplar.codigo_identificacao}</div>
            {livroDetalhe && (
              <>
                <div className="mb-2"><b>Título do Livro:</b> {livroDetalhe.titulo}</div>
                <div className="mb-2"><b>Autor(es):</b> {livroDetalhe.autores.join(", ")}</div>
              </>
            )}
            <div className="mb-2"><b>Usuário:</b> {modalDetalhes.usuario.nome}</div>
            <div className="mb-2"><b>Data de Empréstimo:</b> {modalDetalhes.data_retirada}</div>
            <div className="mb-2"><b>Data de Devolução:</b> {modalDetalhes.data_efetiva_devolucao || <span className="text-gray-400">—</span>}</div>
            <div className="mb-2"><b>Status:</b> {modalDetalhes.status_emprestimo}</div>
            <button
              className="mt-4 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
              onClick={() => setModalDetalhes(null)}
            >Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(EmprestimosPage, ['funcionario']);
