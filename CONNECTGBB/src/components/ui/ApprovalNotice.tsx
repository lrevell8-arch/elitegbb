import { Info } from "lucide-react";
import { cn } from "@/lib/cn";

interface ApprovalNoticeProps {
  message?: string;
  className?: string;
}

export function ApprovalNotice({ message, className }: ApprovalNoticeProps) {
  return (
    <div className={cn("border-l-4 border-[var(--brand-secondary)] bg-[var(--surface-muted)] p-4", className)}>
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-[var(--brand-secondary)] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[var(--foreground)]">
          {message || "All connection requests require parent approval before messaging can begin. We'll notify you once approved."}
        </p>
      </div>
    </div>
  );
}