import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getQuotes } from "@/lib/yahoo";
import { fmtCurrency, fmtPercent, fmtChange, fmtCompact, changeClass } from "@/lib/format";
import RemoveButton from "./RemoveButton";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const wl = await prisma.watchlist.findFirst({
    where: { userId: session.user.id },
    include: { items: { orderBy: { addedAt: "asc" } } },
  });

  const symbols = wl?.items.map((i) => i.symbol) ?? [];
  const quotes = symbols.length ? await getQuotes(symbols) : [];
  const bySym = new Map(quotes.map((q) => [q.symbol, q]));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-1">My watchlist</h1>
      <p className="text-sm text-zinc-400 mb-6">
        Search a ticker above and add it from any quote page.
      </p>

      {symbols.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-8 text-center text-sm text-zinc-400">
          Your watchlist is empty. Search a ticker (e.g., <Link href="/quote/AAPL" className="text-emerald-400">AAPL</Link>) and tap “+ Watchlist”.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/40">
          <table className="w-full text-sm">
            <thead className="text-xs text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="text-left px-4 py-3">Symbol</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">Change</th>
                <th className="text-right px-4 py-3">% Change</th>
                <th className="text-right px-4 py-3">Mkt cap</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {symbols.map((sym) => {
                const q = bySym.get(sym);
                return (
                  <tr key={sym} className="hover:bg-zinc-900/50">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/quote/${encodeURIComponent(sym)}`} className="hover:underline">
                        {sym}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 truncate max-w-[240px]">
                      {q?.shortName ?? q?.longName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {fmtCurrency(q?.regularMarketPrice, q?.currency ?? "USD")}
                    </td>
                    <td className={`px-4 py-3 text-right ${changeClass(q?.regularMarketChange)}`}>
                      {fmtChange(q?.regularMarketChange)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right ${changeClass(q?.regularMarketChangePercent)}`}
                    >
                      {fmtPercent(q?.regularMarketChangePercent)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400">
                      {fmtCompact(q?.marketCap)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RemoveButton symbol={sym} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
