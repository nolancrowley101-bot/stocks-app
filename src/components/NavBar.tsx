import Link from "next/link";
import { auth, signOut } from "@/auth";
import SearchBox from "./SearchBox";

export default async function NavBar() {
  const session = await auth();
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-zinc-950/80 border-b border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center gap-4">
        <Link href="/" className="font-semibold text-emerald-400 whitespace-nowrap">
          Stocks
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm text-zinc-400">
          <Link href="/" className="hover:text-zinc-100">Markets</Link>
          <Link href="/news" className="hover:text-zinc-100">News</Link>
          <Link href="/watchlist" className="hover:text-zinc-100">Watchlist</Link>
          <Link href="/portfolio" className="hover:text-zinc-100">Portfolio</Link>
        </nav>
        <div className="flex-1 max-w-md ml-auto">
          <SearchBox />
        </div>
        <div className="flex items-center gap-2 text-sm">
          {session?.user ? (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="text-zinc-400 hover:text-zinc-100">
                Sign out
              </button>
            </form>
          ) : (
            <>
              <Link href="/signin" className="text-zinc-400 hover:text-zinc-100">
                Sign in
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-block rounded-md bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 text-zinc-950 font-medium"
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
