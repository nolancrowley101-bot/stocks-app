import { notFound } from "next/navigation";
import PriceChart from "@/components/PriceChart";
import AddToWatchlist from "@/components/AddToWatchlist";
import { Card, CardTitle } from "@/components/ui/Card";
import { StatRow } from "@/components/ui/StatRow";
import { getQuote, getQuoteSummary, getNews } from "@/lib/yahoo";
import {
  fmtCurrency,
  fmtCompact,
  fmtNumber,
  fmtPercent,
  fmtChange,
  changeClass,
  timeAgo,
} from "@/lib/format";

export const revalidate = 60;

type Params = { symbol: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { symbol } = await params;
  const s = symbol.toUpperCase();
  return { title: `${s} — Stock quote` };
}

function num(x: unknown): number | undefined {
  if (typeof x === "number") return x;
  if (x && typeof x === "object" && "raw" in (x as Record<string, unknown>)) {
    const raw = (x as { raw: unknown }).raw;
    if (typeof raw === "number") return raw;
  }
  return undefined;
}

const RATING_LABEL: Record<number, string> = {
  1: "Strong Buy",
  2: "Buy",
  3: "Hold",
  4: "Sell",
  5: "Strong Sell",
};

function ratingLabel(mean?: number): string {
  if (mean == null) return "—";
  const r = Math.round(mean);
  return RATING_LABEL[r] ?? "—";
}

