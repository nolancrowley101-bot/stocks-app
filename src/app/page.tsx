import Link from "next/link";
import { getQuotes, getMovers, getNews, type Quote } from "@/lib/yahoo";
import { Module, ModuleHeader, ModuleFooter } from "@/components/ui/Module";
import { Num, Delta } from "@/components/ui/Num";
import { Heatmap, type HeatmapCell } from "@/components/ui/Heatmap";
import {
  DataTable,
  tableHead,
  tableHeadNum,
  tableCell,
  tableCellNum,
  tableRow,
} from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { fmtCurrency, fmtPercent, timeAgo } from "@/lib/format";

export const revalidate = 60;

const INDEX_GROUP: { symbol: string; label: string }[] = [
  { symbol: "^GSPC", label: "S&P 500" },
  { symbol: "^IXIC", label: "Nasdaq" },
  { symbol: "^DJI", label: "Dow Jones" },
  { symbol: "^RUT", label: "Russell 2K" },
  { symbol: "^VIX", label: "VIX" },
  { symbol: "^FTSE", label: "FTSE 100" },
  { symbol: "^N225", label: "Nikkei" },
  { symbol: "^HSI", label: "Hang Seng" },
];

const COMMODITY_GROUP: { symbol: string; label: string }[] = [
  { symbol: "CL=F", label: "WTI Crude" },
  { symbol: "BZ=F", label: "Brent" },
  { symbol: "NG=F", label: "Nat Gas" },
  { symbol: "GC=F", label: "Gold" },
  { symbol: "SI=F", label: "Silver" },
  { symbol: "HG=F", label: "Copper" },
];

const CURRENCY_GROUP: { symbol: string; label: string }[] = [
  { symbol: "DX-Y.NYB", label: "DXY" },
  { symbol: "EURUSD=X", label: "EUR/USD" },
  { symbol: "USDJPY=X", label: "USD/JPY" },
  { symbol: "GBPUSD=X", label: "GBP/USD" },
  { symbol: "USDCAD=X", label: "USD/CAD" },
  { symbol: "AUDUSD=X", label: "AUD/USD" },
];

const TREASURY_GROUP: { symbol: string; label: string }[] = [
  { symbol: "^IRX", label: "13W" },
  { symbol: "^FVX", label: "5Y" },
  { symbol: "^TNX", label: "10Y" },
  { symbol: "^TYX", label: "30Y" },
];

const CRYPTO_GROUP: { symbol: string; label: string }[] = [
  { symbol: "BTC-USD", label: "Bitcoin" },
  { symbol: "ETH-USD", label: "Ethereum" },
  { symbol: "SOL-USD", label: "Solana" },
  { symbol: "DOGE-USD", label: "Doge" },
];

const SECTOR_GROUP: { symbol: string; label: string }[] = [
  { symbol: "XLK", label: "Tech" },
  { symbol: "XLF", label: "Financials" },
  { symbol: "XLV", label: "Health" },
  { symbol: "XLE", label: "Energy" },
  { symbol: "XLI", label: "Industrial" },
  { symbol: "XLY", label: "Cons. Disc." },
  { symbol: "XLP", label: "Cons. Stap." },
  { symbol: "XLU", label: "Utilities" },
  { symbol: "XLB", label: "Materials" },
  { symbol: "XLRE", label: "Real Estate" },
  { symbol: "XLC", label: "Comm." },
];

type Mover = {
  symbol: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
};

