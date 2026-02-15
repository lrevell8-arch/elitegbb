// Coach Dashboard API Endpoint
// GET /api/coach/dashboard - Get coach-specific dashboard data

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

// GET - Coach dashboard data
export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const auth = await verifyCoachToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const coachId = auth.user.sub;
    const school = auth.user.school;

    // Fetch coach profile
    const { data: coach, error: coachError } = await supabaseQuery(env, 'coaches', 'GET', {
      select: '*',
      eq: { id: coachId }
    });

    if (coachError) {
      return new Response(
        JSON.stringify({ detail: 'Failed to fetch coach profile', error: coachError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const savedPlayerIds = coach?.[0]?.saved_players || [];

    // Fetch saved players
    let savedPlayers = [];
    if (savedPlayerIds.length > 0) {
      const orClause = savedPlayerIds.map(id => `id.eq.${id}`).join(',');
      const { data: players } = await supabaseQuery(env, 'players', 'GET', {
        select: 'id,player_name,player_key,school,primary_position,grad_class,verified',
        or: `(${orClause})`
      });
      savedPlayers = players || [];
    }

    // Fetch messages
    const { data: messages } = await supabaseQuery(env, 'coach_messages', 'GET', {
      select: '*,players(player_name)',
      or: `(coach_id.eq.${coachId},recipient_id.eq.${coachId})`,
      order: 'created_at.desc',
      limit: 10
    });

    // Fetch available players (verified and public)
    const { data: availablePlayers } = await supabaseQuery(env, 'players', 'GET', {
      select: 'id,player_name,player_key,school,primary_position,grad_class,city,state,ppg,apg,rpg,verified',
      eq: { verified: true },
      order: 'created_at.desc',
      limit: 20
    });

    const dashboardData = {
      coach: {
        id: coach?.[0]?.id,
        name: coach?.[0]?.name,
        email: coach?.[0]?.email,
        school: coach?.[0]?.school,
        title: coach?.[0]?.title,
        state: coach?.[0]?.state,
        is_verified: coach?.[0]?.is_verified
      },
      stats: {
        saved_players_count: savedPlayers.length,
        messages_total: messages?.length || 0,
        unread_messages: messages?.filter(m => !m.read && m.recipient_id === coachId).length || 0,
        available_players_count: availablePlayers?.length || 0
      },
      saved_players: savedPlayers,
      recent_messages: messages || [],
      available_players: availablePlayers || []
    };

    return new Response(
      JSON.stringify(dashboardData),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// OPTIONS - CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
