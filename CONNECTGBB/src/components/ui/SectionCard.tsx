import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SectionCardProps {
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function SectionCard({ title, description, children, footer, className }: SectionCardProps) {
  return (
    <section className={cn("rounded-xl border border-white/10 bg-[var(--surface)] p-5", className)}>
      <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
      {description ? <p className="mt-2 text-sm text-white/70">{description}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
      {footer ? <div className="mt-4 border-t border-white/10 pt-4">{footer}</div> : null}
    </section>
  );
}
