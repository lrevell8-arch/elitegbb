// src/lib/adapters/players.ts
// ADAPTER: Replace implementations when Supabase schema is confirmed

import { getSupabaseClient } from "@/lib/supabaseClient";

export type PublicPlayerProfile = {
  id: string
  position: string
  gradYear: number
  state: string
  heightInches: number
  height: string
  verified: boolean
  name: string
  avatarUrl?: string
}

// Alias for backward compatibility
export type PublicPlayer = PublicPlayerProfile

const FALLBACK_PLAYERS: PublicPlayerProfile[] = [
  {
    id: "maya-johnson",
    name: "Maya Johnson",
    position: "PG",
    gradYear: 2028,
    state: "GA",
    heightInches: 66,
    height: "5'6\"",
    verified: true,
    avatarUrl: undefined,
  },
  {
    id: "sophia-williams",
    name: "Sophia Williams",
    position: "SF",
    gradYear: 2029,
    state: "TX",
    heightInches: 68,
    height: "5'8\"",
    verified: true,
    avatarUrl: undefined,
  },
  {
    id: "zoe-martinez",
    name: "Zoe Martinez",
    position: "SG",
    gradYear: 2027,
    state: "IL",
    heightInches: 67,
    height: "5'7\"",
    verified: true,
    avatarUrl: undefined,
  },
]

function parseHeightInches(height: string): number {
  const match = /^(\d+)'(\d+)(?:\"?)$/.exec(height.trim());
  if (!match) return 0;
  return Number(match[1]) * 12 + Number(match[2]);
}

export async function getPublicPlayers(): Promise<PublicPlayerProfile[]> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return FALLBACK_PLAYERS;
  }

  const { data, error } = await supabase
    .from("players")
    .select("id, player_name, primary_position, grad_class, state, height, verified, avatar_url")
    .eq("public", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load public players", error.message);
    return FALLBACK_PLAYERS;
  }

  return (data ?? []).map((player: any) => ({
    id: player.id,
    name: player.player_name ?? "Unknown Player",
    position: player.primary_position ?? "Unknown",
    gradYear: Number(player.grad_class) || new Date().getFullYear(),
    state: player.state ?? "",
    heightInches: parseHeightInches(player.height ?? ""),
    height: player.height ?? "",
    verified: Boolean(player.verified),
    avatarUrl: player.avatar_url || undefined,
  }));
}

export async function getPublicPlayerById(id: string): Promise<PublicPlayerProfile | null> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return FALLBACK_PLAYERS.find((player) => player.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from("players")
    .select("id, player_name, primary_position, grad_class, state, height, verified, avatar_url")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load player profile", error.message);
    return FALLBACK_PLAYERS.find((player) => player.id === id) ?? null;
  }

  if (!data) {
    return FALLBACK_PLAYERS.find((player) => player.id === id) ?? null;
  }

  return {
    id: data.id,
    name: data.player_name ?? "Unknown Player",
    position: data.primary_position ?? "Unknown",
    gradYear: Number(data.grad_class) || new Date().getFullYear(),
    state: data.state ?? "",
    heightInches: parseHeightInches(data.height ?? ""),
    height: data.height ?? "",
    verified: Boolean(data.verified),
    avatarUrl: data.avatar_url || undefined,
  };
}
