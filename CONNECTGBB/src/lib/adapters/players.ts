import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export interface PublicPlayer {
  id: string;
  name: string;
  position: string;
  gradYear: string;
  state: string;
  height: string;
  verified: boolean;
}

export interface PlayerFilters {
  position?: string;
  gradYear?: string;
  state?: string;
  heightRange?: string;
}

export interface PublicPlayersResult {
  players: PublicPlayer[];
  source: "supabase" | "fallback";
  error?: string;
}

const fallbackPlayers: PublicPlayer[] = [
  { id: "p1", name: "Player One", position: "PG", gradYear: "2027", state: "GA", height: "5'7\"", verified: true },
  { id: "p2", name: "Player Two", position: "SG", gradYear: "2028", state: "TX", height: "5'9\"", verified: true },
  { id: "p3", name: "Player Three", position: "SF", gradYear: "2026", state: "FL", height: "5'10\"", verified: false },
  { id: "p4", name: "Player Four", position: "PF", gradYear: "2027", state: "NC", height: "6'0\"", verified: true },
  { id: "p5", name: "Player Five", position: "C", gradYear: "2029", state: "IL", height: "6'2\"", verified: false },
];

function applyFilters(players: PublicPlayer[], filters: PlayerFilters) {
  return players.filter((player) => {
    if (filters.position && player.position !== filters.position) return false;
    if (filters.gradYear && player.gradYear !== filters.gradYear) return false;
    if (filters.state && player.state !== filters.state) return false;
    if (filters.heightRange) {
      const minimum = Number(filters.heightRange);
      const heightMatch = player.height.match(/\d+'(\d+)/);
      const inches = heightMatch ? Number(heightMatch[1]) : 0;
      if (inches < minimum) return false;
    }
    return true;
  });
}

export async function getPublicPlayers(filters: PlayerFilters = {}): Promise<PublicPlayersResult> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin
      .from("players")
      .select("id, player_name, primary_position, grad_class, state, height, verified")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filters.position) query = query.eq("primary_position", filters.position);
    if (filters.gradYear) query = query.eq("grad_class", filters.gradYear);
    if (filters.state) query = query.eq("state", filters.state);

    const { data, error } = await query;

    if (error) {
      return {
        players: applyFilters(fallbackPlayers, filters),
        source: "fallback",
        error: error.message,
      };
    }

    const normalized: PublicPlayer[] = (data ?? []).map((row) => ({
      id: row.id,
      name: row.player_name ?? "Unnamed Player",
      position: row.primary_position ?? "N/A",
      gradYear: row.grad_class ?? "N/A",
      state: row.state ?? "N/A",
      height: row.height ?? "N/A",
      verified: Boolean(row.verified),
    }));

    return { players: applyFilters(normalized, filters), source: "supabase" };
  } catch {
    return { players: applyFilters(fallbackPlayers, filters), source: "fallback" };
  }
}
