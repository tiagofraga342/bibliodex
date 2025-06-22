"use client";
import React from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function ReservaButton({ livro, statusLivro, abrirModalReserva }: { livro: any, statusLivro?: string, abrirModalReserva: (livro: any) => void }) {
  const { isAuthenticated } = useAuth();
  const disponivel = typeof livro.exemplares_disponiveis === "number"
    ? livro.exemplares_disponiveis > 0
    : (Array.isArray(livro.exemplares) && livro.exemplares.some((ex: any) => ex.status === "disponivel"));
  const status = (statusLivro || livro.status_geral || livro.status || "").toLowerCase();
  const podeReservar = status === "ativo" || status === "indisponivel";
  const desabilitado = !podeReservar;

  if (!isAuthenticated) return null;
  if (desabilitado) return (
    <button className="px-3 py-1 bg-yellow-300 text-gray-700 rounded w-fit cursor-not-allowed opacity-60" disabled>
      Reservar
    </button>
  );

  return (
    <button
      className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 w-fit disabled:opacity-60"
      onClick={() => abrirModalReserva(livro)}
    >
      Reservar
    </button>
  );
}
