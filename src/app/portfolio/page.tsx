import Link from "next/link";
import type { Holding } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getQuotes } from "@/lib/yahoo";
import { fmtCurrency, fmtPercent, fmtNumber } from "@/lib/format";
import { Module, ModuleHeader } from "@/components/ui/Module";
import { Num, Delta } from "@/components/ui/Num";
import {
  DataTable,
  tableHead,
  tableHeadNum,
  tableCell,
  tableCellNum,
  tableRow,
} from "@/components/ui/DataTable";
import AddHoldingForm from "./AddHoldingForm";
import RemoveHoldingButton from "./RemoveHoldingButton";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  let holdings: Holding[] = [];
  let dbError = false;
  try {
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: session.user.id },
      include: { holdings: { orderBy: { purchasedAt: "desc" } } },
    });
    holdings = portfolio?.holdings ?? [];
  } catch {
    dbError = true;
  }
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
  const winners = rows.filter((r) => r.gain > 0).length;
  const losers = rows.filter((r) => r.gain < 0).length;

  return (
    <main className="p-2 space-y-2">
      <header className="flex items-end justify-between gap-3 px-1 pt-1 pb-2">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight">Portfolio</h1>
          <p className="text-[11px] text-[var(--fg-3)] uppercase tracking-wider mt-0.5">
            Cost vs market value
          </p>
        </div>
      </header>

      {/* KPI strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Kpi label="Market value" value={<Num className="text-[20px]">{fmtCurrency(totalMV)}</Num>} />
        <Kpi label="Cost basis" value={<Num className="text-[20px] text-[var(--fg-2)]">{fmtCurrency(totalCost)}</Num>} />
        <Kpi
          label="Unrealized P/L"
          value={
            <span className="text-[20px]">
              <Delta value={totalGain} pct={totalGainPct} />
            </span>
          }
        />
        <Kpi
          label="Positions"
          value={
            <span className="text-[20px] num">
              {rows.length}
              <span className="ml-2 text-[12px]">
                <span className="text-[var(--gain)]">{winners}</span>
                <span className="text-[var(--fg-3)] mx-1">/</span>
                <span className="text-[var(--loss)]">{losers}</span>
              </span>
            </span>
          }
        />
      </section>

      <Module>
        <ModuleHeader label="Holdings" actions={<span className="num text-[10px] text-[var(--fg-3)]">{rows.length}</span>} />
        {dbError ? (
          <div className="p-8 text-center text-[12px] text-[var(--loss)]">
            Could not reach database. Try again in a moment.
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-[var(--fg-2)]">No holdings yet.</div>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th className={tableHead}>Sym</th>
                <th className={tableHeadNum}>Shares</th>
                <th className={tableHeadNum}>Cost</th>
                <th className={tableHeadNum}>Price</th>
                <th className={tableHeadNum}>Market val</th>
                <th className={tableHeadNum}>P/L</th>
                <th className={tableHeadNum}>%</th>
                <th className={tableHeadNum}>Wt</th>
                <th className={tableHead}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={tableRow}>
                  <td className={`${tableCell} num font-medium`}>
                    <Link href={`/quote/${encodeURIComponent(r.symbol)}`} className="hover:text-[var(--accent)]">
                      {r.symbol}
                    </Link>
                  </td>
                  <td className={tableCellNum}>{fmtNumber(r.shares, 4)}</td>
                  <td className={`${tableCellNum} text-[var(--fg-2)]`}>{fmtCurrency(r.cost)}</td>
                  <td className={tableCellNum}>{fmtCurrency(r.price)}</td>
                  <td className={`${tableCellNum} font-medium`}>{fmtCurrency(r.marketValue)}</td>
                  <td className={tableCellNum}>
                    <Num delta={r.gain}>{fmtCurrency(r.gain)}</Num>
                  </td>
                  <td className={tableCellNum}>
                    <Num delta={r.gainPct}>{fmtPercent(r.gainPct)}</Num>
                  </td>
                  <td className={`${tableCellNum} text-[var(--fg-2)]`}>
                    {totalMV > 0 ? `${((r.marketValue / totalMV) * 100).toFixed(1)}%` : "—"}
                  </td>
                  <td className={`${tableCell} text-right w-8`}>
                    <RemoveHoldingButton id={r.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Module>

      <Module>
        <ModuleHeader label="Add holding" />
        <AddHoldingForm />
      </Module>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Module>
      <ModuleHeader label={label} />
      <div className="px-3 py-2">{value}</div>
    </Module>
  );
}
