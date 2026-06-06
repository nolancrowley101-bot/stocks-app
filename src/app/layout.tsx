import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

const inter = Inter({
  variable: "--font-sans-stack",
  subsets: ["latin"],
  display: "swap",
});

const jbMono = JetBrains_Mono({
  variable: "--font-mono-stack",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stocks — quotes, watchlists, portfolio",
  description: "Real stock prices, charts, analyst ratings, and portfolio tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jbMono.variable} antialiased text-[13px] leading-snug`}>
        <SessionProviderWrapper>
          <NavBar />
          <div className="min-h-[calc(100vh-3rem)]">{children}</div>
          <footer className="px-4 py-3 text-[10px] tracking-wide uppercase text-[var(--fg-3)] border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <span>Data · Yahoo Finance · delayed 15m</span>
            <span className="num">stocks-services.com</span>
          </footer>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
