import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coachId = searchParams.get("coachId");
  let supabaseAdmin;

  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (error) {
    return NextResponse.json({ error: "Supabase admin client not configured." }, { status: 500 });
  }

  if (!coachId) {
    return NextResponse.json({ error: "coachId is required." }, { status: 400 });
  }

  const { data: coach, error } = await supabaseAdmin
    .from("coaches")
    .select("saved_players")
    .eq("id", coachId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const savedPlayers = coach?.saved_players || [];

  if (savedPlayers.length === 0) {
    return NextResponse.json({ players: [] });
  }

  const { data: players } = await supabaseAdmin
    .from("players")
    .select("id, player_name, grad_class, primary_position, state, verified")
    .in("id", savedPlayers);

  return NextResponse.json({ players: players || [] });
}

export async function POST(request: Request) {
  const { coachId, playerId } = await request.json();
  let supabaseAdmin;

  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (error) {
    return NextResponse.json({ error: "Supabase admin client not configured." }, { status: 500 });
  }

  if (!coachId || !playerId) {
    return NextResponse.json({ error: "coachId and playerId are required." }, { status: 400 });
  }

  const { data: coach, error } = await supabaseAdmin
    .from("coaches")
    .select("saved_players")
    .eq("id", coachId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const savedPlayers = coach?.saved_players || [];
  const updatedPlayers = savedPlayers.includes(playerId)
    ? savedPlayers
    : [...savedPlayers, playerId];

  const { error: updateError } = await supabaseAdmin
    .from("coaches")
    .update({ saved_players: updatedPlayers })
    .eq("id", coachId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ saved_players: updatedPlayers });
}
