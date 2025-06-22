"use client";
import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { fetchUsuariosAutocomplete } from "./api";
import api, { UsuarioReadBasic as Usuario, fetchCriarReserva } from './api';
import { useAuth } from './contexts/AuthContext';
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
  titulo?: string;
  autor?: string;
  categoria?: string;
  isbn?: string;
  editora?: string;
  ano?: number;
  sort_by?: string;
  sort_dir?: string;
}

export default function Livros() {
  const { isAuthenticated, user: authUser } = useAuth(); // Get auth state and user
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState<Filtros>({ titulo: '', autor: '', categoria: '' });
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [refreshLivros, setRefreshLivros] = useState(0);
  const { livros, total, loading, erro } = useLivros(filtros, page, pageSize, refreshLivros);
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

  // Estado para busca manual agora usa id_categoria e ordenação
  const [buscaManual, setBuscaManual] = useState<Filtros>({ titulo: '', autor: '', categoria: '', isbn: '', editora: '', ano: undefined, sort_by: 'titulo', sort_dir: 'asc' });
  const [inputPagina, setInputPagina] = useState("");
  const [numeroTomboSelecionado, setNumeroTomboSelecionado] = useState<string>("");

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
    if (modalReservaLivro && buscaUsuarioReserva.length > 0) {
      // Busca usuário por matrícula exata
      const filtered = usuarios.filter(u => u.matricula === buscaUsuarioReserva.trim());
      setUsuariosFiltradosReserva(filtered);
      if (filtered.length === 1) {
        setUsuarioId(String(filtered[0].id_usuario));
      } else {
        setUsuarioId("");
      }
    } else {
      setUsuariosFiltradosReserva([]);
      setUsuarioId("");
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

  async function handleEmprestimo(e: React.FormEvent, numeroTombo?: string) {
    e.preventDefault();
    if (!modalLivro || !buscaUsuarioEmprestimo || !numeroTombo) {
      setMensagem("Livro, matrícula e exemplar são obrigatórios.");
      return;
    }
    try {
      // Buscar usuário pela matrícula
      const usuariosRes = await api.get<any[]>(`/usuarios`, { matricula: buscaUsuarioEmprestimo });
      const usuario = Array.isArray(usuariosRes.data) && usuariosRes.data.length > 0 ? usuariosRes.data[0] : null;
      if (!usuario) {
        setMensagem("Usuário não encontrado para a matrícula informada.");
        return;
      }
      // Calcular datas
      const hoje = new Date();
      const data_retirada = hoje.toISOString().slice(0, 10);
      const data_prevista_devolucao = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // 7 dias

      const emprestimoPayload = {
        numero_tombo: Number(numeroTombo),
        id_usuario: usuario.id_usuario,
        data_retirada,
        data_prevista_devolucao,
      };
      await api.post('/emprestimos', emprestimoPayload);
      setMensagem("Empréstimo realizado com sucesso!");
      setRefreshLivros(r => r + 1);
      setTimeout(() => fecharModalEmprestimo(), 1200);
    } catch (error) {
      console.error("Erro ao realizar empréstimo:", error);
      setMensagem("Falha ao realizar empréstimo.");
    }
  }

  async function abrirModalReserva(livro: any) {
    if (!isAuthenticated) {
      alert("Você precisa estar logado para reservar livros.");
      return;
    }
    // Buscar exemplares do livro
    let exemplaresDisponiveis: any[] = [];
    try {
      const res = await api.get(`/livros/${livro.id_livro}/exemplares`);
      exemplaresDisponiveis = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      exemplaresDisponiveis = [];
    }
    setModalReservaLivro({
      ...livro,
      exemplaresDisponiveis,
      numeroTomboSelecionado: "",
      setNumeroTomboSelecionado: setNumeroTomboSelecionado
    });
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

  async function handleReserva(e: React.FormEvent, numeroTomboSelecionado?: string) {
    e.preventDefault();
    if (!modalReservaLivro || !usuarioId) {
      setMensagemReserva("Livro e Usuário são obrigatórios.");
      return;
    }
    // Validação extra: funcionário só pode reservar se matrícula digitada corresponder a um usuário existente
    if (authUser?.role === 'funcionario') {
      if (!buscaUsuarioReserva.trim()) {
        setMensagemReserva("Digite a matrícula do usuário.");
        return;
      }
      const usuarioSelecionado = usuariosFiltradosReserva.find(u => String(u.id_usuario) === usuarioId && u.matricula === buscaUsuarioReserva.trim());
      if (!usuarioSelecionado) {
        setMensagemReserva("Matrícula não encontrada.");
        return;
      }
    }
    try {
      const payload: any = { id_livro: modalReservaLivro.id_livro, id_usuario: parseInt(usuarioId) };
      if (numeroTomboSelecionado) payload.numero_tombo = Number(numeroTomboSelecionado);
      await fetchCriarReserva(payload);
      setMensagemReserva("Reserva realizada com sucesso!");
      setRefreshLivros(r => r + 1); // Atualiza lista de livros
      setTimeout(() => fecharModalReserva(), 1200);
    } catch (error: any) {
      console.error("Erro ao realizar reserva:", error);
      if (error?.data?.detail) {
        setMensagemReserva(error.data.detail);
      } else if (error?.message) {
        setMensagemReserva(error.message);
      } else {
        setMensagemReserva("Falha ao realizar reserva.");
      }
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
      categoria: buscaManual.categoria,
      isbn: buscaManual.isbn,
      editora: buscaManual.editora,
      ano: buscaManual.ano,
      sort_by: buscaManual.sort_by,
      sort_dir: buscaManual.sort_dir,
    });
    setPage(0); // Sempre volta para a primeira página ao buscar
  }

  // Função para ir para página digitada
  function irParaPagina(e: React.FormEvent) {
    e.preventDefault();
    const num = Number(inputPagina);
    if (!isNaN(num) && num >= 1 && num <= totalPaginas) {
      setPage(num - 1);
    }
    setInputPagina("");
  }

  // Função para gerar páginas resumidas com saltos grandes e metadados
  function paginasResumidas() {
    const paginas = [];
    const saltos = [10000, 1000, 100, 10];
    paginas.push({p: 0, salto: null}); // primeira
    // Saltos para trás
    saltos.forEach(s => {
      if (page - s > 0) paginas.push({p: page - s, salto: -s});
    });
    // Página atual
    if (page !== 0 && page !== totalPaginas - 1) paginas.push({p: page, salto: null});
    // Saltos para frente
    saltos.slice().reverse().forEach(s => {
      if (page + s < totalPaginas - 1) paginas.push({p: page + s, salto: +s});
    });
    // Última página
    if (totalPaginas > 1) paginas.push({p: totalPaginas - 1, salto: null});
    // Remover duplicados e ordenar
    const unique = new Map();
    for (const obj of paginas) unique.set(obj.p, obj);
    return Array.from(unique.values()).sort((a, b) => a.p - b.p);
  }

  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Consulta de Livros</h1>
      <div className="flex flex-col gap-2 mb-6">
        <LivroForm
          valores={{
            titulo: buscaManual.titulo ?? "",
            autor: buscaManual.autor ?? "",
            categoria: buscaManual.categoria ?? "",
            isbn: buscaManual.isbn,
            editora: buscaManual.editora,
            ano: buscaManual.ano,
            sort_by: buscaManual.sort_by,
            sort_dir: buscaManual.sort_dir,
          }}
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
          abrirModalReserva={abrirModalReserva} // nova prop
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
        numeroTomboSelecionado={numeroTomboSelecionado}
        setNumeroTomboSelecionado={setNumeroTomboSelecionado}
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
        setMensagemReserva={setMensagemReserva}
        handleReserva={handleReserva}
        fecharModalReserva={fecharModalReserva}
        modalReservaRef={modalReservaRef}
        dropdownUsuarioReservaAberto={dropdownUsuarioReservaAberto}
        setDropdownUsuarioReservaAberto={setDropdownUsuarioReservaAberto}
        dropdownUsuarioReservaRef={dropdownUsuarioReservaRef}
      />
      {/* Controles de paginação avançados */}
      <div className="flex flex-col items-center gap-2 mt-4 pt-4">
        <div className="w-full overflow-x-auto" style={{paddingTop: '1.5rem'}}>
          <div className="flex gap-1 items-center whitespace-nowrap justify-center">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="px-2 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Anterior
            </button>
            {paginasResumidas().map((obj, idx) =>
              obj.p === page ? (
                <button
                  key={obj.p}
                  className="px-2 py-1 rounded bg-blue-500 text-white border border-blue-700"
                  disabled
                >
                  {obj.p + 1}
                </button>
              ) : (
                <button
                  key={obj.p}
                  onClick={() => setPage(obj.p)}
                  className={`px-2 py-1 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 border ${obj.salto ? 'border-yellow-500 relative overflow-visible' : 'border-gray-300'}`}
                >
                  {obj.p + 1}
                  {obj.salto && (
                    <span className="absolute -top-3 -right-3 z-10 text-xs bg-yellow-200 text-yellow-800 px-1 rounded border border-yellow-400" title={`Salto de ${obj.salto > 0 ? '+' : ''}${obj.salto}`}>
                      {obj.salto > 0 ? '+' : ''}{obj.salto}
                    </span>
                  )}
                </button>
              )
            )}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page + 1 >= totalPaginas}
              className="px-2 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
        <form onSubmit={irParaPagina} className="flex items-center gap-2 mt-1">
          <label htmlFor="inputPagina" className="text-gray-700 text-sm">Ir para página:</label>
          <input
            id="inputPagina"
            type="number"
            min={1}
            max={totalPaginas}
            value={inputPagina}
            onChange={e => setInputPagina(e.target.value)}
            className="w-20 px-2 py-1 border rounded"
            placeholder="Nº"
          />
          <button type="submit" className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">Ir</button>
        </form>
      </div>
    </div>
  );
}
