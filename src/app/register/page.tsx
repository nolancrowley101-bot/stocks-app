"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Module, ModuleHeader, ModuleFooter } from "@/components/ui/Module";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name || undefined }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create account.");
      setPending(false);
      return;
    }
    const signed = await signIn("credentials", { email, password, redirect: false });
    setPending(false);
    if (!signed || signed.error) {
      router.push("/signin");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="p-2">
      <div className="max-w-sm mx-auto mt-12">
        <Module>
          <ModuleHeader label="Create account" actions={<span className="num text-[10px] text-[var(--fg-3)]">NEW</span>} />
          <form onSubmit={onSubmit} className="p-4 space-y-3">
            <Field label="Name (optional)">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-input"
                autoComplete="name"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                autoComplete="email"
              />
            </Field>
            <Field label="Password (min 8 chars)">
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                autoComplete="new-password"
              />
            </Field>
            {error && <p className="text-[12px] text-[var(--loss)]">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full h-9 mt-2 text-[12px] uppercase tracking-wider border border-[var(--border-strong)] hover:border-[var(--fg-2)] bg-[var(--surface-2)] disabled:opacity-50"
            >
              {pending ? "Creating…" : "Create account"}
            </button>
          </form>
          <ModuleFooter>
            <Link href="/signin" className="hover:text-[var(--fg)]">
              Already registered? Sign in →
            </Link>
          </ModuleFooter>
        </Module>
      </div>
      <style>{`
        .auth-input {
          width: 100%;
          height: 2.25rem;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 2px;
          padding: 0 0.625rem;
          color: inherit;
          font-size: 13px;
          font-family: var(--font-mono-stack), monospace;
        }
        .auth-input:focus { outline: none; border-color: var(--accent); }
      `}</style>
    </main>
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
