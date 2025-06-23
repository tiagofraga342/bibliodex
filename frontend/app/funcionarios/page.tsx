"use client";
import * as React from "react";
import api from "../api";
import withAuth from "../components/withAuth";

interface Funcionario {
  id_funcionario: number;
  nome: string;
  cargo: string;
  matricula_funcional: string;
  is_active: boolean;
}

function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = React.useState<Funcionario[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mensagem, setMensagem] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchFuncionarios();
  }, []);

  async function fetchFuncionarios() {
    setLoading(true);
    try {
      const res = await api.get<Funcionario[]>("/funcionarios");
      setFuncionarios(res.data);
    } catch (e: any) {
      setMensagem(e?.message || "Erro ao buscar funcionários.");
      setFuncionarios([]);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Funcionários</h1>
      {mensagem && (
        <div className="mb-4 p-2 rounded bg-red-100 text-red-700">{mensagem}</div>
      )}
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-4 py-2 text-left">Nome</th>
                <th className="px-4 py-2 text-left">Cargo</th>
                <th className="px-4 py-2 text-left">Matrícula</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.map(f => (
                <tr key={f.id_funcionario} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-2">{f.nome}</td>
                  <td className="px-4 py-2">{f.cargo}</td>
                  <td className="px-4 py-2">{f.matricula_funcional}</td>
                  <td className="px-4 py-2">
                    <span className={f.is_active ? "bg-green-200 text-green-800 px-2 py-1 rounded text-xs" : "bg-red-200 text-red-800 px-2 py-1 rounded text-xs"}>
                      {f.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                </tr>
              ))}
              {funcionarios.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-8">Nenhum funcionário encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default withAuth(FuncionariosPage, ["funcionario"]);
