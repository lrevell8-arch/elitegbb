import { cn } from "@/lib/cn";

interface UpgradeBannerProps {
  currentPlan: string;
  upgradeTo: string;
  onUpgrade?: () => void;
  className?: string;
}

export function UpgradeBanner({ currentPlan, upgradeTo, onUpgrade, className }: UpgradeBannerProps) {
  return (
    <div className={cn("border border-[var(--brand-secondary)]/30 bg-[var(--brand-secondary)]/10 rounded-lg p-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-[var(--foreground)]">
          You're on <span className="font-medium">{currentPlan}</span>. Upgrade to{" "}
          <span className="font-medium text-[var(--brand-secondary)]">{upgradeTo}</span> for full access.
        </p>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="bg-[var(--brand-secondary)] text-white px-4 py-2 rounded-lg font-medium hover:bg-[var(--brand-secondary)]/90 transition-colors"
          >
            Upgrade
          </button>
        )}
      </div>
    </div>
  );
}