import { cn } from "@/lib/cn";

export type VerificationState = "verified" | "pending" | "unverified";

export interface VerificationBadgeProps {
  state: VerificationState;
  className?: string;
}

const stateClasses: Record<VerificationState, string> = {
  verified: "border-[var(--brand-primary)]/50 bg-[var(--brand-primary)]/20 text-white",
  pending: "border-[var(--brand-secondary)]/50 bg-[var(--brand-secondary)]/20 text-white",
  unverified: "border-white/20 bg-white/10 text-white/80",
};

export function VerificationBadge({ state, className }: VerificationBadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", stateClasses[state], className)}>
      {state}
    </span>
  );
}
