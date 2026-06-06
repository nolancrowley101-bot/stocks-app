import { notFound } from "next/navigation";
import Link from "next/link";
import PriceChart from "@/components/PriceChart";
import AddToWatchlist from "@/components/AddToWatchlist";
import { Module, ModuleHeader, ModuleFooter } from "@/components/ui/Module";
import { Num, Delta } from "@/components/ui/Num";
import { DataGrid } from "@/components/ui/DataGrid";
import { RangeBar } from "@/components/ui/RangeBar";
import { getQuote, getQuoteSummary, getNews } from "@/lib/yahoo";
import {
  fmtCurrency,
  fmtCompact,
  fmtNumber,
  fmtPercent,
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

function dateFromUnix(x: unknown): string {
  const n = num(x);
  if (n == null) return "—";
  const ms = n > 10 ** 12 ? n : n * 1000;
  const d = new Date(ms);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
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
    getNews(symbol, 10),
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

  // Valuation
  const marketCap = quote.marketCap ?? num(detail.marketCap);
  const enterpriseValue = num(stats.enterpriseValue);
  const peTtm = quote.trailingPE ?? num(detail.trailingPE);
  const peFwd = quote.forwardPE ?? num(detail.forwardPE);
  const peg = num(stats.pegRatio);
  const priceToBook = num(stats.priceToBook);
  const priceToSales = num(detail.priceToSalesTrailing12Months);
  const evToRevenue = num(stats.enterpriseToRevenue);
  const evToEbitda = num(stats.enterpriseToEbitda);

  // Profitability / growth
  const revenue = num(fin.totalRevenue);
  const ebitda = num(fin.ebitda);
  const grossMargins = num(fin.grossMargins);
  const operMargins = num(fin.operatingMargins);
  const profitMargins = num(fin.profitMargins) ?? num(stats.profitMargins);
  const roa = num(fin.returnOnAssets);
  const roe = num(fin.returnOnEquity);
  const revGrowth = num(fin.revenueGrowth);
  const earnGrowth = num(fin.earningsGrowth);
  const epsTtm = num(stats.trailingEps);
  const epsFwd = num(stats.forwardEps);

  // Dividends
  const divYield = quote.dividendYield ?? num(detail.dividendYield);
  const divRate = num(detail.dividendRate);
  const payoutRatio = num(detail.payoutRatio);
  const fiveYrAvgDivYield = num(detail.fiveYearAvgDividendYield);
  const exDivDate = dateFromUnix(detail.exDividendDate);

  // Shares & ownership
  const sharesOut = num(stats.sharesOutstanding);
  const floatShares = num(stats.floatShares);
  const heldInsiders = num(stats.heldPercentInsiders);
  const heldInstitutions = num(stats.heldPercentInstitutions);
  const shortPctOfFloat = num(stats.shortPercentOfFloat);
  const shortRatio = num(stats.shortRatio);
  const beta = num(stats.beta) ?? num(detail.beta);

  // Volumes
  const volume = quote.regularMarketVolume;
  const avgVol = num(detail.averageVolume) ?? quote.averageDailyVolume3Month;
  const avgVol10 = num(detail.averageVolume10days);

  const fifty = num(detail.fiftyDayAverage);
  const twoHundred = num(detail.twoHundredDayAverage);

  return (
    <main className="p-2 space-y-2">
      {/* Hero module */}
      <Module>
        <ModuleHeader
          label={
            <span className="flex items-center gap-2">
              <span className="num text-[var(--fg-2)]">{quote.exchange ?? "—"}</span>
              <span className="text-[var(--border-strong)]">·</span>
              <span>{quote.marketState ?? "—"}</span>
              <span className="text-[var(--border-strong)]">·</span>
              <span className="num">{quote.currency ?? "USD"}</span>
              {sector && (
                <>
                  <span className="text-[var(--border-strong)]">·</span>
                  <span className="normal-case tracking-normal text-[var(--fg-2)]">{sector}</span>
                </>
              )}
            </span>
          }
          actions={<AddToWatchlist symbol={symbol} />}
        />
        <div className="px-3 py-3 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 items-end">
          <div>
            <div className="font-mono text-[22px] font-semibold tracking-wider">{symbol}</div>
            <div className="text-[12px] text-[var(--fg-2)] truncate max-w-[420px]">
              {quote.shortName ?? quote.longName ?? ""}
            </div>
            <div className="mt-2 flex items-baseline gap-4">
              <Num className="text-[34px] font-semibold leading-none">
                {fmtCurrency(price, quote.currency ?? "USD")}
              </Num>
              <span className="text-[15px]">
                <Delta value={quote.regularMarketChange} pct={quote.regularMarketChangePercent} />
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-x-4 gap-y-2 text-right lg:justify-self-end">
            <MiniStat label="Open" value={fmtCurrency(quote.regularMarketOpen)} />
            <MiniStat label="Prev cls" value={fmtCurrency(quote.regularMarketPreviousClose)} />
            <MiniStat label="Day low" value={fmtCurrency(quote.regularMarketDayLow)} />
            <MiniStat label="Day high" value={fmtCurrency(quote.regularMarketDayHigh)} />
            <MiniStat label="52w low" value={fmtCurrency(quote.fiftyTwoWeekLow)} />
            <MiniStat label="52w high" value={fmtCurrency(quote.fiftyTwoWeekHigh)} />
            <MiniStat label="Volume" value={fmtCompact(volume)} />
            <MiniStat label="Avg 3m" value={fmtCompact(avgVol)} />
            <MiniStat label="Avg 10d" value={fmtCompact(avgVol10)} />
            <MiniStat label="Mkt cap" value={fmtCompact(marketCap)} />
            <MiniStat label="50d MA" value={fmtCurrency(fifty)} />
            <MiniStat label="200d MA" value={fmtCurrency(twoHundred)} />
          </div>
        </div>
      </Module>

      {/* Range bars */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Module>
          <ModuleHeader label="Day range" />
          <div className="px-3 py-3">
            <RangeBar
              low={quote.regularMarketDayLow}
              high={quote.regularMarketDayHigh}
              current={price}
              format={(n) => fmtCurrency(n, quote.currency ?? "USD")}
            />
          </div>
        </Module>
        <Module>
          <ModuleHeader label="52-week range" />
          <div className="px-3 py-3">
            <RangeBar
              low={quote.fiftyTwoWeekLow}
              high={quote.fiftyTwoWeekHigh}
              current={price}
              format={(n) => fmtCurrency(n, quote.currency ?? "USD")}
              labelLow="52w L"
              labelHigh="52w H"
            />
          </div>
        </Module>
      </section>

      {/* Chart */}
      <Module>
        <ModuleHeader label="Price" actions={<span className="num text-[10px] text-[var(--fg-3)]">{symbol}</span>} />
        <PriceChart symbol={symbol} />
      </Module>

      {/* 4-up dense stat modules */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
        <Module>
          <ModuleHeader label="Trading" />
          <div className="p-3">
            <DataGrid
              items={[
                { label: "Open", value: <Num>{fmtCurrency(quote.regularMarketOpen)}</Num> },
                { label: "Prev close", value: <Num>{fmtCurrency(quote.regularMarketPreviousClose)}</Num> },
                { label: "Day low", value: <Num>{fmtCurrency(quote.regularMarketDayLow)}</Num> },
                { label: "Day high", value: <Num>{fmtCurrency(quote.regularMarketDayHigh)}</Num> },
                { label: "52w low", value: <Num>{fmtCurrency(quote.fiftyTwoWeekLow)}</Num> },
                { label: "52w high", value: <Num>{fmtCurrency(quote.fiftyTwoWeekHigh)}</Num> },
                { label: "50d MA", value: <Num>{fmtCurrency(fifty)}</Num> },
                { label: "200d MA", value: <Num>{fmtCurrency(twoHundred)}</Num> },
                { label: "Volume", value: <Num>{fmtCompact(volume)}</Num> },
                { label: "Avg vol (3m)", value: <Num>{fmtCompact(avgVol)}</Num> },
                { label: "Avg vol (10d)", value: <Num>{fmtCompact(avgVol10)}</Num> },
                { label: "Beta", value: <Num>{fmtNumber(beta)}</Num> },
              ]}
            />
          </div>
        </Module>

        <Module>
          <ModuleHeader label="Valuation" />
          <div className="p-3">
            <DataGrid
              items={[
                { label: "Market cap", value: <Num>{fmtCompact(marketCap)}</Num> },
                { label: "Enterprise val", value: <Num>{fmtCompact(enterpriseValue)}</Num> },
                { label: "P/E (TTM)", value: <Num>{fmtNumber(peTtm)}</Num> },
                { label: "P/E (FWD)", value: <Num>{fmtNumber(peFwd)}</Num> },
                { label: "PEG", value: <Num>{fmtNumber(peg)}</Num> },
                { label: "P/B", value: <Num>{fmtNumber(priceToBook)}</Num> },
                { label: "P/S", value: <Num>{fmtNumber(priceToSales)}</Num> },
                { label: "EV/Revenue", value: <Num>{fmtNumber(evToRevenue)}</Num> },
                { label: "EV/EBITDA", value: <Num>{fmtNumber(evToEbitda)}</Num> },
                { label: "EPS (TTM)", value: <Num>{fmtNumber(epsTtm)}</Num> },
                { label: "EPS (FWD)", value: <Num>{fmtNumber(epsFwd)}</Num> },
                { label: "Shares out", value: <Num>{fmtCompact(sharesOut)}</Num> },
              ]}
            />
          </div>
        </Module>

        <Module>
          <ModuleHeader label="Profitability" />
          <div className="p-3">
            <DataGrid
              items={[
                { label: "Revenue (TTM)", value: <Num>{fmtCompact(revenue)}</Num> },
                { label: "EBITDA", value: <Num>{fmtCompact(ebitda)}</Num> },
                { label: "Gross margin", value: <Num delta={grossMargins}>{grossMargins != null ? fmtPercent(grossMargins * 100, 1) : "—"}</Num> },
                { label: "Op. margin", value: <Num delta={operMargins}>{operMargins != null ? fmtPercent(operMargins * 100, 1) : "—"}</Num> },
                { label: "Profit margin", value: <Num delta={profitMargins}>{profitMargins != null ? fmtPercent(profitMargins * 100, 1) : "—"}</Num> },
                { label: "ROA", value: <Num delta={roa}>{roa != null ? fmtPercent(roa * 100, 1) : "—"}</Num> },
                { label: "ROE", value: <Num delta={roe}>{roe != null ? fmtPercent(roe * 100, 1) : "—"}</Num> },
                { label: "Rev growth", value: <Num delta={revGrowth}>{revGrowth != null ? fmtPercent(revGrowth * 100, 1) : "—"}</Num> },
                { label: "Earn growth", value: <Num delta={earnGrowth}>{earnGrowth != null ? fmtPercent(earnGrowth * 100, 1) : "—"}</Num> },
              ]}
            />
          </div>
        </Module>

        <Module>
          <ModuleHeader label="Dividends & ownership" />
          <div className="p-3">
            <DataGrid
              items={[
                { label: "Div yield", value: <Num>{divYield != null ? fmtPercent(divYield * 100, 2) : "—"}</Num> },
                { label: "Div rate", value: <Num>{fmtCurrency(divRate)}</Num> },
                { label: "Payout ratio", value: <Num>{payoutRatio != null ? fmtPercent(payoutRatio * 100, 1) : "—"}</Num> },
                { label: "5yr avg yield", value: <Num>{fiveYrAvgDivYield != null ? `${fiveYrAvgDivYield.toFixed(2)}%` : "—"}</Num> },
                { label: "Ex-div date", value: <Num>{exDivDate}</Num> },
                { label: "Float", value: <Num>{fmtCompact(floatShares)}</Num> },
                { label: "Insiders", value: <Num>{heldInsiders != null ? fmtPercent(heldInsiders * 100, 1) : "—"}</Num> },
                { label: "Institutions", value: <Num>{heldInstitutions != null ? fmtPercent(heldInstitutions * 100, 1) : "—"}</Num> },
                { label: "Short % float", value: <Num>{shortPctOfFloat != null ? fmtPercent(shortPctOfFloat * 100, 2) : "—"}</Num> },
                { label: "Short ratio", value: <Num>{fmtNumber(shortRatio)}</Num> },
              ]}
            />
          </div>
        </Module>
      </section>

      {/* Analyst + Profile */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Module>
          <ModuleHeader label="Analyst ratings" actions={numAnalysts && <span className="num text-[10px] text-[var(--fg-3)]">{`n=${numAnalysts}`}</span>} />
          <div className="p-3">
            {numAnalysts ? (
              <>
                <DataGrid
                  cols={2}
                  items={[
                    { label: "Consensus", value: <span>{ratingLabel(recMean)}</span> },
                    { label: "Mean", value: <Num>{fmtNumber(recMean)}</Num> },
                    { label: "Target", value: <Num>{fmtCurrency(targetMean)}</Num> },
                    { label: "Range", value: <Num className="text-[12px]">{`${fmtCurrency(targetLow)} – ${fmtCurrency(targetHigh)}`}</Num> },
                    { label: "Upside", value: <Num delta={upside}>{upside != null ? fmtPercent(upside, 1) : "—"}</Num> },
                  ]}
                />
                {recTrend && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    <div className="label mb-1.5">Breakdown</div>
                    <div className="flex h-1.5 overflow-hidden rounded-sm">
                      {(() => {
                        const sb = num(recTrend.strongBuy) ?? 0;
                        const b = num(recTrend.buy) ?? 0;
                        const h = num(recTrend.hold) ?? 0;
                        const s = num(recTrend.sell) ?? 0;
                        const ss = num(recTrend.strongSell) ?? 0;
                        const total = sb + b + h + s + ss || 1;
                        const seg = (n: number, color: string, key: string) =>
                          n > 0 && (
                            <div
                              key={key}
                              style={{ width: `${(n / total) * 100}%`, background: color }}
                              title={`${n}`}
                            />
                          );
                        return [
                          seg(sb, "var(--gain)", "sb"),
                          seg(b, "color-mix(in srgb, var(--gain) 60%, transparent)", "b"),
                          seg(h, "var(--flat)", "h"),
                          seg(s, "color-mix(in srgb, var(--loss) 60%, transparent)", "s"),
                          seg(ss, "var(--loss)", "ss"),
                        ];
                      })()}
                    </div>
                    <div className="flex justify-between mt-1 text-[9px] uppercase tracking-wider text-[var(--fg-3)]">
                      <span>S.Buy <span className="num text-[var(--fg-2)] normal-case">{num(recTrend.strongBuy) ?? 0}</span></span>
                      <span>Buy <span className="num text-[var(--fg-2)] normal-case">{num(recTrend.buy) ?? 0}</span></span>
                      <span>Hold <span className="num text-[var(--fg-2)] normal-case">{num(recTrend.hold) ?? 0}</span></span>
                      <span>Sell <span className="num text-[var(--fg-2)] normal-case">{num(recTrend.sell) ?? 0}</span></span>
                      <span>S.Sell <span className="num text-[var(--fg-2)] normal-case">{num(recTrend.strongSell) ?? 0}</span></span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[12px] text-[var(--fg-3)]">No analyst coverage.</p>
            )}
          </div>
        </Module>

        <Module>
          <ModuleHeader label="Profile" actions={website && (
            <a href={website} target="_blank" rel="noreferrer noopener" className="text-[10px] uppercase tracking-wider hover:text-[var(--accent)]">
              Site ↗
            </a>
          )} />
          <div className="p-3">
            <DataGrid
              cols={2}
              items={[
                { label: "Sector", value: <span className="truncate">{sector || "—"}</span> },
                { label: "Industry", value: <span className="truncate">{industry || "—"}</span> },
                { label: "Employees", value: <Num>{employees != null ? fmtCompact(employees) : "—"}</Num> },
                { label: "Beta", value: <Num>{fmtNumber(beta)}</Num> },
                { label: "Exchange", value: <span className="num">{quote.exchange ?? "—"}</span> },
                { label: "Currency", value: <span className="num">{quote.currency ?? "—"}</span> },
              ]}
            />
            {businessSummary && (
              <p className="text-[12px] text-[var(--fg-2)] mt-3 pt-3 border-t border-[var(--border)] line-clamp-6 leading-relaxed">
                {businessSummary}
              </p>
            )}
          </div>
        </Module>
      </section>

      {/* News */}
      <Module>
        <ModuleHeader label={`${symbol} news`} actions={<Link href="/news" className="text-[10px] uppercase tracking-wider hover:text-[var(--fg)]">All news →</Link>} />
        <ul className="divide-y divide-[var(--border)]">
          {news.map((n) => (
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
            <li className="px-3 py-4 text-[var(--fg-3)] text-[12px]">No news for this ticker.</li>
          )}
        </ul>
        <ModuleFooter>Source · Yahoo Finance</ModuleFooter>
      </Module>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="text-right">
      <div className="label">{label}</div>
      <Num className="block text-[12px] mt-0.5">{value}</Num>
    </div>
  );
}
