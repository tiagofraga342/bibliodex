"use client";
import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { fetchLivros, fetchUsuariosAutocomplete } from "./api";
import api, { LivroRead as Livro, UsuarioReadBasic as Usuario } from './api'; // Use tipos da API
import { useAuth } from './contexts/AuthContext'; // Import useAuth

interface Filtros {
  titulo: string;
  autor: string;
  categoria: string;
}

export default function Livros() {
  const { isAuthenticated, user: authUser } = useAuth(); // Get auth state and user
  const [livros, setLivros] = useState<Livro[]>([]);
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState<Filtros>({ titulo: '', autor: '', categoria: '' });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalLivro, setModalLivro] = useState<Livro | null>(null); // For Emprestimo
  const [modalReservaLivro, setModalReservaLivro] = useState<Livro | null>(null); // For Reserva
  const [usuarios, setUsuarios] = useState<Usuario[]>([]); // All users for modal selection
  const [usuarioId, setUsuarioId] = useState<string>(""); // Selected user for action
  const [mensagem, setMensagem] = useState<string>(""); // For Emprestimo modal
  const [mensagemReserva, setMensagemReserva] = useState<string>(""); // For Reserva modal
  
  const modalEmprestimoRef = useRef<HTMLDialogElement>(null); // Renamed for clarity
  const modalReservaRef = useRef<HTMLDialogElement>(null);
  
  const [buscaUsuarioEmprestimo, setBuscaUsuarioEmprestimo] = useState(""); // Renamed
  const [usuariosFiltradosEmprestimo, setUsuariosFiltradosEmprestimo] = useState<Usuario[]>([]); // Renamed
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
  const autoresUnicos = React.useMemo(
    () =>
      Array.from(
        new Set(
          livros.flatMap((l) =>
            Array.isArray(l.autores)
              ? l.autores.map((a) => a.nome)
              : []
          )
        )
      ).sort(),
    [livros]
  );
  const categoriasUnicas = React.useMemo(
    () =>
      Array.from(
        new Set(
          livros
            .map((l) => l.categoria?.nome)
            .filter(Boolean)
        )
      ).sort(),
    [livros]
  );

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

  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);

  useEffect(() => {
    setLoading(true);
    fetchLivros({
      skip: page * pageSize,
      limit: pageSize,
      titulo: filtros.titulo || busca || undefined,
      autor: filtros.autor || undefined,
      categoria_id: undefined, // Adapte se necessário
      sort_by: "titulo",
      sort_dir: "asc",
    })
      .then((res) => {
        setLivros(res.data);
        setLoading(false);
      })
      .catch(() => {
        setErro('Erro ao buscar livros');
        setLoading(false);
      });

    if (isAuthenticated && authUser?.role === 'funcionario') { // Fetch all users if admin is logged in
      api.get<Usuario[]>('/usuarios')
        .then(res => setUsuarios(res.data))
        .catch(() => console.error("Erro ao buscar todos os usuários"));
    }
  }, [isAuthenticated, authUser, busca, filtros, page, pageSize]); // Re-fetch if auth state changes

  useEffect(() => {
    if (modalLivro && buscaUsuarioEmprestimo.length > 1) {
      // Filter from already fetched 'usuarios' if available, or make specific API call
      const filtered = usuarios.filter(u => u.nome.toLowerCase().includes(buscaUsuarioEmprestimo.toLowerCase()));
      setUsuariosFiltradosEmprestimo(filtered);
      // Or: api.get<Usuario[]>(`/api/usuarios?nome=${buscaUsuarioEmprestimo}`).then((res) => setUsuariosFiltradosEmprestimo(res.data));
    } else {
      setUsuariosFiltradosEmprestimo([]);
    }
  }, [buscaUsuarioEmprestimo, modalLivro, usuarios]);

  useEffect(() => {
    if (modalReservaLivro && buscaUsuarioReserva.length > 1) {
      const filtered = usuarios.filter(u => u.nome.toLowerCase().includes(buscaUsuarioReserva.toLowerCase()));
      setUsuariosFiltradosReserva(filtered);
      // Or: api.get<Usuario[]>(`/api/usuarios?nome=${buscaUsuarioReserva}`).then((res) => setUsuariosFiltradosReserva(res.data));
    } else {
      setUsuariosFiltradosReserva([]);
    }
  }, [buscaUsuarioReserva, modalReservaLivro, usuarios]);

  useEffect(() => {
    if (buscaLivroFiltro.length === 0) {
      setLivrosFiltradosDropdown(livros);
    } else if (buscaLivroFiltro.length > 1) {
      // Client-side filtering for dropdown, or use API:
      // api.get<Livro[]>(`/api/livros?titulo=${buscaLivroFiltro}`).then((res) => setLivrosFiltradosDropdown(res.data));
       setLivrosFiltradosDropdown(livros.filter(l => l.titulo.toLowerCase().includes(buscaLivroFiltro.toLowerCase())));
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
    if (!isAuthenticated) {
      alert("Você precisa estar logado para emprestar livros.");
      // Optionally, redirect to login: router.push('/login');
      return;
    }
    setModalLivro(livro);
    setUsuarioId(authUser?.role === 'usuario_cliente' ? String(authUser.user_id) : ""); // Pre-fill for cliente
    setBuscaUsuarioEmprestimo(authUser?.role === 'usuario_cliente' ? authUser.nome || "" : "");
    setMensagem("");
    setTimeout(() => modalEmprestimoRef.current?.showModal(), 0);
  }

  function fecharModalEmprestimo() { // Renamed
    setModalLivro(null);
    setMensagem("");
    setBuscaUsuarioEmprestimo("");
    setUsuariosFiltradosEmprestimo([]);
    modalEmprestimoRef.current?.close();
  }

  async function handleEmprestimo(e: React.FormEvent) {
    e.preventDefault();
    if (!modalLivro || !usuarioId) {
      setMensagem("Livro e Usuário são obrigatórios.");
      return;
    }
    try {
      // Buscar exemplar disponível para o livro selecionado
      const exemplaresRes = await api.get<any[]>(`/livros/${modalLivro.id_livro}/exemplares`);
      const exemplarDisponivel = exemplaresRes.data.find((ex: any) => ex.status === "disponivel");
      if (!exemplarDisponivel) {
        setMensagem("Nenhum exemplar disponível para empréstimo.");
        return;
      }
      // Calcular datas
      const hoje = new Date();
      const data_retirada = hoje.toISOString().slice(0, 10);
      const data_prevista_devolucao = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // 7 dias

      const emprestimoPayload = {
        id_exemplar: exemplarDisponivel.id_exemplar,
        id_usuario: parseInt(usuarioId),
        data_retirada,
        data_prevista_devolucao,
        // id_funcionario_registro: será preenchido pelo backend se funcionário autenticado
      };
      await api.post('/emprestimos', emprestimoPayload);
      setMensagem("Empréstimo realizado com sucesso!");
      setTimeout(() => fecharModalEmprestimo(), 1200);
    } catch (error) {
      console.error("Erro ao realizar empréstimo:", error);
      setMensagem("Falha ao realizar empréstimo.");
    }
  }

  function abrirModalReserva(livro: Livro) {
    if (!isAuthenticated) {
      alert("Você precisa estar logado para reservar livros.");
      return;
    }
    setModalReservaLivro(livro);
    setUsuarioId(authUser?.role === 'usuario_cliente' ? String(authUser.user_id) : ""); // Pre-fill for cliente
    setBuscaUsuarioReserva(authUser?.role === 'usuario_cliente' ? authUser.nome || "" : "");
    setMensagemReserva("");
    setTimeout(() => modalReservaRef.current?.showModal(), 0);
  }

  function fecharModalReserva() {
    setModalReservaLivro(null);
    setMensagemReserva("");
    setBuscaUsuarioReserva("");
    setUsuariosFiltradosReserva([]);
    modalReservaRef.current?.close();
  }

  async function handleReserva(e: React.FormEvent) {
    e.preventDefault();
    if (!modalReservaLivro || !usuarioId) {
      setMensagemReserva("Livro e Usuário são obrigatórios.");
      return;
    }
    try {
      // Calcule as datas conforme a regra de negócio (exemplo: validade = hoje + 3 dias)
      const hoje = new Date();
      const data_reserva = hoje.toISOString().slice(0, 10);
      const data_validade_reserva = new Date(hoje.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const reservaPayload = {
        id_livro_solicitado: modalReservaLivro.id_livro,
        id_usuario: parseInt(usuarioId),
        data_reserva,
        data_validade_reserva,
      };
      await api.post('/reservas', reservaPayload);
      setMensagemReserva("Reserva realizada com sucesso!");
      setTimeout(() => fecharModalReserva(), 1200);
    } catch (error) {
      console.error("Erro ao realizar reserva:", error);
      setMensagemReserva("Falha ao realizar reserva.");
    }
  }

  const livrosFiltrados = livros.filter((livro) => {
    const buscaTermo = busca.toLowerCase();
    const autoresStr = Array.isArray(livro.autores)
      ? livro.autores.map((a) => a.nome).join(", ").toLowerCase()
      : "";
    const categoriaStr = livro.categoria?.nome?.toLowerCase() ?? "";
    const matchBusca =
      !buscaTermo ||
      livro.titulo.toLowerCase().includes(buscaTermo) ||
      autoresStr.includes(buscaTermo) ||
      categoriaStr.includes(buscaTermo);
    const matchTitulo =
      !filtros.titulo ||
      livro.titulo.toLowerCase().includes(filtros.titulo.toLowerCase());
    const matchAutor =
      !filtros.autor ||
      autoresStr.includes(filtros.autor.toLowerCase());
    const matchCategoria =
      !filtros.categoria ||
      categoriaStr.includes(filtros.categoria.toLowerCase());
    return matchBusca && matchTitulo && matchAutor && matchCategoria;
  });

  // Exemplo de autocomplete para usuários (em modais)
  async function buscarUsuariosAutocomplete(term: string) {
    if (term.length < 2) return [];
    const res = await fetchUsuariosAutocomplete({ nome_like: term, limit: 10 });
    return res.data;
  }

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
                    key={livro.id_livro}
                    className="px-2 py-1 cursor-pointer hover:bg-blue-100"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => {
                      setBuscaLivroFiltro(livro.titulo);
                      setFiltros(f => ({ ...f, titulo: livro.titulo }));
                      setLivrosFiltradosDropdown([]);
                      setDropdownLivroFiltroAberto(false);
                    }}
                  >
                    {livro.titulo} <span className="text-xs text-gray-500">{Array.isArray(livro.autores) && livro.autores.length > 0 ? `(${livro.autores.map(a => a.nome).join(", ")})` : ""}</span>
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
            <li key={livro.id_livro} className="p-4 border rounded bg-white shadow flex flex-col gap-2">
              <span className="font-semibold text-lg text-gray-900">{livro.titulo}</span>
              <span className="text-gray-700">
                Autor:{" "}
                {Array.isArray(livro.autores)
                  ? livro.autores.map((a) => a.nome).join(", ")
                  : ""}
              </span>
              {livro.categoria && (
                <span className="text-gray-500 text-sm">
                  Categoria: {livro.categoria.nome}
                </span>
              )}
              {isAuthenticated && (
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
              )}
            </li>
          ))}
        </ul>
      )}
      {modalLivro && (
        <dialog ref={modalEmprestimoRef} className="rounded-lg p-0 w-full max-w-md">
          <form method="dialog" onSubmit={handleEmprestimo} className="flex flex-col gap-4 p-6 bg-white">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Emprestar livro</h2>
            {/* Livro selection part can be simplified if modalLivro is always set */}
            <div>
              <span className="font-semibold">Livro selecionado:</span> {modalLivro.titulo} <br />
              <span className="font-semibold">Autor:</span> {modalLivro.autores.map(a => a.nome).join(", ")}
            </div>

            {authUser?.role === 'funcionario' ? (
              <label className="font-semibold text-gray-900">
                Usuário:
                <div className="relative" ref={dropdownUsuarioEmprestimoRef}>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-400 rounded mt-1"
                    placeholder="Digite o nome do usuário"
                    value={buscaUsuarioEmprestimo}
                    onChange={e => {
                      setBuscaUsuarioEmprestimo(e.target.value);
                      setUsuarioId(""); // Clear selected ID when typing
                      setDropdownUsuarioEmprestimoAberto(true);
                    }}
                    onFocus={() => setDropdownUsuarioEmprestimoAberto(true)}
                    required
                  />
                  {dropdownUsuarioEmprestimoAberto && buscaUsuarioEmprestimo.length > 1 && usuariosFiltradosEmprestimo.length > 0 && (
                    <ul className="border border-gray-300 rounded bg-white mt-1 max-h-32 overflow-y-auto z-10 absolute left-0 right-0">
                      {usuariosFiltradosEmprestimo.map(usuario => (
                        <li
                          key={usuario.id_usuario}
                          className={`px-2 py-1 cursor-pointer hover:bg-blue-100 ${usuarioId === String(usuario.id_usuario) ? 'bg-blue-200' : ''}`}
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => {
                            setUsuarioId(String(usuario.id_usuario));
                            setBuscaUsuarioEmprestimo(usuario.nome);
                            setUsuariosFiltradosEmprestimo([]);
                            setDropdownUsuarioEmprestimoAberto(false);
                          }}
                        >
                          {usuario.nome} <span className="text-xs text-gray-500">({usuario.role})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </label>
            ) : (
              <div>
                <span className="font-semibold">Usuário:</span> {authUser?.nome || authUser?.sub}
                {/* Hidden input or ensure usuarioId is set from authUser for non-funcionarios */}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 font-semibold">Confirmar</button>
              <button type="button" onClick={fecharModalEmprestimo} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 font-semibold">Cancelar</button>
            </div>
            {mensagem && <div className="text-green-700 font-semibold mt-2">{mensagem}</div>}
          </form>
        </dialog>
      )}
      {modalReservaLivro && (
        <dialog ref={modalReservaRef} className="rounded-lg p-0 w-full max-w-md">
          <form method="dialog" onSubmit={handleReserva} className="flex flex-col gap-4 p-6 bg-white">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Reservar livro</h2>
            <div>
              <span className="font-semibold">Livro selecionado:</span> {modalReservaLivro.titulo} <br />
              <span className="font-semibold">Autor:</span> {modalReservaLivro.autores.map(a => a.nome).join(", ")}
            </div>

            {authUser?.role === 'funcionario' ? (
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
                      setUsuarioId(""); // Clear selected ID
                      setDropdownUsuarioReservaAberto(true);
                    }}
                    onFocus={() => setDropdownUsuarioReservaAberto(true)}
                    required
                  />
                  {dropdownUsuarioReservaAberto && buscaUsuarioReserva.length > 1 && usuariosFiltradosReserva.length > 0 && (
                    <ul className="border border-gray-300 rounded bg-white mt-1 max-h-32 overflow-y-auto z-10 absolute left-0 right-0">
                      {usuariosFiltradosReserva.map(usuario => (
                        <li
                          key={usuario.id_usuario}
                          className={`px-2 py-1 cursor-pointer hover:bg-yellow-100 ${usuarioId === String(usuario.id_usuario) ? 'bg-yellow-200' : ''}`}
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => {
                            setUsuarioId(String(usuario.id_usuario));
                            setBuscaUsuarioReserva(usuario.nome);
                            setUsuariosFiltradosReserva([]);
                            setDropdownUsuarioReservaAberto(false);
                          }}
                        >
                          {usuario.nome} <span className="text-xs text-gray-500">({usuario.role})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </label>
            ) : (
               <div>
                <span className="font-semibold">Usuário:</span> {authUser?.nome || authUser?.sub}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 font-semibold">Confirmar</button>
              <button type="button" onClick={fecharModalReserva} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 font-semibold">Cancelar</button>
            </div>
            {mensagemReserva && <div className="text-green-700 font-semibold mt-2">{mensagemReserva}</div>}
          </form>
        </dialog>
      )}
      {/* Controles de paginação */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-gray-700">
          Página {page + 1}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
