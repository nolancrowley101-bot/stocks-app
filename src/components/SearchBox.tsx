"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

  function go(sym: string) {
    setOpen(false);
    setQ("");
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
      if (sym) go(sym);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center rounded-md bg-zinc-900 border border-zinc-800 px-3 h-9">
        <Search className="w-4 h-4 text-zinc-500 mr-2" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder="Search ticker or company"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500"
          aria-label="Search"
        />
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900 shadow-xl overflow-hidden">
          {results.map((r, i) => (
            <li key={r.symbol}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.symbol)}
                className={`w-full text-left px-3 py-2 flex justify-between items-center gap-3 ${
                  i === active ? "bg-zinc-800" : ""
                }`}
              >
                <span className="font-medium">{r.symbol}</span>
                <span className="text-xs text-zinc-400 truncate max-w-[60%]">
                  {r.shortname || r.longname || ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
