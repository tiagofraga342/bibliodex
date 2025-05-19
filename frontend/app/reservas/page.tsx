"use client";
import * as React from "react";
import { useState } from "react";

interface Reserva {
  id: number;
  livro: { id: number; titulo: string; autor: string; categoria?: string };
  usuario: { id: number; nome: string; tipo: string };
  dataReserva: string;
  status: "Ativa" | "Cancelada" | "Efetivada";
}

const MOCK_RESERVAS: Reserva[] = [
  {
    id: 1,
    livro: { id: 1, titulo: "Estruturas de Dados", autor: "N. Wirth", categoria: "Tecnologia" },
    usuario: { id: 1, nome: "João Silva", tipo: "aluno" },
    dataReserva: "2024-05-10",
    status: "Ativa",
  },
  {
    id: 2,
    livro: { id: 2, titulo: "Banco de Dados", autor: "Elmasri", categoria: "Tecnologia" },
    usuario: { id: 2, nome: "Maria Souza", tipo: "funcionario" },
    dataReserva: "2024-05-05",
    status: "Efetivada",
  },
  {
    id: 3,
    livro: { id: 3, titulo: "Algoritmos", autor: "Cormen", categoria: "Tecnologia" },
    usuario: { id: 1, nome: "João Silva", tipo: "aluno" },
    dataReserva: "2024-04-28",
    status: "Cancelada",
  },
];

const usuarios = [
  { id: 1, nome: "João Silva", tipo: "aluno" },
  { id: 2, nome: "Maria Souza", tipo: "funcionario" },
];

const livros = [
  { id: 1, titulo: "Estruturas de Dados" },
  { id: 2, titulo: "Banco de Dados" },
  { id: 3, titulo: "Algoritmos" },
];