export default async function HomePage() {
  const allSymbols = [
    ...INDEX_GROUP,
    ...COMMODITY_GROUP,
    ...CURRENCY_GROUP,
    ...TREASURY_GROUP,
    ...CRYPTO_GROUP,
    ...SECTOR_GROUP,
  ].map((g) => g.symbol);

  const [marketQuotes, gainers, losers, actives, news] = await Promise.all([
    getQuotes(allSymbols),
    getMovers("day_gainers", 10),
    getMovers("day_losers", 10),
    getMovers("most_actives", 10),
    getNews("stock market", 12),
  ]);

  const bySym = new Map(marketQuotes.map((q) => [q.symbol, q]));
  const get = (s: string) => bySym.get(s);

  return (
    <main className="p-2 space-y-2">
      <PageHeader
        title="Markets"
        subtitle={
          <>
            <span className="num">{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
            <span className="mx-2 text-[var(--border-strong)]">·</span>
            <span>Delayed quotes — Yahoo Finance</span>
          </>
        }
        right={
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[var(--fg-3)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--gain)] animate-pulse" />
              Live
            </span>
            <span className="text-[var(--border-strong)]">·</span>
            <span className="num">{INDEX_GROUP.length + COMMODITY_GROUP.length + CURRENCY_GROUP.length + TREASURY_GROUP.length + CRYPTO_GROUP.length + SECTOR_GROUP.length} symbols</span>
          </div>
        }
      />

      {/* Equity indices — large tiles */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-px bg-[var(--border)]">
        {INDEX_GROUP.map((g) => (
          <IndexTile key={g.symbol} symbol={g.symbol} label={g.label} q={get(g.symbol)} />
        ))}
      </section>

      {/* Asset class strips — compact */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <StripModule label="Treasuries" group={TREASURY_GROUP} get={get} suffix="%" />
        <StripModule label="Currencies" group={CURRENCY_GROUP} get={get} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <StripModule label="Commodities" group={COMMODITY_GROUP} get={get} />
        <StripModule label="Crypto" group={CRYPTO_GROUP} get={get} />
      </section>

      {/* Sector heatmap */}
      <Module>
        <ModuleHeader
          label="Sectors"
          actions={<span className="num text-[10px] text-[var(--fg-3)]">SPDR · day %</span>}
        />
        <Heatmap
          cols={4}
          cells={SECTOR_GROUP.map((s): HeatmapCell => {
            const q = get(s.symbol);
            return {
              label: s.label,
              symbol: s.symbol,
              value: q?.regularMarketChangePercent ?? null,
              sub: <span className="num">{s.symbol}</span>,
            };
          })}
        />
      </Module>

      {/* Movers */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <MoverTable label="Top gainers" items={gainers} />
        <MoverTable label="Top losers" items={losers} />
        <MoverTable label="Most active" items={actives} />
      </section>

      {/* News + watchlist preview style snapshot */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <Module className="lg:col-span-2">
          <ModuleHeader label="Market news" actions={<Link href="/news" className="text-[10px] uppercase tracking-wider hover:text-[var(--fg)]">All →</Link>} />
          <ul className="divide-y divide-[var(--border)]">
            {news.slice(0, 10).map((n) => (
              <li key={n.uuid}>
                <Link
                  href={`/news/${encodeURIComponent(n.uuid)}`}
                  className="flex items-start gap-3 px-3 py-2 hover:bg-[var(--surface-2)]"
                >
                  <span className="num text-[10px] text-[var(--fg-3)] pt-0.5 whitespace-nowrap min-w-[44px]">
                    {timeAgo(n.providerPublishTime)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] line-clamp-2 leading-snug">{n.title}</span>
                    <span className="block text-[10px] uppercase tracking-wider text-[var(--fg-3)] mt-0.5">
                      {n.publisher ?? "—"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
            {news.length === 0 && (
              <li className="px-3 py-4 text-[var(--fg-3)] text-[12px]">News unavailable.</li>
            )}
          </ul>
          <ModuleFooter>Source · Yahoo Finance</ModuleFooter>
        </Module>

        <Module>
          <ModuleHeader label="Snapshot · indices" />
          <ul className="divide-y divide-[var(--border)]">
            {INDEX_GROUP.slice(0, 4).map((g) => {
              const q = get(g.symbol);
              return (
                <li key={g.symbol}>
                  <Link
                    href={`/quote/${encodeURIComponent(g.symbol)}`}
                    className="flex items-center justify-between px-3 h-9 hover:bg-[var(--surface-2)]"
                  >
                    <span>
                      <span className="block text-[12px]">{g.label}</span>
                      <span className="block num text-[10px] text-[var(--fg-3)]">{g.symbol}</span>
                    </span>
                    <span className="text-right">
                      <Num className="block text-[12px]">
                        {fmtCurrency(q?.regularMarketPrice, q?.currency ?? "USD")}
                      </Num>
                      <Num delta={q?.regularMarketChangePercent} className="block text-[11px]">
                        {fmtPercent(q?.regularMarketChangePercent)}
                      </Num>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <ModuleHeader label="Snapshot · crypto" className="border-t border-[var(--border)]" />
          <ul className="divide-y divide-[var(--border)]">
            {CRYPTO_GROUP.map((g) => {
              const q = get(g.symbol);
              return (
                <li key={g.symbol}>
                  <Link
                    href={`/quote/${encodeURIComponent(g.symbol)}`}
                    className="flex items-center justify-between px-3 h-9 hover:bg-[var(--surface-2)]"
                  >
                    <span>
                      <span className="block text-[12px]">{g.label}</span>
                      <span className="block num text-[10px] text-[var(--fg-3)]">{g.symbol}</span>
                    </span>
                    <span className="text-right">
                      <Num className="block text-[12px]">{fmtCurrency(q?.regularMarketPrice)}</Num>
                      <Num delta={q?.regularMarketChangePercent} className="block text-[11px]">
                        {fmtPercent(q?.regularMarketChangePercent)}
                      </Num>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Module>
      </section>
    </main>
  );
}

function IndexTile({ symbol, label, q }: { symbol: string; label: string; q?: Quote }) {
  return (
    <Link href={`/quote/${encodeURIComponent(symbol)}`}>
      <div className="bg-[var(--surface)] hover:bg-[var(--surface-2)] px-3 py-2.5 h-full transition-colors">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium truncate">{label}</span>
          <span className="num text-[10px] text-[var(--fg-3)]">{symbol}</span>
        </div>
        <Num className="block text-[16px] mt-1">
          {fmtCurrency(q?.regularMarketPrice, q?.currency ?? "USD")}
        </Num>
        <div className="text-[11px] mt-0.5">
          <Delta value={q?.regularMarketChange} pct={q?.regularMarketChangePercent} />
        </div>
      </div>
    </Link>
  );
}

function StripModule({
  label,
  group,
  get,
  suffix,
}: {
  label: string;
  group: { symbol: string; label: string }[];
  get: (s: string) => Quote | undefined;
  suffix?: string;
}) {
  // Responsive grid: 2 cols on phone, 3 on small tablet, then one column per item.
  // Per-item border-l only kicks in when items sit on the same row, so we use
  // a separator approach that works at any column count.
  const desktopCols =
    group.length <= 4
      ? "lg:grid-cols-4"
      : group.length <= 6
        ? "lg:grid-cols-6"
        : "lg:grid-cols-8";
  return (
    <Module>
      <ModuleHeader label={label} actions={<span className="num text-[10px] text-[var(--fg-3)]">{group.length}</span>} />
      <div className={`grid grid-cols-2 sm:grid-cols-3 ${desktopCols} gap-px bg-[var(--border)]`}>
        {group.map((g) => {
          const q = get(g.symbol);
          return (
            <Link
              key={g.symbol}
              href={`/quote/${encodeURIComponent(g.symbol)}`}
              className="px-2.5 py-2 bg-[var(--surface)] hover:bg-[var(--surface-2)]"
            >
              <div className="text-[10px] uppercase tracking-wider text-[var(--fg-3)] truncate">{g.label}</div>
              <Num className="block text-[13px] mt-0.5">
                {q?.regularMarketPrice != null
                  ? `${q.regularMarketPrice.toFixed(suffix === "%" ? 3 : 4)}${suffix ?? ""}`
                  : "—"}
              </Num>
              <Num delta={q?.regularMarketChangePercent} className="block text-[10px]">
                {fmtPercent(q?.regularMarketChangePercent)}
              </Num>
            </Link>
          );
        })}
      </div>
    </Module>
  );
}

function MoverTable({ label, items }: { label: string; items: Mover[] }) {
  return (
    <Module>
      <ModuleHeader label={label} actions={<span className="num text-[10px] text-[var(--fg-3)]">{items.length}</span>} />
      <DataTable>
        <thead>
          <tr>
            <th className={tableHead}>Sym</th>
            <th className={tableHead}>Name</th>
            <th className={tableHeadNum}>Last</th>
            <th className={tableHeadNum}>%</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => (
            <tr key={m.symbol} className={tableRow}>
              <td className={`${tableCell} num font-medium`}>
                <Link href={`/quote/${encodeURIComponent(m.symbol)}`} className="hover:text-[var(--accent)]">
                  {m.symbol}
                </Link>
              </td>
              <td className={`${tableCell} text-[var(--fg-2)] max-w-[140px] truncate`}>
                {m.shortName ?? ""}
              </td>
              <td className={tableCellNum}>{fmtCurrency(m.regularMarketPrice)}</td>
              <td className={tableCellNum}>
                <Num delta={m.regularMarketChangePercent}>
                  {fmtPercent(m.regularMarketChangePercent)}
                </Num>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-4 text-center text-[var(--fg-3)] text-[12px]">
                Unavailable.
              </td>
            </tr>
          )}
        </tbody>
      </DataTable>
    </Module>
  );
}

