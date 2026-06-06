import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProviderWrapper>
          <NavBar />
          {children}
          <footer className="mx-auto max-w-7xl px-4 py-10 mt-12 text-xs text-zinc-500 border-t border-zinc-800">
            Data: Yahoo Finance (delayed). Not investment advice.
          </footer>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
