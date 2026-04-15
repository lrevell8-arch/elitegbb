import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface UIPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: UIPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-white/10 bg-[var(--surface)] p-6 md:flex-row md:items-start md:justify-between",
        className
      )}
    >
      <div>
        <h1 className="font-sans text-2xl font-semibold text-[var(--foreground)] md:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm text-white/70">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
