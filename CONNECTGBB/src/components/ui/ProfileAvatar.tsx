import { cn } from "@/lib/cn";

export type ProfileAvatarSize = "sm" | "md" | "lg";

export interface ProfileAvatarProps {
  src?: string | null;
  initials: string;
  size?: ProfileAvatarSize;
  online?: boolean;
  className?: string;
}

const sizeClasses: Record<ProfileAvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

export function ProfileAvatar({ src, initials, size = "md", online = false, className }: ProfileAvatarProps) {
  return (
    <div className={cn("relative inline-flex", className)}>
      {src ? (
        <img src={src} alt={initials} className={cn("rounded-full border border-white/15 object-cover", sizeClasses[size])} />
      ) : (
        <div className={cn("inline-flex items-center justify-center rounded-full border border-white/15 bg-[var(--surface-muted)] font-semibold text-white", sizeClasses[size])}>
          {initials}
        </div>
      )}
      {online ? <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-[var(--surface)] bg-[var(--brand-primary)]" /> : null}
    </div>
  );
}