export default async function QuotePage({ params }: { params: Promise<Params> }) {
  const { symbol: raw } = await params;
  const symbol = raw.toUpperCase();
  const [quote, summary, news] = await Promise.all([
    getQuote(symbol),
    getQuoteSummary(symbol),
    getNews(symbol, 8),
  ]);
  if (!quote) notFound();

  const fin = (summary?.financialData ?? {}) as Record<string, unknown>;
  const profile = (summary?.assetProfile ?? {}) as Record<string, unknown>;
  const detail = (summary?.summaryDetail ?? {}) as Record<string, unknown>;
  const stats = (summary?.defaultKeyStatistics ?? {}) as Record<string, unknown>;
  const recTrend =
    (summary?.recommendationTrend as { trend?: Array<Record<string, unknown>> } | undefined)
      ?.trend?.[0] ?? null;

  const targetMean = num(fin.targetMeanPrice);
  const targetHigh = num(fin.targetHighPrice);
  const targetLow = num(fin.targetLowPrice);
  const recMean = num(fin.recommendationMean);
  const numAnalysts = num(fin.numberOfAnalystOpinions);

  const price = quote.regularMarketPrice;
  const upside = price && targetMean ? ((targetMean - price) / price) * 100 : undefined;

  const businessSummary = (profile.longBusinessSummary as string | undefined) ?? "";
  const sector = (profile.sector as string | undefined) ?? "";
  const industry = (profile.industry as string | undefined) ?? "";
  const employees = num(profile.fullTimeEmployees);
  const website = (profile.website as string | undefined) ?? "";

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="text-xs text-zinc-500">
            {quote.exchange ?? ""} · {quote.marketState ?? ""}
          </div>
          <h1 className="text-3xl font-semibold">
            {symbol}{" "}
            <span className="text-zinc-400 text-base font-normal">
              {quote.shortName ?? quote.longName ?? ""}
            </span>
          </h1>
          <div className="flex items-baseline gap-3 mt-1">
            <div className="text-4xl font-semibold">
              {fmtCurrency(price, quote.currency ?? "USD")}
            </div>
            <div className={`text-lg ${changeClass(quote.regularMarketChange)}`}>
              {fmtChange(quote.regularMarketChange)} ({fmtPercent(quote.regularMarketChangePercent)})
            </div>
          </div>
        </div>
        <AddToWatchlist symbol={symbol} />
      </header>

      <PriceChart symbol={symbol} />

      <section className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardTitle>Key stats</CardTitle>
          <StatRow label="Previous close" value={fmtCurrency(quote.regularMarketPreviousClose)} />
          <StatRow label="Day range" value={`${fmtCurrency(quote.regularMarketDayLow)} – ${fmtCurrency(quote.regularMarketDayHigh)}`} />
          <StatRow label="52-week range" value={`${fmtCurrency(quote.fiftyTwoWeekLow)} – ${fmtCurrency(quote.fiftyTwoWeekHigh)}`} />
          <StatRow label="Volume" value={fmtCompact(quote.regularMarketVolume)} />
          <StatRow label="Market cap" value={fmtCompact(quote.marketCap)} />
          <StatRow label="P/E (trailing)" value={fmtNumber(quote.trailingPE)} />
          <StatRow label="P/E (forward)" value={fmtNumber(quote.forwardPE)} />
          <StatRow label="Dividend yield" value={quote.dividendYield != null ? `${fmtNumber(quote.dividendYield * 100)}%` : "—"} />
        </Card>

        <Card>
          <CardTitle>Analyst ratings</CardTitle>
          {numAnalysts ? (
            <>
              <StatRow label="Consensus" value={ratingLabel(recMean)} />
              <StatRow label="Mean rating" value={fmtNumber(recMean)} />
              <StatRow label="Analysts covering" value={fmtNumber(numAnalysts, 0)} />
              <StatRow label="Price target (avg)" value={fmtCurrency(targetMean)} />
              <StatRow label="Target range" value={`${fmtCurrency(targetLow)} – ${fmtCurrency(targetHigh)}`} />
              <StatRow
                label="Implied upside"
                value={
                  <span className={changeClass(upside)}>
                    {upside != null ? fmtPercent(upside, 1) : "—"}
                  </span>
                }
              />
              {recTrend && (
                <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-400">
                  <div className="mb-1">Recommendation breakdown</div>
                  <div className="flex h-2 rounded overflow-hidden">
                    {(() => {
                      const sb = num(recTrend.strongBuy) ?? 0;
                      const b = num(recTrend.buy) ?? 0;
                      const h = num(recTrend.hold) ?? 0;
                      const s = num(recTrend.sell) ?? 0;
                      const ss = num(recTrend.strongSell) ?? 0;
                      const total = sb + b + h + s + ss || 1;
                      const seg = (n: number, color: string) =>
                        n > 0 && (
                          <div
                            key={color}
                            style={{ width: `${(n / total) * 100}%` }}
                            className={color}
                            title={`${n}`}
                          />
                        );
                      return [
                        seg(sb, "bg-emerald-500"),
                        seg(b, "bg-emerald-700"),
                        seg(h, "bg-zinc-500"),
                        seg(s, "bg-rose-700"),
                        seg(ss, "bg-rose-500"),
                      ];
                    })()}
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-zinc-500">
                    <span>Strong Buy</span><span>Buy</span><span>Hold</span><span>Sell</span><span>Strong Sell</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-500">No analyst coverage available.</p>
          )}
        </Card>

        <Card>
          <CardTitle>Profile</CardTitle>
          <StatRow label="Sector" value={sector || "—"} />
          <StatRow label="Industry" value={industry || "—"} />
          <StatRow label="Employees" value={employees != null ? fmtCompact(employees) : "—"} />
          <StatRow label="Beta" value={fmtNumber(num(stats.beta) ?? num(detail.beta))} />
          {website && (
            <StatRow
              label="Website"
              value={
                <a
                  href={website}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-emerald-400 hover:underline"
                >
                  Visit ↗
                </a>
              }
            />
          )}
          {businessSummary && (
            <p className="text-sm text-zinc-400 mt-3 line-clamp-6">{businessSummary}</p>
          )}
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Related news</h2>
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
            <p className="text-sm text-zinc-500">No news for this ticker right now.</p>
          )}
        </div>
      </section>
    </main>
  );
}
