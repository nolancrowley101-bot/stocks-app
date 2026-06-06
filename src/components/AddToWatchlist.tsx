"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
    <div className="flex items-center gap-2">
      <button
        onClick={add}
        disabled={pending}
        className="rounded-md border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 text-sm disabled:opacity-50"
      >
        {pending ? "Adding…" : done ? "Added ✓" : "+ Watchlist"}
      </button>
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  );
}
