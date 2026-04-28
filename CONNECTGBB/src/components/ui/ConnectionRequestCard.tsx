import { cn } from "@/lib/cn";
import { ProfileAvatar } from "./ProfileAvatar";

interface ConnectionRequestCardProps {
  coachName: string;
  organization: string;
  title: string;
  message?: string;
  avatarUrl?: string;
  onApprove?: () => void;
  onDecline?: () => void;
  className?: string;
}

export function ConnectionRequestCard({
  coachName,
  organization,
  title,
  message,
  avatarUrl,
  onApprove,
  onDecline,
  className,
}: ConnectionRequestCardProps) {
  return (
    <div className={cn("bg-[var(--surface)] border border-white/10 rounded-lg p-4", className)}>
      <div className="flex items-start gap-3">
        <ProfileAvatar
          src={avatarUrl}
          initials={coachName.split(" ").map(n => n[0]).join("")}
          size="md"
        />
        <div className="flex-1">
          <div className="mb-2">
            <h4 className="font-semibold text-[var(--foreground)]">{coachName}</h4>
            <p className="text-sm text-[var(--foreground)]/80">{title} at {organization}</p>
          </div>
          {message && (
            <p className="text-sm text-[var(--foreground)]/80 mb-3 line-clamp-2">{message}</p>
          )}
          <div className="flex gap-2">
            {onApprove && (
              <button
                onClick={onApprove}
                className="flex-1 bg-[var(--brand-primary)] text-white py-2 px-4 rounded-lg font-medium hover:bg-[var(--brand-primary)]/90 transition-colors"
              >
                Approve
              </button>
            )}
            {onDecline && (
              <button
                onClick={onDecline}
                className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 py-2 px-4 rounded-lg font-medium hover:bg-red-500/30 transition-colors"
              >
                Decline
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}