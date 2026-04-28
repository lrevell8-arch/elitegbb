import { Check, Play } from "lucide-react";
import { cn } from "@/lib/cn";

interface TrainingVideoCardProps {
  title: string;
  duration: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  thumbnailUrl?: string;
  completed?: boolean;
  progress?: number;
  onClick?: () => void;
  className?: string;
}

export function TrainingVideoCard({
  title,
  duration,
  difficulty,
  thumbnailUrl,
  completed,
  progress,
  onClick,
  className,
}: TrainingVideoCardProps) {
  const difficultyColors = {
    beginner: "bg-green-500/20 text-green-400",
    intermediate: "bg-yellow-500/20 text-yellow-400",
    advanced: "bg-red-500/20 text-red-400",
  };

  return (
    <div
      className={cn(
        "bg-[var(--surface)] border border-white/10 rounded-lg overflow-hidden cursor-pointer hover:border-white/20 transition-colors",
        className
      )}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[var(--surface-muted)]">
        {thumbnailUrl && (
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
        )}
        {/* Duration badge */}
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {duration}
        </div>
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 rounded-full p-3">
            <Play className="w-6 h-6 text-white" />
          </div>
        </div>
        {/* Completed checkmark */}
        {completed && (
          <div className="absolute bottom-2 right-2 bg-[var(--brand-primary)] rounded-full p-1">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-[var(--foreground)] mb-2 line-clamp-2">{title}</h3>
        <div className="flex items-center justify-between">
          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", difficultyColors[difficulty])}>
            {difficulty}
          </span>
        </div>
        {/* Progress bar */}
        {progress !== undefined && progress > 0 && (
          <div className="mt-3">
            <div className="w-full bg-[var(--surface-muted)] rounded-full h-1">
              <div
                className="bg-[var(--brand-primary)] h-1 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}