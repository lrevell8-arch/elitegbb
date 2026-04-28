import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import { EmptyState, ProfileAvatar, VerificationBadge } from "@/components/ui";
import { getPublicPlayerById, type PublicPlayerProfile } from "@/lib/adapters/players";

interface PlayerProfilePageProps {
  params: {
    id: string;
  };
}

export default async function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const player = await getPublicPlayerById(params.id);

  if (!player) {
    return (
      <PageLayout
        title="Player not found"
        subtitle="This profile is unavailable or may have been removed."
        eyebrow="Player Profile"
      >
        <EmptyState
          title="No profile found"
          description="Try browsing other prospects or return to the player directory."
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={player.name}
      subtitle={`Class of ${player.gradYear} • ${player.position} • ${player.state}`}
      eyebrow="Player Profile"
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <section className="rounded-xl border border-white/10 bg-[var(--surface)] p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <ProfileAvatar
              initials={player.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
              size="lg"
            />
            <div>
              <p className="text-sm text-[var(--foreground)]/70">Verified Athlete</p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/80">
                <VerificationBadge status={player.verified ? "verified" : "unverified"} />
                <span>{player.verified ? "Verified" : "Unverified"}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4 text-sm text-[var(--foreground)]/75">
            <div>
              <p className="font-semibold text-white">Height</p>
              <p>{player.height}</p>
            </div>
            <div>
              <p className="font-semibold text-white">Location</p>
              <p>{player.state}</p>
            </div>
            <div>
              <p className="font-semibold text-white">Graduation</p>
              <p>{player.gradYear}</p>
            </div>
            <div>
              <p className="font-semibold text-white">Primary position</p>
              <p>{player.position}</p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-[var(--surface)] p-6">
            <h2 className="text-lg font-semibold text-white">About this prospect</h2>
            <p className="mt-3 text-sm text-[var(--foreground)]/80">
              This profile is part of the ConnectGBB prospector directory, designed to help coaches find verified talent with transparent recruiting details.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Academics</p>
                <p className="mt-2 text-sm text-[var(--foreground)]/85">GPA, class schedule, and academic standing are available through the athlete's full recruiting packet.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Athletics</p>
                <p className="mt-2 text-sm text-[var(--foreground)]/85">Training highlights, recent film, and performance metrics can be shared after coach verification.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[var(--surface)] p-6">
            <p className="text-sm text-[var(--foreground)]/70">Want to connect?</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/coach/messages" className="rounded-lg bg-[var(--brand-primary)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-primary)]/90">
                Start a message
              </Link>
              <Link href="/coach/search" className="rounded-lg border border-white/10 px-4 py-3 text-sm text-white/80 hover:bg-white/5">
                Search more prospects
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
