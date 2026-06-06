"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddHoldingForm() {
  const router = useRouter();
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [costBasis, setCostBasis] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [purchasedAt, setPurchasedAt] = useState(today);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/portfolio/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol,
        shares: Number(shares),
        costBasis: Number(costBasis),
        purchasedAt,
      }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not add.");
      return;
    }
    setSymbol("");
    setShares("");
    setCostBasis("");
    setPurchasedAt(today);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 grid sm:grid-cols-5 gap-3 items-end"
    >
      <Field label="Symbol">
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          required
          maxLength={20}
          className="input"
          placeholder="AAPL"
        />
      </Field>
      <Field label="Shares">
        <input
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          required
          type="number"
          step="any"
          min="0"
          className="input"
        />
      </Field>
      <Field label="Cost per share">
        <input
          value={costBasis}
          onChange={(e) => setCostBasis(e.target.value)}
          required
          type="number"
          step="any"
          min="0"
          className="input"
        />
      </Field>
      <Field label="Purchased on">
        <input
          value={purchasedAt}
          onChange={(e) => setPurchasedAt(e.target.value)}
          required
          type="date"
          max={today}
          className="input"
        />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-md bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-medium"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      {error && <p className="text-sm text-rose-400 sm:col-span-5">{error}</p>}
      <style>{`
        .input {
          width: 100%;
          height: 2.5rem;
          background: rgb(24 24 27);
          border: 1px solid rgb(39 39 42);
          border-radius: 0.375rem;
          padding: 0 0.75rem;
          color: inherit;
          font-size: 0.875rem;
        }
        .input:focus { outline: none; border-color: rgb(16 185 129); }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-zinc-400 block mb-1">{label}</span>
      {children}
    </label>
  );
}
