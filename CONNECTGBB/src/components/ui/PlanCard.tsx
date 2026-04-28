import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface PlanCardProps {
  name: string;
  price: number;
  period: "month" | "year";
  features: string[];
  highlighted?: boolean;
  ctaLabel: string;
  onCta?: () => void;
  className?: string;
}

export function PlanCard({
  name,
  price,
  period,
  features,
  highlighted,
  ctaLabel,
  onCta,
  className,
}: PlanCardProps) {
  return (
    <div
      className={cn(
        "bg-[var(--surface)] border rounded-lg p-6",
        highlighted ? "border-[var(--brand-primary)]" : "border-white/10",
        className
      )}
    >
      <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">{name}</h3>
      <div className="mb-4">
        <span className="text-3xl font-bold text-[var(--foreground)]">${price}</span>
        <span className="text-[var(--foreground)]/80">/{period}</span>
      </div>
      <ul className="space-y-2 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[var(--brand-primary)] flex-shrink-0" />
            <span className="text-sm text-[var(--foreground)]/80">{feature}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onCta}
        className={cn(
          "w-full py-2 px-4 rounded-lg font-medium transition-colors",
          highlighted
            ? "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary)]/90"
            : "bg-[var(--surface-muted)] text-[var(--foreground)] hover:bg-[var(--surface)]"
        )}
      >
        {ctaLabel}
      </button>
    </div>
  );
}