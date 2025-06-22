"use client";

import React from "react";

interface Categoria {
  id_categoria: number;
  nome: string;
}

interface LivroFormValores {
  titulo: string;
  autor: string;
  categoria: string;
  isbn?: string;
  editora?: string;
  ano?: number;
  sort_by?: string;
  sort_dir?: string;
}

interface LivroFormProps {
  valores: LivroFormValores;
  categorias: Categoria[];
  onChange: (valores: LivroFormValores) => void;
  onSubmit: (e?: React.FormEvent) => void;
}

export default function LivroForm({ valores, categorias, onChange, onSubmit }: LivroFormProps) {
  return (
    <form className="flex flex-col gap-2 max-w-5xl mx-auto" onSubmit={onSubmit}>
      {/* Primeira linha: título e autor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
        <input
          type="text"
          placeholder="Buscar por título"
          className="w-full p-2 border border-gray-400 text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white col-span-1 md:col-span-2"
          value={valores.titulo}
          onChange={e => onChange({ ...valores, titulo: e.target.value })}
        />
        <input
          type="text"
          placeholder="Buscar por autor"
          className="w-full p-2 border border-gray-400 text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white col-span-1"
          value={valores.autor}
          onChange={e => onChange({ ...valores, autor: e.target.value })}
        />
      </div>
      {/* Segunda linha: ISBN, editora, ano (com flex) */}
      <div className="flex gap-2 w-full">
        <input
          type="text"
          placeholder="ISBN"
          className="flex-1 p-2 border border-gray-400 text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          value={valores.isbn || ''}
          onChange={e => onChange({ ...valores, isbn: e.target.value })}
        />
        <input
          type="text"
          placeholder="Editora"
          className="flex-1 p-2 border border-gray-400 text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          value={valores.editora || ''}
          onChange={e => onChange({ ...valores, editora: e.target.value })}
        />
        <input
          type="number"
          placeholder="Ano"
          className="w-[90px] flex-shrink-0 p-2 border border-gray-400 text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          value={valores.ano ?? ''}
          onChange={e => onChange({ ...valores, ano: e.target.value ? Number(e.target.value) : undefined })}
          min={0}
          max={3000}
        />
      </div>
      {/* Terceira linha: categoria, ordenação única, botão */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full items-end">
        <div className="flex flex-col w-full">
          <label className="text-xs text-gray-600 mb-1">Categoria:</label>
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
        </div>
        <div className="flex flex-col w-full">
          <label className="text-xs text-gray-600 mb-1 flex items-center gap-1">
            <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4 inline-block' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 10h18M3 6h18M3 14h18M3 18h18' /></svg>
            Ordenar por:
          </label>
          <select
            className="w-full p-2 border border-gray-400 text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            value={`${valores.sort_by || 'titulo'}-${valores.sort_dir || 'asc'}`}
            onChange={e => {
              const [sort_by, sort_dir] = e.target.value.split('-');
              onChange({ ...valores, sort_by, sort_dir });
            }}
          >
            <option value="titulo-asc">Título (A-Z)</option>
            <option value="titulo-desc">Título (Z-A)</option>
            <option value="autor-asc">Autor (A-Z)</option>
            <option value="autor-desc">Autor (Z-A)</option>
            <option value="ano_publicacao-asc">Ano de publicação (Crescente)</option>
            <option value="ano_publicacao-desc">Ano de publicação (Decrescente)</option>
            <option value="editora-asc">Editora (A-Z)</option>
            <option value="editora-desc">Editora (Z-A)</option>
          </select>
        </div>
        <button
          type="submit"
          className="h-full min-h-[42px] w-full flex items-center justify-center bg-blue-600 text-white rounded hover:bg-blue-700"
          title="Buscar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
          </svg>
          Buscar
        </button>
      </div>
    </form>
  );
}
