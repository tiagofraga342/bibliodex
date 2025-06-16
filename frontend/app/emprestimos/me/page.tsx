"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import api, { EmprestimoRead } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import withAuth from "../../components/withAuth";

function MeusEmprestimosPage() {
  const { user } = useAuth();
  const [emprestimos, setEmprestimos] = useState<EmprestimoRead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMeusEmprestimos() {
      try {
        const res = await api.get<EmprestimoRead[]>("/emprestimos/me");
        setEmprestimos(res.data);
      } catch (error) {
        setEmprestimos([]);
      }
      setLoading(false);
    }
    fetchMeusEmprestimos();
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Meus Empréstimos</h1>
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-4 py-2 text-left">Exemplar</th>
                <th className="px-4 py-2 text-left">Data de Empréstimo</th>
                <th className="px-4 py-2 text-left">Data de Devolução</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {emprestimos.map(e => (
                <tr key={e.id_emprestimo} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-2">{e.exemplar.codigo_identificacao}</td>
                  <td className="px-4 py-2">{e.data_retirada}</td>
                  <td className="px-4 py-2">{e.data_efetiva_devolucao || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-2">
                    <span className={
                      e.status_emprestimo === "ativo"
                        ? "bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs"
                        : e.status_emprestimo === "devolvido"
                        ? "bg-green-200 text-green-800 px-2 py-1 rounded text-xs"
                        : "bg-red-200 text-red-800 px-2 py-1 rounded text-xs"
                    }>
                      {e.status_emprestimo === "ativo"
                        ? "Em andamento"
                        : e.status_emprestimo === "devolvido"
                        ? "Devolvido"
                        : e.status_emprestimo === "atrasado"
                        ? "Atrasado"
                        : e.status_emprestimo}
                    </span>
                  </td>
                </tr>
              ))}
              {emprestimos.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-8">Nenhum empréstimo encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default withAuth(MeusEmprestimosPage, ["usuario_cliente"]);
