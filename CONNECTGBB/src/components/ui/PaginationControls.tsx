import { cn } from "@/lib/cn";

export interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

export function PaginationControls({ page, totalPages, onChange, className }: PaginationControlsProps) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <nav className={cn("flex items-center justify-between gap-3", className)} aria-label="Pagination">
      <button
        type="button"
        onClick={() => canPrev && onChange(page - 1)}
        disabled={!canPrev}
        className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-white/80 disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-xs text-white/60">Page {page} of {totalPages}</span>
      <button
        type="button"
        onClick={() => canNext && onChange(page + 1)}
        disabled={!canNext}
        className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-white/80 disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}
