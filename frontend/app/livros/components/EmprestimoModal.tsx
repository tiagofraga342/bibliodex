"use client";

import React, { useEffect, useState } from "react";
import api from "../../api";

interface EmprestimoModalProps {
  modalLivro: any;
  authUser: any;
  buscaUsuarioEmprestimo: string;
  setBuscaUsuarioEmprestimo: (v: string) => void;
  usuarioId: string;
  setUsuarioId: (v: string) => void;
  usuariosFiltradosEmprestimo: any[];
  setUsuariosFiltradosEmprestimo: (v: any[]) => void;
  mensagem: string;
  handleEmprestimo: (e: React.FormEvent, numeroTombo?: string) => void;
  fecharModalEmprestimo: () => void;
  modalEmprestimoRef: React.RefObject<HTMLDialogElement>;
  dropdownUsuarioEmprestimoAberto: boolean;
  setDropdownUsuarioEmprestimoAberto: (v: boolean) => void;
  dropdownUsuarioEmprestimoRef: React.RefObject<HTMLDivElement>;
  numeroTomboSelecionado: string;
  setNumeroTomboSelecionado: (v: string) => void;
}

export default function EmprestimoModal({
  modalLivro,
  authUser,
  buscaUsuarioEmprestimo,
  setBuscaUsuarioEmprestimo,
  usuarioId,
  setUsuarioId,
  usuariosFiltradosEmprestimo,
  setUsuariosFiltradosEmprestimo,
  mensagem,
  handleEmprestimo,
  fecharModalEmprestimo,
  modalEmprestimoRef,
  dropdownUsuarioEmprestimoAberto,
  setDropdownUsuarioEmprestimoAberto,
  dropdownUsuarioEmprestimoRef,
  numeroTomboSelecionado,
  setNumeroTomboSelecionado
}: EmprestimoModalProps) {
  const [exemplaresDisponiveis, setExemplaresDisponiveis] = useState<any[]>([]);

  useEffect(() => {
    if (modalLivro) {
      api.get<any[]>(`/livros/${modalLivro.id_livro}/exemplares`).then(res => {
        setExemplaresDisponiveis(Array.isArray(res.data) ? res.data.filter((ex: any) => ex.status === "disponivel") : []);
        setNumeroTomboSelecionado("");
      });
    }
  }, [modalLivro, setNumeroTomboSelecionado]);

  if (!modalLivro) return null;
  return (
    <dialog
      ref={modalEmprestimoRef}
      className="rounded-lg p-0 w-full max-w-md"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 50,
        background: 'rgba(255,255,255,1)'
      }}
    >
      <form method="dialog" onSubmit={e => handleEmprestimo(e, numeroTomboSelecionado)} className="flex flex-col gap-4 p-6 bg-white">
        <h2 className="text-xl font-bold mb-2 text-gray-900">Emprestar livro</h2>
        <div>
          <span className="font-semibold">Livro selecionado:</span> {modalLivro.titulo} <br />
          <span className="font-semibold">Autor:</span> {modalLivro.autores.map((a: any) => a.nome).join(", ")}
        </div>
        {authUser?.role === 'funcionario' ? (
          <label className="font-semibold text-gray-900">
            Matrícula do usuário:
            <input
              type="text"
              className="w-full p-2 border border-gray-400 rounded mt-1"
              placeholder="Digite a matrícula do usuário"
              value={buscaUsuarioEmprestimo}
              onChange={e => setBuscaUsuarioEmprestimo(e.target.value)}
              required
            />
          </label>
        ) : (
          <div>
            <span className="font-semibold">Usuário:</span> {authUser?.nome || authUser?.sub}
          </div>
        )}
        <label className="font-semibold text-gray-900">
          Exemplar disponível:
          <select
            className="w-full p-2 border border-gray-400 rounded mt-1"
            value={numeroTomboSelecionado}
            onChange={e => setNumeroTomboSelecionado(e.target.value)}
            required
          >
            <option value="" disabled>Selecione o exemplar</option>
            {exemplaresDisponiveis.map((ex: any) => (
              <option key={ex.numero_tombo} value={ex.numero_tombo}>
                Nº Tombo: {ex.numero_tombo} | Localização: {ex.localizacao || '-'}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2 justify-end">
          <button type="button" className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" onClick={fecharModalEmprestimo}>Cancelar</button>
          <button type="submit" className="px-3 py-1 rounded bg-blue-700 text-white hover:bg-blue-800">Confirmar</button>
        </div>
        {mensagem && <div className="text-center text-sm text-red-600">{mensagem}</div>}
      </form>
    </dialog>
  );
}
