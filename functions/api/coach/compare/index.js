// Coach Player Comparison API Endpoint
// GET /api/coach/compare?ids=id1,id2,id3 - Compare multiple players
// POST /api/coach/compare - Save comparison

import { verifyJWT } from '../../../utils/jwt.js';

// Supabase REST API helper
async function supabaseQuery(env, table, method, params = {}) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const headers = {
    'apikey': env.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=representation' : ''
  };

  const queryParams = new URLSearchParams();
  if (params.select) queryParams.append('select', params.select);
  if (params.eq) {
    Object.entries(params.eq).forEach(([key, value]) => {
      queryParams.append(key, `eq.${value}`);
    });
  }
  if (params.or) queryParams.append('or', params.or);
  if (params.order) queryParams.append('order', params.order);
  if (params.limit) queryParams.append('limit', params.limit);

  const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;

  const response = await fetch(fullUrl, {
    method,
    headers,
    body: params.body ? JSON.stringify(params.body) : undefined
  });

  if (!response.ok) {
    const error = await response.text();
    return { data: null, error: { message: error, status: response.status } };
  }

  const data = await response.json();
  return { data, error: null };
}

// Verify coach token
async function verifyCoachToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing token' };
  }

  const token = authHeader.substring(7);
  try {
    const payload = await verifyJWT(token, env.JWT_SECRET || 'fallback-secret-key-change-in-production');
    if (payload.role !== 'coach') {
      return { valid: false, error: 'Coach access required' };
    }
    return { valid: true, user: payload };
  } catch (err) {
    return { valid: false, error: 'Invalid token' };
  }
}

// GET - Compare players
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    const auth = await verifyCoachToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const playerIds = url.searchParams.get('ids');
    if (!playerIds) {
      return new Response(
        JSON.stringify({ detail: 'Player IDs are required (comma-separated)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ids = playerIds.split(',').filter(id => id.trim());
    if (ids.length < 2) {
      return new Response(
        JSON.stringify({ detail: 'At least 2 players required for comparison' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build OR clause for player IDs
    const orClause = ids.map(id => `id.eq.${id}`).join(',');

    const { data: players, error } = await supabaseQuery(env, 'players', 'GET', {
      select: 'id,player_name,player_key,school,city,state,grad_class,primary_position,secondary_position,height,weight,jersey_number,ppg,apg,rpg,level,team_names,verified',
      or: `(${orClause})`
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to fetch players', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!players || players.length < 2) {
      return new Response(
        JSON.stringify({ detail: 'Not all players found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate comparison data
    const comparison = generateComparison(players);

    return new Response(
      JSON.stringify({
        players: players,
        comparison: comparison,
        player_count: players.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST - Save comparison to coach's saved comparisons
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const auth = await verifyCoachToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { player_ids, name, notes } = body;

    if (!player_ids || player_ids.length < 2) {
      return new Response(
        JSON.stringify({ detail: 'At least 2 player IDs required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const coachId = auth.user.sub;

    // Fetch players to verify they exist
    const orClause = player_ids.map(id => `id.eq.${id}`).join(',');
    const { data: players, error: fetchError } = await supabaseQuery(env, 'players', 'GET', {
      select: 'id,player_name',
      or: `(${orClause})`
    });

    if (fetchError || !players || players.length < 2) {
      return new Response(
        JSON.stringify({ detail: 'Failed to verify players' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Store comparison (using a simple JSON approach since we don't have a separate comparisons table)
    // In production, you might want a dedicated comparisons table
    const comparisonData = {
      id: crypto.randomUUID(),
      coach_id: coachId,
      name: name || `Comparison: ${players.map(p => p.player_name).join(' vs ')}`,
      player_ids: player_ids,
      player_names: players.map(p => p.player_name),
      notes: notes || '',
      created_at: new Date().toISOString()
    };

    // For now, return the comparison data without storing (would need a comparisons table)
    return new Response(
      JSON.stringify({
        success: true,
        comparison: comparisonData,
        message: 'Comparison saved (mock - implement comparisons table for persistence)'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Generate comparison analysis
function generateComparison(players) {
  const stats = ['ppg', 'apg', 'rpg'];
  
  const comparison = {
    stats_comparison: {},
    rankings: {},
    summary: []
  };

  // Compare each stat
  stats.forEach(stat => {
    const values = players.map(p => ({
      id: p.id,
      name: p.player_name,
      value: parseFloat(p[stat]) || 0
    })).sort((a, b) => b.value - a.value);

    comparison.stats_comparison[stat] = {
      label: stat.toUpperCase(),
      values: values,
      leader: values[0]
    };
  });

  // Overall ranking
  const overallScores = players.map(p => {
    const ppg = parseFloat(p.ppg) || 0;
    const apg = parseFloat(p.apg) || 0;
    const rpg = parseFloat(p.rpg) || 0;
    return {
      id: p.id,
      name: p.player_name,
      score: ppg + apg + rpg,
      stats: { ppg, apg, rpg }
    };
  }).sort((a, b) => b.score - a.score);

  comparison.rankings.overall = overallScores;

  // Generate summary text
  comparison.summary = [
    `${overallScores[0].name} leads overall with ${overallScores[0].score.toFixed(1)} total stats`,
    ...stats.map(stat => {
      const leader = comparison.stats_comparison[stat].leader;
      return `${leader.name} leads in ${stat.toUpperCase()} (${leader.value})`;
    })
  ];

  return comparison;
}

// OPTIONS - CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
