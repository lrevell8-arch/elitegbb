import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ModeratorFlagBannerProps {
  reason?: string;
  onDismiss?: () => void;
  className?: string;
}

export function ModeratorFlagBanner({ reason, onDismiss, className }: ModeratorFlagBannerProps) {
  return (
    <div className={cn("border-l-4 border-red-500 bg-red-500/10 p-4", className)}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-[var(--foreground)] font-medium">
            This conversation is under review
          </p>
          {reason && (
            <p className="text-sm text-[var(--foreground)]/80 mt-1">
              Reason: {reason}
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}