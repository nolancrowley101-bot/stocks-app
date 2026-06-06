import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getNews, type NewsItem } from "@/lib/yahoo";
import { timeAgo } from "@/lib/format";

export const revalidate = 300;

export default async function NewsPage() {
  const session = await auth();
  const marketNews = await getNews("stock market", 16);

  let watchlistNews: { symbol: string; items: NewsItem[] }[] = [];
  if (session?.user?.id) {
    const wl = await prisma.watchlist.findFirst({
      where: { userId: session.user.id },
      include: { items: { orderBy: { addedAt: "asc" }, take: 6 } },
    });
    const symbols = wl?.items.map((i) => i.symbol) ?? [];
    if (symbols.length > 0) {
      watchlistNews = await Promise.all(
        symbols.map(async (s) => ({ symbol: s, items: await getNews(s, 4) }))
      );
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-10">
      <header>
        <h1 className="text-2xl font-semibold">News</h1>
        <p className="text-sm text-zinc-400">Headlines from Yahoo Finance.</p>
      </header>

      {watchlistNews.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">From your watchlist</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {watchlistNews.map(({ symbol, items }) =>
              items.map((n) => (
                <NewsCard key={`${symbol}-${n.uuid}`} n={n} tag={symbol} />
              ))
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Market news</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {marketNews.map((n) => (
            <NewsCard key={n.uuid} n={n} />
          ))}
          {marketNews.length === 0 && (
            <p className="text-sm text-zinc-500">No news available right now.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function NewsCard({ n, tag }: { n: NewsItem; tag?: string }) {
  return (
    <a
      href={n.link}
      target="_blank"
      rel="noreferrer noopener"
      className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 hover:border-zinc-700 block"
    >
      {tag && (
        <span className="inline-block text-[10px] uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5 mb-2">
          {tag}
        </span>
      )}
      <div className="text-sm font-medium mb-1 line-clamp-2">{n.title}</div>
      <div className="text-xs text-zinc-500">
        {n.publisher ?? "—"} · {timeAgo(n.providerPublishTime)}
      </div>
    </a>
  );
}
