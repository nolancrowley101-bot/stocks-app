"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function RemoveButton({ symbol }: { symbol: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  function remove() {
    start(async () => {
      await fetch(`/api/watchlist/items?symbol=${encodeURIComponent(symbol)}`, {
        method: "DELETE",
      });
      router.refresh();
    });
  }
  return (
    <button
      onClick={remove}
      disabled={pending}
      aria-label={`Remove ${symbol}`}
      className="text-zinc-500 hover:text-rose-400 disabled:opacity-50"
    >
      <X className="w-4 h-4" />
    </button>
  );
}
