"use client";
import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    // router.push('/login'); // logout() in AuthContext already handles this
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Carregando...</div>;
  }

  return (
    <>
      <header className="w-full bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-full group">
              <Image src="/file.svg" alt="Logo Bibliodex" width={44} height={44} className="drop-shadow-lg transition group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif drop-shadow-md group-hover:underline">Bibliodex</span>
                <span className="text-xs sm:text-sm font-medium tracking-wide text-blue-100 mt-0.5">Sistema de Gerenciamento de Biblioteca Universitária</span>
              </div>
              <span className="sr-only">Ir para a página inicial</span>
            </Link>
          </div>
          <nav className="flex flex-wrap gap-2 sm:gap-3 mt-2 sm:mt-0">
            {isAuthenticated && user?.role === 'usuario_cliente' && (
              <>
                <Link href="/reservas/me" className="px-3 py-1.5 bg-blue-900/80 hover:bg-blue-900 text-white rounded transition text-sm font-semibold">Minhas Reservas</Link>
                <Link href="/emprestimos/me" className="px-3 py-1.5 bg-blue-900/80 hover:bg-blue-900 text-white rounded transition text-sm font-semibold">Meus Empréstimos</Link>
                {/* <Link href="/usuarios/me" className="px-3 py-1.5 bg-blue-900/80 hover:bg-blue-900 text-white rounded transition text-sm font-semibold">Meu Perfil</Link> */}
              </>
            )}

            {isAuthenticated && user?.role === 'funcionario' && (
              <>
                <Link href="/usuarios" className="px-3 py-1.5 bg-blue-900/80 hover:bg-blue-900 text-white rounded transition text-sm font-semibold">Usuários</Link>
                <Link href="/funcionarios" className="px-3 py-1.5 bg-blue-900/80 hover:bg-blue-900 text-white rounded transition text-sm font-semibold">Funcionários</Link>
                <Link href="/emprestimos" className="px-3 py-1.5 bg-blue-900/80 hover:bg-blue-900 text-white rounded transition text-sm font-semibold">Empréstimos</Link>
                <Link href="/reservas" className="px-3 py-1.5 bg-blue-900/80 hover:bg-blue-900 text-white rounded transition text-sm font-semibold">Reservas</Link>
                <Link href="/relatorios" className="px-3 py-1.5 bg-blue-900/80 hover:bg-blue-900 text-white rounded transition text-sm font-semibold">Relatórios</Link>
                <Link href="/admin" className="px-3 py-1.5 bg-blue-900/80 hover:bg-blue-900 text-white rounded transition text-sm font-semibold">Administração</Link>
              </>
            )}
            
            {isAuthenticated ? (
              <button onClick={handleLogout} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition text-sm font-semibold">Logout ({user?.nome || user?.sub})</button>
            ) : (
              <Link href="/login" className="px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded transition text-sm font-semibold">Login</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="p-4 sm:p-6 md:p-8">{children}</main>
      <footer className="w-full py-4 bg-blue-900 text-white text-center text-xs mt-8">
        &copy; {new Date().getFullYear()} Bibliodex - Projeto BDII USP
      </footer>
    </>
  );
}
