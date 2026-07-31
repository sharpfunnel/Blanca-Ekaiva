import { Inbox, type LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl border border-admin-border bg-admin-card-2 text-admin-muted">
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-sm font-medium text-admin-fg">{title}</p>
      {description ? (
        <p className="mt-1 max-w-xs text-xs text-admin-muted">{description}</p>
      ) : null}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <p className="text-sm font-medium text-admin-fg">
        Something went wrong loading this data.
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border border-admin-border bg-admin-card px-3 py-1.5 text-xs text-admin-fg-2 hover:text-admin-fg"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
