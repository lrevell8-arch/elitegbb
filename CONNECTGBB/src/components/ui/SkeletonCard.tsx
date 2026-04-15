import { cn } from "@/lib/cn";

export interface SkeletonCardProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonCard({ rows = 3, columns = 1, className }: SkeletonCardProps) {
  const rowArray = Array.from({ length: rows });
  const colArray = Array.from({ length: columns });
  const columnClass =
    columns >= 4
      ? "grid-cols-4"
      : columns === 3
        ? "grid-cols-3"
        : columns === 2
          ? "grid-cols-2"
          : "grid-cols-1";

  return (
    <div className={cn("rounded-xl border border-white/10 bg-[var(--surface)] p-5", className)}>
      <div className={cn("grid gap-3", columnClass)}>
        {colArray.map((_, columnIndex) => (
          <div key={`column-${columnIndex}`} className="space-y-2">
            {rowArray.map((_, rowIndex) => (
              <div
                key={`row-${columnIndex}-${rowIndex}`}
                className="h-3 animate-pulse rounded bg-[var(--surface-muted)]"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
