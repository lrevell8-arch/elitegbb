import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface ReportCardProps {
  title: string;
  value: string | number;
  change?: number;
  description?: string;
  className?: string;
}

export function ReportCard({ title, value, change, description, className }: ReportCardProps) {
  return (
    <div className={cn("bg-[var(--surface)] border border-white/10 rounded-lg p-6", className)}>
      <h3 className="text-sm font-medium text-[var(--foreground)]/80 mb-2">{title}</h3>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-bold text-[var(--foreground)]">{value}</span>
        {change !== undefined && (
          <div className={cn("flex items-center gap-1 text-sm", change >= 0 ? "text-green-400" : "text-red-400")}>
            {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      {description && (
        <p className="text-sm text-[var(--foreground)]/60">{description}</p>
      )}
    </div>
  );
}