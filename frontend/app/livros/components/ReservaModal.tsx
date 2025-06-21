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
  dropdownUsuarioReservaRef
}: ReservaModalProps) {
  if (!modalReservaLivro) return null;
  return (
    <dialog ref={modalReservaRef} className="rounded-lg p-0 w-full max-w-md">
      <form method="dialog" onSubmit={handleReserva} className="flex flex-col gap-4 p-6 bg-white">
        <h2 className="text-xl font-bold mb-2 text-gray-900">Reservar livro</h2>
        <div>
          <span className="font-semibold">Livro selecionado:</span> {modalReservaLivro.titulo} <br />
          <span className="font-semibold">Autor:</span> {modalReservaLivro.autores.map((a: any) => a.nome).join(", ")}
        </div>
        {authUser?.role === 'funcionario' ? (
          <label className="font-semibold text-gray-900">
            Usuário:
            <div className="relative" ref={dropdownUsuarioReservaRef}>
              <input
                type="text"
                className="w-full p-2 border border-gray-400 rounded mt-1"
                placeholder="Digite o nome do usuário"
                value={buscaUsuarioReserva}
                onChange={e => {
                  setBuscaUsuarioReserva(e.target.value);
                  setUsuarioId("");
                  setDropdownUsuarioReservaAberto(true);
                }}
                onFocus={() => setDropdownUsuarioReservaAberto(true)}
                required
              />
              {dropdownUsuarioReservaAberto && buscaUsuarioReserva.length > 1 && usuariosFiltradosReserva.length > 0 && (
                <ul className="border border-gray-300 rounded bg-white mt-1 max-h-32 overflow-y-auto z-10 absolute left-0 right-0">
                  {usuariosFiltradosReserva.map(usuario => (
                    <li
                      key={usuario.id_usuario}
                      className={`px-2 py-1 cursor-pointer hover:bg-blue-100 ${usuarioId === String(usuario.id_usuario) ? 'bg-blue-200' : ''}`}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        setUsuarioId(String(usuario.id_usuario));
                        setBuscaUsuarioReserva(usuario.nome);
                        setUsuariosFiltradosReserva([]);
                        setDropdownUsuarioReservaAberto(false);
                      }}
                    >
                      {usuario.nome} <span className="text-xs text-gray-500">({usuario.role})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </label>
        ) : (
          <div>
            <span className="font-semibold">Usuário:</span> {authUser?.nome || authUser?.sub}
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button type="button" className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" onClick={fecharModalReserva}>Cancelar</button>
          <button type="submit" className="px-3 py-1 rounded bg-blue-700 text-white hover:bg-blue-800">Confirmar</button>
        </div>
        {mensagemReserva && <div className="text-center text-sm text-red-600">{mensagemReserva}</div>}
      </form>
    </dialog>
  );
}
