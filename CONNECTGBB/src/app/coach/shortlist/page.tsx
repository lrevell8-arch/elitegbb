"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/components/AuthProvider";

type PlayerSummary = {
  id: string;
  player_name: string;
  grad_class: string | null;
  primary_position: string | null;
  state: string | null;
  verified: boolean | null;
};

export default function CoachShortlistPage() {
  const { profile } = useAuth();
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const loadShortlist = async () => {
      if (!profile?.coach_id) {
        setStatus("Connect a coach profile to load your shortlist.");
        return;
      }

      const response = await fetch(`/api/coach/shortlist?coachId=${profile.coach_id}`);
      const payload = await response.json();
      if (!response.ok) {
        setStatus(payload.error || "Unable to load shortlist.");
        return;
      }

      setPlayers(payload.players || []);
    };

    loadShortlist();
  }, [profile?.coach_id]);

  return (
    <PageLayout
      title="Shortlist"
      subtitle="Track your favorite prospects and keep notes on evaluation status."
      eyebrow="Coach"
    >
      <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
        <h2 className="text-lg font-semibold text-white">Shortlist overview</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {players.map((player) => (
            <div key={player.id} className="rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-sm font-semibold text-white">{player.player_name}</p>
              <p className="mt-1 text-xs text-white/60">
                Class {player.grad_class || "-"} · {player.primary_position || "-"} · {player.state || "-"}
              </p>
              <p className="mt-1 text-xs text-white/50">
                {player.verified ? "Verified" : "Not verified"}
              </p>
            </div>
          ))}
        </div>
        {players.length === 0 ? (
          <p className="mt-3 text-sm text-white/70">No saved players yet.</p>
        ) : null}
        {status ? <p className="mt-3 text-xs text-white/60">{status}</p> : null}
      </section>
    </PageLayout>
  );
}
