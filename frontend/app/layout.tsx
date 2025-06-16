import { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import { AuthProvider, useAuth } from "./contexts/AuthContext"; // Import AuthProvider
import ClientLayout from "./components/ClientLayout"; // We'll create this next

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Bibliodex",
  description: "Sistema de gestão de biblioteca universitária",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 min-h-screen`}>
        <AuthProvider> {/* Wrap with AuthProvider */}
          <ClientLayout> {/* ClientLayout will contain header/footer and consume useAuth */}
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
