"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Check } from "lucide-react";

export default function AddToWatchlist({ symbol }: { symbol: string }) {
  const { status } = useSession();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (status !== "authenticated") {
      router.push(`/signin?callbackUrl=/quote/${encodeURIComponent(symbol)}`);
      return;
    }
    setPending(true);
    setError(null);
    const res = await fetch("/api/watchlist/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not add.");
      return;
    }
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  }

  return (
    <button
      onClick={add}
      disabled={pending}
      className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider border border-[var(--border-strong)] hover:border-[var(--fg-2)] hover:text-[var(--fg)] px-2 h-6 disabled:opacity-50"
      title={error ?? undefined}
    >
      {done ? <Check className="w-3 h-3 text-[var(--gain)]" /> : <Plus className="w-3 h-3" />}
      <span>{pending ? "Adding" : done ? "Added" : "Watchlist"}</span>
    </button>
  );
}
