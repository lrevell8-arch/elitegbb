import { Activity } from "lucide-react";
import { cn } from "@/lib/cn";

interface DrillCardProps {
  title: string;
  category: string;
  equipment: string[];
  duration: string;
  onClick?: () => void;
  className?: string;
}

export function DrillCard({ title, category, equipment, duration, onClick, className }: DrillCardProps) {
  return (
    <div
      className={cn(
        "bg-[var(--surface)] border border-white/10 rounded-lg p-4 cursor-pointer hover:border-white/20 transition-colors",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-[var(--brand-primary)]/10 rounded-lg">
          <Activity className="w-5 h-5 text-[var(--brand-primary)]" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--foreground)] mb-1">{title}</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-[var(--brand-secondary)]/20 text-[var(--brand-secondary)] rounded-full text-xs font-medium">
              {category}
            </span>
            <span className="text-xs text-[var(--foreground)]/80">{duration}</span>
          </div>
          {equipment.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {equipment.map((item) => (
                <span
                  key={item}
                  className="px-2 py-1 bg-[var(--surface-muted)] border border-white/10 rounded-full text-xs text-[var(--foreground)]/80"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}