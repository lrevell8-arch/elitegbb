import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
}

export interface ActionMenuProps {
  label?: string;
  items: ActionMenuItem[];
  className?: string;
}

export function ActionMenu({ label = "Actions", items, className }: ActionMenuProps) {
  return (
    <details className={cn("relative", className)}>
      <summary className="cursor-pointer rounded-md border border-white/15 bg-[var(--surface)] px-3 py-2 text-sm text-white/80">
        {label}
      </summary>
      <div className="absolute right-0 z-20 mt-2 min-w-40 rounded-md border border-white/10 bg-[var(--surface)] p-1 shadow-lg">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.onSelect}
            className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-white/85 hover:bg-white/10"
          >
            {item.icon ? <span className="text-white/60">{item.icon}</span> : null}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </details>
  );
}
