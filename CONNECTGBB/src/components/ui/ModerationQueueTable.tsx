import { MoreHorizontal, Check, Trash2, AlertTriangle, Ban } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { StatusBadge } from "./StatusBadge";

interface ModerationItem {
  id: string;
  type: "message" | "profile" | "content";
  reporter: string;
  date: string;
  severity: "low" | "medium" | "high";
  preview: string;
}

interface ModerationQueueTableProps {
  items: ModerationItem[];
  onApprove: (id: string) => void;
  onRemove: (id: string) => void;
  onWarn: (id: string) => void;
  onSuspend: (id: string) => void;
  className?: string;
}

export function ModerationQueueTable({
  items,
  onApprove,
  onRemove,
  onWarn,
  onSuspend,
  className,
}: ModerationQueueTableProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const severityConfig = {
    low: { variant: "success" as const, label: "Low" },
    medium: { variant: "warning" as const, label: "Medium" },
    high: { variant: "error" as const, label: "High" },
  };

  const handleAction = (action: (id: string) => void, id: string) => {
    action(id);
    setOpenDropdown(null);
  };

  return (
    <div className={cn("bg-[var(--surface)] border border-white/10 rounded-lg overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--surface-muted)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground)]/80 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground)]/80 uppercase tracking-wider">
                Preview
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground)]/80 uppercase tracking-wider">
                Reporter
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground)]/80 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground)]/80 uppercase tracking-wider">
                Severity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground)]/80 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-sm text-[var(--foreground)] capitalize">{item.type}</td>
                <td className="px-4 py-3 text-sm text-[var(--foreground)] max-w-xs truncate">{item.preview}</td>
                <td className="px-4 py-3 text-sm text-[var(--foreground)]">{item.reporter}</td>
                <td className="px-4 py-3 text-sm text-[var(--foreground)]">{item.date}</td>
                <td className="px-4 py-3">
                  <StatusBadge variant={severityConfig[item.severity].variant}>
                    {severityConfig[item.severity].label}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3 relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === item.id ? null : item.id)}
                    className="text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {openDropdown === item.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-[var(--surface)] border border-white/10 rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => handleAction(onApprove, item.id)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(onRemove, item.id)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove Content
                      </button>
                      <button
                        onClick={() => handleAction(onWarn, item.id)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Warn User
                      </button>
                      <button
                        onClick={() => handleAction(onSuspend, item.id)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                      >
                        <Ban className="w-4 h-4" />
                        Suspend User
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}