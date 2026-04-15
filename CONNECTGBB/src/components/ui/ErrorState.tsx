import { cn } from "@/lib/cn";

export interface ErrorStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Try again",
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("rounded-xl border border-[var(--brand-secondary)]/40 bg-[var(--surface)] p-6", className)}>
      <h3 className="text-base font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-2 text-sm text-white/70">{description}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md bg-[var(--brand-primary)] px-3 py-2 text-sm font-semibold text-white"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
