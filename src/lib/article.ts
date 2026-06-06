import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { Agent, setGlobalDispatcher } from "undici";

// Yahoo Finance (and many CDNs) ship response headers larger than the
// Node.js default 16 KiB limit, which makes the built-in `fetch` throw
// UND_ERR_HEADERS_OVERFLOW. Install a global dispatcher with a generous cap.
// Guard against duplicate installs across HMR by stashing on globalThis.
const g = globalThis as unknown as { __articleDispatcherInstalled?: boolean };
if (!g.__articleDispatcherInstalled) {
  setGlobalDispatcher(
    new Agent({
      maxHeaderSize: 128 * 1024,
      headersTimeout: 15_000,
      bodyTimeout: 20_000,
      connect: { timeout: 10_000 },
    })
  );
  g.__articleDispatcherInstalled = true;
}

export type ExtractedArticle = {
  ok: true;
  title?: string;
  byline?: string;
  content: string;       // HTML
  textContent: string;   // plain text
  excerpt?: string;
  siteName?: string;
  publishedTime?: string;
  length: number;
};

export type ExtractFailure = {
  ok: false;
  reason: "fetch" | "parse" | "blocked";
  status?: number;
};

const cache = new Map<string, { at: number; result: ExtractedArticle | ExtractFailure }>();
const TTL_MS = 30 * 60 * 1000;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

export async function extractArticle(url: string): Promise<ExtractedArticle | ExtractFailure> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.result;

  let html: string;
  let status = 0;
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Upgrade-Insecure-Requests": "1",
      },
    });
    status = res.status;
    if (!res.ok) {
      console.error(`[article] fetch ${status} for ${url}`);
      const fail: ExtractFailure = { ok: false, reason: "fetch", status };
      cache.set(url, { at: Date.now(), result: fail });
      return fail;
    }
    html = await res.text();
  } catch (err) {
    console.error(`[article] fetch threw for ${url}:`, err);
    const fail: ExtractFailure = { ok: false, reason: "fetch" };
    cache.set(url, { at: Date.now(), result: fail });
    return fail;
  }

  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const parsed = reader.parse();
    if (!parsed || !parsed.content || (parsed.length ?? 0) < 200) {
      console.error(`[article] parse failed for ${url}: length=${parsed?.length}, hasContent=${!!parsed?.content}`);
      const fail: ExtractFailure = { ok: false, reason: "parse" };
      cache.set(url, { at: Date.now(), result: fail });
      return fail;
    }
    const result: ExtractedArticle = {
      ok: true,
      title: parsed.title ?? undefined,
      byline: parsed.byline ?? undefined,
      content: parsed.content,
      textContent: parsed.textContent ?? "",
      excerpt: parsed.excerpt ?? undefined,
      siteName: parsed.siteName ?? undefined,
      publishedTime: parsed.publishedTime ?? undefined,
      length: parsed.length ?? parsed.textContent?.length ?? 0,
    };
    cache.set(url, { at: Date.now(), result });
    return result;
  } catch {
    const fail: ExtractFailure = { ok: false, reason: "parse" };
    cache.set(url, { at: Date.now(), result: fail });
    return fail;
  }
}

/**
 * Sanitize the readability HTML for safe rendering inside our chrome.
 * Keeps structural tags + links + images; strips scripts/styles/iframes/event handlers.
 */
export function sanitizeArticleHtml(html: string): string {
  // Strip scripts/styles entirely
  let out = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");
  // Strip event handler attributes (onerror, onload, onclick, etc.)
  out = out.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");
  // Strip javascript: hrefs
  out = out.replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"');
  out = out.replace(/href\s*=\s*'javascript:[^']*'/gi, "href='#'");
  return out;
}
