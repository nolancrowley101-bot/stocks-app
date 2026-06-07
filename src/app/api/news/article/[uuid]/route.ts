import { NextResponse } from "next/server";
import { getCachedNewsItem, getNews } from "@/lib/yahoo";
import { extractArticle, sanitizeArticleHtml } from "@/lib/article";

export const revalidate = 600;

export async function GET(_req: Request, ctx: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await ctx.params;
  let item = getCachedNewsItem(uuid);
  if (!item) {
    await getNews("stock market", 30);
    item = getCachedNewsItem(uuid);
  }
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const extracted = await extractArticle(item.link);
  const baseItem = {
    uuid: item.uuid,
    title: item.title,
    publisher: item.publisher,
    link: item.link,
    providerPublishTime: item.providerPublishTime,
    thumbnail: item.thumbnail,
  };

  if (!extracted.ok) {
    return NextResponse.json({
      item: baseItem,
      article: { ok: false, reason: extracted.reason, status: extracted.status },
    });
  }

  return NextResponse.json({
    item: baseItem,
    article: {
      ok: true,
      title: extracted.title,
      byline: extracted.byline,
      contentHtml: sanitizeArticleHtml(extracted.content),
      textContent: extracted.textContent,
      excerpt: extracted.excerpt,
      publishedTime: extracted.publishedTime,
      length: extracted.length,
    },
  });
}
