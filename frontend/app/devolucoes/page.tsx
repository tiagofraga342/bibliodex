"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import api, { EmprestimoRead } from "../api";
import withAuth from "../components/withAuth";

function DevolucoesPage() {
  const [emprestimos, setEmprestimos] = useState<EmprestimoRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    fetchEmprestimos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchEmprestimos() {
    setLoading(true);
    try {
      // Busca todos os empréstimos do backend
      const res = await api.get<EmprestimoRead[]>("/emprestimos");
      setEmprestimos(res.data);
    } catch (error) {
      setEmprestimos([]);
    }
    setLoading(false);
  }

  async function registrarDevolucao(id_emprestimo: number) {
    setMensagem(null);
    try {
      const payload = {
        id_emprestimo,
        data_devolucao: new Date().toISOString().slice(0, 10),
        // observacoes: "Devolução normal" // opcional
      };
      await api.post("/devolucoes", payload);
      setMensagem("Devolução registrada com sucesso!");
      await fetchEmprestimos();
    } catch (error: any) {
      setMensagem(
        error?.data?.detail ||
          "Erro ao registrar devolução. Verifique se o empréstimo já não foi devolvido."
      );
    }
  }

  // Mostra apenas empréstimos ativos ou atrasados
  const emprestimosParaDevolucao = emprestimos.filter(
    (e) => e.status_emprestimo === "ativo" || e.status_emprestimo === "atrasado"
  );

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Devoluções</h1>
      <p className="mb-4">Aqui você pode visualizar empréstimos pendentes e registrar devoluções.</p>
      {mensagem && (
        <div
          className={`mb-4 p-2 rounded ${
            mensagem.includes("sucesso")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {mensagem}
        </div>
      )}
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-4 py-2 text-left">Exemplar</th>
                <th className="px-4 py-2 text-left">Usuário</th>
                <th className="px-4 py-2 text-left">Data de Empréstimo</th>
                <th className="px-4 py-2 text-left">Data de Devolução</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {emprestimosParaDevolucao.map((e) => (
                <tr key={e.id_emprestimo} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-2">{e.exemplar.codigo_identificacao}</td>
                  <td className="px-4 py-2">{e.usuario.nome}</td>
                  <td className="px-4 py-2">{e.data_retirada}</td>
                  <td className="px-4 py-2">{e.data_efetiva_devolucao || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        e.status_emprestimo === "ativo"
                          ? "bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs"
                          : "bg-red-200 text-red-800 px-2 py-1 rounded text-xs"
                      }
                    >
                      {e.status_emprestimo === "ativo"
                        ? "Em andamento"
                        : e.status_emprestimo === "atrasado"
                        ? "Atrasado"
                        : e.status_emprestimo}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      className="px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800 text-xs"
                      onClick={() => registrarDevolucao(e.id_emprestimo)}
                    >
                      Registrar Devolução
                    </button>
                  </td>
                </tr>
              ))}
              {emprestimosParaDevolucao.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">
                    Nenhum empréstimo pendente para devolução.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default withAuth(DevolucoesPage, ["funcionario"]);
