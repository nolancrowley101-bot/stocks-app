import Link from "next/link";
import { auth, signOut } from "@/auth";
import SearchBox from "./SearchBox";

export default async function NavBar() {
  const session = await auth();
  return (
    <header className="sticky top-0 z-40 bg-[var(--bg)]/95 backdrop-blur border-b border-[var(--border)]">
      <div className="px-3 sm:px-4 h-12 flex items-center gap-3 sm:gap-5">
        <Link
          href="/"
          className="font-mono text-[12px] tracking-[0.18em] font-semibold text-[var(--fg)] whitespace-nowrap uppercase shrink-0"
        >
          Stocks<span className="text-[var(--accent)]">.</span>
        </Link>
        <nav className="flex items-center gap-px shrink-0">
          <NavLink href="/">Mkts</NavLink>
          <NavLink href="/news">News</NavLink>
          <NavLink href="/watchlist">Watch</NavLink>
          <NavLink href="/portfolio">Port</NavLink>
        </nav>
        <div className="flex-1 min-w-0 max-w-md ml-auto">
          <SearchBox />
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-[11px] uppercase tracking-wider shrink-0">
          {session?.user ? (
            <>
              <span className="hidden lg:inline text-[var(--fg-3)] normal-case tracking-normal truncate max-w-[180px]">
                {session.user.email}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button className="text-[var(--fg-2)] hover:text-[var(--fg)]">
                  <span className="hidden sm:inline">Sign out</span>
                  <span className="sm:hidden">Out</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/signin" className="text-[var(--fg-2)] hover:text-[var(--fg)]">
                <span className="hidden sm:inline">Sign in</span>
                <span className="sm:hidden">In</span>
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-block border border-[var(--border-strong)] hover:border-[var(--fg-2)] px-2.5 py-1 text-[var(--fg)]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--fg-2)] hover:text-[var(--fg)] hover:bg-[var(--surface)] rounded-sm"
    >
      {children}
    </Link>
  );
}
