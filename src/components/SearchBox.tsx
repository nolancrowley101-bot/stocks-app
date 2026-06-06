"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";

type Result = {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
};

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (q.trim().length < 1) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (!r.ok) return;
        const data = (await r.json()) as { results: Result[] };
        setResults(data.results || []);
        setActive(0);
      } catch {}
    }, 180);
    return () => {
      ctrl.abort();
      clearTimeout(id);
    };
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function navigate(sym: string) {
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
    router.push(`/quote/${encodeURIComponent(sym.toUpperCase())}`);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sym = results[active]?.symbol || q;
      if (sym) navigate(sym);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] focus-within:border-[var(--border-strong)] px-2.5 h-8 rounded-sm">
        <Search className="w-3.5 h-3.5 text-[var(--fg-3)] mr-2" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder="Search ticker or company"
          className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[var(--fg-3)]"
          aria-label="Search"
        />
        <kbd className="hidden sm:inline label tracking-wider border border-[var(--border)] px-1 py-px text-[9px] rounded-sm">/</kbd>
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-[var(--surface)] border border-[var(--border-strong)] shadow-lg overflow-hidden rounded-sm">
          {results.map((r, i) => (
            <li key={r.symbol}>
              <Link
                href={`/quote/${encodeURIComponent(r.symbol.toUpperCase())}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  setOpen(false);
                  setQ("");
                }}
                className={`block px-3 h-8 flex items-center justify-between gap-3 ${
                  i === active ? "bg-[var(--surface-2)]" : ""
                }`}
              >
                <span className="font-mono font-medium text-[12px]">{r.symbol}</span>
                <span className="text-[11px] text-[var(--fg-2)] truncate max-w-[60%]">
                  {r.shortname || r.longname || ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
