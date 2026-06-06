"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setPending(false);
    if (!res || res.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-4">
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
          <span className="text-sm text-zinc-400">Password</span>
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
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-sm text-zinc-400 mt-4">
        No account?{" "}
        <Link href="/register" className="text-emerald-400 hover:underline">
          Create one
        </Link>
      </p>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
