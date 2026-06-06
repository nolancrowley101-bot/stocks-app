"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function RemoveHoldingButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  function remove() {
    if (!confirm("Remove this holding?")) return;
    start(async () => {
      await fetch(`/api/portfolio/holdings?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      router.refresh();
    });
  }
  return (
    <button
      onClick={remove}
      disabled={pending}
      aria-label="Remove holding"
      className="text-zinc-500 hover:text-rose-400 disabled:opacity-50"
    >
      <X className="w-4 h-4" />
    </button>
  );
}
