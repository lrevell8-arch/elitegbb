import { cn } from "@/lib/cn";

export type StatusBadgeVariant = "active" | "pending" | "suspended" | "flagged";

export interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  className?: string;
}

const statusLabels: Record<StatusBadgeVariant, string> = {
  active: "Active",
  pending: "Pending",
  suspended: "Suspended",
  flagged: "Flagged",
};

const statusClasses: Record<StatusBadgeVariant, string> = {
  active: "border-[var(--brand-primary)]/50 bg-[var(--brand-primary)]/20 text-white",
  pending: "border-[var(--brand-secondary)]/50 bg-[var(--brand-secondary)]/20 text-white",
  suspended: "border-white/30 bg-white/10 text-white/85",
  flagged: "border-[var(--brand-secondary)]/70 bg-[var(--brand-secondary)]/30 text-white",
};

export function StatusBadge({ variant, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.15em]",
        statusClasses[variant],
        className
      )}
    >
      {statusLabels[variant]}
    </span>
  );
}
