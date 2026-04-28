import { cn } from "@/lib/cn";

interface PlayerInfoGridProps {
  height?: string;
  weight?: string;
  wingspan?: string;
  position?: string;
  school?: string;
  gpa?: string;
  gradYear?: number;
  className?: string;
}

export function PlayerInfoGrid({
  height,
  weight,
  wingspan,
  position,
  school,
  gpa,
  gradYear,
  className,
}: PlayerInfoGridProps) {
  const fields = [
    { label: "Height", value: height },
    { label: "Weight", value: weight },
    { label: "Wingspan", value: wingspan },
    { label: "Position", value: position },
    { label: "School", value: school },
    { label: "GPA", value: gpa },
    { label: "Grad Year", value: gradYear?.toString() },
  ];

  return (
    <div className={cn("bg-[var(--surface)] border border-white/10 rounded-lg p-6", className)}>
      <div className="grid grid-cols-2 gap-4">
        {fields.map(({ label, value }) => (
          <div key={label} className="flex justify-between">
            <span className="text-[var(--foreground)]/80">{label}:</span>
            <span className="text-[var(--foreground)] font-medium">{value || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}