"use client";
import * as React from "react";
import api, { UsuarioReadBasic } from "../api";
import withAuth from "../components/withAuth";

function UsuariosPage() {
  const [usuarios, setUsuarios] = React.useState<UsuarioReadBasic[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mensagem, setMensagem] = React.useState<string | null>(null);
  const [modalEdit, setModalEdit] = React.useState<UsuarioReadBasic | null>(null);
  const [editData, setEditData] = React.useState<Partial<UsuarioReadBasic>>({});
  const [modalNovo, setModalNovo] = React.useState(false);
  const [novoUsuario, setNovoUsuario] = React.useState({
    nome: "",
    matricula: "",
    email: "",
    telefone: "",
    id_curso: "",
    password: "",
  });

  React.useEffect(() => {
    fetchUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchUsuarios() {
    setLoading(true);
    try {
      const res = await api.get<UsuarioReadBasic[]>("/usuarios");
      setUsuarios(res.data);
    } catch {
      setUsuarios([]);
    }
    setLoading(false);
  }

  async function criarUsuario(e: React.FormEvent) {
    e.preventDefault();
    setMensagem(null);
    try {
      const payload = {
        ...novoUsuario,
        id_curso: novoUsuario.id_curso ? Number(novoUsuario.id_curso) : undefined,
      };
      await api.post("/usuarios", payload);
      setMensagem("Usuário criado com sucesso!");
      setModalNovo(false);
      setNovoUsuario({ nome: "", matricula: "", email: "", telefone: "", id_curso: "", password: "" });
      await fetchUsuarios();
    } catch (e: any) {
      setMensagem(e?.data?.detail || "Erro ao criar usuário.");
    }
  }

  async function salvarEdicaoUsuario(e: React.FormEvent) {
    e.preventDefault();
    if (!modalEdit) return;
    setMensagem(null);
    try {
      const payload = {
        ...editData,
        id_curso: editData.id_curso ? Number(editData.id_curso) : undefined,
      };
      await api.put(`/usuarios/${modalEdit.id_usuario}`, payload);
      setMensagem("Usuário atualizado!");
      setModalEdit(null);
      setEditData({});
      await fetchUsuarios();
    } catch (e: any) {
      setMensagem(e?.data?.detail || "Erro ao atualizar usuário.");
    }
  }

  async function excluirUsuario(id: number) {
    if (!window.confirm("Excluir usuário?")) return;
    setMensagem(null);
    try {
      await api.delete(`/usuarios/${id}`);
      setMensagem("Usuário excluído!");
      setUsuarios(prev => prev.filter(u => u.id_usuario !== id));
    } catch (e: any) {
      // Tenta forçar atualização da lista mesmo em erro
      await fetchUsuarios();
      setMensagem(e?.message || e?.data?.detail || "Erro ao excluir usuário.");
    }
  }

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Usuários</h1>
      {mensagem && (
        <div className={`mb-4 p-2 rounded ${mensagem.includes("sucesso") || mensagem.includes("atualizad") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {mensagem}
        </div>
      )}
      <button
        className="mb-4 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 font-semibold"
        onClick={() => setModalNovo(true)}
      >
        Novo Usuário
      </button>
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-4 py-2 text-left">Nome</th>
                <th className="px-4 py-2 text-left">Matrícula</th>
                <th className="px-4 py-2 text-left">E-mail</th>
                <th className="px-4 py-2 text-left">Telefone</th>
                <th className="px-4 py-2 text-left">Curso</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id_usuario} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-2">{u.nome}</td>
                  <td className="px-4 py-2">{u.matricula}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.telefone}</td>
                  <td className="px-4 py-2">{u.curso?.nome || "-"}</td>
                  <td className="px-4 py-2">
                    <span className={u.is_active ? "bg-green-200 text-green-800 px-2 py-1 rounded text-xs" : "bg-red-200 text-red-800 px-2 py-1 rounded text-xs"}>
                      {u.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      className="px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800 text-xs"
                      onClick={() => { setModalEdit(u); setEditData(u); }}
                    >Editar</button>
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                      onClick={() => excluirUsuario(u.id_usuario)}
                    >Excluir</button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-8">Nenhum usuário encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal Novo Usuário */}
      {modalNovo && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 min-w-[350px] max-w-[90vw]">
            <h2 className="text-xl font-bold mb-4">Novo Usuário</h2>
            <form onSubmit={criarUsuario} className="flex flex-col gap-3">
              <input type="text" placeholder="Nome" value={novoUsuario.nome} onChange={e => setNovoUsuario(n => ({ ...n, nome: e.target.value }))} className="p-2 border rounded" required />
              <input type="text" placeholder="Matrícula" value={novoUsuario.matricula} onChange={e => setNovoUsuario(n => ({ ...n, matricula: e.target.value }))} className="p-2 border rounded" required />
              <input type="email" placeholder="E-mail" value={novoUsuario.email} onChange={e => setNovoUsuario(n => ({ ...n, email: e.target.value }))} className="p-2 border rounded" />
              <input type="text" placeholder="Telefone" value={novoUsuario.telefone} onChange={e => setNovoUsuario(n => ({ ...n, telefone: e.target.value }))} className="p-2 border rounded" />
              <input type="number" placeholder="ID do Curso" value={novoUsuario.id_curso} onChange={e => setNovoUsuario(n => ({ ...n, id_curso: e.target.value }))} className="p-2 border rounded" />
              <input type="password" placeholder="Senha" value={novoUsuario.password} onChange={e => setNovoUsuario(n => ({ ...n, password: e.target.value }))} className="p-2 border rounded" required />
              <div className="flex gap-2 mt-2">
                <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 font-semibold">Salvar</button>
                <button type="button" onClick={() => setModalNovo(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 font-semibold">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Editar Usuário */}
      {modalEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 min-w-[350px] max-w-[90vw]">
            <h2 className="text-xl font-bold mb-4">Editar Usuário</h2>
            <form onSubmit={salvarEdicaoUsuario} className="flex flex-col gap-3">
              <input type="text" placeholder="Nome" value={editData.nome || ""} onChange={e => setEditData(d => ({ ...d, nome: e.target.value }))} className="p-2 border rounded" required />
              <input type="text" placeholder="Matrícula" value={editData.matricula || ""} onChange={e => setEditData(d => ({ ...d, matricula: e.target.value }))} className="p-2 border rounded" required />
              <input type="email" placeholder="E-mail" value={editData.email || ""} onChange={e => setEditData(d => ({ ...d, email: e.target.value }))} className="p-2 border rounded" />
              <input type="text" placeholder="Telefone" value={editData.telefone || ""} onChange={e => setEditData(d => ({ ...d, telefone: e.target.value }))} className="p-2 border rounded" />
              <input type="number" placeholder="ID do Curso" value={editData.id_curso || ""} onChange={e => setEditData(d => ({ ...d, id_curso: e.target.value === "" ? undefined : Number(e.target.value) }))} className="p-2 border rounded" />
              <div className="flex gap-2 mt-2">
                <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 font-semibold">Salvar</button>
                <button type="button" onClick={() => setModalEdit(null)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 font-semibold">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(UsuariosPage, ['funcionario']);
