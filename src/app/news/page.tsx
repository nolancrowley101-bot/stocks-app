import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getNews, type NewsItem } from "@/lib/yahoo";
import { timeAgo } from "@/lib/format";
import { Module, ModuleHeader, ModuleFooter } from "@/components/ui/Module";

export const revalidate = 300;

export default async function NewsPage() {
  const session = await auth();
  const marketNews = await getNews("stock market", 20);

  let watchlistNews: { symbol: string; items: NewsItem[] }[] = [];
  if (session?.user?.id) {
    try {
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
    } catch {
      // DB unavailable — degrade to market news only
    }
  }

  return (
    <main className="p-2 space-y-2">
      <header className="px-1 pt-1 pb-2">
        <h1 className="text-[18px] font-semibold tracking-tight">News</h1>
        <p className="text-[11px] text-[var(--fg-3)] uppercase tracking-wider mt-0.5">
          Yahoo Finance · headlines
        </p>
      </header>

      {watchlistNews.length > 0 && (
        <Module>
          <ModuleHeader label="From your watchlist" />
          <ul className="divide-y divide-[var(--border)]">
            {watchlistNews.flatMap(({ symbol, items }) =>
              items.map((n) => <NewsRow key={`${symbol}-${n.uuid}`} n={n} tag={symbol} />)
            )}
          </ul>
        </Module>
      )}

      <Module>
        <ModuleHeader label="Market news" actions={<span className="num text-[10px] text-[var(--fg-3)]">{marketNews.length}</span>} />
        <ul className="divide-y divide-[var(--border)]">
          {marketNews.map((n) => (
            <NewsRow key={n.uuid} n={n} />
          ))}
          {marketNews.length === 0 && (
            <li className="px-3 py-4 text-[12px] text-[var(--fg-3)]">No news available.</li>
          )}
        </ul>
        <ModuleFooter>Source · Yahoo Finance</ModuleFooter>
      </Module>
    </main>
  );
}

function NewsRow({ n, tag }: { n: NewsItem; tag?: string }) {
  return (
    <li>
      <Link
        href={`/news/${encodeURIComponent(n.uuid)}`}
        className="flex items-start gap-3 px-3 py-2 hover:bg-[var(--surface-2)]"
      >
        <span className="num text-[10px] text-[var(--fg-3)] pt-0.5 whitespace-nowrap min-w-[44px]">
          {timeAgo(n.providerPublishTime)}
        </span>
        {tag && (
          <span className="num text-[10px] uppercase border border-[var(--border-strong)] text-[var(--fg-2)] px-1.5 h-4 inline-flex items-center self-start mt-px">
            {tag}
          </span>
        )}
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] line-clamp-2 leading-snug">{n.title}</span>
          <span className="block text-[10px] uppercase tracking-wider text-[var(--fg-3)] mt-0.5">
            {n.publisher ?? "—"}
          </span>
        </span>
      </Link>
    </li>
  );
}
