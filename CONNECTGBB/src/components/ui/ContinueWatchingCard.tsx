import { Play } from "lucide-react";
import { cn } from "@/lib/cn";

interface ContinueWatchingCardProps {
  title: string;
  progress: number;
  thumbnailUrl?: string;
  onResume?: () => void;
  className?: string;
}

export function ContinueWatchingCard({ title, progress, thumbnailUrl, onResume, className }: ContinueWatchingCardProps) {
  return (
    <div className={cn("bg-[var(--surface)] border border-white/10 rounded-lg overflow-hidden", className)}>
      <div className="flex">
        {/* Thumbnail */}
        <div className="w-24 h-16 bg-[var(--surface-muted)] flex-shrink-0">
          {thumbnailUrl && (
            <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
          )}
        </div>
        {/* Content */}
        <div className="flex-1 p-3">
          <h4 className="font-medium text-[var(--foreground)] text-sm mb-2 line-clamp-2">{title}</h4>
          <div className="mb-2">
            <div className="w-full bg-[var(--surface-muted)] rounded-full h-1">
              <div
                className="bg-[var(--brand-primary)] h-1 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          {onResume && (
            <button
              onClick={onResume}
              className="flex items-center gap-1 text-xs bg-[var(--brand-primary)] text-white px-3 py-1 rounded hover:bg-[var(--brand-primary)]/90 transition-colors"
            >
              <Play className="w-3 h-3" />
              Resume
            </button>
          )}
        </div>
      </div>
    </div>
  );
}