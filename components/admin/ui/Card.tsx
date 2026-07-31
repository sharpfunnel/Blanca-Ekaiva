import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-admin-border bg-admin-card",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 px-5 pt-4 pb-3",
        className
      )}
    >
      <div className="min-w-0">
        <h3 className="font-display text-[15px] font-semibold text-admin-fg">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-admin-muted">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
