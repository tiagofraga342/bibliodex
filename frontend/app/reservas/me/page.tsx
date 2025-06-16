"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import api, { ReservaRead as Reserva } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import withAuth from "../../components/withAuth";

function MinhasReservasPage() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    fetchMinhasReservas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchMinhasReservas() {
    setLoading(true);
    try {
      const res = await api.get<Reserva[]>("/reservas/me");
      setReservas(res.data);
    } catch (error) {
      setReservas([]);
    }
    setLoading(false);
  }

  async function cancelarReserva(id_reserva: number) {
    setMensagem(null);
    try {
      await api.put(`/reservas/${id_reserva}/cancelar`, {});
      setMensagem("Reserva cancelada com sucesso!");
      await fetchMinhasReservas();
    } catch (error: any) {
      setMensagem(
        error?.data?.detail ||
          "Erro ao cancelar reserva. Verifique se a reserva já não foi cancelada ou atendida."
      );
    }
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Minhas Reservas</h1>
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
                <th className="px-4 py-2 text-left">Livro</th>
                <th className="px-4 py-2 text-left">Data da Reserva</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map(r => (
                <tr key={r.id_reserva} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {r.livro
                      ? (<>{r.livro.titulo} <span className="text-xs text-gray-500">
                          {Array.isArray((r.livro as any).autores) && (r.livro as any).autores.length > 0
                            ? `(${(r.livro as any).autores.map((a: any) => a.nome).join(", ")})`
                            : ""}
                        </span></>)
                      : <span className="text-gray-400 italic">Livro não disponível</span>
                    }
                  </td>
                  <td className="px-4 py-2">{r.data_reserva}</td>
                  <td className="px-4 py-2">
                    <span className={
                      r.status === "ativa"
                        ? "bg-green-200 text-green-800 px-2 py-1 rounded text-xs"
                        : r.status === "cancelada"
                        ? "bg-red-200 text-red-800 px-2 py-1 rounded text-xs"
                        : r.status === "atendida"
                        ? "bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs"
                        : "bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs"
                    }>
                      {r.status === "ativa"
                        ? "Ativa"
                        : r.status === "cancelada"
                        ? "Cancelada"
                        : r.status === "atendida"
                        ? "Efetivada"
                        : r.status === "expirada"
                        ? "Expirada"
                        : r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {r.status === "ativa" && (
                      <button
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                        onClick={() => cancelarReserva(r.id_reserva)}
                      >
                        Cancelar Reserva
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {reservas.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-8">Nenhuma reserva encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default withAuth(MinhasReservasPage, ["usuario_cliente"]);
