"use client";
import React from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function ReservaButton({ livro }: { livro: any }) {
  const { isAuthenticated } = useAuth();
  // Exemplo: só permite reservar se houver pelo menos 1 exemplar disponível
  const disponivel = Array.isArray(livro.exemplares)
    ? livro.exemplares.some((ex: any) => ex.status === "disponivel")
    : (typeof livro.exemplares_disponiveis === "number" && livro.exemplares_disponiveis > 0);

  if (!isAuthenticated) return null;
  if (!disponivel) return (
    <button className="px-3 py-1 bg-yellow-300 text-gray-700 rounded w-fit cursor-not-allowed opacity-60" disabled>
      Reservar
    </button>
  );
  // Aqui você pode abrir modal ou redirecionar para fluxo de reserva
  return (
    <button className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 w-fit">
      Reservar
    </button>
  );
}
