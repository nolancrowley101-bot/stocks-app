import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getQuotes } from "@/lib/yahoo";
import { fmtCurrency, fmtPercent, fmtNumber, changeClass } from "@/lib/format";
import AddHoldingForm from "./AddHoldingForm";
import RemoveHoldingButton from "./RemoveHoldingButton";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const portfolio = await prisma.portfolio.findFirst({
    where: { userId: session.user.id },
    include: { holdings: { orderBy: { purchasedAt: "desc" } } },
  });

  const holdings = portfolio?.holdings ?? [];
  const uniqueSymbols = Array.from(new Set(holdings.map((h) => h.symbol)));
  const quotes = uniqueSymbols.length ? await getQuotes(uniqueSymbols) : [];
  const priceBy = new Map(quotes.map((q) => [q.symbol, q.regularMarketPrice ?? 0]));

  const rows = holdings.map((h) => {
    const price = priceBy.get(h.symbol) ?? 0;
    const shares = Number(h.shares);
    const cost = Number(h.costBasis);
    const marketValue = shares * price;
    const costTotal = shares * cost;
    const gain = marketValue - costTotal;
    const gainPct = costTotal > 0 ? (gain / costTotal) * 100 : 0;
    return { ...h, shares, cost, price, marketValue, costTotal, gain, gainPct };
  });

  const totalMV = rows.reduce((s, r) => s + r.marketValue, 0);
  const totalCost = rows.reduce((s, r) => s + r.costTotal, 0);
  const totalGain = totalMV - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-semibold">My portfolio</h1>
          <p className="text-sm text-zinc-400">Track cost basis vs current market value.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-400">Total market value</div>
          <div className="text-2xl font-semibold">{fmtCurrency(totalMV)}</div>
          <div className={`text-sm ${changeClass(totalGain)}`}>
            {fmtCurrency(totalGain)} ({fmtPercent(totalGainPct)})
          </div>
        </div>
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-3">Holdings</h2>
        {rows.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-8 text-center text-sm text-zinc-400">
            No holdings yet. Add one below.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/40">
            <table className="w-full text-sm">
              <thead className="text-xs text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="text-left px-4 py-3">Symbol</th>
                  <th className="text-right px-4 py-3">Shares</th>
                  <th className="text-right px-4 py-3">Cost / sh</th>
                  <th className="text-right px-4 py-3">Price</th>
                  <th className="text-right px-4 py-3">Market value</th>
                  <th className="text-right px-4 py-3">Gain / Loss</th>
                  <th className="text-right px-4 py-3">%</th>
                  <th className="text-right px-4 py-3">Weight</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-900/50">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/quote/${encodeURIComponent(r.symbol)}`} className="hover:underline">
                        {r.symbol}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">{fmtNumber(r.shares, 4)}</td>
                    <td className="px-4 py-3 text-right">{fmtCurrency(r.cost)}</td>
                    <td className="px-4 py-3 text-right">{fmtCurrency(r.price)}</td>
                    <td className="px-4 py-3 text-right font-medium">{fmtCurrency(r.marketValue)}</td>
                    <td className={`px-4 py-3 text-right ${changeClass(r.gain)}`}>
                      {fmtCurrency(r.gain)}
                    </td>
                    <td className={`px-4 py-3 text-right ${changeClass(r.gainPct)}`}>
                      {fmtPercent(r.gainPct)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400">
                      {totalMV > 0 ? `${((r.marketValue / totalMV) * 100).toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RemoveHoldingButton id={r.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Add holding</h2>
        <AddHoldingForm />
      </section>
    </main>
  );
}
