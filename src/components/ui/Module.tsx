import { cn } from "@/lib/cn";

type Density = "compact" | "dense" | "roomy";

const bodyPad: Record<Density, string> = {
  compact: "p-3",
  dense:   "p-2",
  roomy:   "p-4",
};

export function Module({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded border border-[var(--border)] bg-[var(--surface)]",
        "transition-colors duration-100",
        interactive && "hover:border-[var(--border-strong)] cursor-pointer",
        className
      )}
      {...props}
    />
  );
}

export function ModuleHeader({
  label,
  actions,
  className,
}: {
  label: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-3 h-7 border-b border-[var(--border)]",
        className
      )}
    >
      <span className="label truncate">{label}</span>
      {actions && <div className="flex items-center gap-1 text-[var(--fg-2)]">{actions}</div>}
    </div>
  );
}

export function ModuleBody({
  density = "compact",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { density?: Density }) {
  return <div className={cn(bodyPad[density], className)} {...props} />;
}

export function ModuleFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "h-6 px-3 flex items-center text-[10px] tracking-wide uppercase text-[var(--fg-3)] border-t border-[var(--border)]",
        className
      )}
      {...props}
    />
  );
}
