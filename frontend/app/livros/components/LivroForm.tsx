import React from "react";

interface Categoria {
  id_categoria: number;
  nome: string;
}

interface LivroFormProps {
  valores: { titulo: string; autor: string; categoria: string };
  categorias: Categoria[];
  onChange: (valores: { titulo: string; autor: string; categoria: string }) => void;
  onSubmit: (e?: React.FormEvent) => void;
}

export default function LivroForm({ valores, categorias, onChange, onSubmit }: LivroFormProps) {
  return (
    <form className="flex flex-col sm:flex-row gap-2 items-stretch" onSubmit={onSubmit}>
      <input
        type="text"
        placeholder="Buscar por título"
        className="w-full p-2 border border-gray-400 text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
        value={valores.titulo}
        onChange={e => onChange({ ...valores, titulo: e.target.value })}
      />
      <input
        type="text"
        placeholder="Buscar por autor"
        className="w-full p-2 border border-gray-400 text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
        value={valores.autor}
        onChange={e => onChange({ ...valores, autor: e.target.value })}
      />
      <select
        className="w-full p-2 border border-gray-400 text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
        value={valores.categoria}
        onChange={e => onChange({ ...valores, categoria: e.target.value })}
      >
        <option value="">Todas as categorias</option>
        {categorias.map((cat) => (
          <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nome}</option>
        ))}
      </select>
      <button
        type="submit"
        className="flex items-center justify-center px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        title="Buscar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
        </svg>
      </button>
    </form>
  );
}
