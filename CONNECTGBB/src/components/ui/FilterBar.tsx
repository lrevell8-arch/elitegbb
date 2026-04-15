import { cn } from "@/lib/cn";

export interface FilterChip {
  id: string;
  label: string;
}

export interface FilterBarProps {
  filters: FilterChip[];
  onRemove: (id: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export function FilterBar({ filters, onRemove, onClearAll, className }: FilterBarProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={() => onRemove(filter.id)}
          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80"
        >
          {filter.label} ×
        </button>
      ))}
      {onClearAll ? (
        <button type="button" onClick={onClearAll} className="text-xs font-semibold text-[var(--brand-secondary)]">
          Clear all
        </button>
      ) : null}
    </div>
  );
}
