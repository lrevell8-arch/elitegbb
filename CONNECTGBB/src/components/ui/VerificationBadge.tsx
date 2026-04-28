import { Check, Clock, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface VerificationBadgeProps {
  state: "verified" | "pending" | "unverified";
  className?: string;
}

export function VerificationBadge({ state, className }: VerificationBadgeProps) {
  const configs = {
    verified: {
      bg: "bg-[var(--brand-primary)]",
      text: "text-white",
      icon: Check,
      label: "Verified",
    },
    pending: {
      bg: "bg-[var(--brand-secondary)]",
      text: "text-white",
      icon: Clock,
      label: "Pending",
    },
    unverified: {
      bg: "bg-[var(--surface-muted)]",
      text: "text-[var(--foreground)]",
      icon: X,
      label: "Unverified",
    },
  };

  const config = configs[state];
  const Icon = config.icon;

  return (
    <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", config.bg, config.text, className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </div>
  );
}
