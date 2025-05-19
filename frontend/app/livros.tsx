"use client";
import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import api from './api';

interface Livro {
  id: number;
  titulo: string;
  autor: string;
  categoria?: string;
}

interface Filtros {
  titulo: string;
  autor: string;
  categoria: string;
}

interface Usuario {
  id: number;
  nome: string;
  tipo: string;
}

export default function Livros() {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState<Filtros>({ titulo: '', autor: '', categoria: '' });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalLivro, setModalLivro] = useState<Livro | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioId, setUsuarioId] = useState<string>("");
  const [mensagem, setMensagem] = useState<string>("");
  const modalRef = useRef<HTMLDialogElement>(null);
  const [modalReservaLivro, setModalReservaLivro] = useState<Livro | null>(null);
  const [mensagemReserva, setMensagemReserva] = useState<string>("");
  const modalReservaRef = useRef<HTMLDialogElement>(null);
  const [buscaUsuario, setBuscaUsuario] = useState("");
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
  const [buscaUsuarioReserva, setBuscaUsuarioReserva] = useState("");
  const [usuariosFiltradosReserva, setUsuariosFiltradosReserva] = useState<Usuario[]>([]);
  const [buscaLivroEmprestimo, setBuscaLivroEmprestimo] = useState("");
  const [livrosFiltradosEmprestimo, setLivrosFiltradosEmprestimo] = useState<Livro[]>([]);
  const [buscaLivroReserva, setBuscaLivroReserva] = useState("");
  const [livrosFiltradosReserva, setLivrosFiltradosReserva] = useState<Livro[]>([]);
  const [buscaLivroFiltro, setBuscaLivroFiltro] = useState("");
  const [livrosFiltradosDropdown, setLivrosFiltradosDropdown] = useState<Livro[]>([]);
  const [dropdownLivroFiltroAberto, setDropdownLivroFiltroAberto] = useState(false);
  const dropdownLivroFiltroRef = useRef<HTMLDivElement>(null);
  const [dropdownUsuarioEmprestimoAberto, setDropdownUsuarioEmprestimoAberto] = useState(false);
  const dropdownUsuarioEmprestimoRef = useRef<HTMLDivElement>(null);
  const [dropdownLivroEmprestimoAberto, setDropdownLivroEmprestimoAberto] = useState(false);
  const dropdownLivroEmprestimoRef = useRef<HTMLDivElement>(null);
  const [dropdownUsuarioReservaAberto, setDropdownUsuarioReservaAberto] = useState(false);
  const dropdownUsuarioReservaRef = useRef<HTMLDivElement>(null);
  const [dropdownLivroReservaAberto, setDropdownLivroReservaAberto] = useState(false);
  const dropdownLivroReservaRef = useRef<HTMLDivElement>(null);

  // Dropdowns para autor e categoria (filtros)
  const [dropdownAutorFiltroAberto, setDropdownAutorFiltroAberto] = useState(false);
  const dropdownAutorFiltroRef = useRef<HTMLDivElement>(null);
  const [dropdownCategoriaFiltroAberto, setDropdownCategoriaFiltroAberto] = useState(false);
  const dropdownCategoriaFiltroRef = useRef<HTMLDivElement>(null);
  const [autoresFiltradosDropdown, setAutoresFiltradosDropdown] = useState<string[]>([]);
  const [categoriasFiltradasDropdown, setCategoriasFiltradasDropdown] = useState<string[]>([]);

  // Gerar listas únicas de autores/categorias
  const autoresUnicos = React.useMemo(() => Array.from(new Set(livros.map(l => l.autor))).sort(), [livros]);
  const categoriasUnicas = React.useMemo(() => Array.from(new Set(livros.map(l => l.categoria).filter(Boolean))).sort(), [livros]);

  // Atualizar dropdown de autores
  useEffect(() => {
    if (filtros.autor.length === 0) {
      setAutoresFiltradosDropdown(autoresUnicos);
    } else if (filtros.autor.length > 1) {
      setAutoresFiltradosDropdown(autoresUnicos.filter(a => a.toLowerCase().includes(filtros.autor.toLowerCase())));
    } else {
      setAutoresFiltradosDropdown([]);
    }
  }, [filtros.autor, autoresUnicos]);

  // Atualizar dropdown de categorias
  useEffect(() => {
    if (filtros.categoria.length === 0) {
      setCategoriasFiltradasDropdown(categoriasUnicas as string[]);
    } else if (filtros.categoria.length > 1) {
      setCategoriasFiltradasDropdown((categoriasUnicas as string[]).filter(c => c.toLowerCase().includes(filtros.categoria.toLowerCase())));
    } else {
      setCategoriasFiltradasDropdown([]);
    }
  }, [filtros.categoria, categoriasUnicas]);

  useEffect(() => {
    api.get<Livro[]>('/livros/')
      .then((res) => {
        setLivros(res.data);
        setLoading(false);
      })
      .catch(() => {
        setErro('Erro ao buscar livros');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (modalLivro && buscaUsuario.length > 1) {
      api.get<Usuario[]>(`/usuarios?nome=${buscaUsuario}`).then((res) => setUsuariosFiltrados(res.data));
    } else {
      setUsuariosFiltrados([]);
    }
  }, [buscaUsuario, modalLivro]);

  useEffect(() => {
    if (modalReservaLivro && buscaUsuarioReserva.length > 1) {
      api.get<Usuario[]>(`/usuarios?nome=${buscaUsuarioReserva}`).then((res) => setUsuariosFiltradosReserva(res.data));
    } else {
      setUsuariosFiltradosReserva([]);
    }
  }, [buscaUsuarioReserva, modalReservaLivro]);

  useEffect(() => {
    if (modalLivro && buscaLivroEmprestimo.length > 1) {
      api.get<Livro[]>(`/livros?titulo=${buscaLivroEmprestimo}`).then((res) => setLivrosFiltradosEmprestimo(res.data));
    } else {
      setLivrosFiltradosEmprestimo([]);
    }
  }, [buscaLivroEmprestimo, modalLivro, livros]);

  useEffect(() => {
    if (modalReservaLivro && buscaLivroReserva.length > 1) {
      api.get<Livro[]>(`/livros?titulo=${buscaLivroReserva}`).then((res) => setLivrosFiltradosReserva(res.data));
    } else {
      setLivrosFiltradosReserva([]);
    }
  }, [buscaLivroReserva, modalReservaLivro, livros]);

  useEffect(() => {
    // Se não digitou nada, mostra todos os livros
    if (buscaLivroFiltro.length === 0) {
      setLivrosFiltradosDropdown(livros);
    } else if (buscaLivroFiltro.length > 1) {
      api.get<Livro[]>(`/livros?titulo=${buscaLivroFiltro}`).then((res) => setLivrosFiltradosDropdown(res.data));
    } else {
      setLivrosFiltradosDropdown([]);
    }
  }, [buscaLivroFiltro, livros]);

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownLivroFiltroRef.current &&
        !dropdownLivroFiltroRef.current.contains(event.target as Node)
      ) setDropdownLivroFiltroAberto(false);
      if (
        dropdownUsuarioEmprestimoRef.current &&
        !dropdownUsuarioEmprestimoRef.current.contains(event.target as Node)
      ) setDropdownUsuarioEmprestimoAberto(false);
      if (
        dropdownLivroEmprestimoRef.current &&
        !dropdownLivroEmprestimoRef.current.contains(event.target as Node)
      ) setDropdownLivroEmprestimoAberto(false);
      if (
        dropdownUsuarioReservaRef.current &&
        !dropdownUsuarioReservaRef.current.contains(event.target as Node)
      ) setDropdownUsuarioReservaAberto(false);
      if (
        dropdownLivroReservaRef.current &&
        !dropdownLivroReservaRef.current.contains(event.target as Node)
      ) setDropdownLivroReservaAberto(false);
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

  function abrirModalEmprestimo(livro: Livro) {
    setModalLivro(livro);
    setUsuarioId("");
    setMensagem("");
    setTimeout(() => modalRef.current?.showModal(), 0);
  }

  function fecharModal() {
    setModalLivro(null);
    setMensagem("");
    modalRef.current?.close();
  }

  function handleEmprestimo(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioId) {
      setMensagem("Selecione um usuário.");
      return;
    }
    // Aqui faria a requisição para registrar o empréstimo
    setMensagem("Empréstimo realizado com sucesso!");
    setTimeout(() => fecharModal(), 1200);
  }

  function abrirModalReserva(livro: Livro) {
    setModalReservaLivro(livro);
    setUsuarioId("");
    setMensagemReserva("");
    setTimeout(() => modalReservaRef.current?.showModal(), 0);
  }

  function fecharModalReserva() {
    setModalReservaLivro(null);
    setMensagemReserva("");
    modalReservaRef.current?.close();
  }

  function handleReserva(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioId) {
      setMensagemReserva("Selecione um usuário.");
      return;
    }
    setMensagemReserva("Reserva realizada com sucesso!");
    setTimeout(() => fecharModalReserva(), 1200);
  }

  const livrosFiltrados = livros.filter((livro) => {
    const buscaTermo = busca.toLowerCase();
    const matchBusca = !buscaTermo ||
      livro.titulo.toLowerCase().includes(buscaTermo) ||
      livro.autor.toLowerCase().includes(buscaTermo) ||
      (livro.categoria?.toLowerCase().includes(buscaTermo) ?? false);
    const matchTitulo = !filtros.titulo || livro.titulo.toLowerCase().includes(filtros.titulo.toLowerCase());
    const matchAutor = !filtros.autor || livro.autor.toLowerCase().includes(filtros.autor.toLowerCase());
    const matchCategoria = !filtros.categoria || (livro.categoria?.toLowerCase().includes(filtros.categoria.toLowerCase()) ?? false);
    return matchBusca && matchTitulo && matchAutor && matchCategoria;
  });

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Consulta de Livros</h1>
      <div className="flex flex-col gap-2 mb-6">
        <input
          type="text"
          placeholder="Busca geral (título, autor ou categoria)"
          className="w-full p-2 border border-gray-400 text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative w-full" ref={dropdownLivroFiltroRef}>
            <input
              type="text"
              placeholder="Filtrar por título"
              className="w-full p-2 border border-gray-400 text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              value={buscaLivroFiltro}
              onChange={e => {
                setBuscaLivroFiltro(e.target.value);
                setFiltros(f => ({ ...f, titulo: e.target.value }));
                setDropdownLivroFiltroAberto(true);
              }}
              onFocus={() => setDropdownLivroFiltroAberto(true)}
              autoComplete="off"
            />
            {dropdownLivroFiltroAberto && (buscaLivroFiltro.length === 0 || buscaLivroFiltro.length > 1) && livrosFiltradosDropdown.length > 0 && (
              <ul className="absolute left-0 right-0 border border-gray-300 rounded bg-white mt-1 max-h-40 overflow-y-auto z-20 shadow-lg">
                {livrosFiltradosDropdown.map(livro => (
                  <li
                    key={livro.id}
                    className="px-2 py-1 cursor-pointer hover:bg-blue-100"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => {
                      setBuscaLivroFiltro(livro.titulo);
                      setFiltros(f => ({ ...f, titulo: livro.titulo }));
                      setLivrosFiltradosDropdown([]);
                      setDropdownLivroFiltroAberto(false);
                    }}
                  >
                    {livro.titulo} <span className="text-xs text-gray-500">({livro.autor})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="relative w-full" ref={dropdownAutorFiltroRef}>
            <input
              type="text"
              placeholder="Filtrar por autor"
              className="w-full p-2 border border-gray-400 text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              value={filtros.autor}
              onChange={e => {
                setFiltros(f => ({ ...f, autor: e.target.value }));
                setDropdownAutorFiltroAberto(true);
              }}
              onFocus={() => setDropdownAutorFiltroAberto(true)}
              autoComplete="off"
            />
            {dropdownAutorFiltroAberto && (filtros.autor.length === 0 || filtros.autor.length > 1) && autoresFiltradosDropdown.length > 0 && (
              <ul className="absolute left-0 right-0 border border-gray-300 rounded bg-white mt-1 max-h-40 overflow-y-auto z-20 shadow-lg">
                {autoresFiltradosDropdown.map(autor => (
                  <li
                    key={autor}
                    className="px-2 py-1 cursor-pointer hover:bg-blue-100"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => {
                      setFiltros(f => ({ ...f, autor }));
                      setDropdownAutorFiltroAberto(false);
                    }}
                  >
                    {autor}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="relative w-full" ref={dropdownCategoriaFiltroRef}>
            <input
              type="text"
              placeholder="Filtrar por categoria"
              className="w-full p-2 border border-gray-400 text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              value={filtros.categoria}
              onChange={e => {
                setFiltros(f => ({ ...f, categoria: e.target.value }));
                setDropdownCategoriaFiltroAberto(true);
              }}
              onFocus={() => setDropdownCategoriaFiltroAberto(true)}
              autoComplete="off"
            />
            {dropdownCategoriaFiltroAberto && (filtros.categoria.length === 0 || filtros.categoria.length > 1) && categoriasFiltradasDropdown.length > 0 && (
              <ul className="absolute left-0 right-0 border border-gray-300 rounded bg-white mt-1 max-h-40 overflow-y-auto z-20 shadow-lg">
                {categoriasFiltradasDropdown.map(categoria => (
                  <li
                    key={categoria}
                    className="px-2 py-1 cursor-pointer hover:bg-blue-100"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => {
                      setFiltros(f => ({ ...f, categoria }));
                      setDropdownCategoriaFiltroAberto(false);
                    }}
                  >
                    {categoria}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      {loading && <div className="text-center mt-8">Carregando...</div>}
      {erro && <div className="text-red-500 mt-8">{erro}</div>}
      {!loading && !erro && (
        <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {livrosFiltrados.length === 0 && (
            <li className="col-span-2 text-center text-gray-500">Nenhum livro encontrado.</li>
          )}
          {livrosFiltrados.map((livro) => (
            <li key={livro.id} className="p-4 border rounded bg-white shadow flex flex-col gap-2">
              <span className="font-semibold text-lg text-gray-900">{livro.titulo}</span>
              <span className="text-gray-700">Autor: {livro.autor}</span>
              {livro.categoria && <span className="text-gray-500 text-sm">Categoria: {livro.categoria}</span>}
              <div className="flex gap-2 mt-2">
                <button
                  className="px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800 w-fit"
                  onClick={() => abrirModalEmprestimo(livro)}
                >
                  Emprestar
                </button>
                <button
                  className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 w-fit"
                  onClick={() => abrirModalReserva(livro)}
                >
                  Reservar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {modalLivro && (
        <dialog ref={modalRef} className="rounded-lg p-0 w-full max-w-md">
          <form method="dialog" onSubmit={handleEmprestimo} className="flex flex-col gap-4 p-6 bg-white">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Emprestar livro</h2>
            <label className="font-semibold text-gray-900">
              Livro:
              <div className="relative" ref={dropdownLivroEmprestimoRef}>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-400 rounded mt-1"
                  placeholder="Digite o título do livro"
                  value={buscaLivroEmprestimo}
                  onChange={e => {
                    setBuscaLivroEmprestimo(e.target.value);
                    setDropdownLivroEmprestimoAberto(true);
                  }}
                  onFocus={() => setDropdownLivroEmprestimoAberto(true)}
                />
                {dropdownLivroEmprestimoAberto && buscaLivroEmprestimo.length > 1 && livrosFiltradosEmprestimo.length > 0 && (
                  <ul className="border border-gray-300 rounded bg-white mt-1 max-h-32 overflow-y-auto z-10">
                    {livrosFiltradosEmprestimo.map(livro => (
                      <li
                        key={livro.id}
                        className={`px-2 py-1 cursor-pointer hover:bg-blue-100 ${modalLivro?.id === livro.id ? 'bg-blue-200' : ''}`}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setModalLivro(livro);
                          setBuscaLivroEmprestimo(livro.titulo);
                          setLivrosFiltradosEmprestimo([]);
                          setDropdownLivroEmprestimoAberto(false);
                        }}
                      >
                        {livro.titulo} <span className="text-xs text-gray-500">({livro.autor})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </label>
            <div>
              <span className="font-semibold">Livro selecionado:</span> {modalLivro.titulo} <br />
              <span className="font-semibold">Autor:</span> {modalLivro.autor}
            </div>
            <label className="font-semibold text-gray-900">
              Usuário:
              <div className="relative" ref={dropdownUsuarioEmprestimoRef}>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-400 rounded mt-1"
                  placeholder="Digite o nome do usuário"
                  value={buscaUsuario}
                  onChange={e => {
                    setBuscaUsuario(e.target.value);
                    setUsuarioId("");
                    setDropdownUsuarioEmprestimoAberto(true);
                  }}
                  onFocus={() => setDropdownUsuarioEmprestimoAberto(true)}
                  required
                />
                {dropdownUsuarioEmprestimoAberto && buscaUsuario.length > 1 && usuariosFiltrados.length > 0 && (
                  <ul className="border border-gray-300 rounded bg-white mt-1 max-h-32 overflow-y-auto z-10">
                    {usuariosFiltrados.map(usuario => (
                      <li
                        key={usuario.id}
                        className={`px-2 py-1 cursor-pointer hover:bg-blue-100 ${usuarioId === String(usuario.id) ? 'bg-blue-200' : ''}`}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setUsuarioId(String(usuario.id));
                          setBuscaUsuario(usuario.nome);
                          setUsuariosFiltrados([]);
                          setDropdownUsuarioEmprestimoAberto(false);
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
              <button type="button" onClick={fecharModal} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 font-semibold">Cancelar</button>
            </div>
            {mensagem && <div className="text-green-700 font-semibold mt-2">{mensagem}</div>}
          </form>
        </dialog>
      )}
      {modalReservaLivro && (
        <dialog ref={modalReservaRef} className="rounded-lg p-0 w-full max-w-md">
          <form method="dialog" onSubmit={handleReserva} className="flex flex-col gap-4 p-6 bg-white">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Reservar livro</h2>
            <label className="font-semibold text-gray-900">
              Livro:
              <div className="relative" ref={dropdownLivroReservaRef}>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-400 rounded mt-1"
                  placeholder="Digite o título do livro"
                  value={buscaLivroReserva}
                  onChange={e => {
                    setBuscaLivroReserva(e.target.value);
                    setDropdownLivroReservaAberto(true);
                  }}
                  onFocus={() => setDropdownLivroReservaAberto(true)}
                />
                {dropdownLivroReservaAberto && buscaLivroReserva.length > 1 && livrosFiltradosReserva.length > 0 && (
                  <ul className="border border-gray-300 rounded bg-white mt-1 max-h-32 overflow-y-auto z-10">
                    {livrosFiltradosReserva.map(livro => (
                      <li
                        key={livro.id}
                        className={`px-2 py-1 cursor-pointer hover:bg-yellow-100 ${modalReservaLivro?.id === livro.id ? 'bg-yellow-200' : ''}`}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setModalReservaLivro(livro);
                          setBuscaLivroReserva(livro.titulo);
                          setLivrosFiltradosReserva([]);
                          setDropdownLivroReservaAberto(false);
                        }}
                      >
                        {livro.titulo} <span className="text-xs text-gray-500">({livro.autor})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </label>
            <div>
              <span className="font-semibold">Livro selecionado:</span> {modalReservaLivro.titulo} <br />
              <span className="font-semibold">Autor:</span> {modalReservaLivro.autor}
            </div>
            <label className="font-semibold text-gray-900">
              Usuário:
              <div className="relative" ref={dropdownUsuarioReservaRef}>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-400 rounded mt-1"
                  placeholder="Digite o nome do usuário"
                  value={buscaUsuarioReserva}
                  onChange={e => {
                    setBuscaUsuarioReserva(e.target.value);
                    setUsuarioId("");
                    setDropdownUsuarioReservaAberto(true);
                  }}
                  onFocus={() => setDropdownUsuarioReservaAberto(true)}
                  required
                />
                {dropdownUsuarioReservaAberto && buscaUsuarioReserva.length > 1 && usuariosFiltradosReserva.length > 0 && (
                  <ul className="border border-gray-300 rounded bg-white mt-1 max-h-32 overflow-y-auto z-10">
                    {usuariosFiltradosReserva.map(usuario => (
                      <li
                        key={usuario.id}
                        className={`px-2 py-1 cursor-pointer hover:bg-yellow-100 ${usuarioId === String(usuario.id) ? 'bg-yellow-200' : ''}`}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setUsuarioId(String(usuario.id));
                          setBuscaUsuarioReserva(usuario.nome);
                          setUsuariosFiltradosReserva([]);
                          setDropdownUsuarioReservaAberto(false);
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
              <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 font-semibold">Confirmar</button>
              <button type="button" onClick={fecharModalReserva} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 font-semibold">Cancelar</button>
            </div>
            {mensagemReserva && <div className="text-green-700 font-semibold mt-2">{mensagemReserva}</div>}
          </form>
        </dialog>
      )}
    </div>
  );
}
