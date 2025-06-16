"use client";
import Link from "next/link";

export default function AcessoNegado() {
  return (
    <div className="max-w-lg mx-auto mt-20 p-8 bg-white rounded shadow text-center">
      <h1 className="text-3xl font-bold text-red-700 mb-4">Acesso Negado</h1>
      <p className="mb-6 text-gray-700">
        Você não tem permissão para acessar esta página.<br />
        Se você acredita que isso é um erro, entre em contato com o administrador do sistema.
      </p>
      <Link href="/" className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 font-semibold">
        Voltar para a Home
      </Link>
    </div>
  );
}
