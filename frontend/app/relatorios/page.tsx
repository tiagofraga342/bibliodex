"use client";
import * as React from "react";
import withAuth from "../components/withAuth";

function RelatoriosPage() {
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Relatórios</h1>
      <p>Visualização de relatórios sobre uso da biblioteca, livros mais emprestados, penalidades, etc. será implementado aqui.</p>
      <p className="mt-4 p-3 bg-green-100 text-green-700 rounded">
        Acesso restrito a funcionários.
      </p>
    </div>
  );
}

export default withAuth(RelatoriosPage, ['funcionario']);
