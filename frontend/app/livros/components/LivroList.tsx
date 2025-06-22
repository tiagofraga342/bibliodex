"use client";

import React from "react";
import Link from "next/link";
import ReservaButton from "./ReservaButton";
import { useAuth } from "../../contexts/AuthContext";

interface LivroListProps {
  livros: any[];
  isAuthenticated: boolean;
  abrirModalEmprestimo: (livro: any) => void;
  abrirModalReserva: (livro: any) => void; // nova prop
}

export default function LivroList({ livros, isAuthenticated, abrirModalEmprestimo, abrirModalReserva }: LivroListProps) {
  const { user } = useAuth();

  if (livros.length === 0) {
    return <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2"><li className="col-span-2 text-center text-gray-500">Nenhum livro encontrado.</li></ul>;
  }
  // Função utilitária para exibir status amigável
  function statusExemplarLabel(status: string) {
    switch (status) {
      case "disponivel": return "Disponível";
      case "emprestado": return "Emprestado";
      case "leitura_local": return "Leitura local";
      case "reservado": return "Reservado";
      case "descartado": return "Descartado";
      default: return status;
    }
  }
  function statusLivroLabel(status: string, disponiveis?: number) {
    if (status === "ativo" && disponiveis === 0) return "Indisponível";
    switch (status) {
      case "ativo": return "Ativo";
      case "descatalogado": return "Descatalogado";
      case "indisponivel": return "Indisponível";
      default: return statusExemplarLabel(status);
    }
  }
  return (
    <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      {livros.map((livro) => (
        <li key={livro.id_livro} className="p-4 border rounded bg-white shadow flex flex-col gap-2">
          <Link href={`/livros/${livro.id_livro}`} className="font-semibold text-lg text-gray-900 hover:underline w-fit">
            {livro.titulo}
          </Link>
          <span className="text-gray-700">
            Autor(es): {Array.isArray(livro.autores) && livro.autores.length > 0
              ? livro.autores.map((a: any) => a.nome).join(", ")
              : "Desconhecido"}
          </span>
          {livro.edicao && (
            <span className="text-gray-700 text-sm">Edição: {livro.edicao}</span>
          )}
          {livro.editora && (
            <span className="text-gray-700 text-sm">Editora: {livro.editora}</span>
          )}
          {livro.isbn && (
            <span className="text-blue-900 text-sm font-semibold">ISBN: {livro.isbn}</span>
          )}
          {livro.ano_publicacao && (
            <span className="text-gray-700 text-sm">Ano: {livro.ano_publicacao}</span>
          )}
          {livro.categoria && (
            <span className="text-gray-500 text-sm">Categoria: {livro.categoria.nome}</span>
          )}
          {livro.status_geral && (
            <span className="text-gray-500 text-sm flex items-center gap-0.5">
              Status: {statusLivroLabel(livro.status_geral, livro.exemplares_disponiveis)}
              <span className="relative group inline-block align-middle">
                <button
                  type="button"
                  className="ml-0.5 text-blue-500 hover:text-blue-700 focus:outline-none align-middle flex items-center justify-center"
                  tabIndex={0}
                  aria-label="Informação sobre status"
                  style={{ verticalAlign: 'middle', lineHeight: 1 }}
                >
                  <svg className="w-4 h-4 align-middle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01" />
                  </svg>
                </button>
                <span className="absolute top-full left-1/2 -translate-x-1/2 z-10 hidden group-hover:block group-focus:block mt-2 w-56 p-2 text-xs text-white bg-gray-800 rounded shadow-lg">
                  <b>Ativo:</b> livro disponível no acervo.<br/>
                  <b>Indisponível:</b> todos os exemplares estão emprestados, reservados ou em uso local.<br/>
                  <b>Descatalogado:</b> livro removido do acervo, não disponível para empréstimo, mas pode ser lido no local se houver exemplares.
                </span>
              </span>
            </span>
          )}
          {/* Resumo de exemplares */}
          {(typeof livro.total_exemplares === 'number' && typeof livro.exemplares_disponiveis === 'number') ? (
            <span className="text-gray-600 text-sm">
              {`${String(livro.status_geral).trim().toLowerCase() === 'descatalogado' ? 0 : livro.exemplares_disponiveis} disponível(is) de ${livro.total_exemplares} exemplar(es)`}
            </span>
          ) : Array.isArray(livro.exemplares) && livro.exemplares.length > 0 && (
            <span className="text-gray-600 text-sm">
              {(() => {
                const total = livro.exemplares.length;
                const disponiveis = String(livro.status_geral).trim().toLowerCase() === 'descatalogado'
                  ? 0
                  : livro.exemplares.filter((ex: any) => ex.status === 'disponivel').length;
                const locais = livro.exemplares
                  .filter((ex: any) => ex.status === 'disponivel' && ex.localizacao)
                  .map((ex: any) => ex.localizacao)
                  .filter(Boolean);
                return `${disponiveis} disponível(is) de ${total} exemplar(es)` + (locais.length ? ` | Locais: ${locais.join(', ')}` : '');
              })()}
            </span>
          )}
          {isAuthenticated && (
            <div className="flex gap-2 mt-2">
              {user?.role === "funcionario" && (
                <button
                  className={
                    (livro.status_geral === "descatalogado" ||
                      !Array.isArray(livro.exemplares) ||
                      !livro.exemplares.some((ex: any) => ex.status === "disponivel"))
                      ? "px-3 py-1 bg-blue-300 text-gray-700 rounded w-fit cursor-not-allowed opacity-60"
                      : "px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800 w-fit"
                  }
                  onClick={() => abrirModalEmprestimo(livro)}
                  disabled={
                    String(livro.status_geral).trim().toLowerCase() === "descatalogado" ||
                    !Array.isArray(livro.exemplares) ||
                    !livro.exemplares.some((ex: any) => ex.status === "disponivel")
                  }
                  title={
                    String(livro.status_geral).trim().toLowerCase() === "descatalogado"
                      ? "Não é permitido emprestar livros descatalogados."
                      : !Array.isArray(livro.exemplares) || !livro.exemplares.some((ex: any) => ex.status === "disponivel")
                        ? "Não há exemplares disponíveis para empréstimo."
                        : undefined
                  }
                >
                  Emprestar
                </button>
              )}
              <ReservaButton livro={livro} statusLivro={livro.status_geral} abrirModalReserva={abrirModalReserva} />
              <Link href={`/livros/${livro.id_livro}`} className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 w-fit block text-center">
                Ver exemplares
              </Link>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
