import YahooFinance from "yahoo-finance2";
import { prisma } from "@/lib/db";

const yahooFinance = new YahooFinance();

const QUOTE_TTL_MS = 60 * 1000;
const SUMMARY_TTL_MS = 60 * 60 * 1000;
const NEWS_TTL_MS = 10 * 60 * 1000;

export type Quote = {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketPreviousClose?: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  averageDailyVolume3Month?: number;
  regularMarketVolume?: number;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  trailingPE?: number;
  forwardPE?: number;
  dividendYield?: number;
  currency?: string;
  exchange?: string;
  marketState?: string;
};

const QUOTE_OPTS = { validateResult: false } as const;

export async function getQuote(symbol: string): Promise<Quote | null> {
  symbol = symbol.toUpperCase().trim();
  let cached: Awaited<ReturnType<typeof prisma.quoteCache.findUnique>> = null;
  try {
    cached = await prisma.quoteCache.findUnique({ where: { symbol } });
  } catch {
    // DB unavailable — fall through to live fetch
  }
  if (
    cached?.quote &&
    cached.quoteAt &&
    Date.now() - cached.quoteAt.getTime() < QUOTE_TTL_MS
  ) {
    return cached.quote as Quote;
  }
  try {
    const q = (await yahooFinance.quote(symbol, {}, QUOTE_OPTS)) as Quote | undefined;
    if (!q) return null;
    try {
      await prisma.quoteCache.upsert({
        where: { symbol },
        create: { symbol, quote: q as object, quoteAt: new Date() },
        update: { quote: q as object, quoteAt: new Date() },
      });
    } catch {
      // cache write failed — non-fatal
    }
    return q;
  } catch {
    return (cached?.quote as Quote) ?? null;
  }
}

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  const upper = symbols.map((s) => s.toUpperCase().trim()).filter(Boolean);
  if (upper.length === 0) return [];
  try {
    const res = (await yahooFinance.quote(upper, {}, QUOTE_OPTS)) as Quote | Quote[];
    return Array.isArray(res) ? res : [res];
  } catch {
    return [];
  }
}

export type SummaryModules = {
  price?: Record<string, unknown>;
  summaryDetail?: Record<string, unknown>;
  assetProfile?: Record<string, unknown>;
  financialData?: Record<string, unknown>;
  recommendationTrend?: Record<string, unknown>;
  defaultKeyStatistics?: Record<string, unknown>;
  earnings?: Record<string, unknown>;
};

export async function getQuoteSummary(symbol: string): Promise<SummaryModules | null> {
  symbol = symbol.toUpperCase().trim();
  let cached: Awaited<ReturnType<typeof prisma.quoteCache.findUnique>> = null;
  try {
    cached = await prisma.quoteCache.findUnique({ where: { symbol } });
  } catch {
    // DB unavailable — fall through to live fetch
  }
  if (
    cached?.payload &&
    cached.fetchedAt &&
    Date.now() - cached.fetchedAt.getTime() < SUMMARY_TTL_MS
  ) {
    return cached.payload as SummaryModules;
  }
  try {
    const summary = (await yahooFinance.quoteSummary(
      symbol,
      {
        modules: [
          "price",
          "summaryDetail",
          "assetProfile",
          "financialData",
          "recommendationTrend",
          "defaultKeyStatistics",
          "earnings",
        ],
      },
      QUOTE_OPTS
    )) as SummaryModules;
    try {
      await prisma.quoteCache.upsert({
        where: { symbol },
        create: { symbol, payload: summary as object, fetchedAt: new Date() },
        update: { payload: summary as object, fetchedAt: new Date() },
      });
    } catch {
      // cache write failed — non-fatal
    }
    return summary;
  } catch {
    return (cached?.payload as SummaryModules) ?? null;
  }
}

export type ChartRange = "1d" | "5d" | "1mo" | "6mo" | "1y" | "5y" | "max";
type IntervalMap = {
  period1: Date;
  interval: "1m" | "5m" | "15m" | "1h" | "1d" | "1wk";
};

function rangeToParams(range: ChartRange): IntervalMap {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  switch (range) {
    case "1d":
      return { period1: new Date(now.getTime() - 1 * day), interval: "5m" };
    case "5d":
      return { period1: new Date(now.getTime() - 5 * day), interval: "15m" };
    case "1mo":
      return { period1: new Date(now.getTime() - 31 * day), interval: "1h" };
    case "6mo":
      return { period1: new Date(now.getTime() - 183 * day), interval: "1d" };
    case "1y":
      return { period1: new Date(now.getTime() - 366 * day), interval: "1d" };
    case "5y":
      return { period1: new Date(now.getTime() - 5 * 366 * day), interval: "1wk" };
    case "max":
      return { period1: new Date("1970-01-01"), interval: "1wk" };
  }
}

