import { cn } from "@/lib/cn";
import { StatusBadge } from "./StatusBadge";

interface CurrentPlanCardProps {
  planName: string;
  status: "active" | "canceled" | "trialing";
  nextBillingDate?: string;
  amount?: number;
  onManage?: () => void;
  className?: string;
}

export function CurrentPlanCard({
  planName,
  status,
  nextBillingDate,
  amount,
  onManage,
  className,
}: CurrentPlanCardProps) {
  const statusConfig = {
    active: { variant: "success" as const, label: "Active" },
    canceled: { variant: "error" as const, label: "Canceled" },
    trialing: { variant: "warning" as const, label: "Trial" },
  };

  return (
    <div className={cn("bg-[var(--surface)] border border-white/10 rounded-lg p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Current Plan</h3>
        <StatusBadge variant={statusConfig[status].variant}>
          {statusConfig[status].label}
        </StatusBadge>
      </div>
      <p className="text-xl font-bold text-[var(--foreground)] mb-2">{planName}</p>
      {nextBillingDate && amount && (
        <p className="text-sm text-[var(--foreground)]/80 mb-4">
          Next billing: {nextBillingDate} (${amount})
        </p>
      )}
      {onManage && (
        <button
          onClick={onManage}
          className="w-full bg-[var(--brand-primary)] text-white py-2 px-4 rounded-lg font-medium hover:bg-[var(--brand-primary)]/90 transition-colors"
        >
          Manage Billing
        </button>
      )}
    </div>
  );
}