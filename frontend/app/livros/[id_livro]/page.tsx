"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchLivroDetalhes } from "../../api";
import ReservaButton from "./ReservaButton";

export default function LivroDetalhesPage({ params }: { params: Promise<{ id_livro: string }> }) {
  const { id_livro } = React.use(params);
  const [livro, setLivro] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    fetchLivroDetalhes(id_livro)
      .then(res => { if (ativo) setLivro(res.data); })
      .catch(e => { if (ativo) setErro(e.message || "Erro ao buscar detalhes do livro."); });
    return () => { ativo = false; };
  }, [id_livro]);

  if (erro) {
    return <div className="p-4 text-red-600">Erro: {erro}</div>;
  }
  if (!livro) {
    return <div className="p-4">Carregando...</div>;
  }

  function statusExemplarLabel(status: string | string[]) {
    if (Array.isArray(status)) {
      return status.map(statusExemplarLabel).join(" e ");
    }
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
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">{livro.titulo}</h1>
      <div className="mb-4 text-gray-700">
        <div><b>Autores:</b> {Array.isArray(livro.autores) && livro.autores.length > 0 ? livro.autores.map((a: any) => a.nome).join(", ") : "Desconhecido"}</div>
        <div><b>Editora:</b> {livro.editora || "-"}</div>
        <div><b>Edição:</b> {livro.edicao || "-"}</div>
        <div><b>ISBN:</b> {livro.isbn || "-"}</div>
        <div><b>Ano:</b> {livro.ano_publicacao || "-"}</div>
        <div><b>Categoria:</b> {livro.categoria?.nome || "-"}</div>
        <div><b>Status:</b> {statusLivroLabel(livro.status || livro.status_geral || "-", livro.exemplares_disponiveis)}</div>
      </div>
      <div className="mb-4">
        <ReservaButton livro={livro} />
      </div>
      <h2 id="exemplares" className="text-xl font-semibold mt-6 mb-2">Exemplares</h2>
      {livro.exemplares?.length ? (
        <ul className="border rounded divide-y">
          {livro.exemplares.map((ex: any) => (
            <li key={ex.numero_tombo} className="p-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <span><b>Nº Tombo:</b> {ex.numero_tombo}</span>
              <span><b>Status:</b> {statusExemplarLabel(ex.status)}</span>
              <span><b>Localização:</b> {ex.localizacao}</span>
              {ex.status === 'emprestado' && ex.data_prevista_devolucao && (
                <span className="text-sm text-red-700"><b>Emprestado até:</b> {new Date(ex.data_prevista_devolucao).toLocaleDateString()}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-gray-500">Nenhum exemplar cadastrado.</div>
      )}
      <Link href="/" className="inline-block mt-6 text-blue-600 hover:underline">← Voltar para a lista de livros</Link>
    </div>
  );
}
