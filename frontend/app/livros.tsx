"use client";
import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { fetchUsuariosAutocomplete } from "./api";
import api, { UsuarioReadBasic as Usuario } from './api'; // Use tipos da API
import { useAuth } from './contexts/AuthContext'; // Import useAuth
import LivroForm from "./livros/components/LivroForm";
import LivroList from "./livros/components/LivroList";
import EmprestimoModal from "./livros/components/EmprestimoModal";
import ReservaModal from "./livros/components/ReservaModal";
import useLivros from "./livros/components/useLivros";
import useCategorias from "./livros/components/useCategorias";
import useUsuarios from "./livros/components/useUsuarios";
import useModalEmprestimo from "./livros/components/useModalEmprestimo";
import useModalReserva from "./livros/components/useModalReserva";

interface Filtros {
  titulo: string;
  autor: string;
  categoria: string;
}

export default function Livros() {
  const { isAuthenticated, user: authUser } = useAuth(); // Get auth state and user
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState<Filtros>({ titulo: '', autor: '', categoria: '' });
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const { livros, total, loading, erro } = useLivros(filtros, page, pageSize);
  const categorias = useCategorias();

  // Substitui estados/refs locais pelos hooks
  const {
    modalLivro, setModalLivro,
    buscaUsuarioEmprestimo, setBuscaUsuarioEmprestimo,
    usuariosFiltradosEmprestimo, setUsuariosFiltradosEmprestimo,
    dropdownUsuarioEmprestimoAberto, setDropdownUsuarioEmprestimoAberto,
    modalEmprestimoRef, dropdownUsuarioEmprestimoRef,
    mensagem, setMensagem
  } = useModalEmprestimo();
  const {
    modalReservaLivro, setModalReservaLivro,
    buscaUsuarioReserva, setBuscaUsuarioReserva,
    usuariosFiltradosReserva, setUsuariosFiltradosReserva,
    dropdownUsuarioReservaAberto, setDropdownUsuarioReservaAberto,
    modalReservaRef, dropdownUsuarioReservaRef,
    mensagemReserva, setMensagemReserva
  } = useModalReserva();

  // Estados que permanecem locais
  const usuarios = useUsuarios(isAuthenticated, authUser);
  const [usuarioId, setUsuarioId] = useState<string>(""); // Selected user for action
  const [buscaLivroEmprestimo, setBuscaLivroEmprestimo] = useState("");
  const [buscaLivroReserva, setBuscaLivroReserva] = useState("");
  const [dropdownLivroEmprestimoAberto, setDropdownLivroEmprestimoAberto] = useState(false);
  const dropdownLivroEmprestimoRef = useRef<HTMLDivElement>(null);

  // Estado para busca manual agora usa id_categoria
  const [buscaManual, setBuscaManual] = useState({ titulo: '', autor: '', categoria: '' });

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

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
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
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Corrige tipos para evitar dependência de Livro importado
  function abrirModalEmprestimo(livro: any) {
    if (!isAuthenticated) {
      alert("Você precisa estar logado para emprestar livros.");
      return;
    }
    setModalLivro(livro);
    setUsuarioId(authUser?.role === 'usuario_cliente' ? String(authUser.user_id) : "");
    setBuscaUsuarioEmprestimo(authUser?.role === 'usuario_cliente' ? authUser.nome || "" : "");
    setMensagem("");
    setTimeout(() => modalEmprestimoRef.current?.showModal(), 0);
  }

  function fecharModalEmprestimo() {
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

  function abrirModalReserva(livro: any) {
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
    const categoriaStr = livro.categoria?.nome?.toLowerCase() ?? "";
    const matchBusca =
      !buscaTermo ||
      livro.titulo.toLowerCase().includes(buscaTermo) ||
      categoriaStr.includes(buscaTermo);
    const matchTitulo =
      !filtros.titulo ||
      livro.titulo.toLowerCase().includes(filtros.titulo.toLowerCase());
    const matchAutor =
      !filtros.autor ||
      livro.autores.some(a => a.nome.toLowerCase().includes(filtros.autor.toLowerCase()));
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

  // Função para aplicar busca manual
  function aplicarBusca(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setFiltros({
      titulo: buscaManual.titulo,
      autor: buscaManual.autor,
      categoria: buscaManual.categoria // agora é id_categoria
    });
    setPage(0); // Sempre volta para a primeira página ao buscar
  }

  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Consulta de Livros</h1>
      <div className="flex flex-col gap-2 mb-6">
        <LivroForm
          valores={buscaManual}
          categorias={categorias}
          onChange={setBuscaManual}
          onSubmit={aplicarBusca}
        />
      </div>
      {loading && <div className="text-center mt-8">Carregando...</div>}
      {erro && <div className="text-red-500 mt-8">{erro}</div>}
      {!loading && !erro && (
        <LivroList
          livros={livros}
          isAuthenticated={isAuthenticated}
          abrirModalEmprestimo={abrirModalEmprestimo}
          abrirModalReserva={abrirModalReserva}
        />
      )}
      <EmprestimoModal
        modalLivro={modalLivro}
        authUser={authUser}
        buscaUsuarioEmprestimo={buscaUsuarioEmprestimo}
        setBuscaUsuarioEmprestimo={setBuscaUsuarioEmprestimo}
        usuarioId={usuarioId}
        setUsuarioId={setUsuarioId}
        usuariosFiltradosEmprestimo={usuariosFiltradosEmprestimo}
        setUsuariosFiltradosEmprestimo={setUsuariosFiltradosEmprestimo}
        mensagem={mensagem}
        handleEmprestimo={handleEmprestimo}
        fecharModalEmprestimo={fecharModalEmprestimo}
        modalEmprestimoRef={modalEmprestimoRef}
        dropdownUsuarioEmprestimoAberto={dropdownUsuarioEmprestimoAberto}
        setDropdownUsuarioEmprestimoAberto={setDropdownUsuarioEmprestimoAberto}
        dropdownUsuarioEmprestimoRef={dropdownUsuarioEmprestimoRef}
      />
      <ReservaModal
        modalReservaLivro={modalReservaLivro}
        authUser={authUser}
        buscaUsuarioReserva={buscaUsuarioReserva}
        setBuscaUsuarioReserva={setBuscaUsuarioReserva}
        usuarioId={usuarioId}
        setUsuarioId={setUsuarioId}
        usuariosFiltradosReserva={usuariosFiltradosReserva}
        setUsuariosFiltradosReserva={setUsuariosFiltradosReserva}
        mensagemReserva={mensagemReserva}
        handleReserva={handleReserva}
        fecharModalReserva={fecharModalReserva}
        modalReservaRef={modalReservaRef}
        dropdownUsuarioReservaAberto={dropdownUsuarioReservaAberto}
        setDropdownUsuarioReservaAberto={setDropdownUsuarioReservaAberto}
        dropdownUsuarioReservaRef={dropdownUsuarioReservaRef}
      />
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
          Página {page + 1} de {totalPaginas}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page + 1 >= totalPaginas}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
