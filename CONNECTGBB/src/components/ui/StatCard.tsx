import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, delta, icon, className }: StatCardProps) {
  return (
    <article className={cn("rounded-xl border border-white/10 bg-[var(--surface)] p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">{label}</p>
        {icon ? <div className="text-white/70">{icon}</div> : null}
      </div>
      <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
      {delta ? <p className="mt-1 text-xs text-white/60">{delta}</p> : null}
    </article>
  );
}
