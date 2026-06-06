import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getQuotes } from "@/lib/yahoo";
import { fmtCurrency, fmtPercent, fmtChange, fmtCompact } from "@/lib/format";
import { Module, ModuleHeader } from "@/components/ui/Module";
import { Num } from "@/components/ui/Num";
import {
  DataTable,
  tableHead,
  tableHeadNum,
  tableCell,
  tableCellNum,
  tableRow,
} from "@/components/ui/DataTable";
import RemoveButton from "./RemoveButton";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  let symbols: string[] = [];
  let dbError = false;
  try {
    const wl = await prisma.watchlist.findFirst({
      where: { userId: session.user.id },
      include: { items: { orderBy: { addedAt: "asc" } } },
    });
    symbols = wl?.items.map((i) => i.symbol) ?? [];
  } catch {
    dbError = true;
  }
  const quotes = symbols.length ? await getQuotes(symbols) : [];
  const bySym = new Map(quotes.map((q) => [q.symbol, q]));

  const totalUp = quotes.filter((q) => (q.regularMarketChangePercent ?? 0) > 0).length;
  const totalDown = quotes.filter((q) => (q.regularMarketChangePercent ?? 0) < 0).length;

  return (
    <main className="p-2 space-y-2">
      <header className="flex items-end justify-between gap-3 px-1 pt-1 pb-2">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight">Watchlist</h1>
          <p className="text-[11px] text-[var(--fg-3)] uppercase tracking-wider mt-0.5">
            {symbols.length} {symbols.length === 1 ? "symbol" : "symbols"}
            {symbols.length > 0 && (
              <>
                <span className="mx-2 text-[var(--border-strong)]">·</span>
                <span className="text-[var(--gain)]">{totalUp} up</span>
                <span className="mx-1">/</span>
                <span className="text-[var(--loss)]">{totalDown} down</span>
              </>
            )}
          </p>
        </div>
      </header>

      <Module>
        <ModuleHeader label="My watchlist" />
        {dbError ? (
          <div className="p-8 text-center text-[12px] text-[var(--loss)]">
            Could not reach database. Try again in a moment.
          </div>
        ) : symbols.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-[var(--fg-2)]">
            Empty. Search a ticker (e.g.,{" "}
            <Link href="/quote/AAPL" className="text-[var(--accent)] num">AAPL</Link>) and tap{" "}
            <span className="num">+ Watchlist</span>.
          </div>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th className={tableHead}>Sym</th>
                <th className={tableHead}>Name</th>
                <th className={tableHeadNum}>Last</th>
                <th className={tableHeadNum}>Δ</th>
                <th className={tableHeadNum}>%</th>
                <th className={tableHeadNum}>Mkt cap</th>
                <th className={tableHead}></th>
              </tr>
            </thead>
            <tbody>
              {symbols.map((sym) => {
                const q = bySym.get(sym);
                return (
                  <tr key={sym} className={tableRow}>
                    <td className={`${tableCell} num font-medium`}>
                      <Link
                        href={`/quote/${encodeURIComponent(sym)}`}
                        className="hover:text-[var(--accent)]"
                      >
                        {sym}
                      </Link>
                    </td>
                    <td className={`${tableCell} text-[var(--fg-2)] max-w-[280px] truncate`}>
                      {q?.shortName ?? q?.longName ?? "—"}
                    </td>
                    <td className={tableCellNum}>
                      {fmtCurrency(q?.regularMarketPrice, q?.currency ?? "USD")}
                    </td>
                    <td className={tableCellNum}>
                      <Num delta={q?.regularMarketChange}>{fmtChange(q?.regularMarketChange)}</Num>
                    </td>
                    <td className={tableCellNum}>
                      <Num delta={q?.regularMarketChangePercent}>
                        {fmtPercent(q?.regularMarketChangePercent)}
                      </Num>
                    </td>
                    <td className={`${tableCellNum} text-[var(--fg-2)]`}>
                      {fmtCompact(q?.marketCap)}
                    </td>
                    <td className={`${tableCell} text-right w-8`}>
                      <RemoveButton symbol={sym} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        )}
      </Module>
    </main>
  );
}
