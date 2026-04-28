import { Download } from "lucide-react";
import { cn } from "@/lib/cn";
import { StatusBadge } from "./StatusBadge";
import { EmptyState } from "./EmptyState";

interface InvoiceItem {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "open" | "void";
  downloadUrl?: string;
}

interface InvoiceListProps {
  invoices: InvoiceItem[];
  className?: string;
}

export function InvoiceList({ invoices, className }: InvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <EmptyState
        title="No invoices yet"
        description="Your billing history will appear here once you have invoices."
        className={className}
      />
    );
  }

  return (
    <div className={cn("bg-[var(--surface)] border border-white/10 rounded-lg overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--surface-muted)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground)]/80 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground)]/80 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground)]/80 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground)]/80 uppercase tracking-wider">
                Download
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-4 py-3 text-sm text-[var(--foreground)]">{invoice.date}</td>
                <td className="px-4 py-3 text-sm text-[var(--foreground)]">${invoice.amount}</td>
                <td className="px-4 py-3">
                  <StatusBadge variant={invoice.status === "paid" ? "success" : invoice.status === "open" ? "warning" : "error"}>
                    {invoice.status}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3">
                  {invoice.downloadUrl && (
                    <a
                      href={invoice.downloadUrl}
                      className="text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
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