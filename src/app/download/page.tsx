import { headers } from "next/headers";
import { PageHeader } from "@/components/ui/PageHeader";
import { Module, ModuleHeader, ModuleBody, ModuleFooter } from "@/components/ui/Module";

export const metadata = {
  title: "Download — Stocks Services desktop app",
  description:
    "Native desktop client for stocks-services.com. Windows installer, macOS disk image, and Linux AppImage.",
};

type Platform = {
  id: "windows" | "macos" | "linux";
  os: string;
  file: string;
  ext: string;
  href: string;
  size?: string;
  detect: (ua: string) => boolean;
};

const VERSION = "0.2.0";

const PLATFORMS: Platform[] = [
  {
    id: "windows",
    os: "Windows",
    file: `Stocks.Services_${VERSION}_x64-setup.exe`,
    ext: "EXE installer",
    href: `/downloads/Stocks.Services_${VERSION}_x64-setup.exe`,
    detect: (ua) => /windows/i.test(ua),
  },
  {
    id: "macos",
    os: "macOS",
    file: `Stocks.Services_${VERSION}_universal.dmg`,
    ext: "Universal DMG (Apple Silicon + Intel)",
    href: `/downloads/Stocks.Services_${VERSION}_universal.dmg`,
    detect: (ua) => /mac os|macintosh/i.test(ua),
  },
  {
    id: "linux",
    os: "Linux",
    file: `Stocks.Services_${VERSION}_amd64.AppImage`,
    ext: "AppImage (x86_64)",
    href: `/downloads/Stocks.Services_${VERSION}_amd64.AppImage`,
    detect: (ua) => /linux/i.test(ua) && !/android/i.test(ua),
  },
];

export default async function DownloadPage() {
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  const recommended = PLATFORMS.find((p) => p.detect(ua));
  const others = PLATFORMS.filter((p) => p.id !== recommended?.id);

  return (
    <div className="px-4 py-3 max-w-4xl mx-auto">
      <PageHeader
        title="Desktop app"
        subtitle={`Version ${VERSION}`}
        right={
          <div className="text-[11px] uppercase tracking-wider text-[var(--fg-3)]">
            Native quotes · charts · price alerts
          </div>
        }
      />

      <div className="grid gap-3 mt-2">
        {recommended && (
          <Module className="border-[var(--accent)]/40">
            <ModuleHeader
              label={`Recommended · ${recommended.os}`}
              actions={
                <span className="text-[11px] text-[var(--fg-3)]">
                  {recommended.ext}
                </span>
              }
            />
            <ModuleBody density="roomy">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">{recommended.file}</div>
                  <p className="text-[12px] text-[var(--fg-2)] mt-1 max-w-md">
                    A native client for stocks-services.com. Live quotes, charts,
                    watchlist, and OS-level price alerts. The app talks to this
                    same backend — no separate account needed.
                  </p>
                </div>
                <a
                  href={recommended.href}
                  className="px-4 py-2 text-sm border border-[var(--accent)] text-[var(--fg)] hover:bg-[var(--accent)]/20 rounded whitespace-nowrap"
                >
                  Download
                </a>
              </div>
            </ModuleBody>
          </Module>
        )}

        <Module>
          <ModuleHeader label="All platforms" />
          <ModuleBody density="dense">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-[var(--fg-3)]">
                  <th className="text-left font-normal py-1.5 px-2">OS</th>
                  <th className="text-left font-normal py-1.5 px-2">File</th>
                  <th className="text-left font-normal py-1.5 px-2">Type</th>
                  <th className="text-right font-normal py-1.5 px-2">Get</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {(recommended ? [recommended, ...others] : PLATFORMS).map((p) => (
                  <tr key={p.id}>
                    <td className="py-1.5 px-2">{p.os}</td>
                    <td className="py-1.5 px-2 font-mono text-[12px] text-[var(--fg-2)]">
                      {p.file}
                    </td>
                    <td className="py-1.5 px-2 text-[var(--fg-2)]">{p.ext}</td>
                    <td className="py-1.5 px-2 text-right">
                      <a
                        href={p.href}
                        className="text-[var(--accent)] hover:underline"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ModuleBody>
          <ModuleFooter>
            Builds signed by stocks-services.com · checksums at /downloads/SHA256SUMS
          </ModuleFooter>
        </Module>

        <Module>
          <ModuleHeader label="What it does" />
          <ModuleBody density="roomy">
            <ul className="text-[13px] text-[var(--fg-2)] space-y-1.5">
              <li>· Native window with the same dense markets layout as the site.</li>
              <li>
                · Live quotes, charts (1d / 5d / 1mo / 6mo / 1y / 5y / max), and key
                statistics.
              </li>
              <li>· Persistent watchlist stored on your device.</li>
              <li>
                · OS-level price alerts — set thresholds, get a real desktop
                notification when they hit.
              </li>
              <li>
                · No separate backend. Everything flows through{" "}
                <span className="font-mono">stocks-services.com</span>.
              </li>
            </ul>
          </ModuleBody>
        </Module>
      </div>
    </div>
  );
}