export type ChartPoint = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
};

type ChartQuote = {
  date: Date | string | number;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
};

export async function getChart(symbol: string, range: ChartRange): Promise<ChartPoint[]> {
  symbol = symbol.toUpperCase().trim();
  const { period1, interval } = rangeToParams(range);
  try {
    const res = (await yahooFinance.chart(
      symbol,
      { period1, interval },
      QUOTE_OPTS
    )) as { quotes?: ChartQuote[] };
    const quotes = res?.quotes ?? [];
    return quotes
      .filter((q) => q.close != null && q.open != null)
      .map((q) => ({
        t: new Date(q.date).getTime(),
        o: q.open ?? 0,
        h: q.high ?? 0,
        l: q.low ?? 0,
        c: q.close ?? 0,
        v: q.volume ?? undefined,
      }));
  } catch {
    return [];
  }
}

export type SearchResult = {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  quoteType?: string;
};

type RawSearchQuote = {
  symbol?: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  quoteType?: string;
  isYahooFinance?: boolean;
};

type RawSearchResult = {
  quotes?: RawSearchQuote[];
  news?: RawNewsItem[];
};

export async function search(query: string, limit = 8): Promise<SearchResult[]> {
  query = query.trim();
  if (!query) return [];
  try {
    const res = (await yahooFinance.search(
      query,
      { quotesCount: limit, newsCount: 0 },
      QUOTE_OPTS
    )) as RawSearchResult;
    const quotes = res?.quotes ?? [];
    return quotes
      .filter((q): q is RawSearchQuote & { symbol: string } => typeof q.symbol === "string")
      .map((q) => ({
        symbol: q.symbol,
        shortname: q.shortname,
        longname: q.longname,
        exchange: q.exchange,
        quoteType: q.quoteType,
      }));
  } catch {
    return [];
  }
}

type RawNewsItem = {
  uuid: string;
  title: string;
  publisher?: string;
  link: string;
  providerPublishTime: number | string | Date;
  type?: string;
  thumbnail?: { resolutions?: { url?: string }[] };
};

export type NewsItem = {
  uuid: string;
  title: string;
  publisher?: string;
  link: string;
  providerPublishTime: number;
  type?: string;
  thumbnail?: string;
};

const newsCache = new Map<string, { at: number; items: NewsItem[] }>();
const newsByUuid = new Map<string, NewsItem>();

export function getCachedNewsItem(uuid: string): NewsItem | undefined {
  return newsByUuid.get(uuid);
}

function normalizeTime(t: number | string | Date): number {
  if (typeof t === "number") return t > 10 ** 12 ? Math.floor(t / 1000) : t;
  const d = t instanceof Date ? t : new Date(t);
  return Math.floor(d.getTime() / 1000);
}

export async function getNews(query: string, limit = 12): Promise<NewsItem[]> {
  const key = `${query.toLowerCase()}:${limit}`;
  const hit = newsCache.get(key);
  if (hit && Date.now() - hit.at < NEWS_TTL_MS) return hit.items;
  try {
    const res = (await yahooFinance.search(
      query,
      { quotesCount: 0, newsCount: limit },
      QUOTE_OPTS
    )) as RawSearchResult;
    const items: NewsItem[] = (res?.news ?? []).map((n) => ({
      uuid: n.uuid,
      title: n.title,
      publisher: n.publisher,
      link: n.link,
      providerPublishTime: normalizeTime(n.providerPublishTime),
      type: n.type,
      thumbnail: n.thumbnail?.resolutions?.[0]?.url,
    }));
    newsCache.set(key, { at: Date.now(), items });
    for (const item of items) newsByUuid.set(item.uuid, item);
    return items;
  } catch {
    return [];
  }
}

export type Mover = {
  symbol: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
};

const moversCache = new Map<string, { at: number; items: Mover[] }>();

export async function getMovers(
  scrId: "day_gainers" | "day_losers" | "most_actives" = "day_gainers",
  count = 10
): Promise<Mover[]> {
  const hit = moversCache.get(scrId);
  if (hit && Date.now() - hit.at < QUOTE_TTL_MS) return hit.items;
  try {
    // Call as a method (preserve `this` binding) — detaching loses _moduleExec.
    const res = (await (yahooFinance as unknown as {
      screener: (
        q: { scrIds: string; count: number },
        o?: Record<string, unknown>,
        m?: Record<string, unknown>
      ) => Promise<{ quotes?: Mover[] }>;
    }).screener({ scrIds: scrId, count }, {}, QUOTE_OPTS)) as { quotes?: Mover[] };
    const quotes = res?.quotes ?? [];
    moversCache.set(scrId, { at: Date.now(), items: quotes });
    return quotes;
  } catch (err) {
    console.error(`[movers ${scrId}] failed:`, err);
    return hit?.items ?? [];
  }
}
