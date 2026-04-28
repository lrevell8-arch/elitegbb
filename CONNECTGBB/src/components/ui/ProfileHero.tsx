import { Edit } from "lucide-react";
import { cn } from "@/lib/cn";
import { ProfileAvatar } from "./ProfileAvatar";
import { VerificationBadge } from "./VerificationBadge";

interface ProfileHeroProps {
  name: string;
  position: string;
  gradYear: number;
  location: string;
  avatarUrl?: string;
  coverUrl?: string;
  verified?: boolean;
  onEdit?: () => void;
  className?: string;
}

export function ProfileHero({
  name,
  position,
  gradYear,
  location,
  avatarUrl,
  coverUrl,
  verified,
  onEdit,
  className,
}: ProfileHeroProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Cover */}
      <div
        className="h-48 bg-[var(--surface-muted)] bg-cover bg-center"
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
      />
      {/* Avatar overlapping */}
      <div className="absolute bottom-0 left-6 transform translate-y-1/2">
        <ProfileAvatar
          src={avatarUrl}
          initials={name.split(" ").map(n => n[0]).join("")}
          size="lg"
          className="ring-4 ring-[var(--background)]"
        />
      </div>
      {/* Content */}
      <div className="pt-16 pb-6 px-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{name}</h1>
            <p className="text-[var(--foreground)]/80">{position} • Class of {gradYear} • {location}</p>
            {verified && <VerificationBadge status="verified" className="mt-2" />}
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-white/10 rounded-lg text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}