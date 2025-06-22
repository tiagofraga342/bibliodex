"use client";

import React from "react";

interface ReservaModalProps {
  modalReservaLivro: any;
  authUser: any;
  buscaUsuarioReserva: string;
  setBuscaUsuarioReserva: (v: string) => void;
  usuarioId: string;
  setUsuarioId: (v: string) => void;
  usuariosFiltradosReserva: any[];
  setUsuariosFiltradosReserva: (v: any[]) => void;
  mensagemReserva: string;
  handleReserva: (e: React.FormEvent) => void;
  fecharModalReserva: () => void;
  modalReservaRef: React.RefObject<HTMLDialogElement>;
  dropdownUsuarioReservaAberto: boolean;
  setDropdownUsuarioReservaAberto: (v: boolean) => void;
  dropdownUsuarioReservaRef: React.RefObject<HTMLDivElement>;
  setMensagemReserva: (v: string) => void;
}

export default function ReservaModal({
  modalReservaLivro,
  authUser,
  buscaUsuarioReserva,
  setBuscaUsuarioReserva,
  usuarioId,
  setUsuarioId,
  usuariosFiltradosReserva,
  setUsuariosFiltradosReserva,
  mensagemReserva,
  handleReserva,
  fecharModalReserva,
  modalReservaRef,
  dropdownUsuarioReservaAberto,
  setDropdownUsuarioReservaAberto,
  dropdownUsuarioReservaRef,
  setMensagemReserva
}: ReservaModalProps) {
  const [numeroTomboSelecionado, setNumeroTomboSelecionado] = React.useState("");

  React.useEffect(() => {
    setNumeroTomboSelecionado("");
  }, [modalReservaLivro]);

  React.useEffect(() => {
    if (!modalReservaLivro) return;
    if (authUser?.role === 'funcionario' && buscaUsuarioReserva.trim().length > 0) {
      // Busca usuário por matrícula diretamente na API
      (async () => {
        try {
          const res = await import('../../api').then(m => m.default.get<any[]>(`/usuarios`, { matricula: buscaUsuarioReserva.trim() }));
          const usuario = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null;
          if (usuario) {
            setUsuarioId(String(usuario.id_usuario));
            setUsuariosFiltradosReserva([usuario]);
          } else {
            setUsuarioId("");
            setUsuariosFiltradosReserva([]);
          }
        } catch {
          setUsuarioId("");
          setUsuariosFiltradosReserva([]);
        }
      })();
    } else {
      setUsuarioId("");
      setUsuariosFiltradosReserva([]);
    }
  }, [modalReservaLivro, buscaUsuarioReserva, authUser, setUsuarioId, setUsuariosFiltradosReserva]);

  function handleReservaInterno(e: React.FormEvent) {
    e.preventDefault();
    // Passar o exemplar selecionado para o handler de reserva via closure
    (handleReserva as any)(e, numeroTomboSelecionado);
  }

  if (!modalReservaLivro) return null;

  return (
    <dialog
      ref={modalReservaRef}
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
      <form method="dialog" onSubmit={handleReservaInterno} className="flex flex-col gap-4 p-6 bg-white">
        <h2 className="text-xl font-bold mb-2 text-gray-900">Reservar livro</h2>
        <div>
          <span className="font-semibold">Livro selecionado:</span> {modalReservaLivro.titulo} <br />
          <span className="font-semibold">Autor(es):</span> {Array.isArray(modalReservaLivro.autores) && modalReservaLivro.autores.length > 0
            ? modalReservaLivro.autores.map((a: any) => a.nome).join(", ")
            : "Desconhecido"}
        </div>
        {authUser?.role === 'funcionario' ? (
          <label className="font-semibold text-gray-900">
            Matrícula do usuário:
            <input
              type="text"
              className="w-full p-2 border border-gray-400 rounded mt-1"
              placeholder="Digite a matrícula do usuário"
              value={buscaUsuarioReserva}
              onChange={async (e) => {
                setBuscaUsuarioReserva(e.target.value);
                const matricula = e.target.value.trim();
                if (matricula.length > 0) {
                  try {
                    const res = await import('../../api').then(m => m.default.get<any[]>(`/usuarios`, { matricula }));
                    const usuario = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null;
                    if (usuario) {
                      setUsuarioId(String(usuario.id_usuario));
                    } else {
                      setUsuarioId("");
                    }
                  } catch {
                    setUsuarioId("");
                  }
                } else {
                  setUsuarioId("");
                }
              }}
              autoComplete="off"
            />
          </label>
        ) : null}
        <label className="font-semibold text-gray-900 mt-2">
          Exemplar a reservar (opcional):
          <select
            className="w-full p-2 border border-gray-400 rounded mt-1"
            value={numeroTomboSelecionado}
            onChange={e => setNumeroTomboSelecionado(e.target.value)}
          >
            <option value="">Selecione o exemplar (opcional)</option>
            {modalReservaLivro.exemplaresDisponiveis && modalReservaLivro.exemplaresDisponiveis
              .filter((ex: any) => {
                // Permite reservar apenas se NÃO houver reserva ativa para o exemplar
                if (Array.isArray(ex.status)) {
                  return (ex.status.includes("disponivel") || ex.status.includes("emprestado")) && !ex.status.includes("reservado");
                }
                return (ex.status === "disponivel" || ex.status === "emprestado") && ex.status !== "reservado";
              })
              .map((ex: any) => {
                let statusLabel = Array.isArray(ex.status)
                  ? ex.status.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" e ")
                  : ex.status.charAt(0).toUpperCase() + ex.status.slice(1);
                let info = `Nº Tombo: ${ex.numero_tombo} | Localização: ${ex.localizacao || '-'}`;
                info += ` | Status: ${statusLabel}`;
                if ((Array.isArray(ex.status) ? ex.status.includes('emprestado') : ex.status === 'emprestado') && ex.data_prevista_devolucao) {
                  info += ` | Emprestado até: ${new Date(ex.data_prevista_devolucao).toLocaleDateString()}`;
                }
                if (Array.isArray(ex.status) && ex.status.includes('reservado')) {
                  info += ' | Já reservado para outro usuário';
                }
                return (
                  <option key={ex.numero_tombo} value={ex.numero_tombo}>
                    {info}
                  </option>
                );
              })}
          </select>
        </label>
        <div className="flex gap-2 justify-end">
          <button type="button" className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" onClick={fecharModalReserva}>Cancelar</button>
          <button type="submit" className="px-3 py-1 rounded bg-blue-700 text-white hover:bg-blue-800">Confirmar</button>
        </div>
        {mensagemReserva && <div className="text-center text-sm text-red-600 flex justify-center items-center min-h-[2.5rem]">{mensagemReserva}</div>}
      </form>
    </dialog>
  );
}
