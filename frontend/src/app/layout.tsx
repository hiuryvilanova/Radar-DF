import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Radar DF — Inteligência Territorial de Demandas Públicas",
  description: "Plataforma de monitoramento, organização e análise de demandas das cidades do Distrito Federal, desenvolvida para transformar informações territoriais em diagnósticos, prioridades e ações estratégicas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className} lang="pt-BR">{children}</body>
    </html>
  );
}
