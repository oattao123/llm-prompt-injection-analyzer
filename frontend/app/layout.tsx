import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "🛡️ LLM Prompt Injection Analyzer",
  description:
    "Multi-layer detection for LLM prompt injection & jailbreak — OWASP LLM01",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="gradient-bg min-h-screen text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
