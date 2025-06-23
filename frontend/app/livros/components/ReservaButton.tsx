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

  // Desabilita o botão se todos os exemplares disponíveis estão reservados
  const todosReservados = Array.isArray(livro.exemplares)
    ? livro.exemplares.every((ex: any) => Array.isArray(ex.status)
        ? ex.status.includes('reservado')
        : ex.status === 'reservado')
    : false;

  if (!isAuthenticated) return null;
  if (desabilitado || todosReservados) return (
    <button className="px-3 py-1 bg-gray-300 text-gray-700 rounded w-fit cursor-not-allowed opacity-60" disabled>
      Reservar
    </button>
  );

  return (
    <button
      className={
        todosReservados
          ? "px-3 py-1 bg-gray-300 text-gray-700 rounded w-fit cursor-not-allowed opacity-60"
          : "px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800 w-fit"
      }
      onClick={() => abrirModalReserva(livro)}
      disabled={todosReservados}
      title={todosReservados ? "Todos os exemplares deste livro já estão reservados." : undefined}
    >
      Reservar
    </button>
  );
}
