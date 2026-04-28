import { cn } from "@/lib/cn";

interface ProfileCompletionCardProps {
  percentage: number;
  missingFields: string[];
  className?: string;
}

export function ProfileCompletionCard({ percentage, missingFields, className }: ProfileCompletionCardProps) {
  return (
    <div className={cn("bg-[var(--surface)] border border-white/10 rounded-lg p-6", className)}>
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Profile Completion</h3>
      <div className="mb-4">
        <div className="flex justify-between text-sm text-[var(--foreground)]/80 mb-2">
          <span>{percentage}% Complete</span>
        </div>
        <div className="w-full bg-[var(--surface-muted)] rounded-full h-2">
          <div
            className="bg-[var(--brand-primary)] h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      {missingFields.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-[var(--foreground)]/80 mb-2">Missing fields:</p>
          <div className="flex flex-wrap gap-2">
            {missingFields.map((field) => (
              <span
                key={field}
                className="px-3 py-1 bg-[var(--surface-muted)] border border-white/10 rounded-full text-xs text-[var(--foreground)] cursor-pointer hover:bg-[var(--surface)] transition-colors"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      )}
      <button className="w-full bg-[var(--brand-primary)] text-white py-2 px-4 rounded-lg font-medium hover:bg-[var(--brand-primary)]/90 transition-colors">
        Complete Profile
      </button>
    </div>
  );
}