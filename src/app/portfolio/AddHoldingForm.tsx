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
      className="grid sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end p-3"
    >
      <Field label="Symbol">
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          required
          maxLength={20}
          className="input num"
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
          className="input num"
        />
      </Field>
      <Field label="Cost / share">
        <input
          value={costBasis}
          onChange={(e) => setCostBasis(e.target.value)}
          required
          type="number"
          step="any"
          min="0"
          className="input num"
        />
      </Field>
      <Field label="Purchased on">
        <input
          value={purchasedAt}
          onChange={(e) => setPurchasedAt(e.target.value)}
          required
          type="date"
          max={today}
          className="input num"
        />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="h-8 px-4 text-[11px] uppercase tracking-wider border border-[var(--border-strong)] hover:border-[var(--fg-2)] bg-[var(--surface-2)] disabled:opacity-50"
      >
        {pending ? "Adding" : "Add holding"}
      </button>
      {error && <p className="text-[12px] text-[var(--loss)] sm:col-span-5">{error}</p>}
      <style>{`
        .input {
          width: 100%;
          height: 2rem;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 2px;
          padding: 0 0.5rem;
          color: inherit;
          font-size: 12px;
        }
        .input:focus { outline: none; border-color: var(--accent); }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label block mb-1">{label}</span>
      {children}
    </label>
  );
}
