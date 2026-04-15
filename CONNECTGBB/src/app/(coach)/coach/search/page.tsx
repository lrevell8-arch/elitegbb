"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";

type PlayerSummary = {
  id: string;
  player_name: string;
  grad_class: string | null;
  primary_position: string | null;
  state: string | null;
  verified: boolean | null;
};

const classYears = ["2025", "2026", "2027", "2028", "2029"];
const positions = ["PG", "SG", "SF", "PF", "C"];

export default function CoachSearchPage() {
  const { profile } = useAuth();
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [classYear, setClassYear] = useState("");
  const [position, setPosition] = useState("");
  const [state, setState] = useState("");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const loadPlayers = async () => {
    let supabase;

    try {
      supabase = getSupabaseClient();
    } catch (error) {
      return;
    }

    let query = supabase
      .from("players")
      .select("id, player_name, grad_class, primary_position, state, verified")
      .order("created_at", { ascending: false })
      .limit(20);

    if (searchTerm) {
      query = query.ilike("player_name", `%${searchTerm}%`);
    }
    if (classYear) {
      query = query.eq("grad_class", classYear);
    }
    if (position) {
      query = query.eq("primary_position", position);
    }
    if (state) {
      query = query.eq("state", state);
    }

    const { data } = await query;
    setPlayers(data || []);
  };

  const loadSaved = async () => {
    if (!profile?.coach_id) {
      return;
    }
    const response = await fetch(`/api/coach/shortlist?coachId=${profile.coach_id}`);
    const payload = await response.json();
    setSavedIds((payload.players || []).map((player: PlayerSummary) => player.id));
  };

  const saveToShortlist = async (playerId: string) => {
    if (!profile?.coach_id) {
      setStatus("Connect a coach profile to save players.");
      return;
    }

    const response = await fetch("/api/coach/shortlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coachId: profile.coach_id, playerId }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error || "Unable to update shortlist.");
      return;
    }

    setSavedIds(payload.saved_players || []);
    setStatus("Player added to shortlist.");
  };

  useEffect(() => {
    loadPlayers();
  }, [searchTerm, classYear, position, state]);

  useEffect(() => {
    loadSaved();
  }, [profile?.coach_id]);

  return (
    <PageLayout
      title="Search Players"
      subtitle="Filter the directory by class year, position, location, and academic fit."
      eyebrow="Coach Search"
    >
      <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
        <h2 className="text-lg font-semibold text-white">Filters</h2>
        <div className="mt-4 grid gap-3 text-sm text-white/70 md:grid-cols-2">
          <input
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
            placeholder="Search name"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
            value={classYear}
            onChange={(event) => setClassYear(event.target.value)}
          >
            <option value="">Class year</option>
            {classYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
            value={position}
            onChange={(event) => setPosition(event.target.value)}
          >
            <option value="">Position</option>
            {positions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
          <input
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
            placeholder="State"
            value={state}
            onChange={(event) => setState(event.target.value)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
        <h2 className="text-lg font-semibold text-white">Results</h2>
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
              <button
                type="button"
                onClick={() => saveToShortlist(player.id)}
                className="mt-3 rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
              >
                {savedIds.includes(player.id) ? "Saved" : "Save to shortlist"}
              </button>
            </div>
          ))}
        </div>
        {status ? <p className="mt-3 text-xs text-white/60">{status}</p> : null}
      </section>
    </PageLayout>
  );
}
