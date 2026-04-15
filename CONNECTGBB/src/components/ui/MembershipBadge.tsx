import { cn } from "@/lib/cn";

export type MembershipTier = "free" | "development" | "elite";

export interface MembershipBadgeProps {
  tier: MembershipTier;
  className?: string;
}

const tierStyles: Record<MembershipTier, string> = {
  free: "border-white/20 bg-white/10 text-white/80",
  development: "border-[var(--brand-primary)]/50 bg-[var(--brand-primary)]/20 text-white",
  elite: "border-[var(--brand-secondary)]/50 bg-[var(--brand-secondary)]/20 text-white",
};

export function MembershipBadge({ tier, className }: MembershipBadgeProps) {
  return <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize", tierStyles[tier], className)}>{tier}</span>;
}
