"use client";
import * as React from "react"; // Import React
import { useState, useEffect, useRef } from "react"; // Import hooks
import api, { ReservaRead as Reserva, UsuarioReadBasic as User, LivroRead as Livro } from "../api"; // Corrija os tipos importados
import { useAuth } from "../contexts/AuthContext"; // Import useAuth
import withAuth from "../components/withAuth"; // Import withAuth

function ReservasPage() {
  const { user: authUser } = useAuth(); // Get authenticated user info
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [livros, setLivros] = useState<Livro[]>([]);
  const [filtroUsuario, setFiltroUsuario] = useState(""); // ID do usuário
  const [filtroLivro, setFiltroLivro] = useState(""); // ID do livro
  const [filtroAutor, setFiltroAutor] = React.useState(""); // Nome do autor
  const [filtroCategoria, setFiltroCategoria] = React.useState(""); // Nome da categoria
  const [filtroStatus, setFiltroStatus] = useState("");
  const [modalNova, setModalNova] = useState(false);
  const [livroId, setLivroId] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [buscaUsuarioModal, setBuscaUsuarioModal] = useState("");
  const [usuariosFiltradosModal, setUsuariosFiltradosModal] = useState<User[]>([]);
  const [buscaLivroModal, setBuscaLivroModal] = useState("");
  const [livrosFiltradosModal, setLivrosFiltradosModal] = useState<Livro[]>([]);

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
  const autoresUnicos = React.useMemo(
    () =>
      Array.from(
        new Set(
          reservas
            .map((r) =>
              Array.isArray(r.livro?.autores)
                ? r.livro.autores.map((a) => a.nome)
                : []
            )
            .flat()
        )
      ).sort(),
    [reservas]
  );
  const categoriasUnicos = React.useMemo(
    () =>
      Array.from(
        new Set(
          reservas
            .map((r) => r.livro?.categoria?.nome)
            .filter(Boolean)
        )
      ).sort(),
    [reservas]
  );

  // Gerar listas únicas de usuários/livros
  const usuariosUnicos = React.useMemo(() => Array.from(new Set(reservas.map(r => r.usuario.nome))).sort(), [reservas]);
  const livrosUnicos = React.useMemo(
    () =>
      Array.from(
        new Set(reservas.map((r) => r.livro?.titulo).filter(Boolean))
      ).sort(),
    [reservas]
  );

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

  useEffect(() => {
    async function fetchData() {
      if (!authUser) return; 

      try {
        // Use correct paths without /api prefix
        const reservasRes = await api.get<Reserva[]>("/reservas");
        setReservas(reservasRes.data);

        const usuariosRes = await api.get<User[]>("/usuarios");
        setUsuarios(usuariosRes.data);

        const livrosRes = await api.get<Livro[]>("/livros");
        setLivros(livrosRes.data);

      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setMensagem("Falha ao carregar dados. Tente novamente.");
      }
    }
    fetchData();
  }, [authUser]); 

  // Update modal user search
  useEffect(() => {
    if (buscaUsuarioModal.length > 1) {
      // Simulating client-side filter as API mock might not support query for all users
      setUsuariosFiltradosModal(
        usuarios.filter(u => u.nome.toLowerCase().includes(buscaUsuarioModal.toLowerCase()))
      );
    } else {
      setUsuariosFiltradosModal([]);
    }
  }, [buscaUsuarioModal, usuarios]);

  // Update modal livro search
  useEffect(() => {
    if (buscaLivroModal.length > 1) {
      setLivrosFiltradosModal(
        livros.filter(l => l.titulo.toLowerCase().includes(buscaLivroModal.toLowerCase()))
      );
    } else {
      setLivrosFiltradosModal([]);
    }
  }, [buscaLivroModal, livros]);


  // Mapeamento de status do backend para exibição amigável
  function statusReservaLabel(status: string) {
    switch (status) {
      case "ativa":
        return "Ativa";
      case "cancelada":
        return "Cancelada";
      case "expirada":
        return "Expirada";
      case "atendida":
        return "Efetivada";
      default:
        return status;
    }
  }

  function filtrarReservas() {
    return reservas.filter(r =>
      (!filtroUsuario || String(r.usuario.id_usuario) === filtroUsuario) &&
      (!filtroLivro || (r.livro && String(r.livro.id_livro) === filtroLivro)) &&
      (!filtroStatus || r.status === filtroStatus) &&
      (!filtroAutor ||
        (r.livro &&
          Array.isArray(r.livro.autores) &&
          r.livro.autores.some((a: any) =>
            a.nome.toLowerCase().includes(filtroAutor.toLowerCase())
          ))
      ) &&
      (!filtroCategoria ||
        (r.livro &&
          r.livro.categoria &&
          r.livro.categoria.nome.toLowerCase().includes(filtroCategoria.toLowerCase()))
      )
    );
  }

  async function criarReserva(e: React.FormEvent) {
    e.preventDefault();
    if (!livroId || !usuarioId) {
      setMensagem("Selecione o livro e o usuário.");
      return;
    }
    try {
      // Calcule as datas conforme a regra de negócio (exemplo: validade = hoje + 3 dias)
      const hoje = new Date();
      const data_reserva = hoje.toISOString().slice(0, 10);
      const data_validade_reserva = new Date(hoje.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const novaReservaPayload = {
        id_livro_solicitado: parseInt(livroId),
        id_usuario: parseInt(usuarioId),
        data_reserva,
        data_validade_reserva,
        // status: "ativa" // opcional, backend já define default
      };
      const response = await api.post<Reserva>('/reservas', novaReservaPayload);
      setReservas(rs => [...rs, response.data]);
      setMensagem("Reserva criada com sucesso!");
      setTimeout(() => {
        setModalNova(false);
        setMensagem("");
        setLivroId("");
        setUsuarioId("");
        setBuscaLivroModal("");
        setBuscaUsuarioModal("");
      }, 1200);
    } catch (error) {
      console.error("Erro ao criar reserva:", error);
      setMensagem("Falha ao criar reserva.");
    }
  }

  async function cancelarReserva(id: number, isCliente: boolean = false) {
    try {
      if (isCliente) {
        // Usuário comum cancela sua própria reserva via endpoint específico
        await api.put(`/reservas/${id}/cancelar`, {});
        setReservas(rs => rs.map(r => r.id_reserva === id ? { ...r, status: "cancelada" } : r));
        setMensagem("Reserva cancelada.");
        setTimeout(() => setMensagem(""), 2000);
      } else {
        // Funcionário pode excluir/cancelar diretamente
        await api.delete(`/reservas/${id}`);
        setReservas(rs => rs.filter(r => r.id_reserva !== id));
        setMensagem("Reserva cancelada.");
        setTimeout(() => setMensagem(""), 2000);
      }
    } catch (error) {
      console.error("Erro ao cancelar reserva:", error);
      setMensagem("Falha ao cancelar reserva.");
    }
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
           {/* Dropdown para filtroUsuarioNome */}
           {dropdownUsuarioFiltroAberto && (filtroUsuarioNome.length === 0 || filtroUsuarioNome.length > 1) && usuariosFiltradosDropdown.length > 0 && (
            <ul className="absolute left-0 right-0 border border-gray-300 rounded bg-white mt-1 max-h-40 overflow-y-auto z-20 shadow-lg">
              {usuariosFiltradosDropdown.map(nome => (
                <li
                  key={nome}
                  className="px-2 py-1 cursor-pointer hover:bg-blue-100"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    setFiltroUsuarioNome(nome);
                    // Encontrar o ID do usuário correspondente ao nome selecionado para filtroUsuario
                    const usuarioSelecionado = usuarios.find(u => u.nome === nome);
                    if (usuarioSelecionado) setFiltroUsuario(String(usuarioSelecionado.id_usuario));
                    setDropdownUsuarioFiltroAberto(false);
                  }}
                >
                  {nome}
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
          {/* Dropdown para filtroLivroTitulo */}
          {dropdownLivroFiltroAberto && (filtroLivroTitulo.length === 0 || filtroLivroTitulo.length > 1) && livrosFiltradosDropdown.length > 0 && (
            <ul className="absolute left-0 right-0 border border-gray-300 rounded bg-white mt-1 max-h-40 overflow-y-auto z-20 shadow-lg">
              {livrosFiltradosDropdown.map(titulo => (
                <li
                  key={titulo}
                  className="px-2 py-1 cursor-pointer hover:bg-blue-100"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    setFiltroLivroTitulo(titulo);
                     const livroSelecionado = livros.find(l => l.titulo === titulo);
                    if (livroSelecionado) setFiltroLivro(String(livroSelecionado.id_livro));
                    setDropdownLivroFiltroAberto(false);
                  }}
                >
                  {titulo}
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
           {/* Dropdown para filtroAutor */}
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
          {/* Dropdown para filtroCategoria */}
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
          <option value="ativa">Ativa</option>
          <option value="cancelada">Cancelada</option>
          <option value="atendida">Efetivada</option>
          <option value="expirada">Expirada</option>
        </select>
        <button
          className="ml-auto px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 font-semibold"
          onClick={() => setModalNova(true)}
        >Nova Reserva</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 rounded">
          {/* Table Head */}
          <thead className="bg-blue-100">
            <tr>
              <th className="px-4 py-2 text-left">Livro</th>
              <th className="px-4 py-2 text-left">Usuário</th>
              <th className="px-4 py-2 text-left">Data da Reserva</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Ações</th>
            </tr>
          </thead>
          {/* Table Body */}
          <tbody>
            {filtrarReservas().map(r => (
              <tr key={r.id_reserva} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-2">
                  {r.livro
                    ? (
                        <>
                          {r.livro.titulo}{" "}
                          <span className="text-xs text-gray-500">
                            {Array.isArray(r.livro.autores) && r.livro.autores.length > 0
                              ? `(${r.livro.autores.map((a) => a.nome).join(", ")})`
                              : ""}
                          </span>
                        </>
                      )
                    : <span className="text-gray-400 italic">Livro não disponível</span>
                  }
                </td>
                <td className="px-4 py-2">{r.usuario.nome} <span className="text-xs text-gray-500">({r.usuario.role || "-"})</span></td>
                <td className="px-4 py-2">{r.data_reserva}</td>
                <td className="px-4 py-2">
                  <span className={
                    r.status === "ativa"
                      ? "bg-green-200 text-green-800 px-2 py-1 rounded text-xs"
                      : r.status === "cancelada"
                      ? "bg-red-200 text-red-800 px-2 py-1 rounded text-xs"
                      : r.status === "atendida"
                      ? "bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs"
                      : "bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs"
                  }>
                    {statusReservaLabel(r.status)}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {/* Permite cancelar se for funcionário OU se for reserva do próprio usuário autenticado */}
                  {r.status === "ativa" && (
                    <>
                      {authUser?.role === "funcionario" ? (
                        <button
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                          onClick={() => cancelarReserva(r.id_reserva)}
                        >
                          Cancelar
                        </button>
                      ) : authUser && r.usuario.id_usuario === authUser.user_id ? (
                        <button
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                          onClick={() => cancelarReserva(r.id_reserva, true)}
                        >
                          Cancelar
                        </button>
                      ) : null}
                    </>
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
          <div className="bg-white rounded shadow-lg p-6 min-w-[350px] max-w-[90vw]">
            <h2 className="text-xl font-bold mb-4">Nova Reserva</h2>
            {mensagem && <div className={`mb-3 p-2 rounded ${mensagem.includes("sucesso") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{mensagem}</div>}
            <form onSubmit={criarReserva}>
              <div className="mb-4 relative" ref={livroModalDropdownRef}>
                <label htmlFor="livroModal" className="block mb-1 font-semibold">Livro:</label>
                <input
                  type="text"
                  id="livroModal"
                  className="w-full p-2 border border-gray-400 rounded"
                  placeholder="Buscar livro pelo título"
                  value={buscaLivroModal}
                  onChange={e => {
                    setBuscaLivroModal(e.target.value);
                    setLivroId(""); // Clear selection when typing
                    setIsDropdownLivroModalOpen(true);
                  }}
                  onFocus={() => setIsDropdownLivroModalOpen(true)}
                  autoComplete="off"
                />
                {isDropdownLivroModalOpen && buscaLivroModal.length > 1 && livrosFiltradosModal.length > 0 && (
                  <ul className="border border-gray-300 rounded bg-white mt-1 max-h-32 overflow-y-auto z-20 absolute left-0 right-0">
                    {livrosFiltradosModal.map(livro => (
                      <li
                        key={livro.id_livro}
                        className={`px-2 py-1 cursor-pointer hover:bg-blue-100 ${livroId === String(livro.id_livro) ? 'bg-blue-200' : ''}`}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setLivroId(String(livro.id_livro));
                          setBuscaLivroModal(livro.titulo);
                          setIsDropdownLivroModalOpen(false);
                        }}
                      >
                        {livro.titulo} <span className="text-xs text-gray-500">{Array.isArray(livro.autores) && livro.autores.length > 0 ? `(${livro.autores.map(a => a.nome).join(", ")})` : ""}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mb-4 relative" ref={usuarioModalDropdownRef}>
                <label htmlFor="usuarioModal" className="block mb-1 font-semibold">Usuário:</label>
                <input
                  type="text"
                  id="usuarioModal"
                  className="w-full p-2 border border-gray-400 rounded"
                  placeholder="Buscar usuário pelo nome"
                  value={buscaUsuarioModal}
                  onChange={e => {
                    setBuscaUsuarioModal(e.target.value);
                    setUsuarioId(""); // Clear selection
                    setIsDropdownUsuarioModalOpen(true);
                  }}
                  onFocus={() => setIsDropdownUsuarioModalOpen(true)}
                  autoComplete="off"
                />
                {isDropdownUsuarioModalOpen && buscaUsuarioModal.length > 1 && usuariosFiltradosModal.length > 0 && (
                  <ul className="border border-gray-300 rounded bg-white mt-1 max-h-32 overflow-y-auto z-20 absolute left-0 right-0">
                    {usuariosFiltradosModal.map(usuario => (
                      <li
                        key={usuario.id_usuario}
                        className={`px-2 py-1 cursor-pointer hover:bg-blue-100 ${usuarioId === String(usuario.id_usuario) ? 'bg-blue-200' : ''}`}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setUsuarioId(String(usuario.id_usuario));
                          setBuscaUsuarioModal(usuario.nome);
                          setIsDropdownUsuarioModalOpen(false);
                        }}
                      >
                        {usuario.nome} <span className="text-xs text-gray-500">({usuario.role})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <button type="button" onClick={() => { setModalNova(false); setMensagem(""); }} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 font-semibold">Criar Reserva</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(ReservasPage, ['funcionario', 'aluno']);
