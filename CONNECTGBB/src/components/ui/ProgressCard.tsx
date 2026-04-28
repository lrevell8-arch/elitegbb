import { cn } from "@/lib/cn";

interface ProgressCardProps {
  label: string;
  value: number;
  max: number;
  unit?: string;
  className?: string;
}

export function ProgressCard({ label, value, max, unit, className }: ProgressCardProps) {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 40; // radius 40
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("bg-[var(--surface)] border border-white/10 rounded-lg p-6 flex flex-col items-center", className)}>
      <div className="relative w-20 h-20 mb-4">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="var(--surface-muted)"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="var(--brand-primary)"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-[var(--foreground)]">
            {value}{unit}
          </span>
        </div>
      </div>
      <p className="text-sm text-[var(--foreground)]/80 text-center">{label}</p>
    </div>
  );
}