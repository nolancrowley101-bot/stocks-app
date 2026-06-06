import Link from "next/link";
import { notFound } from "next/navigation";
import { getCachedNewsItem, getNews } from "@/lib/yahoo";
import { extractArticle, sanitizeArticleHtml } from "@/lib/article";
import { Module, ModuleHeader, ModuleFooter } from "@/components/ui/Module";
import { timeAgo } from "@/lib/format";

export const revalidate = 600;

type Params = { uuid: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { uuid } = await params;
  const item = getCachedNewsItem(uuid);
  return { title: item?.title ? `${item.title} — News` : "Article — News" };
}

export default async function NewsArticlePage({ params }: { params: Promise<Params> }) {
  const { uuid } = await params;
  let item = getCachedNewsItem(uuid);

  // Cold start (server restart, deep-link): refresh the general feed so the
  // by-uuid cache populates with at least the latest market news items.
  if (!item) {
    await getNews("stock market", 30);
    item = getCachedNewsItem(uuid);
  }
  if (!item) notFound();

  const extracted = await extractArticle(item.link);
  const related = await getNews("stock market", 8);

  return (
    <main className="p-2 space-y-2">
      <Module>
        <ModuleHeader
          label={
            <span className="flex items-center gap-2">
              <Link href="/news" className="hover:text-[var(--fg)]">News</Link>
              <span className="text-[var(--border-strong)]">/</span>
              <span className="num normal-case tracking-normal text-[var(--fg-2)]">{item.publisher ?? "Article"}</span>
              <span className="text-[var(--border-strong)]">·</span>
              <span className="num normal-case tracking-normal text-[var(--fg-3)]">{timeAgo(item.providerPublishTime)}</span>
            </span>
          }
          actions={
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer noopener"
              className="text-[10px] uppercase tracking-wider hover:text-[var(--accent)]"
            >
              Open original ↗
            </a>
          }
        />
        <div className="px-4 py-5 max-w-3xl">
          <h1 className="text-[22px] leading-tight font-semibold tracking-tight">{item.title}</h1>
          <div className="mt-2 text-[11px] uppercase tracking-wider text-[var(--fg-3)]">
            <span>{item.publisher ?? "—"}</span>
            <span className="mx-2 text-[var(--border-strong)]">·</span>
            <span className="num normal-case tracking-normal">{timeAgo(item.providerPublishTime)}</span>
          </div>

          {extracted.ok ? (
            <article
              className="article-body mt-5 text-[14px] leading-relaxed text-[var(--fg)]"
              dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(extracted.content) }}
            />
          ) : (
            <div className="mt-5 p-4 border border-[var(--border)] bg-[var(--surface-2)] rounded-sm">
              <p className="text-[13px] text-[var(--fg-2)]">
                {extracted.reason === "fetch"
                  ? "Couldn't fetch this article server-side."
                  : "Couldn't extract a readable article body from this page."}{" "}
                Read it at the publisher:
              </p>
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer noopener"
                className="block mt-2 num text-[12px] text-[var(--accent)] truncate"
              >
                {item.link} ↗
              </a>
            </div>
          )}
        </div>
        <ModuleFooter>
          Source · {item.publisher ?? "—"} · via Yahoo Finance
          {extracted.ok && extracted.length ? (
            <>
              <span className="mx-2 text-[var(--border-strong)]">·</span>
              <span className="num normal-case tracking-normal">~{Math.round(extracted.length / 1000)}k chars</span>
            </>
          ) : null}
        </ModuleFooter>
      </Module>

      <Module>
        <ModuleHeader label="More market news" actions={<Link href="/news" className="text-[10px] uppercase tracking-wider hover:text-[var(--fg)]">All →</Link>} />
        <ul className="divide-y divide-[var(--border)]">
          {related
            .filter((n) => n.uuid !== item.uuid)
            .slice(0, 8)
            .map((n) => (
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
        </ul>
      </Module>
    </main>
  );
}
