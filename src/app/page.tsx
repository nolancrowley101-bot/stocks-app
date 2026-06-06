import Link from "next/link";
import { getQuotes, getMovers, getNews } from "@/lib/yahoo";
import { Card, CardTitle } from "@/components/ui/Card";
import { fmtCurrency, fmtPercent, fmtChange, changeClass, timeAgo } from "@/lib/format";

export const revalidate = 60;

const INDEX_SYMBOLS = ["^GSPC", "^IXIC", "^DJI", "^RUT"];
const INDEX_NAMES: Record<string, string> = {
  "^GSPC": "S&P 500",
  "^IXIC": "Nasdaq",
  "^DJI": "Dow Jones",
  "^RUT": "Russell 2000",
};

export default async function HomePage() {
  const [indices, gainers, losers, actives, news] = await Promise.all([
    getQuotes(INDEX_SYMBOLS),
    getMovers("day_gainers", 8),
    getMovers("day_losers", 8),
    getMovers("most_actives", 8),
    getNews("stock market", 8),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <section>
        <h1 className="text-2xl font-semibold mb-1">Markets</h1>
        <p className="text-sm text-zinc-400">
          Real prices from Yahoo Finance. Delayed at least 15 minutes.
        </p>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {indices.map((idx) => (
          <Link
            key={idx.symbol}
            href={`/quote/${encodeURIComponent(idx.symbol)}`}
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 hover:border-zinc-700"
          >
            <div className="text-xs text-zinc-400">{INDEX_NAMES[idx.symbol] ?? idx.symbol}</div>
            <div className="text-lg font-semibold mt-1">
              {fmtCurrency(idx.regularMarketPrice, idx.currency ?? "USD")}
            </div>
            <div className={`text-sm mt-0.5 ${changeClass(idx.regularMarketChange)}`}>
              {fmtChange(idx.regularMarketChange)} ({fmtPercent(idx.regularMarketChangePercent)})
            </div>
          </Link>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <MoverList title="Top gainers" items={gainers} />
        <MoverList title="Top losers" items={losers} />
        <MoverList title="Most active" items={actives} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Market news</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {news.map((n) => (
            <a
              key={n.uuid}
              href={n.link}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 hover:border-zinc-700"
            >
              <div className="text-sm font-medium mb-1 line-clamp-2">{n.title}</div>
              <div className="text-xs text-zinc-500">
                {n.publisher ?? "—"} · {timeAgo(n.providerPublishTime)}
              </div>
            </a>
          ))}
          {news.length === 0 && (
            <p className="text-sm text-zinc-500">News unavailable right now.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function MoverList({
  title,
  items,
}: {
  title: string;
  items: {
    symbol: string;
    shortName?: string;
    regularMarketPrice?: number;
    regularMarketChangePercent?: number;
  }[];
}) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <ul className="divide-y divide-zinc-800">
        {items.map((m) => (
          <li key={m.symbol}>
            <Link
              href={`/quote/${encodeURIComponent(m.symbol)}`}
              className="flex justify-between items-center py-2 hover:bg-zinc-900/50 -mx-2 px-2 rounded"
            >
              <div className="min-w-0">
                <div className="font-medium">{m.symbol}</div>
                <div className="text-xs text-zinc-500 truncate max-w-[160px]">
                  {m.shortName ?? ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm">{fmtCurrency(m.regularMarketPrice)}</div>
                <div className={`text-xs ${changeClass(m.regularMarketChangePercent)}`}>
                  {fmtPercent(m.regularMarketChangePercent)}
                </div>
              </div>
            </Link>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-sm text-zinc-500 py-2">Unavailable right now.</li>
        )}
      </ul>
    </Card>
  );
}
