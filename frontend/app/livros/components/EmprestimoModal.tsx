import React from "react";

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
  handleEmprestimo: (e: React.FormEvent) => void;
  fecharModalEmprestimo: () => void;
  modalEmprestimoRef: React.RefObject<HTMLDialogElement>;
  dropdownUsuarioEmprestimoAberto: boolean;
  setDropdownUsuarioEmprestimoAberto: (v: boolean) => void;
  dropdownUsuarioEmprestimoRef: React.RefObject<HTMLDivElement>;
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
  dropdownUsuarioEmprestimoRef
}: EmprestimoModalProps) {
  if (!modalLivro) return null;
  return (
    <dialog ref={modalEmprestimoRef} className="rounded-lg p-0 w-full max-w-md">
      <form method="dialog" onSubmit={handleEmprestimo} className="flex flex-col gap-4 p-6 bg-white">
        <h2 className="text-xl font-bold mb-2 text-gray-900">Emprestar livro</h2>
        <div>
          <span className="font-semibold">Livro selecionado:</span> {modalLivro.titulo} <br />
          <span className="font-semibold">Autor:</span> {modalLivro.autores.map((a: any) => a.nome).join(", ")}
        </div>
        {authUser?.role === 'funcionario' ? (
          <label className="font-semibold text-gray-900">
            Usuário:
            <div className="relative" ref={dropdownUsuarioEmprestimoRef}>
              <input
                type="text"
                className="w-full p-2 border border-gray-400 rounded mt-1"
                placeholder="Digite o nome do usuário"
                value={buscaUsuarioEmprestimo}
                onChange={e => {
                  setBuscaUsuarioEmprestimo(e.target.value);
                  setUsuarioId("");
                  setDropdownUsuarioEmprestimoAberto(true);
                }}
                onFocus={() => setDropdownUsuarioEmprestimoAberto(true)}
                required
              />
              {dropdownUsuarioEmprestimoAberto && buscaUsuarioEmprestimo.length > 1 && usuariosFiltradosEmprestimo.length > 0 && (
                <ul className="border border-gray-300 rounded bg-white mt-1 max-h-32 overflow-y-auto z-10 absolute left-0 right-0">
                  {usuariosFiltradosEmprestimo.map(usuario => (
                    <li
                      key={usuario.id_usuario}
                      className={`px-2 py-1 cursor-pointer hover:bg-blue-100 ${usuarioId === String(usuario.id_usuario) ? 'bg-blue-200' : ''}`}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        setUsuarioId(String(usuario.id_usuario));
                        setBuscaUsuarioEmprestimo(usuario.nome);
                        setUsuariosFiltradosEmprestimo([]);
                        setDropdownUsuarioEmprestimoAberto(false);
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
          <button type="button" className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" onClick={fecharModalEmprestimo}>Cancelar</button>
          <button type="submit" className="px-3 py-1 rounded bg-blue-700 text-white hover:bg-blue-800">Confirmar</button>
        </div>
        {mensagem && <div className="text-center text-sm text-red-600">{mensagem}</div>}
      </form>
    </dialog>
  );
}
