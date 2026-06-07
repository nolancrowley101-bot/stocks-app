import { createHmac, timingSafeEqual } from "node:crypto";
import { auth } from "@/auth";

const SECRET = process.env.NEXTAUTH_SECRET ?? "dev-only-insecure-secret";

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

export function signToken(uid: string, days = 30): string {
  const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(
    Buffer.from(JSON.stringify({ sub: uid, iat: now, exp: now + days * 86400 }))
  );
  const body = `${header}.${payload}`;
  const sig = b64url(createHmac("sha256", SECRET).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyToken(token: string): { sub: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expected = b64url(createHmac("sha256", SECRET).update(`${header}.${payload}`).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const obj = JSON.parse(b64urlDecode(payload).toString("utf8")) as { sub?: string; exp?: number };
    if (!obj.sub || !obj.exp || obj.exp < Math.floor(Date.now() / 1000)) return null;
    return { sub: obj.sub };
  } catch {
    return null;
  }
}

export function getUserIdFromBearer(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  if (!m) return null;
  const v = verifyToken(m[1].trim());
  return v?.sub ?? null;
}

/**
 * Resolve the calling user from either a Bearer token (desktop client)
 * or the NextAuth cookie session (website). Returns null if neither valid.
 */
export async function getUserIdForApi(req: Request): Promise<string | null> {
  const fromBearer = getUserIdFromBearer(req);
  if (fromBearer) return fromBearer;
  try {
    const session = await auth();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}
