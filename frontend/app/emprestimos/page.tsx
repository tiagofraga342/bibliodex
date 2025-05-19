"use client";
import * as React from "react";
import { useState, useEffect } from "react";

interface Emprestimo {
  id: number;
  livro: { id: number; titulo: string; autor: string; categoria?: string };
  usuario: { id: number; nome: string; tipo: string };
  dataEmprestimo: string;
  dataDevolucao: string | null;
  status: "Em andamento" | "Devolvido";
}

export default function PainelEmprestimos() {
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [filtroLivro, setFiltroLivro] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [modalDetalhes, setModalDetalhes] = useState<Emprestimo | null>(null);

  // Estados e refs para dropdowns
  const [isDropdownUsuarioOpen, setIsDropdownUsuarioOpen] = useState(false);
  const usuarioDropdownRef = React.useRef<HTMLDivElement>(null);
  const [isDropdownLivroOpen, setIsDropdownLivroOpen] = useState(false);
  const livroDropdownRef = React.useRef<HTMLDivElement>(null);

  // Dropdowns para autor e categoria (filtros)
  const [dropdownAutorFiltroAberto, setDropdownAutorFiltroAberto] = React.useState(false);
  const dropdownAutorFiltroRef = React.useRef<HTMLDivElement>(null);
  const [dropdownCategoriaFiltroAberto, setDropdownCategoriaFiltroAberto] = React.useState(false);
  const dropdownCategoriaFiltroRef = React.useRef<HTMLDivElement>(null);
  const [autoresFiltradosDropdown, setAutoresFiltradosDropdown] = React.useState<string[]>([]);
  const [categoriasFiltradasDropdown, setCategoriasFiltradasDropdown] = React.useState<string[]>([]);
  const [filtroAutor, setFiltroAutor] = React.useState("");
  const [filtroCategoria, setFiltroCategoria] = React.useState("");

  // Dropdowns para usuário e livro (filtros)
  const [dropdownUsuarioFiltroAberto, setDropdownUsuarioFiltroAberto] = React.useState(false);
  const dropdownUsuarioFiltroRef = React.useRef<HTMLDivElement>(null);
  const [dropdownLivroFiltroAberto, setDropdownLivroFiltroAberto] = React.useState(false);
  const dropdownLivroFiltroRef = React.useRef<HTMLDivElement>(null);
  const [usuariosFiltradosDropdown, setUsuariosFiltradosDropdown] = React.useState<string[]>([]);
  const [livrosFiltradosDropdown, setLivrosFiltradosDropdown] = React.useState<string[]>([]);
  const [filtroUsuarioNome, setFiltroUsuarioNome] = React.useState("");
  const [filtroLivroTitulo, setFiltroLivroTitulo] = React.useState("");

  // Gerar listas únicas de autores/categorias
  const autoresUnicos = React.useMemo(() => Array.from(new Set(emprestimos.map(e => e.livro.autor))).sort(), [emprestimos]);
  const categoriasUnicas = React.useMemo(() => Array.from(new Set(emprestimos.map(e => e.livro.categoria).filter(Boolean))).sort(), [emprestimos]);

  // Gerar listas únicas de usuários/livros
  const usuariosUnicos = React.useMemo(() => Array.from(new Set(emprestimos.map(e => e.usuario.nome))).sort(), [emprestimos]);
  const livrosUnicos = React.useMemo(() => Array.from(new Set(emprestimos.map(e => e.livro.titulo))).sort(), [emprestimos]);

  // Atualizar dropdown de autores
  React.useEffect(() => {
    if (filtroAutor.length === 0) {
      setAutoresFiltradosDropdown(autoresUnicos);
    } else if (filtroAutor.length > 1) {
      setAutoresFiltradosDropdown(autoresUnicos.filter(a => a.toLowerCase().includes(filtroAutor.toLowerCase())));
    } else {
      setAutoresFiltradosDropdown([]);
    }
  }, [filtroAutor, autoresUnicos]);

  // Atualizar dropdown de categorias
  React.useEffect(() => {
    if (filtroCategoria.length === 0) {
      setCategoriasFiltradasDropdown(categoriasUnicas as string[]);
    } else if (filtroCategoria.length > 1) {
      setCategoriasFiltradasDropdown((categoriasUnicas as string[]).filter(c => c.toLowerCase().includes(filtroCategoria.toLowerCase())));
    } else {
      setCategoriasFiltradasDropdown([]);
    }
  }, [filtroCategoria, categoriasUnicas]);

  // Atualizar dropdown de usuários
  React.useEffect(() => {
    if (filtroUsuarioNome.length === 0) {
      setUsuariosFiltradosDropdown(usuariosUnicos);
    } else if (filtroUsuarioNome.length > 1) {
      setUsuariosFiltradosDropdown(usuariosUnicos.filter(u => u.toLowerCase().includes(filtroUsuarioNome.toLowerCase())));
    } else {
      setUsuariosFiltradosDropdown([]);
    }
  }, [filtroUsuarioNome, usuariosUnicos]);

  // Atualizar dropdown de livros
  React.useEffect(() => {
    if (filtroLivroTitulo.length === 0) {
      setLivrosFiltradosDropdown(livrosUnicos);
    } else if (filtroLivroTitulo.length > 1) {
      setLivrosFiltradosDropdown(livrosUnicos.filter(l => l.toLowerCase().includes(filtroLivroTitulo.toLowerCase())));
    } else {
      setLivrosFiltradosDropdown([]);
    }
  }, [filtroLivroTitulo, livrosUnicos]);

  // Fechar dropdown ao clicar fora
  React.useEffect(() => {
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
      if (dropdownUsuarioFiltroRef.current && !dropdownUsuarioFiltroRef.current.contains(event.target as Node)) {
        setDropdownUsuarioFiltroAberto(false);
      }
      if (dropdownLivroFiltroRef.current && !dropdownLivroFiltroRef.current.contains(event.target as Node)) {
        setDropdownLivroFiltroAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [emprestimosRes, usuariosRes, livrosRes] = await Promise.all([
          fetch('/api/emprestimos'),
          fetch('/api/usuarios'),
          fetch('/api/livros')
        ]);

        const [emprestimosData, usuariosData, livrosData] = await Promise.all([
          emprestimosRes.json(),
          usuariosRes.json(),
          livrosRes.json()
        ]);

        setEmprestimos(emprestimosData);
        // Atualizar estados de usuários e livros se necessário
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    }

    fetchData();
  }, []);

  function filtrarEmprestimos() {
    return emprestimos.filter(e =>
      (!filtroUsuario || String(e.usuario.id) === filtroUsuario) &&
      (!filtroLivro || String(e.livro.id) === filtroLivro) &&
      (!filtroStatus || e.status === filtroStatus) &&
      (!filtroAutor || e.livro.autor === filtroAutor) &&
      (!filtroCategoria || e.livro.categoria === filtroCategoria)
    );
  }

  function registrarDevolucao(id: number) {
    setEmprestimos(emps =>
      emps.map(e =>
        e.id === id && e.status === "Em andamento"
          ? { ...e, status: "Devolvido", dataDevolucao: new Date().toISOString().slice(0, 10) }
          : e
      )
    );
  }

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
          {isDropdownUsuarioOpen && filtroUsuarioNome.length > 1 && usuariosFiltradosDropdown.length > 0 && (
            <ul className="border border-gray-300 rounded bg-white mt-1 max-h-32 overflow-y-auto z-10 absolute left-0 right-0">
              {usuariosFiltradosDropdown.map(usuario => (
                <li
                  key={usuario}
                  className={`px-2 py-1 cursor-pointer hover:bg-blue-100 ${filtroUsuario === String(usuario) ? 'bg-blue-200' : ''}`}
                  onClick={() => {
                    setFiltroUsuario(String(usuario));
                    setFiltroUsuarioNome(usuario);
                    setIsDropdownUsuarioOpen(false);
                  }}
                >
                  {usuario}
                </li>
              ))}
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
          {isDropdownLivroOpen && filtroLivroTitulo.length > 1 && livrosFiltradosDropdown.length > 0 && (
            <ul className="border border-gray-300 rounded bg-white mt-1 max-h-32 overflow-y-auto z-10 absolute left-0 right-0">
              {livrosFiltradosDropdown.map(livro => (
                <li
                  key={livro}
                  className={`px-2 py-1 cursor-pointer hover:bg-blue-100 ${filtroLivro === String(livro) ? 'bg-blue-200' : ''}`}
                  onClick={() => {
                    setFiltroLivro(String(livro));
                    setFiltroLivroTitulo(livro);
                    setIsDropdownLivroOpen(false);
                  }}
                >
                  {livro}
                </li>
              ))}
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
        <div className="relative min-w-[180px]" ref={dropdownUsuarioFiltroRef}>
          <input
            type="text"
            className="p-2 border border-gray-400 rounded w-full"
            placeholder="Filtrar por usuário"
            value={filtroUsuarioNome}
            onChange={e => {
              setFiltroUsuarioNome(e.target.value);
              setDropdownUsuarioFiltroAberto(true);
            }}
            onFocus={() => setDropdownUsuarioFiltroAberto(true)}
            autoComplete="off"
          />
          {dropdownUsuarioFiltroAberto && (filtroUsuarioNome.length === 0 || filtroUsuarioNome.length > 1) && usuariosFiltradosDropdown.length > 0 && (
            <ul className="absolute left-0 right-0 border border-gray-300 rounded bg-white mt-1 max-h-40 overflow-y-auto z-20 shadow-lg">
              {usuariosFiltradosDropdown.map(usuario => (
                <li
                  key={usuario}
                  className="px-2 py-1 cursor-pointer hover:bg-blue-100"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    setFiltroUsuarioNome(usuario);
                    setDropdownUsuarioFiltroAberto(false);
                  }}
                >
                  {usuario}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="relative min-w-[180px]" ref={dropdownLivroFiltroRef}>
          <input
            type="text"
            className="p-2 border border-gray-400 rounded w-full"
            placeholder="Filtrar por livro"
            value={filtroLivroTitulo}
            onChange={e => {
              setFiltroLivroTitulo(e.target.value);
              setDropdownLivroFiltroAberto(true);
            }}
            onFocus={() => setDropdownLivroFiltroAberto(true)}
            autoComplete="off"
          />
          {dropdownLivroFiltroAberto && (filtroLivroTitulo.length === 0 || filtroLivroTitulo.length > 1) && livrosFiltradosDropdown.length > 0 && (
            <ul className="absolute left-0 right-0 border border-gray-300 rounded bg-white mt-1 max-h-40 overflow-y-auto z-20 shadow-lg">
              {livrosFiltradosDropdown.map(livro => (
                <li
                  key={livro}
                  className="px-2 py-1 cursor-pointer hover:bg-blue-100"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    setFiltroLivroTitulo(livro);
                    setDropdownLivroFiltroAberto(false);
                  }}
                >
                  {livro}
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
          <option value="Em andamento">Em andamento</option>
          <option value="Devolvido">Devolvido</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 rounded">
          <thead className="bg-blue-100">
            <tr>
              <th className="px-4 py-2 text-left">Livro</th>
              <th className="px-4 py-2 text-left">Usuário</th>
              <th className="px-4 py-2 text-left">Data de Empréstimo</th>
              <th className="px-4 py-2 text-left">Data de Devolução</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrarEmprestimos().map(e => (
              <tr key={e.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-2">{e.livro.titulo} <span className="text-xs text-gray-500">({e.livro.autor})</span></td>
                <td className="px-4 py-2">{e.usuario.nome} <span className="text-xs text-gray-500">({e.usuario.tipo})</span></td>
                <td className="px-4 py-2">{e.dataEmprestimo}</td>
                <td className="px-4 py-2">{e.dataDevolucao || <span className="text-gray-400">—</span>}</td>
                <td className="px-4 py-2">
                  <span className={
                    e.status === "Em andamento"
                      ? "bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs"
                      : "bg-green-200 text-green-800 px-2 py-1 rounded text-xs"
                  }>
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    className="px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800 text-xs"
                    onClick={() => setModalDetalhes(e)}
                  >Detalhes</button>
                  {e.status === "Em andamento" && (
                    <button
                      className="px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800 text-xs"
                      onClick={() => registrarDevolucao(e.id)}
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
            <div className="mb-2"><b>Livro:</b> {modalDetalhes.livro.titulo} ({modalDetalhes.livro.autor})</div>
            <div className="mb-2"><b>Usuário:</b> {modalDetalhes.usuario.nome} ({modalDetalhes.usuario.tipo})</div>
            <div className="mb-2"><b>Data de Empréstimo:</b> {modalDetalhes.dataEmprestimo}</div>
            <div className="mb-2"><b>Data de Devolução:</b> {modalDetalhes.dataDevolucao || <span className="text-gray-400">—</span>}</div>
            <div className="mb-2"><b>Status:</b> {modalDetalhes.status}</div>
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
