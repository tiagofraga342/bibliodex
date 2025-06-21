import React from "react";

interface LivroListProps {
  livros: any[];
  isAuthenticated: boolean;
  abrirModalEmprestimo: (livro: any) => void;
  abrirModalReserva: (livro: any) => void;
}

export default function LivroList({ livros, isAuthenticated, abrirModalEmprestimo, abrirModalReserva }: LivroListProps) {
  if (livros.length === 0) {
    return <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2"><li className="col-span-2 text-center text-gray-500">Nenhum livro encontrado.</li></ul>;
  }
  return (
    <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      {livros.map((livro) => (
        <li key={livro.id_livro} className="p-4 border rounded bg-white shadow flex flex-col gap-2">
          <span className="font-semibold text-lg text-gray-900">{livro.titulo}</span>
          <span className="text-gray-700">
            Autor: {Array.isArray(livro.autores) ? livro.autores.map((a: any) => a.nome).join(", ") : ""}
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
  );
}
