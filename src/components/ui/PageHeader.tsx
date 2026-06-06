export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-3 px-1 pt-1 pb-2">
      <div>
        <h1 className="text-[18px] font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-[11px] text-[var(--fg-3)] uppercase tracking-wider mt-0.5">{subtitle}</p>
        )}
      </div>
      {right && <div className="text-right">{right}</div>}
    </header>
  );
}