export default function Reservas() {
  const [reservas, setReservas] = useState<Reserva[]>(MOCK_RESERVAS);
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [filtroLivro, setFiltroLivro] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [modalNova, setModalNova] = useState(false);
  const [livroId, setLivroId] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [buscaUsuarioModal, setBuscaUsuarioModal] = useState("");
  const [usuariosFiltradosModal, setUsuariosFiltradosModal] = useState<{id:number, nome:string, tipo:string}[]>([]);
  const [buscaLivroModal, setBuscaLivroModal] = useState("");
  const [livrosFiltradosModal, setLivrosFiltradosModal] = useState<{id:number, titulo:string, autor:string}[]>([]);

  // Estados e refs para dropdowns dos filtros
  const [isDropdownUsuarioOpen, setIsDropdownUsuarioOpen] = useState(false);
  const usuarioDropdownRef = React.useRef<HTMLDivElement>(null);
  const [isDropdownLivroOpen, setIsDropdownLivroOpen] = useState(false);
  const livroDropdownRef = React.useRef<HTMLDivElement>(null);
  // Estados e refs para dropdowns do modal
  const [isDropdownUsuarioModalOpen, setIsDropdownUsuarioModalOpen] = useState(false);
  const usuarioModalDropdownRef = React.useRef<HTMLDivElement>(null);
  const [isDropdownLivroModalOpen, setIsDropdownLivroModalOpen] = useState(false);
  const livroModalDropdownRef = React.useRef<HTMLDivElement>(null);

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
  const autoresUnicos = React.useMemo(() => Array.from(new Set(reservas.map(r => r.livro.autor))).sort(), [reservas]);
  const categoriasUnicos = React.useMemo(() => Array.from(new Set(reservas.map(r => r.livro.categoria).filter(Boolean))).sort(), [reservas]);

  // Gerar listas únicas de usuários/livros
  const usuariosUnicos = React.useMemo(() => Array.from(new Set(reservas.map(r => r.usuario.nome))).sort(), [reservas]);
  const livrosUnicos = React.useMemo(() => Array.from(new Set(reservas.map(r => r.livro.titulo))).sort(), [reservas]);

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
      setCategoriasFiltradasDropdown(categoriasUnicos as string[]);
    } else if (filtroCategoria.length > 1) {
      setCategoriasFiltradasDropdown((categoriasUnicos as string[]).filter(c => c.toLowerCase().includes(filtroCategoria.toLowerCase())));
    } else {
      setCategoriasFiltradasDropdown([]);
    }
  }, [filtroCategoria, categoriasUnicos]);

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
      if (usuarioModalDropdownRef.current && !usuarioModalDropdownRef.current.contains(event.target as Node)) {
        setIsDropdownUsuarioModalOpen(false);
      }
      if (livroModalDropdownRef.current && !livroModalDropdownRef.current.contains(event.target as Node)) {
        setIsDropdownLivroModalOpen(false);
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

  function filtrarReservas() {
    return reservas.filter(r =>
      (!filtroUsuario || String(r.usuario.id) === filtroUsuario) &&
      (!filtroLivro || String(r.livro.id) === filtroLivro) &&
      (!filtroStatus || r.status === filtroStatus) &&
      (!filtroAutor || r.livro.autor === filtroAutor) &&
      (!filtroCategoria || r.livro.categoria === filtroCategoria)
    );
  }

  function criarReserva(e: React.FormEvent) {
    e.preventDefault();
    if (!livroId || !usuarioId) {
      setMensagem("Selecione o livro e o usuário.");
      return;
    }
    setReservas(rs => [
      ...rs,
      {
        id: rs.length + 1,
        livro: livros.find(l => String(l.id) === livroId)!,
        usuario: usuarios.find(u => String(u.id) === usuarioId)!,
        dataReserva: new Date().toISOString().slice(0, 10),
        status: "Ativa",
      },
    ]);
    setMensagem("Reserva criada com sucesso!");
    setTimeout(() => {
      setModalNova(false);
      setMensagem("");
      setLivroId("");
      setUsuarioId("");
    }, 1200);
  }

  function cancelarReserva(id: number) {
    setReservas(rs =>
      rs.map(r =>
        r.id === id && r.status === "Ativa"
          ? { ...r, status: "Cancelada" }
          : r
      )
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-8 bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Gestão de Reservas</h1>
      <div className="flex flex-wrap gap-4 mb-6">
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
          <option value="Ativa">Ativa</option>
          <option value="Efetivada">Efetivada</option>
          <option value="Cancelada">Cancelada</option>
        </select>
        <button
          className="ml-auto px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 font-semibold"
          onClick={() => setModalNova(true)}
        >Nova Reserva</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 rounded">
          <thead className="bg-blue-100">
            <tr>
              <th className="px-4 py-2 text-left">Livro</th>
              <th className="px-4 py-2 text-left">Usuário</th>
              <th className="px-4 py-2 text-left">Data da Reserva</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrarReservas().map(r => (
              <tr key={r.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-2">{r.livro.titulo} <span className="text-xs text-gray-500">({r.livro.autor})</span></td>
                <td className="px-4 py-2">{r.usuario.nome} <span className="text-xs text-gray-500">({r.usuario.tipo})</span></td>
                <td className="px-4 py-2">{r.dataReserva}</td>
                <td className="px-4 py-2">
                  <span className={
                    r.status === "Ativa"
                      ? "bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs"
                      : r.status === "Efetivada"
                      ? "bg-green-200 text-green-800 px-2 py-1 rounded text-xs"
                      : "bg-red-200 text-red-800 px-2 py-1 rounded text-xs"
                  }>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2 flex gap-2">
                  {r.status === "Ativa" && (
                    <button
                      className="px-3 py-1 bg-red-700 text-white rounded hover:bg-red-800 text-xs"
                      onClick={() => cancelarReserva(r.id)}
                    >Cancelar</button>
                  )}
                </td>
              </tr>
            ))}
            {filtrarReservas().length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-8">Nenhuma reserva encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Modal Nova Reserva */}
      {modalNova && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 min-w-[320px] max-w-[90vw]">
            <h2 className="text-xl font-bold mb-2">Nova Reserva</h2>
            <form onSubmit={criarReserva} className="flex flex-col gap-4">
              <label className="font-semibold text-gray-900">
                Livro:
                <div className="relative" ref={livroModalDropdownRef}>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-400 rounded mt-1"
                    placeholder="Digite o título do livro"
                    value={buscaLivroModal}
                    onChange={e => {
                      setBuscaLivroModal(e.target.value);
                      setIsDropdownLivroModalOpen(true);
                    }}
                    onFocus={() => setIsDropdownLivroModalOpen(true)}
                    required
                  />
                  {isDropdownLivroModalOpen && buscaLivroModal.length > 1 && livrosFiltradosModal.length > 0 && (
                    <ul className="border border-gray-300 rounded bg-white mt-1 max-h-32 overflow-y-auto z-10 absolute left-0 right-0">
                      {livrosFiltradosModal.map(livro => (
                        <li
                          key={livro.id}
                          className={`px-2 py-1 cursor-pointer hover:bg-yellow-100 ${livroId === String(livro.id) ? 'bg-yellow-200' : ''}`}
                          onClick={() => {
                            setLivroId(String(livro.id));
                            setBuscaLivroModal(livro.titulo);
                            setLivrosFiltradosModal([]);
                            setIsDropdownLivroModalOpen(false);
                          }}
                        >
                          {livro.titulo} <span className="text-xs text-gray-500">({livro.autor})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </label>
              <label className="font-semibold text-gray-900">
                Usuário:
                <div className="relative" ref={usuarioModalDropdownRef}>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-400 rounded mt-1"
                    placeholder="Digite o nome do usuário"
                    value={buscaUsuarioModal}
                    onChange={e => {
                      setBuscaUsuarioModal(e.target.value);
                      setUsuarioId("");
                      setIsDropdownUsuarioModalOpen(true);
                    }}
                    onFocus={() => setIsDropdownUsuarioModalOpen(true)}
                    required
                  />
                  {isDropdownUsuarioModalOpen && buscaUsuarioModal.length > 1 && usuariosFiltradosModal.length > 0 && (
                    <ul className="border border-gray-300 rounded bg-white mt-1 max-h-32 overflow-y-auto z-10 absolute left-0 right-0">
                      {usuariosFiltradosModal.map(usuario => (
                        <li
                          key={usuario.id}
                          className={`px-2 py-1 cursor-pointer hover:bg-yellow-100 ${usuarioId === String(usuario.id) ? 'bg-yellow-200' : ''}`}
                          onClick={() => {
                            setUsuarioId(String(usuario.id));
                            setBuscaUsuarioModal(usuario.nome);
                            setUsuariosFiltradosModal([]);
                            setIsDropdownUsuarioModalOpen(false);
                          }}
                        >
                          {usuario.nome} <span className="text-xs text-gray-500">({usuario.tipo})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </label>
              <div className="flex gap-2 mt-2">
                <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 font-semibold">Confirmar</button>
                <button type="button" onClick={() => { setModalNova(false); setMensagem(""); setLivroId(""); setUsuarioId(""); setBuscaLivroModal(""); setBuscaUsuarioModal(""); }} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 font-semibold">Cancelar</button>
              </div>
              {mensagem && <div className="text-green-700 font-semibold mt-2">{mensagem}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
