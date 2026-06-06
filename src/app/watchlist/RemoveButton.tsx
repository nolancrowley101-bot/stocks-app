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
      className="text-[var(--fg-3)] hover:text-[var(--loss)] disabled:opacity-50"
    >
      <X className="w-3.5 h-3.5" />
    </button>
  );
}
