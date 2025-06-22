"use client";
import React, { useEffect, useState } from "react";
import api from "../../api";

export default function ExemplarDetalhePage({ params }: { params: Promise<{ numero_tombo: string }> }) {
  const { numero_tombo } = React.use(params);
  const [exemplar, setExemplar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (numero_tombo) {
      api.get(`/exemplares/${numero_tombo}`)
        .then(res => setExemplar(res.data))
        .catch(() => setErro("Exemplar não encontrado."))
        .finally(() => setLoading(false));
    }
  }, [numero_tombo]);

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (erro) return <div className="p-8 text-center text-red-600">{erro}</div>;
  if (!exemplar) return <div className="p-8 text-center text-gray-500">Exemplar não encontrado.</div>;

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Detalhes do Exemplar</h1>
      <div className="mb-2"><b>Número de Tombo:</b> {exemplar.numero_tombo}</div>
      <div className="mb-2"><b>Status:</b> {Array.isArray(exemplar.status) ? exemplar.status.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' e ') : exemplar.status}</div>
      <div className="mb-2"><b>Localização:</b> {exemplar.localizacao || <span className="text-gray-400">—</span>}</div>
      {exemplar.livro && (
        <>
          <div className="mb-2"><b>Título do Livro:</b> {exemplar.livro.titulo}</div>
          <div className="mb-2"><b>Autor(es):</b> {exemplar.livro.autores?.map((a: any) => a.nome).join(", ") || "Desconhecido"}</div>
          <div className="mb-2"><b>Categoria:</b> {exemplar.livro.categoria?.nome || <span className="text-gray-400">—</span>}</div>
        </>
      )}
    </div>
  );
}
