import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  cta?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, cta, className }: EmptyStateProps) {
  return (
    <div className={cn("rounded-xl border border-dashed border-white/20 bg-black/30 p-6 text-center", className)}>
      {icon ? <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center text-white/60">{icon}</div> : null}
      <h3 className="text-base font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-2 text-sm text-white/70">{description}</p>
      {cta ? <div className="mt-4">{cta}</div> : null}
    </div>
  );
}
