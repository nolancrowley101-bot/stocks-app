"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">Create account</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm text-zinc-400">Name (optional)</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </label>
        <label className="block">
          <span className="text-sm text-zinc-400">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </label>
        <label className="block">
          <span className="text-sm text-zinc-400">Password (min 8 chars)</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </label>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-medium py-2"
        >
          {pending ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="text-sm text-zinc-400 mt-4">
        Already have an account?{" "}
        <Link href="/signin" className="text-emerald-400 hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
